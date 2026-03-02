import { Controller, Get, Param, Query } from "@nestjs/common";
import { DatabaseService } from "../db/database.service";

@Controller("/asistente-renta")
export class TaxAssistantController {
  constructor(private readonly db: DatabaseService) {}

  @Get("/deducciones")
  async listDeductions(
    @Query("region") region?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string
  ) {
    const resolvedLimit = Math.min(Number(limit) || 25, 200);
    const query = q ? `%${q}%` : "%%";
    const regionFilter = region && region.trim().length > 0 ? region.trim() : "general";

    const rows = await this.db.query(
      `SELECT id, category, name, description, maxAmount, region, updatedAt
       FROM sandbox_tax_deductions
       WHERE (region = ? OR region = 'general')
         AND (name LIKE ? OR description LIKE ?)
       ORDER BY updatedAt DESC
       LIMIT ?`,
      [regionFilter, query, query, resolvedLimit]
    );

    return { items: rows };
  }

  @Get("/deducciones/:id")
  async getDeduction(@Param("id") id: string) {
    const rows = await this.db.query(
      "SELECT id, category, name, description, maxAmount, region, updatedAt FROM sandbox_tax_deductions WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  @Get("/tramos")
  async listBrackets(
    @Query("region") region?: string,
    @Query("year") year?: string
  ) {
    const regionFilter = region && region.trim().length > 0 ? region.trim() : "general";
    const taxYear = Number(year) || new Date().getFullYear() - 1;

    const rows = await this.db.query(
      `SELECT id, region, taxYear, minBase, maxBase, rate, updatedAt
       FROM sandbox_tax_brackets
       WHERE region = ? AND taxYear = ?
       ORDER BY minBase ASC`,
      [regionFilter, taxYear]
    );

    return { items: rows };
  }

  @Get("/documentos")
  async listDocuments(
    @Query("categoria") category?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string
  ) {
    const resolvedLimit = Math.min(Number(limit) || 25, 200);
    const query = q ? `%${q}%` : "%%";
    const categoryFilter = category && category.trim().length > 0 ? category.trim() : "%%";

    const rows = await this.db.query(
      `SELECT id, category, title, description, updatedAt
       FROM sandbox_tax_documents
       WHERE category LIKE ?
         AND (title LIKE ? OR description LIKE ?)
       ORDER BY updatedAt DESC
       LIMIT ?`,
      [categoryFilter, query, query, resolvedLimit]
    );

    return { items: rows };
  }

  @Get("/documentos/:id")
  async getDocument(@Param("id") id: string) {
    const rows = await this.db.query(
      "SELECT id, category, title, description, updatedAt FROM sandbox_tax_documents WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }
}
