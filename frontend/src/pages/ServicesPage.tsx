import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import type { ServiceCatalogItem } from "../types";
import { PageWithDocs } from "../components/PageWithDocs";
import { formatEur } from "../utils/currency";
import { emitToast } from "../toast";
import Swal from "sweetalert2";
import { useI18n } from "../i18n/I18nProvider";

export function ServicesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.listServiceCatalog();
        setServices(list as ServiceCatalogItem[]);
        setError(null);
      } catch (err: any) {
        setError(err.message || t("Error cargando servicios"));
      }
    };
    load();
  }, [t]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return services;
    }
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(term) ||
        service.code.toLowerCase().includes(term)
      );
    });
  }, [services, query]);

  const handleToggle = async (service: ServiceCatalogItem) => {
    try {
      setBusyId(service.id);
      const updated = await api.updateServiceCatalog(service.id, {
        enabled: !service.enabled,
      });
      setServices((prev) =>
        prev.map((item) => (item.id === service.id ? updated : item)),
      );
      emitToast(
        service.enabled ? t("Servicio desactivado") : t("Servicio activado"),
      );
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error actualizando servicio"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: ServiceCatalogItem) => {
    const result = await Swal.fire({
      title: t("Eliminar servicio"),
      text: t("¿Eliminar {name}? Esta acción es irreversible.", {
        name: service.name,
      }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setBusyId(service.id);
      await api.deleteServiceCatalog(service.id);
      setServices((prev) => prev.filter((item) => item.id !== service.id));
      emitToast(t("Servicio eliminado"));
      setError(null);
    } catch (err: any) {
      setError(err.message || t("Error eliminando servicio"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageWithDocs slug="services">
      <section className="grid">
        {error && <div className="error-banner">{error}</div>}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>{t("Servicios")}</h2>
              <p className="muted">
                {t("Catálogo de servicios disponibles para clientes.")}
              </p>
            </div>
            <div className="card-header-actions">
              <Link className="btn" to="/">
                {t("Volver")}
              </Link>
              <Link className="btn primary" to="/services/new">
                {t("Crear servicio")}
              </Link>
            </div>
          </div>

          {filtered.map((service) => (
            <div className="row servicetable-row" key={service.id}>
              <div className="col-12">
                <div className="d-flex justify-content-between mb-3">
                  <h4>{service.name}</h4>
                  <div
                    className={`status ${service.enabled ? "active" : "disabled"}`}
                  >
                    {service.enabled ? t("activo") : t("inactivo")}
                  </div>
                </div>

                <p>{service.description}</p>
              </div>

              <div className="col-12">
                <div className="d-flex justify-content-between">
                  <div>
                    Código servicio: <strong>{service.code}</strong>
                  </div>
                  <div>
                    <span>
                      Importe mensual:{" "}
                      <strong>{formatEur(service.priceMonthlyEur)}</strong>
                    </span>{" "}
                    -{" "}
                    <span>
                      Importe anual:{" "}
                      <strong>{formatEur(service.priceAnnualEur)}</strong>
                    </span>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <div>
                    Endpoints activados:{" "}
                    <strong>
                      {service.endpointsEnabled !== false ? t("sí") : t("no")}
                    </strong>
                  </div>

                  <div className="row-actions">
                    {/* 👇 AHORA ES UN BUTTON REAL */}
                    <button
                      type="button"
                      className="link"
                      onClick={() => navigate(`/services/${service.id}`)}
                    >
                      {t("Editar")}
                    </button>

                    <button
                      type="button"
                      className="link2"
                      onClick={() => handleToggle(service)}
                      disabled={busyId === service.id}
                    >
                      {service.enabled ? t("Desactivar") : t("Activar")}
                    </button>

                    <button
                      type="button"
                      className="link3"
                      onClick={() => handleDelete(service)}
                      disabled={busyId === service.id}
                    >
                      {t("Eliminar")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="muted">{t("No hay servicios disponibles.")}</div>
          )}
        </div>
      </section>
    </PageWithDocs>
  );
}
