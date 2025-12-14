
import React from 'react';
import { Room, RoomType, Problem } from '../types';
import { CheckCircle, ExternalLink, ShieldAlert, Sword, Gift, Skull, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoomViewProps {
  room: Room;
  onSolveAttempt: (problemId: number) => void;
  onSkipProblem: (problemId: number) => void;
  onLeaveRoom: () => void;
  onTravel: (direction: { x: number; y: number }) => void;
  isLoading: boolean;
  canTravel: boolean;
}

const ProblemCard: React.FC<{
  problem: Problem;
  onCheck: () => void;
  onSkip: () => void;
  loading: boolean;
  canSkip: boolean;
  actionLabel: string;
  disabled: boolean;
}> = ({ problem, onCheck, onSkip, loading, canSkip, actionLabel, disabled }) => {
  return (
    <div className={`p-4 rounded-lg border ${problem.isSolved ? 'bg-green-900/30 border-green-600' : 'bg-gray-800 border-gray-700'} mb-4 flex flex-col gap-2 shadow-lg transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
            <span className="bg-gray-700 text-xs px-2 py-1 rounded text-white">Lv.{problem.level}</span>
            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
              {problem.id}: {problem.title}
              <ExternalLink size={14} />
            </a>
          </h3>
          <p className="text-xs text-gray-400 mt-1">Tags: {problem.tags.join(', ')}</p>
        </div>
        {problem.isSolved && <CheckCircle className="text-green-500" />}
      </div>
      
      {!problem.isSolved && (
        <div className="flex gap-2 mt-2">
          <button 
            onClick={onCheck} 
            disabled={loading || disabled}
            className={`px-4 py-2 rounded text-sm font-semibold flex-1 transition-colors ${
               problem.reward 
                 ? 'bg-pink-600 hover:bg-pink-500 text-white' 
                 : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Checking...' : actionLabel}
          </button>
          {canSkip && (
            <button 
              onClick={onSkip}
              disabled={loading || disabled}
              className="bg-red-900/50 hover:bg-red-900/80 text-red-200 px-3 py-2 rounded text-sm border border-red-800 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const RoomView: React.FC<RoomViewProps> = ({ 
  room, 
  onSolveAttempt, 
  onSkipProblem, 
  onLeaveRoom, 
  onTravel,
  isLoading,
  canTravel
}) => {
  
  const getHeader = () => {
    switch(room.type) {
      case RoomType.ENTRANCE: return { title: 'Entrance', icon: <ShieldAlert className="text-green-500" />, desc: 'The journey begins.' };
      case RoomType.NORMAL: return { title: 'Chamber', icon: <Sword className="text-gray-400" />, desc: 'A standard challenge awaits.' };
      case RoomType.MINI_BOSS: return { title: 'Mini Boss', icon: <Skull className="text-yellow-500" />, desc: 'Solve 2 to heal. Fail all to hurt.' };
      case RoomType.ARTIFACT: return { title: 'Artifact', icon: <Gift className="text-pink-500" />, desc: 'Choose a boon.' };
      case RoomType.FINAL_BOSS: return { title: 'Final Boss', icon: <Skull className="text-red-600 w-8 h-8" />, desc: 'Endless torment. Survive 3.' };
    }
  };

  const header = getHeader();

  // Artifact Logic: If any problem is solved, others are disabled
  const isArtifactCleared = room.type === RoomType.ARTIFACT && room.problems.some(p => p.isSolved);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl"
    >
      <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <div className="p-3 bg-gray-800 rounded-full">{header.icon}</div>
        <div>
          <h2 className="text-2xl font-bold text-white">{header.title}</h2>
          <p className="text-gray-400">{header.desc}</p>
        </div>
      </div>

      <div className="mb-6">
        {room.problems.length === 0 && !room.cleared && (
           <div className="text-center py-8 text-gray-500 italic">Generating problems...</div>
        )}
        
        {room.problems.map((p) => {
           let actionLabel = "Check Solved";
           if (room.type === RoomType.ARTIFACT) {
             if (p.reward) {
               // Use description directly (e.g., "Recover +1 HP" or "Hardcore: math Diff+0.5")
               actionLabel = p.reward.description;
             } else {
               actionLabel = "Claim Artifact";
             }
           }

           const isDisabled = room.cleared || (isArtifactCleared && !p.isSolved);
           
           // Mini Boss: Disable skips, only "Check Solved". 
           // Artifact: Disable skips.
           // Normal/Entrance: Can skip only if not solved.
           const canSkip = room.type === RoomType.FINAL_BOSS || room.type === RoomType.NORMAL || room.type === RoomType.ENTRANCE;

           return (
            <ProblemCard
              key={p.uid} 
              problem={p}
              loading={isLoading}
              onCheck={() => onSolveAttempt(p.id)}
              onSkip={() => onSkipProblem(p.id)}
              canSkip={canSkip && !p.isSolved} 
              actionLabel={actionLabel}
              disabled={isDisabled}
            />
           );
        })}

        {room.type === RoomType.FINAL_BOSS && isLoading && (
            <div className="flex items-center justify-center gap-2 p-4 text-gray-400 animate-pulse">
                <Loader2 className="animate-spin" />
                <span>Summoning next challenge...</span>
            </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        {room.type === RoomType.FINAL_BOSS ? (
           <div className="text-center">
              <h3 className="text-xl font-bold text-red-500 mb-2">SURVIVE</h3>
              <p className="text-gray-400">Problems Solved: <span className="text-white font-bold text-xl">{room.problemsSolvedCount} / 3</span></p>
           </div>
        ) : (
          <>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Navigation</h3>
            
            {room.cleared && <p className="text-green-500 mb-2 text-sm font-mono">Room Cleared. Interactions disabled.</p>}

            {canTravel ? (
              <div className="grid grid-cols-2 gap-4">
                 {room.adjacent.map((adj, idx) => (
                   <button
                     key={idx}
                     onClick={() => onTravel(adj)}
                     className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded flex items-center justify-center gap-2 border border-gray-700"
                   >
                     Go to ({adj.x}, {adj.y})
                   </button>
                 ))}
              </div>
            ) : (
              <div className="text-center text-yellow-500 bg-yellow-900/20 p-3 rounded border border-yellow-900/50">
                <p>
                  {room.type === RoomType.MINI_BOSS 
                    ? "You must solve at least one problem to travel, or give up." 
                    : "Clear the room or suffer the penalty to proceed."}
                </p>
                  
                {/* Force Escape - Show here unless it's Mini Boss (which has special button below) */}
                {room.type !== RoomType.MINI_BOSS && (
                    <button 
                      onClick={onLeaveRoom}
                      className="mt-2 text-sm text-red-400 hover:text-red-300 underline block w-full"
                    >
                      Force Escape (-1 HP)
                    </button>
                )}
              </div>
            )}

            {/* Explicit Give Up/Finish Button for Mini Boss */}
            {room.type === RoomType.MINI_BOSS && !room.cleared && (
                <div className="mt-4 pt-4 border-t border-gray-800/50">
                    <button 
                        onClick={onLeaveRoom}
                        className="w-full py-3 px-4 rounded border border-yellow-600/50 text-yellow-200 hover:bg-yellow-900/30 transition-colors font-bold uppercase text-sm tracking-wide"
                    >
                        {room.problemsSolvedCount === 0 ? "Give Up (-1 HP)" : `Finish Room & Claim HP (${room.problemsSolvedCount - 1} HP)`}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Stops ability to solve more problems and finalizes rewards.
                    </p>
                </div>
            )}

            {/* Artifact Give Up (if not solved) */}
            {room.type === RoomType.ARTIFACT && !room.cleared && (
                 <button onClick={onLeaveRoom} className="mt-2 text-gray-500 hover:text-gray-300 text-sm w-full underline">
                    Skip Artifact (No Penalty)
                 </button>
            )}

          </>
        )}
      </div>

    </motion.div>
  );
};
