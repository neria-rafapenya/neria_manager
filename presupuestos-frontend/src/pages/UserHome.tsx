import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function UserHome() {
  const { session } = useAuth();

  return (
    <section>
      <h2>Espacio Usuario</h2>
      <div className="card">
        <p>Bienvenido, {session?.user.email}. Este es el espacio para usuarios convencionales.</p>
        <p>
          Para solicitar un presupuesto, entra en <strong>Solicitar presupuesto</strong>.
        </p>
        <Link to="/request" className="landing-button">
          Solicitar presupuesto
        </Link>
      </div>
    </section>
  );
}
