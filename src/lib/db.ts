import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// The client is created lazily on first use so that building the app
// (which evaluates every route module) does not require DATABASE_URL.
let _sql: NeonQueryFunction<false, false> | null = null;

function client(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply: (_target, _thisArg, args) =>
      (client() as unknown as (...a: unknown[]) => unknown)(...args),
    get: (_target, prop, receiver) => {
      const c = client() as unknown as object;
      const value = Reflect.get(c, prop, receiver);
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
    },
  }
) as NeonQueryFunction<false, false>;
