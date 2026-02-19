import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { DatabaseService } from "../db/database.service";

@Controller("chat-sql")
export class ChatSqlController {
  constructor(private readonly db: DatabaseService) {}

  @Get("productos")
  async listProducts(
    @Query("categoria") categoria?: string,
    @Query("q") q?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(Math.max(Number(limitRaw || 20), 1), 100);
    const where: string[] = [];
    const params: any[] = [];

    if (categoria) {
      where.push("category = ?");
      params.push(categoria);
    }
    if (q) {
      where.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await this.db.query(
      `SELECT id, sku, name, category, description, price, currency, stock, tags
       FROM sandbox_products
       ${clause}
       ORDER BY name ASC
       LIMIT ?`,
      [...params, limit],
    );

    return { items: rows };
  }

  @Get("productos/:id")
  async getProduct(@Param("id") id: string) {
    const rows = await this.db.query(
      `SELECT id, sku, name, category, description, price, currency, stock, tags
       FROM sandbox_products
       WHERE id = ? OR sku = ?
       LIMIT 1`,
      [id, id],
    );
    if (rows.length === 0) throw new NotFoundException("Producto no encontrado");
    return rows[0];
  }

  @Get("categorias")
  async listCategories() {
    const rows = await this.db.query(
      "SELECT DISTINCT category FROM sandbox_products ORDER BY category ASC",
    );
    return { items: rows.map((row) => row.category) };
  }
}
