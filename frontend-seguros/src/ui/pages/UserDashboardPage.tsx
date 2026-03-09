import { useAuth } from "../app/AuthProvider";
import { Link } from "react-router-dom";

export function UserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="user-dashboard">
      <div className="user-dashboard__header">
        <div>
          <p className="user-dashboard__eyebrow">Portal asegurado</p>
          <h1>Hola {user?.email}</h1>
          <p className="text-muted">
            Gestiona tus siniestros y mantente al dia del estado de tu expediente.
          </p>
        </div>
        <Link className="btn btn-primary" to="/claims/new">
          Abrir siniestro
        </Link>
      </div>

      <div className="user-dashboard__card">
        <h3>Estado del expediente</h3>
        <p className="text-muted">
          Cuando tengas un siniestro abierto, veras aqui su estado, documentos pendientes y
          proximos pasos.
        </p>
      </div>
    </div>
  );
}

