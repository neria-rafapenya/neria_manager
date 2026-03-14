import { useEffect, useState } from "react";
import { tenantService } from "../services/tenantService";
import { sectorsService } from "../services/sectorsService";
import { Tenant } from "../types/tenant";
import { uploadFile } from "../services/uploadService";
import { UploadResponse } from "../types/upload";
import { Sector } from "../types/sector";

export default function Settings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sector: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    logoUrl: "",
  });

  async function loadTenant() {
    try {
      const data = await tenantService.get("");
      setTenant(data);
      setForm({
        name: data.name ?? "",
        sector: data.sector ?? "",
        companyEmail: data.companyEmail ?? "",
        companyPhone: data.companyPhone ?? "",
        companyAddress: data.companyAddress ?? "",
        logoUrl: data.logoUrl ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando tenant");
    }
  }

  async function loadSectors() {
    try {
      const data = await sectorsService.list("");
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando sectores");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, "presupuestos/tenant");
      setUploadResult(result);
      const url = result.secureUrl ?? result.url ?? "";
      setForm((prev) => ({ ...prev, logoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo archivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await tenantService.update("", {
        name: form.name,
        sector: form.sector,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone,
        companyAddress: form.companyAddress,
        logoUrl: form.logoUrl,
      });
      setTenant(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando tenant");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadTenant();
    loadSectors();
  }, []);

  return (
    <section>
      <h2>Settings</h2>
      <p>Configura los datos generales del tenant y define un sector principal (opcional).</p>
      {error && <div className="auth-error">{error}</div>}
      <div className="card">
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <input
            className="form-control light"
            placeholder="Company name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <select
            className="form-select light"
            value={form.sector}
            onChange={(e) => setForm((prev) => ({ ...prev, sector: e.target.value }))}
          >
            <option value="">Sin sector</option>
            {sectors
              .filter((sector) => sector.active)
              .map((sector) => (
                <option key={sector.id} value={sector.name}>
                  {sector.name}
                </option>
              ))}
          </select>
          <input
            className="form-control light"
            placeholder="Company email"
            value={form.companyEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
          />
          <input
            className="form-control light"
            placeholder="Company phone"
            value={form.companyPhone}
            onChange={(e) => setForm((prev) => ({ ...prev, companyPhone: e.target.value }))}
          />
          <input
            className="form-control light"
            placeholder="Company address"
            value={form.companyAddress}
            onChange={(e) => setForm((prev) => ({ ...prev, companyAddress: e.target.value }))}
          />
          <input
            className="form-control light"
            placeholder="Logo URL"
            value={form.logoUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
          />
        </div>
        <button onClick={handleSave} disabled={saving} style={{ marginTop: "12px" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3>Subida de logo (Cloudinary)</h3>
        <input className="form-control light" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? "Subiendo..." : "Subir"}
        </button>
        {uploadResult?.secureUrl && (
          <div style={{ marginTop: "8px" }}>
            URL: <a href={uploadResult.secureUrl}>{uploadResult.secureUrl}</a>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <div>Company: {tenant?.name ?? "-"}</div>
        <div>Sector: {tenant?.sector ?? "-"}</div>
        <div>Activo: {tenant?.active ? "Si" : "No"}</div>
      </div>
    </section>
  );
}
