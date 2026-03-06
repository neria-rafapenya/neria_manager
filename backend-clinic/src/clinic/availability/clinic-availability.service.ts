import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicAvailabilityEntity } from "../entities/clinic-availability.entity";
import { ClinicHolidaysService } from "../holidays/clinic-holidays.service";

export interface AvailabilityRequest {
  startAt: string;
  endAt: string;
  serviceCode?: string;
  practitionerName?: string;
}

export interface OpenWindowRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  slotMinutes?: number;
  weekdays?: number[]; // 1=Mon ... 7=Sun
  serviceCode?: string;
  practitionerName?: string;
}

@Injectable()
export class ClinicAvailabilityService {
  constructor(
    @InjectRepository(ClinicAvailabilityEntity)
    private readonly repo: Repository<ClinicAvailabilityEntity>,
    private readonly holidays: ClinicHolidaysService,
  ) {}

  list(
    tenantId: string,
    from?: string,
    to?: string,
    options?: { includeReserved?: boolean; status?: string },
  ) {
    const qb = this.repo.createQueryBuilder("a")
      .where("a.tenantId = :tenantId", { tenantId });
    if (from) {
      qb.andWhere("a.endAt >= :from", { from: new Date(from) });
    }
    if (to) {
      qb.andWhere("a.startAt <= :to", { to: new Date(to) });
    }
    if (options?.status) {
      qb.andWhere("a.status = :status", { status: options.status });
    } else if (options?.includeReserved === false) {
      qb.andWhere("(a.status IS NULL OR a.status <> 'reserved')");
    }
    qb.orderBy("a.startAt", "ASC");
    return qb.getMany();
  }

