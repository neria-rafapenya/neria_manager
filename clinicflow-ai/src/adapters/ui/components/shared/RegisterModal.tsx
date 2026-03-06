import { useState } from "react";
import { Modal } from "./Modal";
import { IconFacebook, IconGoogle } from "./icons";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  onSocialLogin?: (provider: "google" | "facebook") => Promise<void>;
}

export const RegisterModal = ({
  isOpen,
  onClose,
  onRegister,
  onSocialLogin,
}: RegisterModalProps) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Email y contraseña son obligatorios.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRegister({
        name: form.name || undefined,
        email: form.email,
        password: form.password,
      });
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Crear una cuenta" onClose={onClose}>
      <div className="form-field">
        <label>Nombre</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </div>
      <div className="form-field">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
      </div>
      <div className="form-field">
        <label>Contraseña</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
      </div>
      <div className="form-field">
        <label>Repite la contraseña</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
          }
        />
      </div>
      {error ? <p className="muted">{error}</p> : null}
      {onSocialLogin ? (
        <div className="d-flex flex-column gap-2 mt-2">
          <button
            className="btn btn-google"
            type="button"
            onClick={() => onSocialLogin("google")}
            disabled={loading}
          >
            <IconGoogle />
            Continuar con Google
          </button>
          <button
            className="btn btn-facebook"
            type="button"
            onClick={() => onSocialLogin("facebook")}
            disabled={loading}
          >
            <IconFacebook />
            Continuar con Facebook
          </button>
        </div>
      ) : null}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button className="btn secondary" type="button" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button className="btn primary" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </div>
    </Modal>
  );
};
