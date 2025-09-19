import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import "./index.css";

export function App() {
  const [message, setMessage] = useState<string>("");
  const [nodeId, setNodeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brain/hello")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setMessage("");
        } else {
          setMessage(data.message || "Hello from Brain!");
          setNodeId(data.node_id || "");
          setError(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch from brain:", error);
        setError("Failed to connect to brain architecture");
        setMessage("");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Brain Architecture Demo
            <div className="bg-amber-600">Div test</div>
          </CardTitle>
          <CardDescription className="text-center">
            Neural network-inspired application architecture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Connected Successfully</AlertTitle>
                <AlertDescription className="mt-2">
                  {message}
                </AlertDescription>
              </Alert>

              {nodeId && (
                <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Node ID:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {nodeId}
                  </Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;