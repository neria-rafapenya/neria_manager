import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { DatabaseService } from "../db/database.service";

@Controller("asistente-operativo")
export class OperationalSupportController {
  constructor(private readonly db: DatabaseService) {}

  @Get("documentos")
  async listDocuments(
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
      where.push("(title LIKE ? OR content LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await this.db.query(
      `SELECT id, title, category, source, updatedAt
       FROM sandbox_operational_documents
       ${clause}
       ORDER BY updatedAt DESC
       LIMIT ?`,
      [...params, limit],
    );

    return { items: rows };
  }

  @Get("documentos/:id")
  async getDocument(@Param("id") id: string) {
    const rows = await this.db.query(
      `SELECT id, title, category, source, content, updatedAt
       FROM sandbox_operational_documents
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException("Documento no encontrado");
    return rows[0];
  }

  @Get("politicas")
  async listPolicies() {
    const rows = await this.db.query(
      "SELECT id, title, updatedAt FROM sandbox_operational_policies ORDER BY updatedAt DESC",
    );
    return { items: rows };
  }

  @Get("politicas/:id")
  async getPolicy(@Param("id") id: string) {
    const rows = await this.db.query(
      "SELECT id, title, content, updatedAt FROM sandbox_operational_policies WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0) throw new NotFoundException("Politica no encontrada");
    return rows[0];
  }

  @Get("plantillas")
  async listTemplates() {
    const rows = await this.db.query(
      "SELECT id, title, updatedAt FROM sandbox_operational_templates ORDER BY updatedAt DESC",
    );
    return { items: rows };
  }

  @Get("plantillas/:id")
  async getTemplate(@Param("id") id: string) {
    const rows = await this.db.query(
      "SELECT id, title, content, updatedAt FROM sandbox_operational_templates WHERE id = ? LIMIT 1",
      [id],
    );
    if (rows.length === 0) throw new NotFoundException("Plantilla no encontrada");
    return rows[0];
  }
}
