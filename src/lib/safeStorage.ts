import fs from 'fs';
import path from 'path';

// Memory cache to guarantee data availability even if filesystem is read-only
const memoryStore: Record<string, any> = {};

function isServerless(): boolean {
  return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME);
}

function getDataDirectory(): string {
  if (isServerless()) {
    return path.join('/tmp', 'hayalmest_data');
  }
  return path.join(process.cwd(), 'data');
}

/**
 * Safely reads a JSON file from disk.
 * Checks tmp dir first (for serverless persisted state in current instance),
 * then falls back to local data/ directory, and finally to defaultData.
 * Never throws an uncaught exception.
 */
export function safeReadJson<T>(fileName: string, defaultData: T): T {
  try {
    // 1. If in serverless, check /tmp first (has latest writes)
    if (isServerless()) {
      const tmpPath = path.join('/tmp', 'hayalmest_data', fileName);
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf-8');
        const parsed = JSON.parse(raw);
        memoryStore[fileName] = parsed;
        return parsed;
      }
    }

    // 2. Check bundled project data directory (process.cwd()/data)
    const localPath = path.join(process.cwd(), 'data', fileName);
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore[fileName] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`[safeStorage] Notice: Could not read ${fileName} from filesystem:`, err);
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
 * Never throws EROFS (read-only filesystem) errors.
 */
export function safeWriteJson<T>(fileName: string, data: T): void {
  // Always update in-memory cache first
  memoryStore[fileName] = data;

  try {
    const targetDir = getDataDirectory();
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, fileName);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[safeStorage] Disk write bypassed for ${fileName} (running in read-only/serverless mode):`, err);
  }
}
