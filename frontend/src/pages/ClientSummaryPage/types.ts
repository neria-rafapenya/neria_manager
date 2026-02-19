export type TenantFormState = {
  name: string;
  billingEmail: string;
  companyName: string;
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
  taxId: string;
  website: string;
};

export type TenantFieldKey = keyof TenantFormState;

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

export type RenderEditableRow = (
  label: string,
  field: TenantFieldKey,
  displayValue: string,
  placeholder?: string,
  type?: string,
) => JSX.Element;
