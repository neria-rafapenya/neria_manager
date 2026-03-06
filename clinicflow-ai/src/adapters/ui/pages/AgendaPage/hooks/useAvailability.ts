import { useState } from "react";

import { toDateKey } from "../helpers/dateHelpers";
import { staffApi } from "../../../../../infrastructure/api/clinicflowApi";

export const useAvailability = (rangeStart: Date, rangeEnd: Date) => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = async () => {
    try {
      const from = toDateKey(rangeStart);
      const to = toDateKey(rangeEnd);

      const data = await staffApi.listAvailability(from, to);

      const list = Array.isArray(data) ? data : [];

      setAvailability(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la disponibilidad.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id: string) => {
    await staffApi.deleteAvailability(id);
    await loadAvailability();
  };

  return {
    availability,
    loading,
    error,
    loadAvailability,
    deleteSlot,
  };
};
