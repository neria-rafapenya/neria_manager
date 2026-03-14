export type SubscriptionPlan = "STARTER" | "PRO" | "BUSINESS";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface Subscription {
  id: string;
  tenantId?: string;
  plan?: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: SubscriptionStatus;
  createdAt?: string;
}

export interface UsageMetric {
  id: string;
  tenantId?: string;
  metricType?: string;
  value?: number;
  createdAt?: string;
}
