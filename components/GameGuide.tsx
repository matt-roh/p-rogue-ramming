
import React from 'react';
import { X, BookOpen, Shield, Zap, Gift, Target } from 'lucide-react';

interface GameGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameGuide: React.FC<GameGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-blue-500" /> Adventurer's Guide
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8 text-gray-300">
          
          <section>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Target size={20} className="text-green-500" /> The Objective
            </h3>
            <p>
              Navigate the dungeon to find and defeat the <strong>Final Boss</strong>. 
              Your weapon is your coding skill. Solve algorithmic problems from <em>solved.ac</em> to clear rooms and progress.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={20} className="text-blue-500" /> Room Types
            </h3>
            <div className="grid gap-4">
              <div className="flex gap-3">
                <div className="mt-1 shrink-0"><div className="w-4 h-4 rounded bg-gray-600 border border-gray-500"></div></div>
                <div>
                  <strong className="text-gray-200">Normal Chamber</strong>
                  <p className="text-sm">Standard problems. Solve 1 to clear. Fleeing costs <span className="text-red-400">-1 HP</span>.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 shrink-0"><div className="w-4 h-4 rounded bg-yellow-700 border border-yellow-600"></div></div>
                <div>
                  <strong className="text-yellow-200">Mini-Boss</strong>
                  <p className="text-sm">A gauntlet of 3 problems. Solve 2 to clear and <span className="text-green-400">recover +1 HP</span>. Giving up or failing costs HP based on progress.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 shrink-0"><div className="w-4 h-4 rounded bg-pink-700 border border-pink-600"></div></div>
                <div>
                  <strong className="text-pink-200">Artifact Room</strong>
                  <p className="text-sm">Contains powerful modifiers. Solve a problem to claim its reward. Rewards alter your stats (e.g., increasing problem difficulty variance).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 shrink-0"><div className="w-4 h-4 rounded bg-red-800 border border-red-600"></div></div>
                <div>
                  <strong className="text-red-400">Final Boss</strong>
                  <p className="text-sm">The end goal. Survive a barrage of 3 difficult problems to win the game.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" /> Dynamic Difficulty
            </h3>
            <p className="mb-2">
              The dungeon reacts to you. Every problem is generated based on your <strong>Tag Stats</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
              <li><strong>Rating (Mean):</strong> The average difficulty tier of problems.</li>
              <li><strong>Variance (StdDev):</strong> How much the difficulty fluctuates.</li>
              <li><strong>Frequency (Chance):</strong> How often a specific tag (e.g., DP, Greedy) appears.</li>
            </ul>
            <p className="mt-2 text-sm italic text-gray-400">
              Artifacts directly modify these stats. Be careful not to make 'Math' problems impossible!
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Gift size={20} className="text-purple-500" /> Tips
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>You can <strong>Check Solved</strong> as many times as you want.</li>
              <li>If you are stuck, you can <strong>Skip</strong> a problem, but it usually comes with a penalty.</li>
              <li>Use <strong>Artifacts</strong> strategically to heal or manipulate the problem generation to your strengths.</li>
              <li><strong>Test Mode</strong> lets you play without a real Solved.ac account (using 'total' user).</li>
            </ul>
          </section>

        </div>
        
        <div className="p-4 border-t border-gray-800 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
