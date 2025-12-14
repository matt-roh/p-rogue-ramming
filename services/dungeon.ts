import { Room, RoomType } from '../types';

export const generateDungeon = (size: number): Room[][] => {
  const grid: Room[][] = [];

  // Initialize Grid
  for (let y = 0; y < size; y++) {
    const row: Room[] = [];
    for (let x = 0; x < size; x++) {
      row.push({
        x,
        y,
        type: RoomType.NORMAL, // Default, will change
        visited: false,
        revealed: false,
        cleared: false,
        problems: [],
        problemsSolvedCount: 0,
        adjacent: [],
      });
    }
    grid.push(row);
  }

  // Generate Tree using Randomized Prim's or DFS
  // Using Randomized DFS for simplicity and "mazey" feel
  const stack: { x: number; y: number }[] = [];
  const visited = new Set<string>();
  const startX = Math.floor(Math.random() * size);
  const startY = Math.floor(Math.random() * size);

  stack.push({ x: startX, y: startY });
  visited.add(`${startX},${startY}`);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
    ].filter(
      (n) =>
        n.x >= 0 &&
        n.x < size &&
        n.y >= 0 &&
        n.y < size &&
        !visited.has(`${n.x},${n.y}`)
    );

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Link logic (add adjacency)
      grid[current.y][current.x].adjacent.push({ x: next.x, y: next.y });
      grid[next.y][next.x].adjacent.push({ x: current.x, y: current.y });
      
      visited.add(`${next.x},${next.y}`);
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Find Diameter for Entrance and Final Boss
  const bfs = (start: { x: number; y: number }) => {
    const dist = new Map<string, number>();
    const prev = new Map<string, { x: number; y: number }>();
    const q = [start];
    dist.set(`${start.x},${start.y}`, 0);
    let farthest = start;

    while (q.length > 0) {
      const u = q.shift()!;
      if ((dist.get(`${u.x},${u.y}`) || 0) > (dist.get(`${farthest.x},${farthest.y}`) || 0)) {
        farthest = u;
      }
      for (const v of grid[u.y][u.x].adjacent) {
        if (!dist.has(`${v.x},${v.y}`)) {
          dist.set(`${v.x},${v.y}`, (dist.get(`${u.x},${u.y}`) || 0) + 1);
          prev.set(`${v.x},${v.y}`, u);
          q.push(v);
        }
      }
    }
    return { farthest, dist };
  };

  // 1. Random point -> Farthest A
  const p1 = bfs({ x: 0, y: 0 }).farthest;
  // 2. Farthest A -> Farthest B (Diameter end)
  const p2Data = bfs(p1);
  const startNode = p1;
  const endNode = p2Data.farthest;

  // Set Types
  grid[startNode.y][startNode.x].type = RoomType.ENTRANCE;
  grid[startNode.y][startNode.x].revealed = true; // Reveal entrance
  grid[startNode.y][startNode.x].visited = true; // Consider user 'at' entrance
  grid[endNode.y][endNode.x].type = RoomType.FINAL_BOSS;

  // Assign other rooms
  const allCoords = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x === startNode.x && y === startNode.y) || (x === endNode.x && y === endNode.y)) continue;
      allCoords.push({ x, y });
    }
  }

  // Shuffle
  for (let i = allCoords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCoords[i], allCoords[j]] = [allCoords[j], allCoords[i]];
  }

  // 3:2:1 Ratio -> Normal:Artifact:MiniBoss
  const totalOthers = allCoords.length;
  const normalCount = Math.floor(totalOthers * (3 / 6));
  const artifactCount = Math.floor(totalOthers * (2 / 6));
  // Remaining are MiniBoss

  let idx = 0;
  for (; idx < normalCount; idx++) grid[allCoords[idx].y][allCoords[idx].x].type = RoomType.NORMAL;
  for (; idx < normalCount + artifactCount; idx++) grid[allCoords[idx].y][allCoords[idx].x].type = RoomType.ARTIFACT;
  for (; idx < totalOthers; idx++) grid[allCoords[idx].y][allCoords[idx].x].type = RoomType.MINI_BOSS;

  // Reveal neighbors of entrance
  grid[startNode.y][startNode.x].adjacent.forEach(adj => {
    grid[adj.y][adj.x].revealed = true;
  });

  return grid;
};