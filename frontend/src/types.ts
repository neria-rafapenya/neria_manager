export type Tenant = {
  id: string;
  name: string;
  status: string;
  killSwitch: boolean;
  billingEmail?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  taxId?: string | null;
  website?: string | null;
  authUsername?: string | null;
};

export type Provider = {
  id: string;
  tenantId: string;
  type: string;
  displayName: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

export type Policy = {
  id: string;
  tenantId: string;
  maxRequestsPerMinute: number;
  maxTokensPerDay: number;
  maxCostPerDayUsd: number;
  redactionEnabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type UsageSummary = {
  tenantId: string;
  tokens: number;
  costUsd: number;
};

export type UsageAlert = {
  tenantId: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  limit?: number;
};

export type AuditEvent = {
  id: string;
  action: string;
  status: string;
  tenantId: string;
  createdAt: string;
};
export type TenantRequestLog = {
  id: string;
  tenantId: string;
  userId?: string | null;
  userEmail?: string | null;
  role?: string | null;
  method?: string | null;
  path?: string | null;
  type?: string | null;
  serviceCode?: string | null;
  queryString?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  statusCode?: number | null;
  payloadJson?: string | null;
  createdAt: string;
};


export type UsageEvent = {
  id: string;
  tenantId: string;
  providerId: string;
  model: string;
  serviceCode?: string | null;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  createdAt: string;
};

export type PricingEntry = {
  id: string;
  providerType: string;
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  enabled: boolean;
};

export type Webhook = {
  id: string;
  tenantId: string | null;
  url: string;
  events: string[];
  enabled: boolean;
};

export type NotificationChannel = {
  id: string;
  tenantId: string | null;
  type: string;
  config: { name?: string; recipients?: string[]; webhookUrl?: string };
  enabled: boolean;
};

export type AlertSchedule = {
  cron: string;
  minIntervalMinutes: number;
};

export type DocumentationEntry = {
  id: string;
  menuSlug: string;
  category: string;
  title: string;
  content: string;
  titleEn?: string | null;
  contentEn?: string | null;
  titleCa?: string | null;
  contentCa?: string | null;
  link: string | null;
  orderIndex: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantServiceSettings = {
  tenantId: string;
  genericEnabled: boolean;
  ocrEnabled: boolean;
  sqlEnabled: boolean;
};

export type TenantServiceOverview = {
  serviceCode: string;
  name: string;
  description: string;
  apiBaseUrl?: string | null;
  priceMonthlyEur: number;
  priceAnnualEur: number;
  endpointsEnabled: boolean;
  emailAutomationEnabled?: boolean;
  catalogHumanHandoffEnabled?: boolean;
  catalogFileStorageEnabled?: boolean;
  catalogDocumentProcessingEnabled?: boolean;
  catalogOcrEnabled?: boolean;
  catalogSemanticSearchEnabled?: boolean;
  tenantHumanHandoffEnabled?: boolean | null;
  tenantFileStorageEnabled?: boolean | null;
  tenantDocumentProcessingEnabled?: boolean | null;
  tenantOcrEnabled?: boolean | null;
  tenantSemanticSearchEnabled?: boolean | null;
  tenantInternalDocsEnabled?: boolean | null;
  tenantInternalPoliciesEnabled?: boolean | null;
  tenantInternalTemplatesEnabled?: boolean | null;
  internalDocsEnabled?: boolean;
  internalPoliciesEnabled?: boolean;
  internalTemplatesEnabled?: boolean;
  humanHandoffEnabled?: boolean;
  fileStorageEnabled?: boolean;
  documentProcessingEnabled?: boolean;
  ocrEnabled?: boolean;
  semanticSearchEnabled?: boolean;
  subscriptionStatus: 'active' | 'pending' | 'pending_removal' | 'disabled';
  activateAt: string | null;
  deactivateAt?: string | null;
  tenantServiceId?: string | null;
  configStatus: 'active' | 'suspended';
  systemPrompt: string | null;
  providerId?: string | null;
  pricingId?: string | null;
  policyId?: string | null;
  documentDomain?: string | null;
  documentOutputType?: string | null;
  serviceApiKey?: string | null;
  userCount: number;
  endpointCount: number;
  jiraEnabled?: boolean;
  jiraConfigured?: boolean;
};

export type TenantServiceEndpoint = {
  id: string;
  tenantId: string;
  serviceCode: string;
  slug: string;
  method: string;
  path: string;
  baseUrl?: string | null;
  headers?: Record<string, string> | null;
  responsePath?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantServiceEmailAccount = {
  id: string;
  label?: string | null;
  email: string;
  host: string;
  port?: number | null;
  username: string;
  folder?: string | null;
  useSsl: boolean;
  useStartTls: boolean;
  enabled: boolean;
  hasPassword: boolean;
  lastSyncAt?: string | null;
};

export type TenantServiceEmailMessage = {
  id: string;
  accountId: string;
  subject?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  receivedAt?: string | null;
  status?: string | null;
  intent?: string | null;
  priority?: string | null;
  actionType?: string | null;
  actionStatus?: string | null;
  jiraIssueKey?: string | null;
  jiraIssueUrl?: string | null;
};

export type SurveySummary = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  language?: string | null;
  publicCode: string;
  allowMultiple: boolean;
  collectEmail: boolean;
  anonymous: boolean;
  welcomeText?: string | null;
  thankYouText?: string | null;
  questionCount: number;
  responseCount: number;
  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SurveyQuestion = {
  id: string;
  label: string;
  description?: string | null;
  type: string;
  required: boolean;
  orderIndex: number;
  options?: string[];
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
};

export type SurveyDetail = {
  summary: SurveySummary;
  questions: SurveyQuestion[];
};

export type SurveyResponseSummary = {
  id: string;
  status: string;
  respondentEmail?: string | null;
  respondentName?: string | null;
  submittedAt?: string | null;
  answerCount: number;
};

export type SurveyResponseDetail = {
  id: string;
  status: string;
  respondentEmail?: string | null;
  respondentName?: string | null;
  submittedAt?: string | null;
  answers: { questionId: string; value: any }[];
};

export type SurveyInsight = {
  id: string;
  model?: string | null;
  status: string;
  payload?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
};

export type PublicSurvey = {
  publicCode: string;
  title: string;
  description?: string | null;
  welcomeText?: string | null;
  thankYouText?: string | null;
  language?: string | null;
  collectEmail: boolean;
  anonymous: boolean;
  questions: SurveyQuestion[];
};



export type FinancialSimulationSummary = {
  id: string;
  title: string;
  type: string;
  currency: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  result?: Record<string, any> | null;
};

export type FinancialSimulationDetail = {
  summary: FinancialSimulationSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  explanation?: string | null;
  model?: string | null;
  providerId?: string | null;
};



export type PreEvaluationSummary = {
  id: string;
  title: string;
  productType: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  result?: Record<string, any> | null;
};

export type PreEvaluationDetail = {
  summary: PreEvaluationSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  report?: string | null;
  model?: string | null;
  providerId?: string | null;
};

export type OperationalSupportSummary = {
  id: string;
  title: string;
  entryType: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  result?: Record<string, any> | null;
};

export type OperationalSupportDetail = {
  summary: OperationalSupportSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  report?: string | null;
  model?: string | null;
  providerId?: string | null;
};

export type SelfAssessmentSummary = {
  id: string;
  title: string;
  assessmentType: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  result?: Record<string, any> | null;
};

export type SelfAssessmentDetail = {
  summary: SelfAssessmentSummary;
  input: Record<string, any> | null;
  result: Record<string, any> | null;
  report?: string | null;
  model?: string | null;
  providerId?: string | null;
};

export type TenantServiceUser = {
  userId: string;
  status: 'active' | 'suspended';
  user: ChatUserSummary;
};

export type ServiceCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  apiBaseUrl?: string | null;
  priceMonthlyEur: number;
  priceAnnualEur: number;
  enabled: boolean;
  endpointsEnabled: boolean;
  emailAutomationEnabled?: boolean;
  catalogHumanHandoffEnabled?: boolean;
  catalogFileStorageEnabled?: boolean;
  catalogDocumentProcessingEnabled?: boolean;
  catalogOcrEnabled?: boolean;
  catalogSemanticSearchEnabled?: boolean;
  tenantHumanHandoffEnabled?: boolean | null;
  tenantFileStorageEnabled?: boolean | null;
  tenantDocumentProcessingEnabled?: boolean | null;
  tenantOcrEnabled?: boolean | null;
  tenantSemanticSearchEnabled?: boolean | null;
  tenantInternalDocsEnabled?: boolean | null;
  tenantInternalPoliciesEnabled?: boolean | null;
  tenantInternalTemplatesEnabled?: boolean | null;
  internalDocsEnabled?: boolean;
  internalPoliciesEnabled?: boolean;
  internalTemplatesEnabled?: boolean;
  humanHandoffEnabled?: boolean;
  fileStorageEnabled?: boolean;
  documentProcessingEnabled?: boolean;
  ocrEnabled?: boolean;
  semanticSearchEnabled?: boolean;
  jiraEnabled?: boolean;
  jiraProjectKey?: string | null;
  jiraDefaultIssueType?: string | null;
  jiraAllowUserPriorityOverride?: boolean;
  jiraAutoLabelWithServiceName?: boolean;
};

export type TenantServiceJiraSettings = {
  jiraEnabled: boolean;
  jiraProjectKey?: string | null;
  jiraDefaultIssueType?: string | null;
  jiraAllowUserPriorityOverride: boolean;
  jiraAutoLabelWithServiceName: boolean;
  jiraBaseUrl?: string | null;
  jiraEmail?: string | null;
  jiraCredentialsEnabled: boolean;
  jiraHasToken: boolean;
};

export type Subscription = {
  id: string;
  tenantId: string;
  status: 'active' | 'pending' | 'cancelled' | 'past_due';
  period: 'monthly' | 'annual';
  basePriceEur: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionServiceItem = {
  serviceCode: string;
  status: 'active' | 'pending' | 'pending_removal';
  activateAt: string | null;
  deactivateAt?: string | null;
  priceEur: number;
  name?: string;
  description?: string;
  priceMonthlyEur?: number;
  priceAnnualEur?: number;
};

export type SubscriptionSummary = {
  subscription: Subscription | null;
  services: SubscriptionServiceItem[];
  totals: {
    basePriceEur: number;
    servicesPriceEur: number;
    subtotalEur?: number;
    taxRate?: number;
    taxEur?: number;
    totalEur: number;
    billedSinceStartEur: number;
  } | null;
};

export type TenantInvoice = {
  id: string;
  tenantId: string;
  subscriptionId?: string | null;
  paymentRequestId?: string | null;
  period: string;
  basePriceEur: number;
  servicesPriceEur: number;
  taxRate?: number | null;
  taxEur?: number | null;
  totalEur: number;
  currency: string;
  status: 'pending' | 'paid' | 'void';
  stripeInvoiceId?: string | null;
  stripePaymentIntentId?: string | null;
  issuedAt: string;
  paidAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  createdAt: string;
};

export type TenantInvoiceItem = {
  id: string;
  invoiceId: string;
  serviceCode: string;
  description?: string | null;
  priceEur: number;
  status: string;
  createdAt: string;
};

export type TenantInvoiceEntry = {
  invoice: TenantInvoice;
  items: TenantInvoiceItem[];
};

export type AdminSubscriptionSummary = {
  tenantId: string;
  tenantName: string;
  subscription: Subscription | null;
  currentTotalEur: number;
  billedSinceStartEur: number;
  historyTotalEur: number;
};

export type ApiKeySummary = {
  id: string;
  tenantId: string | null;
  name: string;
  status: string;
  createdAt: string;
};

export type TenantPricingAssignment = {
  tenantId: string;
  pricingIds: string[];
};

export type AdminUser = {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
  role: 'admin' | 'editor';
  status: 'active' | 'disabled';
  language?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  user: string | null;
  role: 'admin' | 'editor' | 'tenant' | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  mustChangePassword?: boolean;
  language?: string | null;
};

export type ChatUserSummary = {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
};

export type ChatConversation = {
  id: string;
  tenantId: string;
  userId: string;
  providerId: string;
  model: string;
  serviceCode: string;
  title?: string | null;
  apiKeyId?: string | null;
  handoffStatus?: 'none' | 'requested' | 'active' | 'resolved' | null;
  handoffReason?: string | null;
  handoffRequestedAt?: string | null;
  handoffAcceptedAt?: string | null;
  handoffResolvedAt?: string | null;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatAttachment = {
  url?: string;
  name?: string;
  contentType?: string;
  size?: number;
  provider?: string;
  storageKey?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  tenantId: string;
  userId: string;
  role: 'system' | 'user' | 'assistant' | 'human';
  content: string;
  attachments?: ChatAttachment[] | string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
};

export type TenantServiceStorage = {
  provider: string;
  enabled: boolean;
  usingDefault: boolean;
  config: Record<string, unknown> | null;
};
