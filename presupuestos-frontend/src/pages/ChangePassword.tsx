import { FormEvent, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newPassword || newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Cambiar contraseña</h2>
      <div className="card" style={{ maxWidth: "480px" }}>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="currentPassword">
            <span>Contraseña actual</span>
            <input
              id="currentPassword"
              type="password"
              className="form-control light"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label htmlFor="newPassword">
            <span>Nueva contraseña</span>
            <input
              id="newPassword"
              type="password"
              className="form-control light"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label htmlFor="confirmPassword">
            <span>Confirmar contraseña</span>
            <input
              id="confirmPassword"
              type="password"
              className="form-control light"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </section>
  );
}
