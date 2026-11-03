import { compileAndRunCpp, gppAvailable } from "@/lib/runtime/cpp-compile";
import { runLua } from "@/lib/runtime/lua-run";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { runner?: string; code?: string; stdin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  if (body.runner !== "lua" && body.runner !== "cpp") {
    return Response.json({ error: "This route runs Lua and C++." }, { status: 400 });
  }
  const limit = body.runner === "cpp" ? 50000 : 20000;
  if (typeof body.code !== "string" || body.code.length > limit) {
    return Response.json({ error: "The program is empty or too long." }, { status: 400 });
  }
  const stdin = typeof body.stdin === "string" ? body.stdin.slice(0, 8000) : "";
  if (body.runner === "lua") return Response.json(runLua(body.code, stdin));
  if (gppAvailable()) return Response.json(compileAndRunCpp(body.code, stdin));
  if (process.env.VERCEL) {
    try {
      const { runCppInSandbox } = await import("@/lib/runtime/cpp-sandbox");
      return Response.json(await runCppInSandbox(body.code, stdin));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The C++ sandbox could not start.";
      return Response.json({ stdout: "", error: message }, { status: 500 });
    }
  }
  return Response.json({ stdout: "", error: "No C++ compiler is available on this machine." }, { status: 500 });
}
