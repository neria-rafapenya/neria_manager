import {
  IconAvailable,
  IconUnavailable,
} from "../../../components/shared/icons";
import { formatDate, formatTime } from "./dateHelpers";

export const formatSlotLabel = (slot: any) => {
  if (!slot?.startAt || !slot?.endAt) return "—";

  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return (
      <div>
        <div>{formatDate(start)}</div>
        <div className="muted">
          {formatTime(start)} - {formatTime(end)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        {formatDate(start)}
        <div className="muted">{formatTime(start)}</div>
      </div>
      <div>
        {formatDate(end)}
        <div className="muted">{formatTime(end)}</div>
      </div>
    </div>
  );
};

export const formatSlotStatus = (slot: any) => {
  const reserved = slot?.status === "reserved";

  return (
    <div className="slot-status">
      {reserved ? (
        <IconUnavailable className="icon-style status-icon" />
      ) : (
        <IconAvailable className="icon-style status-icon" />
      )}
    </div>
  );
};

export const formatSlotPatient = (slot: any) => {
  if (slot?.status !== "reserved")
    return <em className="muted">Hueco disponible</em>;

  return (
    slot.reservedByPatientName || slot.reservedByPatientEmail || "Paciente"
  );
};
