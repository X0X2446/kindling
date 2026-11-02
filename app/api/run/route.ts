import { runLua } from "@/lib/runtime/lua-run";

export async function POST(request: Request) {
  let body: { runner?: string; code?: string; stdin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (body.runner !== "lua") return Response.json({ error: "This route runs Lua." }, { status: 400 });
  if (typeof body.code !== "string" || body.code.length > 20000) {
    return Response.json({ error: "The program is empty or too long." }, { status: 400 });
  }
  const stdin = typeof body.stdin === "string" ? body.stdin.slice(0, 4000) : "";
  return Response.json(runLua(body.code, stdin));
}
