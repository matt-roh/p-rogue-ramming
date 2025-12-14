
import { Problem, TagStat, GameConfig } from '../types';
import { SOLVED_AC_API_URL, FALLBACK_PROBLEM, OFFLINE_PROBLEMS } from '../constants';

// --- Helper: Fetch with Timeout ---
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// --- Helper: Fetch with CORS Proxy Fallback ---

const fetchWithFallback = async (url: string) => {
  // Strategy 1: AllOrigins Raw (Best for JSON)
  // We use a timestamp to prevent caching issues
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
    const response = await fetchWithTimeout(proxyUrl, {}, 5000);
    if (response.ok) return await response.json();
  } catch (error) {
    console.warn(`AllOrigins Raw failed for ${url}`, error);
  }

  // Strategy 2: AllOrigins Get (JSON Wrapper) - backup if Raw fails
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, {}, 5000);
    if (response.ok) {
      const data = await response.json();
      if (data && data.contents) {
        return JSON.parse(data.contents);
      }
    }
  } catch (error) {
    console.warn(`AllOrigins Get failed for ${url}`, error);
  }

  // Strategy 3: CorsProxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, {}, 5000);
    if (response.ok) return await response.json();
  } catch (error) {
    console.warn(`CorsProxy.io failed for ${url}`, error);
  }

  throw new Error("All fetch strategies failed");
};

// --- Solved.ac Helper Functions ---

// Fetch user tier. Returns 0 if not found or error.
export const fetchUserTier = async (handle: string): Promise<number> => {
  // In test mode, we use 'total' which is an unrated account (tier 0)
  if (handle === 'total') return 0; 

  try {
    const data = await fetchWithFallback(`${SOLVED_AC_API_URL}/user/show?handle=${handle}`);
    // Explicitly check for number since 0 is falsy
    if (typeof data.tier === 'number') {
      return data.tier;
    }
    return 0;
  } catch (error) {
    console.error("Failed to fetch user tier:", error);
    return 10; // Default to Silver 5 equivalent if fetch fails
  }
};

// Check if a problem is solved by the user
export const checkProblemSolved = async (handle: string, problemId: number, config: GameConfig): Promise<boolean> => {
  if (config.testMode) return true;
  
  try {
    // Query: id:1000 s@user (checks if problem 1000 is in the set of problems solved by user)
    const query = `id:${problemId} s@${handle}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `${SOLVED_AC_API_URL}/search/problem?query=${encodedQuery}&sort=id&direction=asc`;
    
    const data = await fetchWithFallback(url);
    return data.count > 0;
  } catch (error) {
    console.error("Failed to check if problem is solved:", error);
    return false; 
  }
};

// --- Problem Selection Logic ---

export const pickTag = (stats: Record<string, TagStat>): string => {
  const tags = Object.keys(stats);
  const totalWeight = tags.reduce((sum, tag) => sum + stats[tag].chance, 0);
  let r = Math.random() * totalWeight;
  for (const tag of tags) {
    r -= stats[tag].chance;
    if (r <= 0) return tag;
  }
  return tags[tags.length - 1];
};

const randn_bm = () => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

// Generate a single problem
export const generateProblem = async (
  playerHandle: string,
  stats: Record<string, TagStat>,
  config: GameConfig
): Promise<Problem> => {
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  
  const uid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const handle = config.testMode ? 'total' : playerHandle;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    const tag = pickTag(stats);
    const stat = stats[tag];
    
    let difficulty = stat.mean + stat.stdDev * randn_bm();
    difficulty = Math.max(1, Math.min(30, Math.round(difficulty)));

    try {
      // Solved.ac Query: *tier tag:tagname -@user
      // We use -@handle (alias for -s@handle) to exclude problems already solved by the user
      const query = `*${difficulty} tag:${tag} -@${handle}`;
      const encodedQuery = encodeURIComponent(query);
      
      const url = `${SOLVED_AC_API_URL}/search/problem?query=${encodedQuery}&sort=random&page=1`;
      
      const data = await fetchWithFallback(url);
      
      if (data && data.items && data.items.length > 0) {
        const p = data.items[0];
        
        const tags = Array.isArray(p.tags) 
          ? p.tags.map((t: any) => t.key) 
          : [];

        return {
          uid,
          id: p.problemId,
          title: p.titleKo || p.title || `Problem ${p.problemId}`,
          level: p.level,
          tags: tags,
          url: `https://acmicpc.net/problem/${p.problemId}`,
          isSolved: false
        };
      }
    } catch (e) {
      console.warn(`Attempt ${attempts} failed to fetch from API for tag ${tag} tier ${difficulty}.`);
      // Continue to next attempt
    }
  }

  // --- OFFLINE FALLBACK ---
  console.warn("All API attempts failed, switching to offline problem selection.");
  
  const targetLevel = Math.max(1, fetchUserTierSync(stats)); 
  
  let candidates = OFFLINE_PROBLEMS.filter(p => Math.abs(p.level - targetLevel) <= 5);
  if (candidates.length === 0) candidates = OFFLINE_PROBLEMS; 
  
  if (candidates.length > 0) {
    const p = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      uid,
      id: p.id,
      title: p.title,
      level: p.level,
      tags: p.tags,
      url: `https://acmicpc.net/problem/${p.id}`,
      isSolved: false
    };
  }

  return { ...FALLBACK_PROBLEM, uid }; 
};

// Helper to guess target tier from stats if we are offline
const fetchUserTierSync = (stats: Record<string, TagStat>): number => {
    // Just grab the mean of 'math' as a proxy for user level
    return Math.round(stats['math']?.mean || 10);
};
