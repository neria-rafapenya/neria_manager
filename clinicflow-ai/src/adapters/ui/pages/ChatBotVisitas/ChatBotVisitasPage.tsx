import { useEffect, useMemo, useRef, useState } from "react";
import { patientApi } from "../../../../infrastructure/api/clinicflowApi";
import { useAuthContext } from "../../../../infrastructure/contexts/AuthContext";
import { Modal } from "../../components/shared/Modal";
import { RegisterModal } from "../../components/shared/RegisterModal";
import { IconSend } from "../../components/shared/icons";

type ChatRole = "user" | "assistant";

type SlotSuggestion = {
  id: string;
  startAt: string;
  endAt: string;
  location?: string | null;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  slots?: SlotSuggestion[];
};

type PatientPreferences = {
  preferredTimeOfDay?: string | null;
  preferredPractitionerName?: string | null;
  preferredTreatment?: string | null;
  preferredDays?: string[] | null;
  unavailableDays?: string[] | null;
};

const formatSlot = (slot: SlotSuggestion) => {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Horario disponible";
  }
  const date = start.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} - ${startTime} a ${endTime}`;
};

export const ChatBotVisitasPage = () => {
  const { token, register, loginWithProvider } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hola, soy tu asistente de citas. Dime cuándo te gustaría venir (por ejemplo: “mañana por la tarde” o “la semana que viene”).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<SlotSuggestion | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [preferences, setPreferences] = useState<PatientPreferences | null>(
    null,
  );
  const endRef = useRef<HTMLDivElement | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const lastSlots = useMemo(() => {
    const last = [...messages].reverse().find((item) => item.slots?.length);
    return last?.slots ?? [];
  }, [messages]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    let active = true;
    const loadPreferences = async () => {
      if (!token) return;
      try {
        const prefs = await patientApi.getPreferences();
        if (active && prefs) {
          setPreferences(prefs);
        }
      } catch {
        // ignore preference load errors
      }
    };
    loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const sendMessage = async (message: string) => {
    if (!message || loading) return;
    setError(null);
    addMessage({ id: `user-${Date.now()}`, role: "user", text: message });
    setLoading(true);

    try {
      const response = await patientApi.chatAvailability(message);
      const suggestions: SlotSuggestion[] = Array.isArray(response?.slots)
        ? response.slots
        : [];
      addMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text:
          response?.reply ||
          "Estos son los huecos disponibles que he encontrado.",
        slots: suggestions.length ? suggestions : undefined,
      });
      if (response?.preferences) {
        setPreferences(response.preferences);
      }
    } catch (err: any) {
      setError(err.message || "No pude consultar la disponibilidad.");
      addMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: "Ahora mismo no puedo acceder a la disponibilidad. Inténtalo de nuevo en unos minutos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");

    if (!token) {
      setPendingMessage(trimmed);
      setIsRegisterOpen(true);
      return;
    }
    await sendMessage(trimmed);
  };

  const handleRegister = async (payload: {
    name?: string;
    email: string;
    password: string;
  }) => {
    await register(payload);
    if (pendingMessage) {
      await sendMessage(pendingMessage);
      setPendingMessage(null);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    await loginWithProvider(provider);
    if (pendingMessage) {
      await sendMessage(pendingMessage);
      setPendingMessage(null);
    }
    setIsRegisterOpen(false);
  };

  const handleReserve = async (slot: SlotSuggestion) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    addMessage({
      id: `user-select-${Date.now()}`,
      role: "user",
      text: `Reservar ${formatSlot(slot)}`,
    });
    try {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);
      const durationMin = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60000),
      );
      await patientApi.createAppointment({
        title: "Cita en clínica",
        scheduledAt: start.toISOString(),
        durationMin,
        location: slot.location || null,
        notes: null,
        status: "requested",
      });
      addMessage({
        id: `assistant-confirm-${Date.now()}`,
        role: "assistant",
        text: "Perfecto, he reservado tu cita. Si necesitas cambiarla o cancelarla, dímelo y te ayudo.",
      });
    } catch (err: any) {
      setError(err.message || "No se pudo reservar el hueco.");
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: "No he podido reservar ese hueco. ¿Quieres probar con otro horario?",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot: SlotSuggestion) => {
    setPendingSlot(slot);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingSlot) return;
    setIsConfirmOpen(false);
    const inferredTimeOfDay = (() => {
      const start = new Date(pendingSlot.startAt);
      const hour = start.getHours();
      if (hour >= 19) return "evening";
      if (hour >= 12) return "afternoon";
      return "morning";
    })();
    try {
      await patientApi.updatePreferences({
        preferredTimeOfDay: inferredTimeOfDay,
      });
      setPreferences((prev) => ({
        ...(prev || {}),
        preferredTimeOfDay: inferredTimeOfDay,
      }));
    } catch {
      // ignore preference save errors
    }
    await handleReserve(pendingSlot);
    setPendingSlot(null);
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setPendingSlot(null);
  };

  const renderSlotSummary = (slot: SlotSuggestion) => {
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    const durationMin =
      Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        ? null
        : Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
    return (
      <>
        <strong>{formatSlot(slot)}</strong>
        {durationMin ? (
          <p className="muted">Duración: {durationMin} min</p>
        ) : null}
        {slot.location ? (
          <p className="muted">Ubicación: {slot.location}</p>
        ) : null}
      </>
    );
  };

  return (
    <div className="page">
      <div className="card card-min">
        <h3>Chat de citas</h3>
        <p className="muted mb-3">
          Pregunta por disponibilidad con tus propias palabras y selecciona un
          hueco para reservarlo.
        </p>
        {error ? <p className="muted">{error}</p> : null}
        <div className="chat-panel ">
          <div className="chat-messages card-min">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message chat-${message.role}`}
              >
                <div className="chat-bubble">
                  <p>{message.text}</p>
                  {message.slots?.length ? (
                    <div className="chat-slots">
                      {message.slots.map((slot) => (
                        <button
                          key={slot.id}
                          className="btn secondary"
                          type="button"
                          onClick={() => handleSelectSlot(slot)}
                        >
                          {formatSlot(slot)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="chat-message chat-assistant">
                <div className="chat-bubble">
                  <p>Consultando disponibilidad...</p>
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ej: ¿hay huecos mañana por la tarde?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="btn btn-primary btn-icon-round"
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <IconSend size={20} />
            </button>
          </div>
        </div>
        {lastSlots.length ? (
          <p className="muted" style={{ marginTop: "10px" }}>
            Selecciona un hueco para confirmar la reserva.
          </p>
        ) : null}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        title="Confirmar cita"
        onClose={handleCancel}
      >
        {pendingSlot ? (
          <div className="d-flex flex-column gap-2">
            <p>Vas a reservar la siguiente cita:</p>
            <div className="card" style={{ padding: "12px" }}>
              {renderSlotSummary(pendingSlot)}
              {preferences?.preferredTreatment ? (
                <p className="muted">
                  Tratamiento habitual: {preferences.preferredTreatment}
                </p>
              ) : null}
              {preferences?.preferredPractitionerName ? (
                <p className="muted">
                  Profesional preferido: {preferences.preferredPractitionerName}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            className="btn secondary"
            type="button"
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button className="btn primary" type="button" onClick={handleConfirm}>
            Confirmar cita
          </button>
        </div>
      </Modal>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegister}
        onSocialLogin={handleSocialLogin}
      />
    </div>
  );
};
