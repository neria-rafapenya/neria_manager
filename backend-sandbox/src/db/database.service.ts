import { Injectable, OnModuleDestroy } from "@nestjs/common";
import mysql, { Pool, PoolOptions } from "mysql2/promise";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const config: PoolOptions = {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "provider_manager",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      charset: "utf8mb4",
    };
    this.pool = mysql.createPool(config);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.pool.execute(sql, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
