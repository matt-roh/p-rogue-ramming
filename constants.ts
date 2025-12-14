import { TagStat } from './types';

export const INITIAL_HP = 3;

export const INITIAL_TAGS: string[] = [
  'math',
  'geometry',
  'implementation',
  'dp',
  'greedy',
  'graphs',
  'string',
  'data_structures',
];

export const INITIAL_TAG_STAT: Omit<TagStat, 'mean'> = {
  chance: 1,
  stdDev: 1,
};

export const TIER_NAMES = [
  'Unrated',
  'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
  'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
  'Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I',
  'Platinum V', 'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
  'Diamond V', 'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
  'Ruby V', 'Ruby IV', 'Ruby III', 'Ruby II', 'Ruby I',
  'Master'
];

export const SOLVED_AC_API_URL = 'https://solved.ac/api/v3';

// Fallback problem if API fails completely
export const FALLBACK_PROBLEM = {
  uid: 'fallback',
  id: 1000,
  title: 'A+B',
  level: 1,
  tags: ['implementation', 'math'],
  url: 'https://acmicpc.net/problem/1000',
  isSolved: false,
};

// A curated list of real problems to use when the API is unreachable (offline mode)
export const OFFLINE_PROBLEMS = [
  // Bronze / Basic
  { id: 2557, title: 'Hello World', level: 1, tags: ['implementation'] },
  { id: 2739, title: 'Multiplication Table', level: 1, tags: ['math', 'implementation'] },
  { id: 10869, title: 'Four Arithmetic Operations', level: 1, tags: ['math', 'implementation'] },
  { id: 2753, title: 'Leap Year', level: 2, tags: ['math', 'implementation'] },
  { id: 2438, title: 'Star - 1', level: 3, tags: ['implementation'] },
  
  // Silver / Intermediate
  { id: 1920, title: 'Find Number', level: 7, tags: ['binary_search', 'sorting'] },
  { id: 2164, title: 'Card 2', level: 7, tags: ['data_structures', 'queue'] },
  { id: 10828, title: 'Stack', level: 7, tags: ['data_structures', 'stack'] },
  { id: 11399, title: 'ATM', level: 8, tags: ['greedy', 'sorting'] },
  { id: 9012, title: 'Parenthesis', level: 7, tags: ['data_structures', 'string'] },
  { id: 10845, title: 'Queue', level: 7, tags: ['data_structures', 'queue'] },
  
  // Gold / Advanced
  { id: 12865, title: 'Ordinary Knapsack', level: 11, tags: ['dp', 'knapsack'] },
  { id: 7576, title: 'Tomato', level: 11, tags: ['graphs', 'bfs'] },
  { id: 1107, title: 'Remote Control', level: 11, tags: ['bruteforcing'] },
  { id: 1753, title: 'Shortest Path', level: 12, tags: ['graphs', 'dijkstra'] },
  { id: 9251, title: 'LCS', level: 11, tags: ['dp', 'string'] },
  { id: 9663, title: 'N-Queen', level: 11, tags: ['bruteforcing', 'backtracking'] },
  { id: 11053, title: 'LIS', level: 12, tags: ['dp'] },

  // Platinum / Expert
  { id: 2150, title: 'SCC', level: 16, tags: ['graphs', 'scc'] },
  { id: 4195, title: 'Virtual Friends', level: 16, tags: ['data_structures', 'disjoint_set'] },
  { id: 14438, title: 'Sequence and Query 17', level: 16, tags: ['data_structures', 'segment_tree'] },
  { id: 6549, title: 'Histogram', level: 16, tags: ['data_structures', 'stack', 'divide_and_conquer'] },
  { id: 3015, title: 'Oasis Reunion', level: 16, tags: ['data_structures', 'stack'] },
  
  // Diamond / Ruby (Rare)
  { id: 18185, title: 'Ramen Buy', level: 21, tags: ['greedy'] },
  { id: 13548, title: 'Query 6', level: 21, tags: ['data_structures', 'mo'] }
];