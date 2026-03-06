import { useEffect, useRef, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastPayload {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 4000;

export const GlobalToast = () => {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleToast = (event: Event) => {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      if (!payload?.message) return;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast(payload);

      if (payload.durationMs === 0) return;
      const duration = payload.durationMs ?? DEFAULT_DURATION_MS;
      timeoutRef.current = window.setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, duration);
    };

    window.addEventListener("clinicflow:toast", handleToast);
    return () => {
      window.removeEventListener("clinicflow:toast", handleToast);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  const variantClass = toast.variant ? `toast-${toast.variant}` : "toast-info";

  return (
    <div className="global-toast" role="status" aria-live="polite">
      <div className={`global-toast-card ${variantClass}`}>
        <div className="global-toast-body">
          {toast.title ? (
            <strong className="global-toast-title">{toast.title}</strong>
          ) : null}
          <span>{toast.message}</span>
        </div>
        <button
          type="button"
          className="global-toast-close"
          aria-label="Cerrar"
          onClick={() => setToast(null)}
        >
          ×
        </button>
      </div>
    </div>
  );
};
