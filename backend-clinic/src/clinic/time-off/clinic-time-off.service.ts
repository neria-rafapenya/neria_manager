import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicTimeOffEntity } from "../entities/clinic-time-off.entity";

export interface TimeOffRequest {
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

@Injectable()
export class ClinicTimeOffService {
  constructor(
    @InjectRepository(ClinicTimeOffEntity)
    private readonly repo: Repository<ClinicTimeOffEntity>,
  ) {}

  list(tenantId: string, from?: string, to?: string) {
    const qb = this.repo
      .createQueryBuilder("t")
      .where("t.tenantId = :tenantId", { tenantId });
    if (from) {
      qb.andWhere("t.endDate >= :from", { from: new Date(from) });
    }
    if (to) {
      qb.andWhere("t.startDate <= :to", { to: new Date(to) });
    }
    qb.orderBy("t.startDate", "ASC");
    return qb.getMany();
  }

  async create(tenantId: string, dto: TimeOffRequest) {
    if (!dto?.startDate) {
      throw new BadRequestException("Missing startDate");
    }
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate || dto.startDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid date");
    }
    if (endDate < startDate) {
      throw new BadRequestException("endDate must be after startDate");
    }
    let startAt: Date | null = null;
    let endAt: Date | null = null;
    if (dto.startTime || dto.endTime) {
      if (!dto.startTime || !dto.endTime) {
        throw new BadRequestException("Missing startTime/endTime");
      }
      const [sh, sm] = dto.startTime.split(":").map(Number);
      const [eh, em] = dto.endTime.split(":").map(Number);
      const start = new Date(startDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(endDate);
      end.setHours(eh, em, 0, 0);
      if (end <= start) {
        throw new BadRequestException("endTime must be after startTime");
      }
      startAt = start;
      endAt = end;
    }
    const timeOff = this.repo.create({
      id: randomUUID(),
      tenantId,
      startDate,
      endDate,
      startAt,
      endAt,
      reason: dto.reason || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(timeOff);
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete({ id, tenantId });
  }

  async hasOverlap(tenantId: string, startAt: Date, endAt: Date) {
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const entries = await this.repo
      .createQueryBuilder("t")
      .where("t.tenantId = :tenantId", { tenantId })
      .andWhere("t.startDate <= :endDate", { endDate })
      .andWhere("t.endDate >= :startDate", { startDate })
      .getMany();
    if (!entries.length) return false;
    return entries.some((entry) => {
      const rangeStart = entry.startAt
        ? new Date(entry.startAt)
        : new Date(entry.startDate);
      const rangeEnd = entry.endAt
        ? new Date(entry.endAt)
        : new Date(entry.endDate);
      if (!entry.startAt) {
        rangeStart.setHours(0, 0, 0, 0);
      }
      if (!entry.endAt) {
        rangeEnd.setHours(23, 59, 59, 999);
      }
      return startAt <= rangeEnd && endAt >= rangeStart;
    });
  }

  async filterSlots(tenantId: string, slots: { startAt: Date; endAt: Date }[]) {
    if (!slots.length) return slots;
    const minStart = slots.reduce(
      (min, slot) => (slot.startAt < min ? slot.startAt : min),
      slots[0].startAt,
    );
    const maxEnd = slots.reduce(
      (max, slot) => (slot.endAt > max ? slot.endAt : max),
      slots[0].endAt,
    );
    const timeOff = await this.list(
      tenantId,
      minStart.toISOString().slice(0, 10),
      maxEnd.toISOString().slice(0, 10),
    );
    if (!timeOff.length) return slots;
    const ranges = timeOff.map((item) => {
      const start = item.startAt ? new Date(item.startAt) : new Date(item.startDate);
      const end = item.endAt ? new Date(item.endAt) : new Date(item.endDate);
      if (!item.startAt) {
        start.setHours(0, 0, 0, 0);
      }
      if (!item.endAt) {
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    });
    return slots.filter((slot) => {
      return !ranges.some(
        (range) => slot.startAt <= range.end && slot.endAt >= range.start,
      );
    });
  }
}
