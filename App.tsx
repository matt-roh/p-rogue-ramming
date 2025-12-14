
import React, { useState, useEffect } from 'react';
import { 
  GameConfig, GameStatus, PlayerState, Room, RoomType, 
  Modifier, TagStat, Problem 
} from './types';
import { 
  INITIAL_HP, INITIAL_TAGS, INITIAL_TAG_STAT, TIER_NAMES
} from './constants';
import { generateDungeon } from './services/dungeon';
import { fetchUserTier, checkProblemSolved, generateProblem } from './services/api';
import { GameMap } from './components/GameMap';
import { RoomView } from './components/RoomView';
import { Activity, Heart, Trophy, Skull, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [config, setConfig] = useState<GameConfig>({ gridSize: 5, testMode: false });
  const [status, setStatus] = useState<GameStatus>(GameStatus.SETUP);
  const [player, setPlayer] = useState<PlayerState>({
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    handle: '',
    tier: 0,
    currentRoom: { x: 0, y: 0 },
    modifiers: [],
    tagStats: {},
    history: []
  });
  const [dungeon, setDungeon] = useState<Room[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Initialize Tag Stats
  useEffect(() => {
    const stats: Record<string, TagStat> = {};
    INITIAL_TAGS.forEach(tag => {
      stats[tag] = { ...INITIAL_TAG_STAT, mean: 1 }; 
    });
    setPlayer(p => ({ ...p, tagStats: stats }));
  }, []);

  const addToHistory = (msg: string) => {
    setPlayer(prev => ({ ...prev, history: [msg, ...prev.history] }));
  };

  const resetGame = () => {
    // Re-initialize tag stats
    const stats: Record<string, TagStat> = {};
    INITIAL_TAGS.forEach(tag => {
      stats[tag] = { ...INITIAL_TAG_STAT, mean: 1 }; 
    });

    setPlayer({
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      handle: player.handle, // Keep the handle for convenience
      tier: 0,
      currentRoom: { x: 0, y: 0 },
      modifiers: [],
      tagStats: stats,
      history: []
    });
    setDungeon([]);
    setIsLoading(false);
    setStatus(GameStatus.SETUP);
  };

  const startGame = async () => {
    if (!player.handle) return;
    setIsLoading(true);

    const tier = await fetchUserTier(player.handle);
    const initialMean = Math.max(1, tier - 10);
    
    // Ensure tagStats are initialized if empty
    let currentStats = { ...player.tagStats };
    if (Object.keys(currentStats).length === 0) {
        INITIAL_TAGS.forEach(tag => {
            currentStats[tag] = { ...INITIAL_TAG_STAT, mean: 1 };
        });
    }

    const newTagStats = { ...currentStats };
    Object.keys(newTagStats).forEach(key => {
      newTagStats[key] = { ...newTagStats[key], mean: initialMean };
    });

    const newDungeon = generateDungeon(config.gridSize);
    
    let startRoom = { x: 0, y: 0 };
    for(let y=0; y<config.gridSize; y++) {
      for(let x=0; x<config.gridSize; x++) {
        if(newDungeon[y][x].type === RoomType.ENTRANCE) startRoom = { x, y };
      }
    }

    setPlayer(p => ({
      ...p,
      tier,
      tagStats: newTagStats,
      currentRoom: startRoom,
      history: [`Game started! Tier: ${TIER_NAMES[tier] || 'Unknown'}`]
    }));
    setDungeon(newDungeon);
    setStatus(GameStatus.PLAYING);
    setIsLoading(false);

    generateProblemsForRoom(newDungeon[startRoom.y][startRoom.x], newTagStats, tier);
  };

  const generateProblemsForRoom = async (room: Room, tagStats: Record<string, TagStat>, playerTier: number) => {
    if (room.problems.length > 0) return;

    setIsLoading(true);
    let count = 1;
    if (room.type === RoomType.MINI_BOSS || room.type === RoomType.ARTIFACT) count = 3;
    if (room.type === RoomType.FINAL_BOSS) count = 1; 

    const generatedProblems: Problem[] = [];
    const existingIds = new Set<number>();

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let p: Problem | null = null;
      // Retry loop to avoid duplicates within this batch
      while (attempts < 3) {
        p = await generateProblem(player.handle, tagStats, config);
        if (!existingIds.has(p.id)) {
            existingIds.add(p.id);
            break;
        }
        attempts++;
      }
      if (p) generatedProblems.push(p);
    }
    
    // Pre-assign modifiers for Artifact Rooms
    if (room.type === RoomType.ARTIFACT) {
        const types: Modifier['type'][] = [
          'HP', 'HARDCORE', 'GAMBLING', 'NO_GAMBLING', 'GAMECHANGER', 'EQUIVALENT_EXCHANGE'
        ];
        generatedProblems.forEach(p => {
             const type = types[Math.floor(Math.random() * types.length)];
             
             // Try to find a tag that is already tracked to avoid creating new entries unnecessarily
             const knownTags = Object.keys(tagStats);
             let targetTag = 'math';
             const match = p.tags.find(t => knownTags.includes(t));
             if (match) {
                 targetTag = match;
             } else if (p.tags.length > 0) {
                 targetTag = p.tags[0];
             }

             let desc = '';
             if (type === 'HP') desc = 'Recover +1 HP';
             else if (type === 'HARDCORE') desc = `Hardcore: ${targetTag} Diff+0.5`;
             else if (type === 'GAMBLING') desc = `Gambling: ${targetTag} Var x1.5`;
             else if (type === 'NO_GAMBLING') desc = `Stable: ${targetTag} Var x0.75`;
             else if (type === 'GAMECHANGER') desc = `Gamechanger: ${targetTag} Chance++`;
             else if (type === 'EQUIVALENT_EXCHANGE') desc = `Exchange: ${targetTag} Diff-1 (-1 HP)`;
             
             p.reward = { type, tag: targetTag, description: desc };
        });
    }

    setDungeon(prev => {
      // Guard: If dungeon was cleared (e.g. game reset), abort update
      if (prev.length === 0) return prev;
      
      const newGrid = [...prev];
      if (!newGrid[room.y] || !newGrid[room.y][room.x]) return prev;
      
      newGrid[room.y][room.x].problems = generatedProblems;
      return newGrid;
    });
    setIsLoading(false);
  };

  const addFinalBossProblem = async (x: number, y: number) => {
    setIsLoading(true);
    // Grab existing IDs to avoid immediate duplicates if possible (though API random usually handles it)
    const existingIds = new Set(dungeon[y]?.[x]?.problems.map(p => p.id) || []);
    
    let p: Problem | null = null;
    let attempts = 0;
    while(attempts < 3) {
        p = await generateProblem(player.handle, player.tagStats, config);
        if (!existingIds.has(p.id)) break;
        attempts++;
    }

    if (p) {
        setDungeon(prev => {
            if (prev.length === 0) return prev;
            const grid = [...prev];
            if (!grid[y] || !grid[y][x]) return prev;
            
            grid[y][x].problems.push(p!);
            return grid;
        });
    }
    setIsLoading(false);
  };

  const handleSolveAttempt = async (problemId: number, uid: string) => {
    setIsLoading(true);
    const solved = await checkProblemSolved(player.handle, problemId, config);
    
    if (solved) {
      addToHistory(`Solved problem ${problemId}!`);
      
      const cx = player.currentRoom.x;
      const cy = player.currentRoom.y;
      
      setDungeon(prev => {
        if (prev.length === 0) return prev;
        
        const updatedDungeon = [...prev];
        const currentRoom = updatedDungeon[cy][cx];
        const roomRef = updatedDungeon[cy][cx];
        const problemRef = roomRef.problems.find(p => p.uid === uid);
        
        if (problemRef && !problemRef.isSolved) {
          problemRef.isSolved = true;
          roomRef.problemsSolvedCount++;
        }

        // Room Logic (Moved inside setter to ensure atomic update with dungeon state)
        if (currentRoom.type === RoomType.NORMAL || currentRoom.type === RoomType.ENTRANCE) {
          roomRef.cleared = true;
          revealNeighbors(cx, cy, updatedDungeon);
        } else if (currentRoom.type === RoomType.ARTIFACT) {
          roomRef.cleared = true;
          // Note: modifiers applied separately, which is fine
          revealNeighbors(cx, cy, updatedDungeon);
        } else if (currentRoom.type === RoomType.MINI_BOSS) {
          revealNeighbors(cx, cy, updatedDungeon);
        } else if (currentRoom.type === RoomType.FINAL_BOSS) {
          if (roomRef.problemsSolvedCount >= 3) {
             // We need to schedule status change outside component render
             // But we are in event handler, so we can't easily change status here 
             // without useEffect, but `status` is separate state. 
             // We'll handle status update in useEffect or timeout? 
             // Actually, we can just call setStatus here, it's fine.
          } 
        }
        
        return updatedDungeon;
      });
      
      // Need to re-access dungeon to apply modifiers/status which relies on latest state
      // This part is tricky because 'dungeon' variable is stale closure.
      // But for 'applyModifier', we rely on 'problemRef' from above.
      // Let's check `dungeon` state again in separate effect or just use existing logic but safe.
      
      // Re-find problem in current dungeon state to apply modifiers
      // Since setDungeon is async, we can't see the update yet.
      // However, modifiers don't depend on dungeon structure, just the problem.
      // We can find the problem in the 'dungeon' variable from closure - it has the reward data.
      const currentRoom = dungeon[cy][cx];
      const problem = currentRoom.problems.find(p => p.uid === uid);
      
      if (currentRoom.type === RoomType.ARTIFACT && problem?.reward) {
          applyModifier(problem.reward);
      }
      
      if (currentRoom.type === RoomType.FINAL_BOSS) {
         // Check using the updated count. 
         // Since we can't easily access the result of setDungeon, we estimate.
         // If prev count was 2, now it is 3.
         if (currentRoom.problemsSolvedCount + 1 >= 3) {
            setStatus(GameStatus.GAME_OVER_WIN);
         } else {
            await addFinalBossProblem(cx, cy);
         }
      }

    } else {
      addToHistory(`Problem ${problemId} not solved yet.`);
    }
    setIsLoading(false);
  };

  const handleSkipProblem = (problemId: number, uid: string) => {
    const cx = player.currentRoom.x;
    const cy = player.currentRoom.y;
    const room = dungeon[cy][cx];

    if (room.type === RoomType.FINAL_BOSS) {
      modifyHp(-1);
      addToHistory("Skipped Final Boss problem. -1 HP.");
      
      setDungeon(prev => {
        if (prev.length === 0) return prev;
        const updatedDungeon = [...prev];
        const roomRef = updatedDungeon[cy][cx];
        roomRef.problems = roomRef.problems.filter(p => p.uid !== uid);
        return updatedDungeon;
      });
      
      // Force generation of next problem
      addFinalBossProblem(cx, cy);
    } else {
       // For normal/entrance, skip = leave with penalty
       handleLeaveRoom();
    }
  };

  // Called via "Force Escape" or "Give Up" button
  const handleLeaveRoom = () => {
    const cx = player.currentRoom.x;
    const cy = player.currentRoom.y;
    const room = dungeon[cy][cx];
    
    // Safety check: if already cleared, avoid re-processing penalties
    if (room.cleared) return;

    let hpChange = 0;
    if (room.type === RoomType.NORMAL || room.type === RoomType.ENTRANCE) {
         if (!room.problems.some(p => p.isSolved)) hpChange = -1;
    } else if (room.type === RoomType.MINI_BOSS) {
         const solved = room.problemsSolvedCount;
         hpChange = solved - 1;
    } else if (room.type === RoomType.ARTIFACT) {
        hpChange = 0;
    }

    if (hpChange !== 0) {
        modifyHp(hpChange);
        addToHistory(`Room finalized. HP ${hpChange > 0 ? '+' : ''}${hpChange}`);
    } else {
        addToHistory("Room finalized.");
    }
    
    setDungeon(prev => {
        if (prev.length === 0) return prev;
        const updatedDungeon = [...prev];
        updatedDungeon[cy][cx].cleared = true;
        revealNeighbors(cx, cy, updatedDungeon);
        return updatedDungeon;
    });
  };

  // Logic applied when normally traveling OUT of a room
  const processRoomExit = (room: Room) => {
    if (room.cleared) return;

    let hpChange = 0;
    let msg = "";

    if (room.type === RoomType.MINI_BOSS) {
        hpChange = room.problemsSolvedCount - 1;
        msg = `Mini-Boss complete: ${room.problemsSolvedCount} solved.`;
    } 
    
    if (hpChange !== 0) {
        modifyHp(hpChange);
        addToHistory(`${msg} HP ${hpChange > 0 ? '+' : ''}${hpChange}`);
    } else if (room.type === RoomType.MINI_BOSS) {
        addToHistory(`${msg} No HP change.`);
    }

    setDungeon(prev => {
        if (prev.length === 0) return prev;
        const newGrid = [...prev];
        newGrid[room.y][room.x].cleared = true;
        return newGrid;
    });
  };

  const handleTravel = (dest: { x: number; y: number }) => {
    const currentRoom = dungeon[player.currentRoom.y][player.currentRoom.x];
    processRoomExit(currentRoom);

    setPlayer(p => ({ ...p, currentRoom: dest }));
    generateProblemsForRoom(dungeon[dest.y][dest.x], player.tagStats, player.tier);
  };

  const handleMapClick = (x: number, y: number) => {
    const current = dungeon[player.currentRoom.y][player.currentRoom.x];
    const canTravel = current.cleared;
    
    const isAdjacent = current.adjacent.some(adj => adj.x === x && adj.y === y);

    if (canTravel && isAdjacent) {
        handleTravel({x, y});
    }
  };

  const modifyHp = (amount: number) => {
    setPlayer(prev => {
      const newHp = prev.hp + amount;
      if (newHp <= 0) {
        setStatus(GameStatus.GAME_OVER_LOSS);
      }
      return { ...prev, hp: newHp };
    });
  };

  const applyModifier = (mod?: Modifier) => {
    if (!mod) return;
    
    const newStats = { ...player.tagStats };
    const targetTag = mod.tag || 'math';
    let desc = '';
    
    // Ensure tag stat exists to avoid crash
    if (!newStats[targetTag]) {
         newStats[targetTag] = { 
            chance: 1, 
            stdDev: 1, 
            mean: Math.max(1, player.tier - 10) 
        };
    }

    switch (mod.type) {
      case 'HP':
        modifyHp(1);
        desc = '+1 HP Recovered';
        break;
      case 'HARDCORE':
        newStats[targetTag].mean += 0.5;
        newStats[targetTag].stdDev += 0.5;
        desc = `Hardcore: ${targetTag} diff+0.5`;
        break;
      case 'GAMBLING':
        newStats[targetTag].stdDev *= 1.5;
        desc = `Gambling: ${targetTag} var x1.5`;
        break;
      case 'NO_GAMBLING':
        newStats[targetTag].stdDev *= 0.75;
        desc = `Stable: ${targetTag} var x0.75`;
        break;
      case 'GAMECHANGER':
        newStats[targetTag].chance += 0.5;
        desc = `Gamechanger: ${targetTag} freq++`;
        break;
      case 'EQUIVALENT_EXCHANGE':
        modifyHp(-1);
        newStats[targetTag].mean = Math.max(1, newStats[targetTag].mean - 1.0);
        desc = `Exchange: ${targetTag} diff-1, -1 HP`;
        break;
    }

    addToHistory(`Artifact Used: ${desc}`);
    setPlayer(p => ({
      ...p,
      tagStats: newStats,
      modifiers: [...p.modifiers, { ...mod, description: desc }]
    }));
  };

  const revealNeighbors = (x: number, y: number, grid: Room[][]) => {
    grid[y][x].adjacent.forEach(adj => {
      grid[adj.y][adj.x].revealed = true;
    });
  };

  // --- Renders ---

  if (status === GameStatus.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white font-mono p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-blue-500 tracking-tighter">P-rogue-ramming</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Solved.ac Handle</label>
              <input 
                type="text" 
                value={player.handle}
                onChange={e => setPlayer({...player, handle: e.target.value})}
                disabled={config.testMode}
                className={`w-full bg-gray-800 border border-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${config.testMode ? 'opacity-50 cursor-not-allowed text-gray-500' : ''}`}
                placeholder="Ex: baekjoon_user"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Grid Size (N)</label>
              <input 
                type="number" 
                value={config.gridSize}
                onChange={e => setConfig({...config, gridSize: parseInt(e.target.value) || 5})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-3 outline-none"
                min={3} max={10}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="testMode"
                checked={config.testMode}
                onChange={e => {
                    const isTest = e.target.checked;
                    setConfig({...config, testMode: isTest});
                    if (isTest) {
                        setPlayer(p => ({ ...p, handle: 'total' }));
                    } else if (player.handle === 'total') {
                        setPlayer(p => ({ ...p, handle: '' }));
                    }
                }}
                className="w-4 h-4 accent-blue-500"
              />
              <label htmlFor="testMode" className="text-sm text-gray-400">Test Mode (Skip Validation & Use 'total')</label>
            </div>
            <button 
              onClick={startGame}
              disabled={!player.handle || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Loading User...' : 'Enter Dungeon'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === GameStatus.GAME_OVER_WIN || status === GameStatus.GAME_OVER_LOSS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
        <div className="max-w-lg w-full">
          {status === GameStatus.GAME_OVER_WIN ? (
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
          ) : (
            <Skull className="w-24 h-24 text-red-600 mx-auto mb-6" />
          )}
          <h1 className="text-5xl font-bold mb-4">
            {status === GameStatus.GAME_OVER_WIN ? 'VICTORY' : 'GAME OVER'}
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            {status === GameStatus.GAME_OVER_WIN 
              ? "You have conquered the algorithm dungeon!" 
              : "The problems were too hard this time..."}
          </p>
          <button 
            onClick={resetGame}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Safe access to currentRoomData
  const currentRoomData = dungeon[player.currentRoom.y]?.[player.currentRoom.x];
  
  if (!currentRoomData) {
      // Fallback for transition states where dungeon might be empty but status not yet SETUP
      return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const canTravel = currentRoomData.cleared; // Strictly cleared based
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar / Stats */}
      <div className="md:w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto z-10 shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <span className="bg-blue-600 p-1 rounded"><Activity size={16}/></span>
            {player.handle}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{TIER_NAMES[player.tier]}</p>
        </div>

        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm uppercase font-bold">Health</span>
            <span className="text-red-400 font-mono text-xl">{player.hp} / {INITIAL_HP}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(player.hp, 3) }).map((_, i) => (
               <Heart 
                 key={i} 
                 size={20} 
                 className={`${i < player.hp ? 'text-red-500 fill-red-500' : 'text-gray-700'} transition-all`} 
               />
            ))}
          </div>
        </div>

        <div className="bg-black/20 rounded p-2 overflow-hidden flex flex-col h-48 shrink-0">
           <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Event Log</h3>
           <div className="space-y-2 font-mono text-xs text-gray-400 overflow-y-auto flex-1 pr-1">
             {player.history.map((log, i) => (
               <div key={i} className="border-l-2 border-gray-700 pl-2 py-1">{log}</div>
             ))}
           </div>
        </div>

        <button 
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <BarChart2 size={16} /> View Tag Stats
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 p-4 md:p-8 flex flex-col items-center overflow-y-auto">
          
          <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center">
             <div className="order-2 md:order-1 flex-1 w-full">
                <RoomView 
                  room={currentRoomData}
                  onSolveAttempt={(pid) => handleSolveAttempt(pid, currentRoomData.problems.find(p => p.id === pid)?.uid || '')}
                  onSkipProblem={(pid) => handleSkipProblem(pid, currentRoomData.problems.find(p => p.id === pid)?.uid || '')}
                  onLeaveRoom={handleLeaveRoom}
                  onTravel={handleTravel}
                  isLoading={isLoading}
                  canTravel={canTravel}
                />
             </div>
             
             <div className="order-1 md:order-2 w-full md:w-auto flex justify-center">
               <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl w-full flex justify-center">
                 <div className="w-full">
                   <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 text-center">Dungeon Map</h3>
                   <GameMap 
                      grid={dungeon} 
                      currentRoom={player.currentRoom} 
                      onRoomClick={(x, y) => handleMapClick(x, y)}
                      adjacentCoords={currentRoomData.adjacent}
                   />
                 </div>
               </div>
             </div>
          </div>

        </div>
      </div>

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-4xl rounded-xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
             <div className="flex justify-between items-center mb-6 shrink-0">
               <h2 className="text-xl font-bold text-white">Tag Statistics</h2>
               <button 
                 onClick={() => setShowStats(false)} 
                 className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
               >
                 Close
               </button>
             </div>
             
             <div className="space-y-8 flex-1 overflow-y-auto pr-2">
               
               {/* Chart Data Prep */}
               {(() => {
                 const chartData = Object.entries(player.tagStats).map(([k, v]) => ({ 
                   name: k, 
                   chance: v.chance, 
                   mean: v.mean,
                   stdDev: v.stdDev 
                 }));

                 return (
                   <>
                     {/* Frequency */}
                     <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                       <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                         <BarChart2 size={16}/> Frequency (Weight)
                       </h3>
                       <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                             <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                             <Tooltip 
                               contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                               itemStyle={{ color: '#e5e5e5' }}
                               cursor={{fill: 'rgba(59, 130, 246, 0.1)'}}
                             />
                             <Bar dataKey="chance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>

                     {/* Difficulty */}
                     <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                       <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                         <Activity size={16}/> Difficulty (Rating)
                       </h3>
                       <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                             <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                             <Tooltip 
                               contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                               itemStyle={{ color: '#e5e5e5' }}
                               cursor={{fill: 'rgba(239, 68, 68, 0.1)'}}
                             />
                             <Bar dataKey="mean" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>

                     {/* Variance */}
                     <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                       <h3 className="text-sm font-bold text-yellow-400 mb-4 flex items-center gap-2">
                         <Activity size={16}/> Variance (Std Dev)
                       </h3>
                       <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                             <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                             <Tooltip 
                               contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                               itemStyle={{ color: '#e5e5e5' }}
                               cursor={{fill: 'rgba(234, 179, 8, 0.1)'}}
                             />
                             <Bar dataKey="stdDev" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                   </>
                 );
               })()}
               
               {/* Modifiers Grid */}
               {player.modifiers.length > 0 && (
                 <div className="pt-6 border-t border-gray-700">
                   <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Active Modifiers</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {player.modifiers.map((mod, i) => (
                        <div key={i} className="bg-gray-800/50 p-3 rounded border border-gray-700/50 flex flex-col gap-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded w-fit ${
                            mod.type === 'HP' ? 'bg-green-900/50 text-green-400' :
                            mod.type.includes('GAMBLING') ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-blue-900/50 text-blue-400'
                          }`}>
                            {mod.type.replace('_', ' ')}
                          </span>
                          <span className="text-gray-300 text-sm">{mod.description}</span>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
