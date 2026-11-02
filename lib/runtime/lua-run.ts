import { lauxlib, lua, lualib, to_jsstring, to_luastring } from "fengari";

export function runLua(code: string, stdin = ""): { stdout: string; error?: string } {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  let stdout = "";
  let steps = 0;
  lua.lua_sethook(
    L,
    () => {
      steps += 1;
      if (steps > 40000) lauxlib.luaL_error(L, to_luastring("This ran too long. Look for a loop that never ends."));
    },
    lua.LUA_MASKCOUNT,
    80,
  );
  lua.lua_pushjsfunction(L, (state) => {
    const count = lua.lua_gettop(state);
    const parts: string[] = [];
    for (let i = 1; i <= count; i++) {
      parts.push(to_jsstring(lauxlib.luaL_tolstring(state, i)));
      lua.lua_pop(state, 1);
    }
    stdout += parts.join("\t") + "\n";
    return 0;
  });
  lua.lua_setglobal(L, to_luastring("print"));
  const lines = stdin.length ? stdin.split("\n") : [];
  let cursor = 0;
  lua.lua_pushjsfunction(L, (state) => {
    if (cursor >= lines.length) {
      lua.lua_pushstring(state, to_luastring(""));
      return 1;
    }
    lua.lua_pushstring(state, to_luastring(lines[cursor++] ?? ""));
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("input"));
  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  if (status !== lua.LUA_OK) {
    const message = to_jsstring(lua.lua_tostring(L, -1));
    lua.lua_close(L);
    return { stdout, error: message || "Lua stopped." };
  }
  lua.lua_close(L);
  return { stdout };
}
