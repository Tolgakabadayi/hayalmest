import fs from 'fs';
import path from 'path';

// Memory cache to guarantee data availability across calls in current runtime
const memoryStore: Record<string, any> = {};
const deletedIdsStore: Record<string, Set<string>> = {};

/**
 * Tracks deleted item IDs permanently so they are never resurrected
 * even if present in the build-time static local file.
 */
export function recordDeletedId(fileName: string, id: string): void {
  if (!deletedIdsStore[fileName]) {
    deletedIdsStore[fileName] = new Set<string>();
  }
  deletedIdsStore[fileName].add(id);

  try {
    const tmpDir = path.join('/tmp', 'hayalmest_data');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const delPath = path.join(tmpDir, `deleted_${fileName}`);
    fs.writeFileSync(delPath, JSON.stringify(Array.from(deletedIdsStore[fileName])), 'utf-8');
  } catch (err) {
    // Ignore tmp write errors
  }
}

export function getDeletedIds(fileName: string): Set<string> {
  if (!deletedIdsStore[fileName]) {
    deletedIdsStore[fileName] = new Set<string>();
    try {
      const delPath = path.join('/tmp', 'hayalmest_data', `deleted_${fileName}`);
      if (fs.existsSync(delPath)) {
        const raw = fs.readFileSync(delPath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((id: string) => deletedIdsStore[fileName].add(id));
        }
      }
    } catch (err) {
      // Ignore tmp read errors
    }
  }
  return deletedIdsStore[fileName];
}

/**
 * Safely reads a JSON file from disk.
 * Checks both /tmp (where serverless writes persist) and local project data directory,
 * compares modification times (mtimeMs) to pick the newest copy,
 * excludes deleted IDs, and falls back to memoryStore or defaultData.
 */
export function safeReadJson<T>(fileName: string, defaultData: T): T {
  let tmpData: T | null = null;
  let tmpMtime = 0;
  let localData: T | null = null;
  let localMtime = 0;
  const deletedSet = getDeletedIds(fileName);

  // 1. Check /tmp directory (where runtime writes happen on Vercel/serverless)
  try {
    const tmpPath = path.join('/tmp', 'hayalmest_data', fileName);
    if (fs.existsSync(tmpPath)) {
      const stat = fs.statSync(tmpPath);
      tmpMtime = stat.mtimeMs;
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      tmpData = JSON.parse(raw);
    }
  } catch (err) {
    // Ignore tmp read errors
  }

  // 2. Check local data directory (process.cwd()/data)
  try {
    const localPath = path.join(process.cwd(), 'data', fileName);
    if (fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      localMtime = stat.mtimeMs;
      const raw = fs.readFileSync(localPath, 'utf-8');
      localData = JSON.parse(raw);
    }
  } catch (err) {
    // Ignore local read errors
  }

  // 3. Determine newest data between /tmp and local data/
  let newestData: T | null = null;
  if (tmpData !== null && localData !== null) {
    if (Array.isArray(tmpData) && Array.isArray(localData)) {
      // Merge by unique 'id' preserving runtime writes while skipping deleted IDs
      const mergedMap = new Map<string, any>();
      for (const item of localData) {
        if (item && item.id && !deletedSet.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      }
      for (const item of tmpData) {
        if (item && item.id && !deletedSet.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      }
      newestData = Array.from(mergedMap.values()) as unknown as T;
    } else {
      newestData = tmpMtime >= localMtime ? tmpData : localData;
    }
  } else if (tmpData !== null) {
    newestData = tmpData;
  } else if (localData !== null) {
    newestData = localData;
  }

  // Double check deletion filter on resulting array
  if (Array.isArray(newestData)) {
    newestData = (newestData as any[]).filter(item => !item || !item.id || !deletedSet.has(item.id)) as unknown as T;
  }

  // If valid data found from disk
  if (newestData !== null) {
    // Safeguard: if disk has empty array [] but memoryStore has active items,
    // do not clobber in-memory active items
    if (
      Array.isArray(newestData) &&
      newestData.length === 0 &&
      Array.isArray(memoryStore[fileName]) &&
      memoryStore[fileName].length > 0
    ) {
      return memoryStore[fileName] as T;
    }
    memoryStore[fileName] = newestData;
    return newestData;
  }

  // 4. Fallback to in-memory store if previously written
  if (memoryStore[fileName] !== undefined) {
    return memoryStore[fileName] as T;
  }

  // 5. Default data fallback
  memoryStore[fileName] = defaultData;
  return defaultData;
}

/**
 * Safely writes a JSON file to disk.
 * Writes to BOTH /tmp and local project data directory (if writable),
 * ensuring the latest writes are picked up in all environments.
 */
export function safeWriteJson<T>(fileName: string, data: T): void {
  // Always update in-memory cache first
  memoryStore[fileName] = data;

  // 1. Write to local project data directory (if writable)
  try {
    const localDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, fileName);
    fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Expected on Vercel EROFS read-only environment
  }

  // 2. Always write to /tmp directory as well
  try {
    const tmpDir = path.join('/tmp', 'hayalmest_data');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpPath = path.join(tmpDir, fileName);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (tmpErr) {
    console.warn(`[safeStorage] /tmp write failed for ${fileName}:`, tmpErr);
  }
}
