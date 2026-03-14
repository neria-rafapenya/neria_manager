export type EmailStatus = "NEW" | "PARSING" | "PARSED" | "QUOTE_CREATED" | "FAILED";

export interface Email {
  id: string;
  tenantId?: string;
  customerEmail?: string;
  subject?: string;
  body?: string;
  status?: EmailStatus;
  processed?: boolean;
  createdAt?: string;
}
