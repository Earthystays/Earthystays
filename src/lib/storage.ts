import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function readJsonSync<T>(filename: string, fallback: T): T {
  try {
    const txt = fsSync.readFileSync(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

export async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    const txt = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export async function appendJson<T>(filename: string, item: T): Promise<void> {
  const existing = await readJson<T[]>(filename, []);
  existing.unshift(item); // newest first
  await writeJson(filename, existing);
}
