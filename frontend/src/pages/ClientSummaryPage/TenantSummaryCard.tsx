import type { Tenant } from "../../types";
import { StatusBadgeIcon } from "../../components/StatusBadgeIcon";
import type { RenderEditableRow, TenantFormState, TranslateFn } from "./types";

type TenantSummaryCardProps = {
  tenant: Tenant | null;
  tenantId?: string;
  tenantForm: TenantFormState;
  renderEditableRow: RenderEditableRow;
  t: TranslateFn;
};

export function TenantSummaryCard({
  tenant,
  tenantId,
  tenantForm,
  renderEditableRow,
  t,
}: TenantSummaryCardProps) {
  return (
    <div className="card">
      <div>
        <h2>{t("Resumen")}</h2>
        <p className="muted">{t("Datos generales del cliente.")}</p>
      </div>
      {!tenant?.billingEmail && (
        <div className="info-banner">
          {t(
            "Falta el email de facturación. Algunas acciones quedarán bloqueadas hasta completarlo.",
          )}
        </div>
      )}
      <div className="mini-list summary-list">
        <div className="mini-row">
          <span>ID</span>
          <span>{tenant?.id || tenantId}</span>
        </div>
        {renderEditableRow(
          t("Nombre"),
          "name",
          tenantForm.name,
          t("Nombre del cliente"),
        )}
        <div className="mini-row summary-inline-row">
          <span>{t("Estado")}</span>
          <StatusBadgeIcon status={tenant?.status || "active"} />
        </div>
        <div className="mini-row summary-inline-row">
          <span>{t("Kill switch")}</span>
          <span>{tenant?.killSwitch ? t("ON") : t("OFF")}</span>
        </div>
        {renderEditableRow(
          t("Email facturación"),
          "billingEmail",
          tenantForm.billingEmail || t("No definido"),
          t("billing@cliente.com"),
          "email",
        )}
        {renderEditableRow(
          t("Empresa"),
          "companyName",
          tenantForm.companyName,
          t("Razón social"),
        )}
        {renderEditableRow(
          t("Responsable"),
          "contactName",
          tenantForm.contactName,
          t("Nombre del responsable"),
        )}
        {renderEditableRow(
          t("Teléfono"),
          "phone",
          tenantForm.phone,
          t("+34 600 000 000"),
          "tel",
        )}
        {renderEditableRow(
          t("Web"),
          "website",
          tenantForm.website,
          t("https://cliente.com"),
        )}
        {renderEditableRow(
          t("CIF/NIF"),
          "taxId",
          tenantForm.taxId,
          t("B12345678"),
        )}
        {renderEditableRow(
          t("Dirección"),
          "addressLine1",
          tenantForm.addressLine1,
          t("Calle, número"),
        )}
        {renderEditableRow(
          t("Dirección (2)"),
          "addressLine2",
          tenantForm.addressLine2,
          t("Piso, puerta"),
        )}
        {renderEditableRow(t("Ciudad"), "city", tenantForm.city, t("Madrid"))}
        {renderEditableRow(
          t("Código postal"),
          "postalCode",
          tenantForm.postalCode,
          t("28001"),
        )}
        {renderEditableRow(
          t("País"),
          "country",
          tenantForm.country,
          t("España"),
        )}
        {renderEditableRow(
          t("Dirección facturación"),
          "billingAddressLine1",
          tenantForm.billingAddressLine1,
          t("Calle, número"),
        )}
        {renderEditableRow(
          t("Dirección facturación (2)"),
          "billingAddressLine2",
          tenantForm.billingAddressLine2,
          t("Piso, puerta"),
        )}
        {renderEditableRow(
          t("Ciudad facturación"),
          "billingCity",
          tenantForm.billingCity,
          t("Madrid"),
        )}
        {renderEditableRow(
          t("CP facturación"),
          "billingPostalCode",
          tenantForm.billingPostalCode,
          t("28001"),
        )}
        {renderEditableRow(
          t("País facturación"),
          "billingCountry",
          tenantForm.billingCountry,
          t("España"),
        )}
      </div>
    </div>
  );
}
