import { useState } from "react";

import { toDateKey } from "../helpers/dateHelpers";
import { staffApi } from "../../../../../infrastructure/api/clinicflowApi";

export const useTimeOff = (rangeStart: Date, rangeEnd: Date) => {
  const [timeOff, setTimeOff] = useState<any[]>([]);

  const loadTimeOff = async () => {
    const data = await staffApi.listTimeOff(
      toDateKey(rangeStart),
      toDateKey(rangeEnd),
    );

    setTimeOff(Array.isArray(data) ? data : []);
  };

  return {
    timeOff,
    loadTimeOff,
  };
};
