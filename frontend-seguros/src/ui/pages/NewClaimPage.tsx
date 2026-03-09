import { useState } from "react";
import { useServices } from "../app/ServicesProvider";
import type { ClaimType } from "@/domain/models/claim";

const claimOptions: { value: ClaimType; label: string }[] = [
  { value: "auto", label: "Auto" },
];

export function NewClaimPage() {
  const { claimsService } = useServices();
  const [form, setForm] = useState({
    type: "auto" as ClaimType,
    policyNumber: "",
    lossDate: "",
    urgency: "normal",
    description: "",
    thirdPartyInvolved: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ claimNumber: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const claim = await claimsService.createClaim({
        type: form.type,
        policyNumber: form.policyNumber || undefined,
        lossDate: form.lossDate || undefined,
        description: form.description || undefined,
        urgency: form.urgency === "alta",
        thirdPartyInvolved: form.thirdPartyInvolved,
      });
      setCreated({ claimNumber: claim.claimNumber });
    } catch {
      setError("No se pudo crear el expediente. Revisa los datos e intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Nuevo expediente</h3>
                <p>Flujo guiado para apertura sin llamadas.</p>
              </div>
              <span className="step-pill">Paso 1 de 3</span>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Ramo</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, type: event.target.value as ClaimType }))
                  }
                >
                  {claimOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Numero de poliza</label>
                <input
                  className="form-control"
                  placeholder="AUTO-889123"
                  value={form.policyNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, policyNumber: event.target.value }))
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Fecha del siniestro</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.lossDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, lossDate: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Urgencia</label>
                <select
                  className="form-select"
                  value={form.urgency}
                  onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Descripcion</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Describe el incidente y danos principales."
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                ></textarea>
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="thirdParty"
                    checked={form.thirdPartyInvolved}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, thirdPartyInvolved: event.target.checked }))
                    }
                  />
                  <label className="form-check-label" htmlFor="thirdParty">
                    Hay terceros implicados
                  </label>
                </div>
              </div>
            </div>
            {error ? <p className="text-danger mt-3">{error}</p> : null}
          </div>

          <div className="panel mt-4">
            <div className="panel-header">
              <div>
                <h3>Documentos requeridos</h3>
                <p>Solo lo necesario segun tipo de siniestro.</p>
              </div>
            </div>
            <div className="doc-uploader">
              <div>
                <strong>Parte amistoso</strong>
                <p>PDF o foto legible.</p>
              </div>
              <button className="btn btn-outline-light" type="button">
                Subir
              </button>
            </div>
            <div className="doc-uploader">
              <div>
                <strong>Fotos del dano</strong>
                <p>3 minimos, luz natural.</p>
              </div>
              <button className="btn btn-outline-light" type="button">
                Abrir camara
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="panel">
            <h3>Checklist dinamico</h3>
            <ul className="checklist">
              <li>
                <input type="checkbox" /> Datos basicos
              </li>
              <li>
                <input type="checkbox" /> Parte amistoso
              </li>
              <li>
                <input type="checkbox" /> Fotos
              </li>
              <li>
                <input type="checkbox" /> Datos terceros
              </li>
            </ul>
            <button
              className="btn btn-primary w-100"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar expediente"}
            </button>
            {created ? (
              <div className="submission-box mt-3">
                <strong>Expediente creado</strong>
                <p>Numero: {created.claimNumber}</p>
                <p>Te contactaremos si falta documentacion.</p>
              </div>
            ) : null}
          </div>
          <div className="panel mt-4">
            <h3>Reglas activas</h3>
            <p>
              Auto con terceros implica solicitud automatica de atestado si el dano supera 1500 EUR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
