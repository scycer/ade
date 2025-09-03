import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TodoSection {
  title: string;
  items: string[];
}

export function TodoDisplay() {
  const [todoContent, setTodoContent] = useState<TodoSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/todo")
      .then((res) => res.json())
      .then((data) => {
        const parsed = parseTodoContent(data.content);
        setTodoContent(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch TODO:", err);
        setLoading(false);
      });
  }, []);

  const parseTodoContent = (content: string): TodoSection[] => {
    const lines = content.split("\n");
    const sections: TodoSection[] = [];
    let currentSection: TodoSection | null = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and main title
      if (!trimmedLine || trimmedLine === "# TODO") return;
      
      // Check for section headers (## or ###)
      if (trimmedLine.startsWith("##")) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        const title = trimmedLine.replace(/^#+\s*/, "");
        currentSection = { title, items: [] };
      }
      // Add items that are not headers and not separator lines
      else if (currentSection && !trimmedLine.startsWith("#") && !trimmedLine.startsWith("---")) {
        // Skip lines that are just dashes
        if (trimmedLine !== "---------------------") {
          currentSection.items.push(trimmedLine);
        }
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
      <Card className="bg-card/50 backdrop-blur-sm border-muted mt-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading TODO list...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground">📋 TODO List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {todoContent.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-xl font-semibold text-primary">{section.title}</h3>
            <ul className="space-y-2 pl-4">
              {section.items.map((item, itemIndex) => (
                item && (
                  <li key={itemIndex} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
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