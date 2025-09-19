import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const gitDiffSchema = z.object({});

export type GitDiffInput = z.infer<typeof gitDiffSchema>;

export interface GitDiffOutput {
  files: Array<{
    filename: string;
    status: 'added' | 'modified' | 'deleted';
    additions: number;
    deletions: number;
    patch: string;
  }>;
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
}

export async function getGitDiffs(_input: GitDiffInput): Promise<GitDiffOutput> {
  try {
    const { stdout } = await execAsync("git diff --numstat && echo '---SEPARATOR---' && git diff", {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const parts = stdout.split('---SEPARATOR---');
    const numstatOutput = parts[0] || '';
    const diffOutput = parts[1] || '';

    const files: GitDiffOutput['files'] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    // Parse numstat for statistics
    const numstatLines = numstatOutput.trim().split('\n').filter(Boolean);
    const fileStats = new Map<string, { additions: number; deletions: number }>();

    for (const line of numstatLines) {
      const [additions, deletions, filename] = line.split('\t');
      if (additions && deletions && filename) {
        const add = parseInt(additions) || 0;
        const del = parseInt(deletions) || 0;
        fileStats.set(filename, { additions: add, deletions: del });
        totalAdditions += add;
        totalDeletions += del;
      }
    }

    // Parse diff output for patches
    const diffSections = diffOutput.split(/^diff --git /m).filter(Boolean);

    for (const section of diffSections) {
      const fileMatch = section.match(/^a\/(.+?) b\/(.+?)$/m);
      if (!fileMatch || !fileMatch[2]) continue;

      const filename = fileMatch[2];
      const stats = fileStats.get(filename) || { additions: 0, deletions: 0 };

      let status: 'added' | 'modified' | 'deleted' = 'modified';
      if (section.includes('new file mode')) {
        status = 'added';
      } else if (section.includes('deleted file mode')) {
        status = 'deleted';
      }

      files.push({
        filename,
        status,
        additions: stats.additions,
        deletions: stats.deletions,
        patch: section
      });
    }

    return {
      files,
      totalFiles: files.length,
      totalAdditions,
      totalDeletions
    };
  } catch (error) {
    console.error("Error getting git diff:", error);
    return {
      files: [],
      totalFiles: 0,
      totalAdditions: 0,
      totalDeletions: 0
    };
  }
}