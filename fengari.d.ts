declare module "fengari" {
  export const lua: {
    LUA_OK: number;
    LUA_MASKCOUNT: number;
    lua_sethook: (L: unknown, hook: (L: unknown) => void, mask: number, count: number) => void;
    lua_pushjsfunction: (L: unknown, fn: (L: unknown) => number) => void;
    lua_setglobal: (L: unknown, name: unknown) => void;
    lua_gettop: (L: unknown) => number;
    lua_pop: (L: unknown, n: number) => void;
    lua_pushstring: (L: unknown, s: unknown) => void;
    lua_tostring: (L: unknown, index: number) => unknown;
    lua_close: (L: unknown) => void;
    luaL_tolstring: (L: unknown, index: number) => unknown;
  };
  export const lauxlib: {
    luaL_newstate: () => unknown;
    luaL_dostring: (L: unknown, code: unknown) => number;
    luaL_error: (L: unknown, message: unknown) => never;
    luaL_tolstring: (L: unknown, index: number) => unknown;
  };
  export const lualib: {
    luaL_openlibs: (L: unknown) => void;
  };
  export function to_luastring(value: string): unknown;
  export function to_jsstring(value: unknown): string;
}
