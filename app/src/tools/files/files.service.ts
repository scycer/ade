import { Glob } from "bun";
import { existsSync } from "node:fs";

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

export const filesService = {
  getAllFiles,
};