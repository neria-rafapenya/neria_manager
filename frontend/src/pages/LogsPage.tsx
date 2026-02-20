import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PageWithDocs } from "../components/PageWithDocs";
import { DataTable } from "../components/DataTable";
import type { TenantRequestLog } from "../types";
import { useI18n } from "../i18n/I18nProvider";

export function LogsPage() {
  const { t } = useI18n();
  const statusOptions = [
    { value: "", label: t("Todos") },
    { value: "2xx", label: "2xx" },
    { value: "3xx", label: "3xx" },
    { value: "4xx", label: "4xx" },
    { value: "5xx", label: "5xx" },
  ];
  const [logs, setLogs] = useState<TenantRequestLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TenantRequestLog | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await api.getLogs(500);
        setLogs(list);
        setError(null);
      } catch (err: any) {
        setError(err.message || t("Error cargando logs"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const typeOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((item) => item.type).filter(Boolean))) as string[];
    return ["", ...values];
  }, [logs]);

  const methodOptions = useMemo(() => {
    const values = Array.from(
      new Set(logs.map((item) => item.method).filter(Boolean)),
    ) as string[];
    return ["", ...values];
  }, [logs]);

  const tenantOptions = useMemo(() => {
    const values = Array.from(
      new Set(logs.map((item) => item.tenantId).filter(Boolean)),
    ) as string[];
    return ["", ...values];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (typeFilter && item.type !== typeFilter) {
        return false;
      }
      if (methodFilter && item.method !== methodFilter) {
        return false;
      }
      if (tenantFilter && item.tenantId !== tenantFilter) {
        return false;
      }
      if (statusFilter) {
        const code = item.statusCode ?? 0;
        const bucket = `${Math.floor(code / 100)}xx`;
        if (bucket !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [logs, typeFilter, methodFilter, statusFilter, tenantFilter]);

  const handleExport = () => {
    const headers = [
      "createdAt",
      "tenantId",
      "userId",
      "userEmail",
      "role",
      "method",
      "path",
      "type",
      "serviceCode",
      "statusCode",
      "queryString",
      "ipAddress",
      "userAgent",
      "payloadJson",
    ];
    const escape = (value: any) => {
      if (value === null || value === undefined) return "";
      const text = String(value)
        .replace(/"/g, '""')
        .replace(/\r?\n/g, "\\n");
      return `"${text}"`;
    };
    const rows = filteredLogs.map((item) =>
      headers.map((key) => escape((item as any)[key])).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPayload = (payload: string | null | undefined) => {
    if (!payload) {
      return null;
    }
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <PageWithDocs slug="audit">
      <section className="grid">
        {error && <div className="error-banner full-row">{error}</div>}
        <div className="card full-row">
          <div className="log-header">
            <div>
              <h2>{t("Logs")}</h2>
              <p className="muted">
                {t("Registro de acciones de tenants para diagnóstico y trazabilidad.")}
              </p>
            </div>
            <button className="btn" onClick={handleExport} disabled={filteredLogs.length === 0}>
              {t("Exportar CSV")}
            </button>
          </div>

          <div className="log-filters">
            <label>
              {t("Tipo")}
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                {typeOptions.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || t("Todos")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Método")}
              <select
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value)}
              >
                {methodOptions.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || t("Todos")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Estado")}
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Tenant")}
              <select
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
              >
                {tenantOptions.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value || t("Todos")}
                  </option>
                ))}
              </select>
            </label>
            <div className="log-filter-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setTypeFilter("");
                  setMethodFilter("");
                  setStatusFilter("");
                  setTenantFilter("");
                }}
              >
                {t("Limpiar")}
              </button>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "type", label: t("Tipo"), sortable: true },
              { key: "method", label: t("Método"), sortable: true },
              { key: "path", label: t("Ruta"), sortable: true },
              { key: "tenantId", label: t("Tenant"), sortable: true },
              { key: "userId", label: t("Usuario"), sortable: true },
              { key: "userEmail", label: t("Email"), sortable: true },
              {
                key: "statusCode",
                label: t("Estado"),
                sortable: true,
                render: (row: TenantRequestLog) => {
                  const code = row.statusCode ?? 0;
                  const statusClass = code >= 200 && code < 300 ? "accepted" : "rejected";
                  return <span className={`status ${statusClass}`}>{code}</span>;
                },
              },
              {
                key: "payload",
                label: t("Payload"),
                render: (row: TenantRequestLog) =>
                  row.payloadJson ? (
                    <button
                      className="link"
                      type="button"
                      onClick={() => setSelectedLog(row)}
                    >
                      {t("Ver")}
                    </button>
                  ) : (
                    <span className="muted">-</span>
                  ),
              },
              {
                key: "createdAt",
                label: t("Hora"),
                sortable: true,
                render: (row: TenantRequestLog) =>
                  row.createdAt ? new Date(row.createdAt).toLocaleString() : "",
              },
            ]}
            data={filteredLogs}
            getRowId={(row) => row.id}
            pageSize={50}
            filterKeys={["userId", "userEmail"]}
          />
          {loading && <div className="muted">{t("Cargando...")}</div>}
          {!loading && filteredLogs.length === 0 && (
            <div className="muted">{t("Sin logs registrados.")}</div>
          )}
        </div>
      </section>

      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal modal-wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">{t("Payload")}</div>
                <h3>{selectedLog.path}</h3>
                <p className="muted">
                  {selectedLog.method} · {selectedLog.tenantId}
                </p>
              </div>
              <button className="btn" onClick={() => setSelectedLog(null)}>
                {t("Cerrar")}
              </button>
            </div>
            <div className="modal-body">
              <div className="code-block">
                <pre>{renderPayload(selectedLog.payloadJson)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
