import mysql from "mysql2/promise";

import type { Pool } from "mysql2/promise";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  _pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "tailsharp",
    password: process.env.MYSQL_PASSWORD || "ts_m4rk3t_1nt3l_2026",
    database: process.env.MYSQL_DATABASE || "tailsharp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return _pool;
}

// Lazy-initialized proxy -- pool is only created on first property access
const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const instance = getPool();
    const value = (instance as any)[prop];
    if (typeof value === "function") return value.bind(instance);
    return value;
  },
});

export default pool;