  async create(tenantId: string, dto: AvailabilityRequest) {
    if (!dto?.startAt || !dto?.endAt) {
      throw new BadRequestException("Missing startAt/endAt");
    }
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException("Invalid date");
    }
    if (endAt <= startAt) {
      throw new BadRequestException("endAt must be after startAt");
    }
    const availability = this.repo.create({
      id: randomUUID(),
      tenantId,
      startAt,
      endAt,
      serviceCode: dto.serviceCode || null,
      practitionerName: dto.practitionerName || null,
      status: "available",
      reservedByPatientUserId: null,
      reservedByPatientEmail: null,
      reservedByPatientName: null,
      reservedAppointmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(availability);
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete({ id, tenantId });
  }

  async openWindow(tenantId: string, dto: OpenWindowRequest) {
    if (!dto?.startDate || !dto?.endDate || !dto?.startTime || !dto?.endTime) {
      throw new BadRequestException("Missing dates or times");
    }
    const weekdays = dto.weekdays?.length ? dto.weekdays : [1,2,3,4,5];
    const slotMinutes = Number(dto.slotMinutes ?? 30);
    if (!Number.isFinite(slotMinutes) || slotMinutes <= 0) {
      throw new BadRequestException("Invalid slot duration");
    }
    const created: ClinicAvailabilityEntity[] = [];

    const start = new Date(dto.startDate + "T00:00:00");
    const end = new Date(dto.endDate + "T00:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid date range");
    }

    const holidaySet = await this.holidays.getDateSet(tenantId, start, end);
    const current = new Date(start);
    while (current <= end) {
      const dateKey = current.toISOString().slice(0, 10);
      if (holidaySet.has(dateKey)) {
        current.setDate(current.getDate() + 1);
        continue;
      }
      const day = current.getDay(); // 0=Sun
      const normalized = day === 0 ? 7 : day;
      if (weekdays.includes(normalized)) {
        const [sh, sm] = dto.startTime.split(":").map(Number);
        const [eh, em] = dto.endTime.split(":").map(Number);
        const slotStart = new Date(current);
        slotStart.setHours(sh, sm, 0, 0);
        const slotEnd = new Date(current);
        slotEnd.setHours(eh, em, 0, 0);
        if (slotEnd > slotStart) {
          let cursor = new Date(slotStart);
          while (cursor < slotEnd) {
            const nextEnd = new Date(cursor);
            nextEnd.setMinutes(nextEnd.getMinutes() + slotMinutes);
            if (nextEnd > slotEnd) break;
            const exists = await this.repo.findOne({
              where: { tenantId, startAt: cursor, endAt: nextEnd },
            });
            if (!exists) {
              const availability = this.repo.create({
                id: randomUUID(),
                tenantId,
                startAt: new Date(cursor),
                endAt: new Date(nextEnd),
                serviceCode: dto.serviceCode || null,
                practitionerName: dto.practitionerName || null,
                status: "available",
                reservedByPatientUserId: null,
                reservedByPatientEmail: null,
                reservedByPatientName: null,
                reservedAppointmentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              created.push(await this.repo.save(availability));
            }
            cursor = nextEnd;
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return { created: created.length };
  }

  async findCoveringSlot(tenantId: string, startAt: Date, endAt: Date) {
    return this.repo.createQueryBuilder("a")
      .where("a.tenantId = :tenantId", { tenantId })
      .andWhere("a.startAt <= :startAt", { startAt })
      .andWhere("a.endAt >= :endAt", { endAt })
      .andWhere("(a.status IS NULL OR a.status <> 'reserved')")
      .getOne();
  }

  async consumeSlot(
    tenantId: string,
    startAt: Date,
    endAt: Date,
    reservation?: {
      patientUserId?: string;
      patientEmail?: string;
      patientName?: string;
      appointmentId?: string;
    },
  ) {
    if (endAt <= startAt) {
      throw new BadRequestException("Invalid slot window");
    }
    await this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(ClinicAvailabilityEntity);
      const slot = await repo
        .createQueryBuilder("a")
        .where("a.tenantId = :tenantId", { tenantId })
        .andWhere("a.startAt <= :startAt", { startAt })
        .andWhere("a.endAt >= :endAt", { endAt })
        .andWhere("(a.status IS NULL OR a.status <> 'reserved')")
        .orderBy("a.startAt", "ASC")
        .setLock("pessimistic_write")
        .getOne();

      if (!slot) {
        throw new BadRequestException("No availability for selected time");
      }

      const originalStart = new Date(slot.startAt);
      const originalEnd = new Date(slot.endAt);
      const updatedAt = new Date();

      const reservedPayload = {
        status: "reserved",
        reservedByPatientUserId: reservation?.patientUserId || null,
        reservedByPatientEmail: reservation?.patientEmail || null,
        reservedByPatientName: reservation?.patientName || null,
        reservedAppointmentId: reservation?.appointmentId || null,
      };

      if (startAt.getTime() === originalStart.getTime() && endAt.getTime() === originalEnd.getTime()) {
        slot.status = "reserved";
        slot.reservedByPatientUserId = reservedPayload.reservedByPatientUserId;
        slot.reservedByPatientEmail = reservedPayload.reservedByPatientEmail;
        slot.reservedByPatientName = reservedPayload.reservedByPatientName;
        slot.reservedAppointmentId = reservedPayload.reservedAppointmentId;
        slot.updatedAt = updatedAt;
        await repo.save(slot);
        return;
      }

      if (startAt.getTime() === originalStart.getTime()) {
        slot.startAt = endAt;
        slot.updatedAt = updatedAt;
        await repo.save(slot);
        const reservedSlot = repo.create({
          id: randomUUID(),
          tenantId,
          startAt,
          endAt,
          serviceCode: slot.serviceCode || null,
          practitionerName: slot.practitionerName || null,
          ...reservedPayload,
          createdAt: new Date(),
          updatedAt,
        });
        await repo.save(reservedSlot);
        return;
      }

      if (endAt.getTime() === originalEnd.getTime()) {
        slot.endAt = startAt;
        slot.updatedAt = updatedAt;
        await repo.save(slot);
        const reservedSlot = repo.create({
          id: randomUUID(),
          tenantId,
          startAt,
          endAt,
          serviceCode: slot.serviceCode || null,
          practitionerName: slot.practitionerName || null,
          ...reservedPayload,
          createdAt: new Date(),
          updatedAt,
        });
        await repo.save(reservedSlot);
        return;
      }

      const afterSlot = repo.create({
        id: randomUUID(),
        tenantId,
        startAt: endAt,
        endAt: originalEnd,
        serviceCode: slot.serviceCode || null,
        practitionerName: slot.practitionerName || null,
        status: "available",
        reservedByPatientUserId: null,
        reservedByPatientEmail: null,
        reservedByPatientName: null,
        reservedAppointmentId: null,
        createdAt: new Date(),
        updatedAt,
      });
      slot.endAt = startAt;
      slot.updatedAt = updatedAt;
      slot.status = "available";
      slot.reservedByPatientUserId = null;
      slot.reservedByPatientEmail = null;
      slot.reservedByPatientName = null;
      slot.reservedAppointmentId = null;
      await repo.save(slot);
      await repo.save(afterSlot);

      const reservedSlot = repo.create({
        id: randomUUID(),
        tenantId,
        startAt,
        endAt,
        serviceCode: slot.serviceCode || null,
        practitionerName: slot.practitionerName || null,
        ...reservedPayload,
        createdAt: new Date(),
        updatedAt,
      });
      await repo.save(reservedSlot);
    });
  }

  async releaseSlot(tenantId: string, startAt: Date, endAt: Date) {
    if (endAt <= startAt) {
      return;
    }
    await this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(ClinicAvailabilityEntity);
      const overlaps = await repo
        .createQueryBuilder("a")
        .where("a.tenantId = :tenantId", { tenantId })
        .andWhere("a.startAt <= :endAt", { endAt })
        .andWhere("a.endAt >= :startAt", { startAt })
        .andWhere("(a.status IS NULL OR a.status <> 'reserved')")
        .orderBy("a.startAt", "ASC")
        .setLock("pessimistic_write")
        .getMany();

      if (overlaps.length === 0) {
        const availability = repo.create({
          id: randomUUID(),
          tenantId,
          startAt,
          endAt,
          serviceCode: null,
          practitionerName: null,
          status: "available",
          reservedByPatientUserId: null,
          reservedByPatientEmail: null,
          reservedByPatientName: null,
          reservedAppointmentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await repo.save(availability);
        return;
      }

      const mergedStart = overlaps.reduce(
        (min, slot) => (slot.startAt < min ? slot.startAt : min),
        startAt,
      );
      const mergedEnd = overlaps.reduce(
        (max, slot) => (slot.endAt > max ? slot.endAt : max),
        endAt,
      );
      const template = overlaps[0];
      await repo.delete({ tenantId, id: template.id });
      for (let i = 1; i < overlaps.length; i += 1) {
        await repo.delete({ tenantId, id: overlaps[i].id });
      }

      const merged = repo.create({
        id: randomUUID(),
        tenantId,
        startAt: mergedStart,
        endAt: mergedEnd,
        serviceCode: template.serviceCode || null,
        practitionerName: template.practitionerName || null,
        status: "available",
        reservedByPatientUserId: null,
        reservedByPatientEmail: null,
        reservedByPatientName: null,
        reservedAppointmentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await repo.save(merged);
    });
  }
}
