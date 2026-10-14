import fs from 'fs';
import path from 'path';

// Memory cache to guarantee data availability even if filesystem is read-only
const memoryStore: Record<string, any> = {};

/**
 * Safely reads a JSON file from disk.
 * Prioritizes local project data directory (process.cwd()/data),
 * falls back to /tmp (for serverless environments),
 * and finally to in-memory store or defaultData.
 */
export function safeReadJson<T>(fileName: string, defaultData: T): T {
  // 1. Check bundled project data directory (process.cwd()/data)
  try {
    const localPath = path.join(process.cwd(), 'data', fileName);
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore[fileName] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`[safeStorage] Could not read ${fileName} from local data dir:`, err);
  }

  // 2. Check /tmp directory fallback (for serverless environments)
  try {
    const tmpPath = path.join('/tmp', 'hayalmest_data', fileName);
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore[fileName] = parsed;
      return parsed;
    }
  } catch (err) {
    // Ignore tmp read errors
  }

  // 3. Fallback to in-memory store if previously written
  if (memoryStore[fileName] !== undefined) {
    return memoryStore[fileName];
  }

  // 4. Default data fallback
  memoryStore[fileName] = defaultData;
  return defaultData;
}

/**
 * Safely writes a JSON file to disk.
 * Always updates memoryStore immediately, then attempts to write to disk.
 * Falls back to /tmp if local filesystem is read-only (EROFS).
 */
export function safeWriteJson<T>(fileName: string, data: T): void {
  // Always update in-memory cache first
  memoryStore[fileName] = data;

  // 1. Try writing to local project data directory
  try {
    const localDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, fileName);
    fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf-8');
    return;
  } catch (err: any) {
    // 2. If EROFS (read-only filesystem on Vercel), write to /tmp
    if (err && (err.code === 'EROFS' || err.code === 'EACCES')) {
      try {
        const tmpDir = path.join('/tmp', 'hayalmest_data');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpPath = path.join(tmpDir, fileName);
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
        return;
      } catch (tmpErr) {
        console.warn(`[safeStorage] /tmp fallback write failed for ${fileName}:`, tmpErr);
      }
    }
    console.warn(`[safeStorage] Disk write bypassed for ${fileName}:`, err);
  }
}
