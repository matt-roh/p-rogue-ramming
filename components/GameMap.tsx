
import React from 'react';
import { Room, RoomType } from '../types';
import { motion } from 'framer-motion';

interface GameMapProps {
  grid: Room[][];
  currentRoom: { x: number; y: number };
  onRoomClick: (x: number, y: number) => void;
  adjacentCoords: { x: number; y: number }[];
}

const RoomCell: React.FC<{ 
  room: Room; 
  isCurrent: boolean; 
  isAdjacent: boolean;
  onClick: () => void;
}> = ({ room, isCurrent, isAdjacent, onClick }) => {
  if (!room.revealed && !room.visited && !room.cleared) {
    return <div className="w-14 h-14 bg-gray-900 m-1 rounded border border-gray-800 opacity-50" />;
  }

  let bgColor = 'bg-gray-600'; // Normal
  let borderColor = 'border-gray-500';

  if (room.type === RoomType.ENTRANCE) bgColor = 'bg-green-700';
  if (room.type === RoomType.MINI_BOSS) bgColor = 'bg-yellow-700';
  if (room.type === RoomType.ARTIFACT) bgColor = 'bg-pink-700';
  if (room.type === RoomType.FINAL_BOSS) bgColor = 'bg-red-800';

  if (room.cleared) {
    bgColor = 'bg-gray-800'; // Darken cleared rooms
    borderColor = 'border-gray-600';
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={isAdjacent ? onClick : undefined}
      className={`w-14 h-14 m-1 rounded flex items-center justify-center relative ${bgColor} border-2 ${
        isCurrent ? 'border-blue-400 ring-2 ring-blue-400' : borderColor
      } ${isAdjacent ? 'cursor-pointer hover:brightness-110 hover:border-white' : ''}`}
    >
      {isCurrent && (
        <div className="w-4 h-4 bg-blue-200 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      )}
      
      {/* Fog Overlay for Revealed but Unvisited (optional) */}
      {!room.visited && room.revealed && (
        <div className="absolute inset-0 bg-black bg-opacity-30 rounded pointer-events-none" />
      )}
    </motion.div>
  );
};

export const GameMap: React.FC<GameMapProps> = ({ grid, currentRoom, onRoomClick, adjacentCoords }) => {
  const isAdjacent = (x: number, y: number) => {
    return adjacentCoords.some(c => c.x === x && c.y === y);
  };

  return (
    <div className="flex flex-col items-center bg-gray-950 p-4 rounded-xl shadow-inner overflow-auto max-h-[60vh] max-w-full">
      {grid.map((row, y) => (
        <div key={y} className="flex">
          {row.map((room, x) => (
            <RoomCell 
              key={`${x}-${y}`} 
              room={room} 
              isCurrent={currentRoom.x === x && currentRoom.y === y} 
              isAdjacent={isAdjacent(x, y)}
              onClick={() => onRoomClick(x, y)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
