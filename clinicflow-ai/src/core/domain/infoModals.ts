export type InfoModalKey = "availability" | "slots";

export interface InfoModalCopy {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const infoModals: Record<InfoModalKey, InfoModalCopy> = {
  availability: {
    title: "Cómo funciona la disponibilidad",
    paragraphs: [
      "Por defecto generamos disponibilidad para los próximos 3 meses.",
      "Puedes bloquear días completos o rangos horarios desde el calendario.",
      "Los huecos se consumen automáticamente cuando un paciente reserva una cita.",
    ],
    bullets: [
      "Selecciona un rango en el calendario para bloquear o desbloquear.",
      "Usa el bloqueo horario si solo quieres cerrar una franja.",
      "Los tramos puntuales se pueden añadir manualmente.",
    ],
  },
  slots: {
    title: "Qué son los huecos publicados",
    paragraphs: [
      "Aquí se listan todos los tramos disponibles para reserva en el rango activo.",
      "Al reservar una cita, el hueco se consume y se ajusta automáticamente.",
    ],
    bullets: [
      "Puedes eliminar un hueco manualmente si deja de estar disponible.",
      "Los bloqueos horarios no aparecen como huecos publicados.",
    ],
  },
};
