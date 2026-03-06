import { Injectable } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { ClinicAvailabilityService } from "../availability/clinic-availability.service";
import { ClinicTimeOffService } from "../time-off/clinic-time-off.service";
import { ClinicPatientPreferenceService } from "./clinic-patient-preference.service";

type TimeOfDay = "morning" | "afternoon" | "evening" | "any";

type LlmAvailabilityResponse = {
  reply?: string;
  fromDate?: string;
  toDate?: string;
  timeOfDay?: TimeOfDay | string;
  preferredDays?: string[] | null;
  unavailableDays?: string[] | null;
  preferredPractitionerName?: string | null;
  preferredTreatment?: string | null;
  updatePreferences?: {
    timeOfDay?: TimeOfDay | string | null;
    preferredDays?: string[] | null;
    unavailableDays?: string[] | null;
    preferredPractitionerName?: string | null;
    preferredTreatment?: string | null;
    notes?: string | null;
  };
};

const DEFAULT_WINDOW_DAYS = 14;
const MAX_SUGGESTIONS = 5;

const normalizeTimeOfDay = (value?: string | null): TimeOfDay | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("morning") || normalized.includes("manana")) return "morning";
  if (normalized.includes("afternoon") || normalized.includes("tarde")) return "afternoon";
  if (normalized.includes("evening") || normalized.includes("noche")) return "evening";
  if (normalized.includes("any") || normalized.includes("cualquiera")) return "any";
  return null;
};

const timeRanges: Record<Exclude<TimeOfDay, "any">, [number, number]> = {
  morning: [8, 12],
  afternoon: [12, 19],
  evening: [19, 22],
};

const dayMap: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
  domingo: 0,
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

@Injectable()
export class ClinicVisitChatService {
  constructor(
    private readonly aiService: AiService,
    private readonly availabilityService: ClinicAvailabilityService,
    private readonly timeOffService: ClinicTimeOffService,
    private readonly preferenceService: ClinicPatientPreferenceService,
  ) {}

  private buildPrompt(message: string, preferences?: {
    preferredTimeOfDay?: string | null;
    preferredPractitionerName?: string | null;
    preferredTreatment?: string | null;
    preferredDays?: string[] | null;
    unavailableDays?: string[] | null;
    notes?: string | null;
  }): { role: "system" | "user"; content: string }[] {
    const today = new Date().toISOString().slice(0, 10);
    const prefSummary = preferences
      ? JSON.stringify(preferences)
      : "{}";
    return [
      {
        role: "system",
        content:
          "Eres un asistente de citas para una clínica dental. " +
          "Tu tarea es interpretar la petición del paciente y devolver SOLO JSON válido. " +
          "Fecha de referencia hoy: " +
          today +
          ". " +
          "No inventes horarios, solo propone rangos temporales. " +
          "Si el paciente indica preferencias (por ejemplo, siempre por la tarde), " +
          "devuélvelas en updatePreferences.",
      },
      {
        role: "user",
        content:
          `Preferencias actuales del paciente: ${prefSummary}\n` +
          `Mensaje del paciente: "${message}"\n\n` +
          "Devuelve JSON con esta estructura:\n" +
          "{\n" +
          '  "reply": "respuesta breve y amable en español",\n' +
          '  "fromDate": "YYYY-MM-DD o vacío",\n' +
          '  "toDate": "YYYY-MM-DD o vacío",\n' +
          '  "timeOfDay": "morning | afternoon | evening | any",\n' +
          '  "preferredDays": ["mon","tue",... ] o null,\n' +
          '  "unavailableDays": ["mon","tue",... ] o null,\n' +
          '  "preferredPractitionerName": "texto opcional" | null,\n' +
          '  "preferredTreatment": "texto opcional" | null,\n' +
          '  "updatePreferences": {\n' +
          '     "timeOfDay": "morning | afternoon | evening | any" | null,\n' +
          '     "preferredDays": ["mon","tue",... ] | null,\n' +
          '     "unavailableDays": ["mon","tue",... ] | null,\n' +
          '     "preferredPractitionerName": "texto opcional" | null,\n' +
          '     "preferredTreatment": "texto opcional" | null,\n' +
          '     "notes": "texto opcional" | null\n' +
          "  }\n" +
          "}\n" +
          "Si no hay fechas claras, deja fromDate y toDate vacíos y usa timeOfDay=any.\n",
      },
    ];
  }

