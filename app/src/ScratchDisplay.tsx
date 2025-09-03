import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScratchSection {
  title: string;
  items: string[];
}

export function ScratchDisplay() {
  const [scratchContent, setScratchContent] = useState<ScratchSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scratch")
      .then((res) => res.json())
      .then((data) => {
        const parsed = parseScratchContent(data.content);
        setScratchContent(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch SCRATCH:", err);
        setLoading(false);
      });
  }, []);

  const parseScratchContent = (content: string): ScratchSection[] => {
    const lines = content.split("\n");
    const sections: ScratchSection[] = [];
    let currentSection: ScratchSection | null = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and main title
      if (!trimmedLine || trimmedLine === "# SCRATCH") return;
      
      // Check for section headers
      if (trimmedLine.startsWith("#")) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        const title = trimmedLine.replace(/^#+\s*/, "");
        currentSection = { title, items: [] };
      }
      // Add items that are not headers
      else if (currentSection && !trimmedLine.startsWith("---")) {
        currentSection.items.push(trimmedLine);
      }
    });

    // Add the last section if it exists and has items
    if (currentSection) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
    }

    return sections;
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg h-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading SCRATCH notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg h-full overflow-auto">
      <CardHeader className="sticky top-0 bg-card/95 backdrop-blur z-10">
        <CardTitle className="text-2xl font-bold text-foreground">📝 SCRATCH Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scratchContent.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
            <ul className="space-y-1.5 pl-4">
              {section.items.map((item, itemIndex) => (
                item && (
                  <li key={itemIndex} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5 text-xs">•</span>
                    <span className="text-sm text-foreground/90">{item}</span>
                  </li>
                )
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}