import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
  extension?: string;
}

export async function listFiles(dirPath: string = '/app'): Promise<FileInfo[]> {
  try {
    const files = await readdir(dirPath);
    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const fullPath = join(dirPath, file);
      try {
        const stats = await stat(fullPath);
        const extension = file.includes('.') ? file.split('.').pop() : undefined;

        fileInfos.push({
          name: file,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
          extension
        });
      } catch (err) {
        console.error(`Error getting stats for ${fullPath}:`, err);
      }
    }

    return fileInfos.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error('Error listing files:', err);
    throw err;
  }
}

export async function readFile(filePath: string): Promise<{ content: string; error?: string }> {
  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      return { content: '', error: 'File not found' };
    }

    const size = file.size;
    if (size > 1024 * 1024 * 5) {
      return { content: '', error: 'File too large (>5MB)' };
    }

    const content = await file.text();
    return { content };
  } catch (err) {
    console.error('Error reading file:', err);
    return { content: '', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}