  private resolveWindow(fromDate?: string | null, toDate?: string | null) {
    const now = new Date();
    const parsedFrom = parseDate(fromDate);
    const parsedTo = parseDate(toDate);
    if (parsedFrom || parsedTo) {
      const from = startOfDay(parsedFrom ?? parsedTo ?? now);
      const to = endOfDay(parsedTo ?? parsedFrom ?? now);
      if (from > to) {
        return {
          from: startOfDay(now),
          to: endOfDay(new Date(now.getTime() + DEFAULT_WINDOW_DAYS * 86400000)),
        };
      }
      return { from, to };
    }
    const from = startOfDay(now);
    const to = endOfDay(new Date(now.getTime() + DEFAULT_WINDOW_DAYS * 86400000));
    return { from, to };
  }

  private filterSlots(
    slots: any[],
    timeOfDay: TimeOfDay | null,
    preferredDays: string[] | null | undefined,
    unavailableDays: string[] | null | undefined,
  ) {
    let filtered = slots;
    if (preferredDays?.length) {
      const daySet = new Set(
        preferredDays
          .map((day) => dayMap[day.toLowerCase()])
          .filter((day) => day !== undefined),
      );
      if (daySet.size > 0) {
        filtered = filtered.filter((slot) => {
          const start = new Date(slot.startAt);
          return daySet.has(start.getDay());
        });
      }
    }
    if (timeOfDay && timeOfDay !== "any") {
      const [startHour, endHour] = timeRanges[timeOfDay];
      filtered = filtered.filter((slot) => {
        const start = new Date(slot.startAt);
        const hour = start.getHours();
        return hour >= startHour && hour < endHour;
      });
    }
    if (unavailableDays?.length) {
      const blockedSet = new Set(
        unavailableDays
          .map((day) => dayMap[day.toLowerCase()])
          .filter((day) => day !== undefined),
      );
      if (blockedSet.size > 0) {
        filtered = filtered.filter((slot) => {
          const start = new Date(slot.startAt);
          return !blockedSet.has(start.getDay());
        });
      }
    }
    return filtered;
  }

  async chatAvailability(tenantId: string, patientUserId: string, message: string) {
    const preferences = await this.preferenceService.getByPatient(
      tenantId,
      patientUserId,
    );

    const prompt = this.buildPrompt(message, preferences ?? undefined);
    const fallback: LlmAvailabilityResponse = {
      reply: "Ahora mismo estoy revisando disponibilidad. ¿Qué fechas prefieres?",
      timeOfDay: "any",
      fromDate: "",
      toDate: "",
    };

    const aiResponse = await this.aiService.chatJson<LlmAvailabilityResponse>(
      prompt,
      fallback,
    );

    const timeOfDay =
      normalizeTimeOfDay(aiResponse.timeOfDay) ??
      normalizeTimeOfDay(preferences?.preferredTimeOfDay ?? null) ??
      "any";

    const { from, to } = this.resolveWindow(
      aiResponse.fromDate,
      aiResponse.toDate,
    );

    const availability = await this.availabilityService.list(
      tenantId,
      from.toISOString(),
      to.toISOString(),
      { includeReserved: false },
    );
    const slots = await this.timeOffService.filterSlots(tenantId, availability);
    const filtered = this.filterSlots(
      slots,
      timeOfDay,
      aiResponse.preferredDays ?? preferences?.preferredDays,
      aiResponse.unavailableDays ?? preferences?.unavailableDays,
    );

    const suggestions = filtered.slice(0, MAX_SUGGESTIONS);

    const updatePreferences = aiResponse.updatePreferences ?? {};
    const nextPrefs = {
      preferredTimeOfDay: normalizeTimeOfDay(updatePreferences.timeOfDay) ?? preferences?.preferredTimeOfDay ?? null,
      preferredPractitionerName:
        updatePreferences.preferredPractitionerName ??
        preferences?.preferredPractitionerName ??
        null,
      preferredTreatment:
        updatePreferences.preferredTreatment ??
        preferences?.preferredTreatment ??
        null,
      preferredDays: updatePreferences.preferredDays ?? preferences?.preferredDays ?? null,
      unavailableDays: updatePreferences.unavailableDays ?? preferences?.unavailableDays ?? null,
      notes: updatePreferences.notes ?? preferences?.notes ?? null,
    };

    if (
      updatePreferences.timeOfDay ||
      updatePreferences.preferredDays ||
      updatePreferences.unavailableDays ||
      updatePreferences.preferredPractitionerName ||
      updatePreferences.preferredTreatment ||
      updatePreferences.notes
    ) {
      await this.preferenceService.upsert(tenantId, patientUserId, nextPrefs);
    }

    return {
      reply:
        aiResponse.reply ||
        (suggestions.length
          ? "Estos son los huecos disponibles que he encontrado."
          : "No he encontrado huecos con esas preferencias. ¿Quieres probar otras fechas?"),
      slots: suggestions.map((slot) => ({
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })),
      preferences: nextPrefs,
    };
  }
}
