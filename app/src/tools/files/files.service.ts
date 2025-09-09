import { Glob } from "bun";
import { existsSync } from "node:fs";
import { readFile, writeFile, unlink, stat } from "node:fs/promises";

const getAllFiles = async (dir: string): Promise<string[]> => {
  // Check if directory exists first to avoid noisy errors
  if (!existsSync(dir)) {
    return [];
  }

  try {
    const glob = new Glob("**/*");
    const files: string[] = [];

    for await (const file of glob.scan({
      cwd: dir,
      onlyFiles: true,
    })) {
      files.push(`${dir}/${file}`);
    }

    return files;
  } catch (error) {
    // Only log unexpected errors
    console.error(`Unexpected error reading directory ${dir}:`, error);
    return [];
  }
};

const getFile = async (path: string): Promise<string | null> => {
  try {
    const content = await readFile(path, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    return null;
  }
};

const newFile = async (path: string, content: string): Promise<boolean> => {
  try {
    // Check if file already exists
    if (existsSync(path)) {
      console.error(`File already exists: ${path}`);
      return false;
    }
    
    await writeFile(path, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error creating file ${path}:`, error);
    return false;
  }
};

const updateFile = async (path: string, content: string): Promise<boolean> => {
  try {
    // Check if file exists
    if (!existsSync(path)) {
      console.error(`File does not exist: ${path}`);
      return false;
    }
    
    await writeFile(path, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error updating file ${path}:`, error);
    return false;
  }
};

const deleteFile = async (path: string): Promise<boolean> => {
  try {
    if (!existsSync(path)) {
      console.error(`File does not exist: ${path}`);
      return false;
    }
    
    await unlink(path);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${path}:`, error);
    return false;
  }
};

const fileExists = (path: string): boolean => {
  return existsSync(path);
};

interface FileInfo {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  modifiedTime: Date;
  createdTime: Date;
}

const getFileInfo = async (path: string): Promise<FileInfo | null> => {
  try {
    const stats = await stat(path);
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      modifiedTime: stats.mtime,
      createdTime: stats.birthtime,
    };
  } catch (error) {
    console.error(`Error getting file info for ${path}:`, error);
    return null;
  }
};

export const filesService = {
  getAllFiles,
  getFile,
  newFile,
  updateFile,
  deleteFile,
  fileExists,
  getFileInfo,
};