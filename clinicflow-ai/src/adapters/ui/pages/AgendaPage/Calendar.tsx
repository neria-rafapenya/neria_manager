import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

type BlockedSlot = {
  date: string;
  hours: string[];
};

type CalendarProps = {
  selectedRange?: DateRange;
  onSelectRange: (range?: DateRange) => void;
  rangeStart: Date;
  rangeEnd: Date;
  blockedRanges: { from: Date; to: Date }[];
  blockedSlots?: BlockedSlot[];
};

export const Calendar = ({
  selectedRange,
  onSelectRange,
  rangeStart,
  rangeEnd,
  blockedRanges,
  blockedSlots = [],
}: CalendarProps) => {
  const toKey = (date: Date) => date.toISOString().slice(0, 10);
  const titles = Object.fromEntries(
    blockedSlots.map((slot) => [
      slot.date,
      `No disponible:\n${slot.hours.join("\n")}`,
    ]),
  );

  return (
    <div className="calendar-wrap">
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={onSelectRange}
        startMonth={rangeStart}
        endMonth={rangeEnd}
        numberOfMonths={1}
        pagedNavigation
        modifiers={{
          blocked: blockedRanges,
          occupied: blockedSlots.map((s) => new Date(s.date)),
        }}
        modifiersClassNames={{
          blocked: "rdp-day-blocked",
          occupied: "rdp-day-occupied",
        }}
        onDayMouseEnter={(date, e) => {
          const key = toKey(date);
          if (titles[key]) {
            (e.currentTarget as unknown as HTMLElement).title = titles[key];
          }
        }}
      />

      <div className="calendar-legend">
        <span className="legend-item">Disponible</span>
        <span className="legend-item">No disponible</span>
        <span className="legend-item">⚠ Horario ocupado</span>
      </div>
    </div>
  );
};
