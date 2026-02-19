import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../db/database.service";

@Controller("gestion-citas")
export class AppointmentsController {
  constructor(private readonly db: DatabaseService) {}

  @Get("profesionales")
  async listStaff() {
    const rows = await this.db.query(
      "SELECT id, name, specialty, location FROM sandbox_staff WHERE active = 1 ORDER BY name ASC",
    );
    return { items: rows };
  }

  @Get("slots")
  async listSlots(
    @Query("date") date?: string,
    @Query("staffId") staffId?: string,
    @Query("service") service?: string,
  ) {
    const where: string[] = ["status = 'available'"];
    const params: any[] = [];

    if (date) {
      where.push("DATE(startAt) = ?");
      params.push(date);
    }
    if (staffId) {
      where.push("staffId = ?");
      params.push(staffId);
    }
    if (service) {
      where.push("service = ?");
      params.push(service);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = await this.db.query(
      `SELECT id, staffId, service, startAt, endAt, location
       FROM sandbox_appointment_slots
       ${clause}
       ORDER BY startAt ASC
       LIMIT 100`,
      params,
    );
    return { items: rows };
  }

  @Post("reservas")
  async createAppointment(@Body() body: any) {
    const { slotId, customerName, customerEmail, notes } = body || {};
    if (!slotId || !customerName || !customerEmail) {
      throw new BadRequestException("slotId, customerName y customerEmail son obligatorios");
    }

    const slotRows = await this.db.query(
      `SELECT id, staffId, service, startAt, endAt, location, status
       FROM sandbox_appointment_slots
       WHERE id = ?
       LIMIT 1`,
      [slotId],
    );
    if (slotRows.length === 0) throw new NotFoundException("Slot no encontrado");
    const slot = slotRows[0] as any;
    if (slot.status !== "available") {
      throw new BadRequestException("Slot no disponible");
    }

    const appointmentId = randomUUID();
    await this.db.execute(
      `INSERT INTO sandbox_appointments
       (id, slotId, staffId, service, customerName, customerEmail, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, NOW(), NOW())`,
      [appointmentId, slot.id, slot.staffId, slot.service, customerName, customerEmail, notes || null],
    );

    await this.db.execute(
      "UPDATE sandbox_appointment_slots SET status = 'booked', updatedAt = NOW() WHERE id = ?",
      [slot.id],
    );

    return {
      id: appointmentId,
      slotId: slot.id,
      staffId: slot.staffId,
      service: slot.service,
      startAt: slot.startAt,
      endAt: slot.endAt,
      location: slot.location,
      customerName,
      customerEmail,
      status: "confirmed",
    };
  }

  @Get("reservas/:id")
  async getAppointment(@Param("id") id: string) {
    const rows = await this.db.query(
      `SELECT id, slotId, staffId, service, customerName, customerEmail, status, notes, createdAt
       FROM sandbox_appointments
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException("Reserva no encontrada");
    return rows[0];
  }
}
