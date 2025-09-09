import { assistantAgent } from './agent';

export async function handleChat(req: Request) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await assistantAgent.generate([
      {
        role: "user",
        content: message,
      },
    ]);

    return Response.json({
      response: result.text,
      model: Bun.env.DEFAULT_MODEL || 'openai/gpt-4o-mini',
      usage: result.usage,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to process chat request",
        details: Bun.env.NODE_ENV === "development" ? error : undefined
      },
      { status: 500 }
    );
  }
}