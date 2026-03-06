export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const formatDate = (value: Date) => value.toLocaleDateString("es-ES");

export const formatTime = (value: Date) =>
  value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
