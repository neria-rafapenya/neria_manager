import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ClinicHolidayEntity } from "./clinic-holiday.entity";

export interface HolidayRequest {
  date: string;
  name?: string;
}

@Injectable()
export class ClinicHolidaysService {
  constructor(
    @InjectRepository(ClinicHolidayEntity)
    private readonly repo: Repository<ClinicHolidayEntity>,
  ) {}

  list(tenantId: string, from?: string, to?: string) {
    const qb = this.repo
      .createQueryBuilder("h")
      .where("h.tenantId = :tenantId", { tenantId });
    if (from) {
      qb.andWhere("h.date >= :from", { from: new Date(from) });
    }
    if (to) {
      qb.andWhere("h.date <= :to", { to: new Date(to) });
    }
    qb.orderBy("h.date", "ASC");
    return qb.getMany();
  }

  async create(tenantId: string, dto: HolidayRequest) {
    if (!dto?.date) {
      throw new BadRequestException("Missing date");
    }
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid date");
    }
    const key = date.toISOString().slice(0, 10);
    const existing = await this.repo.findOne({
      where: { tenantId, date: new Date(key) },
    });
    if (existing) {
      return existing;
    }
    const holiday = this.repo.create({
      id: randomUUID(),
      tenantId,
      date: new Date(key),
      name: dto.name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.repo.save(holiday);
  }

  async delete(tenantId: string, id: string) {
    await this.repo.delete({ id, tenantId });
  }

  async getDateSet(tenantId: string, from: Date, to: Date) {
    const list = await this.list(
      tenantId,
      from.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10),
    );
    return new Set(list.map((h) => new Date(h.date).toISOString().slice(0, 10)));
  }

  async filterSlots(
    tenantId: string,
    slots: { startAt: Date; endAt: Date }[],
  ) {
    if (!slots.length) return slots;
    const minStart = slots.reduce(
      (min, slot) => (slot.startAt < min ? slot.startAt : min),
      slots[0].startAt,
    );
    const maxEnd = slots.reduce(
      (max, slot) => (slot.endAt > max ? slot.endAt : max),
      slots[0].endAt,
    );
    const holidays = await this.getDateSet(tenantId, minStart, maxEnd);
    if (!holidays.size) return slots;
    return slots.filter((slot) => {
      const key = slot.startAt.toISOString().slice(0, 10);
      return !holidays.has(key);
    });
  }
}
