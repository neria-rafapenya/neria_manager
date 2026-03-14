import { useEffect, useState } from "react";
import { emailService } from "../services/emailService";
import { Email } from "../types/email";

export default function Leads() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadEmails() {
    try {
      const data = await emailService.list("");
      setEmails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando leads");
    }
  }

  useEffect(() => {
    loadEmails();
  }, []);

  return (
    <section>
      <h2>Leads</h2>
      <p>
        El menú Leads muestra los emails entrantes que el sistema ha capturado y procesado como oportunidades de presupuesto.
        En esta pantalla puedes:
      </p>
      <ul>
        <li>Ver el listado de emails recibidos (cliente, asunto y cuerpo).</li>
        <li>
          Consultar el estado del procesamiento:
          <span> NEW: recién recibido · </span>
          <span>PARSING: en análisis por IA · </span>
          <span>PARSED: ya interpretado · </span>
          <span>QUOTE_CREATED: presupuesto generado · </span>
          <span>FAILED: error en el pipeline</span>
        </li>
        <li>Identificar leads nuevos que aún no se han convertido en presupuesto.</li>
      </ul>
      <p>Es, en resumen, el panel para supervisar el pipeline de emails → IA → presupuesto.</p>
      {error && <div className="auth-error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Producto/servicio detectado</th>
            <th>Confidence IA</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {emails.length === 0 ? (
            <tr>
              <td colSpan={4}>Sin datos</td>
            </tr>
          ) : (
            emails.map((email) => (
              <tr key={email.id}>
                <td>{email.customerEmail ?? "-"}</td>
                <td>-</td>
                <td>-</td>
                <td>{email.status ?? "NEW"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
