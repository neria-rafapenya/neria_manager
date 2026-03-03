import { useMemo } from "react";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";

interface TopbarProps {
  title: string;
}

export const Topbar = ({ title }: TopbarProps) => {
  const { user, logout } = useAuthContext();
  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  return (
    <header className="topbar">
      <div>
        <p className="topbar-title">{title}</p>
        <p className="topbar-subtitle">{dateLabel}</p>
      </div>
      <div className="topbar-actions">
        <label className="topbar-search">
          <span>Buscar</span>
          <input placeholder="Paciente, cita o protocolo" />
        </label>
        <div className="topbar-user">
          <span className="topbar-user-label">{user?.email ?? ""}</span>
          <button className="btn btn-ghost" onClick={logout} type="button">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};
