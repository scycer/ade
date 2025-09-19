import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GitDiffFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  patch: string;
}

interface GitDiffData {
  files: GitDiffFile[];
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
}

export function GitDiff() {
  const [diffData, setDiffData] = useState<GitDiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGitDiff();
  }, []);

  const fetchGitDiff = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/git/diff");
      if (!response.ok) {
        throw new Error(`Failed to fetch git diff: ${response.statusText}`);
      }
      const data = await response.json();
      setDiffData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch git diff');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!diffData || diffData.files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Changes</CardTitle>
          <CardDescription>Your working directory is clean</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Git Diff</h2>
          <p className="text-sm text-muted-foreground">
            {diffData.totalFiles} file{diffData.totalFiles !== 1 ? 's' : ''} changed,
            <span className="text-green-600 ml-1">+{diffData.totalAdditions}</span> additions,
            <span className="text-red-600 ml-1">-{diffData.totalDeletions}</span> deletions
          </p>
        </div>

        {diffData.files.map((file, index) => (
          <Card key={index} className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-mono truncate flex-1 min-w-0">{file.filename}</CardTitle>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={file.status} />
                  <span className="text-sm whitespace-nowrap">
                    <span className="text-green-600">+{file.additions}</span>
                    {' '}
                    <span className="text-red-600">-{file.deletions}</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-muted/50 rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <pre className="text-xs p-4 m-0 whitespace-pre" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
                    <code className="font-mono inline-block">{formatPatch(file.patch)}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    added: 'bg-green-100 text-green-800',
    modified: 'bg-blue-100 text-blue-800',
    deleted: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status as keyof typeof colors] || ''}`}>
      {status}
    </span>
  );
}

function formatPatch(patch: string): string {
  // Remove the first line (diff --git) if present
  const lines = patch.split('\n');
  const formattedLines = lines.map(line => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return `🟩 ${line.substring(1)}`;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      return `🟥 ${line.substring(1)}`;
    } else if (line.startsWith('@@')) {
      return `📍 ${line}`;
    }
    return line;
  });

  return formattedLines.join('\n');
}