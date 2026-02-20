import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { StatusBadgeIcon } from "../components/StatusBadgeIcon";
import { LoaderComponent } from "../components/LoaderComponent";
import { PageWithDocs } from "../components/PageWithDocs";
import { InfoTooltip } from "../components/InfoTooltip";
import { useAuth } from "../auth";
import { emitToast } from "../toast";
import { copyToClipboard } from "../utils/clipboard";
import { getTenantApiKey } from "../utils/apiKeyStorage";
import { useI18n } from "../i18n/I18nProvider";
import type {
  ApiKeySummary,
  ChatConversation,
  ChatMessage,
  ChatUserSummary,
  Policy,
  Provider,
  PricingEntry,
  TenantServiceEmailAccount,
  TenantServiceEmailMessage,
  TenantServiceJiraSettings,
  TenantServiceEndpoint,
  TenantServiceOverview,
  TenantServiceStorage,
  TenantServiceUser,
} from "../types";

export function TenantServiceDetailPage() {
  const { tenantId, serviceCode } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { role, tenantId: authTenantId } = useAuth();
  const canManageServices = role === "admin";
  const canManageChatUsers = role === "admin" || role === "tenant";
  const canManagePolicies = role === "admin";
  const canManageConversations = role === "admin";
  const canManageEmailAutomation = role === "admin" || role === "tenant";
  const isFinancialService = serviceCode === "simulador-financiero";
  const isSelfAssessmentService = serviceCode === "autoevalucion";
  const isPreEvaluationService = serviceCode === "pre-evaluacion";
  const isOperationalSupportService = serviceCode === "asistente-operativo";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<TenantServiceOverview | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [policyCatalog, setPolicyCatalog] = useState<Policy[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUserSummary[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [serviceEndpoints, setServiceEndpoints] = useState<
    TenantServiceEndpoint[]
  >([]);

  const endpointsEnabled = service?.endpointsEnabled !== false;

  const sectionLinks = useMemo(() => {
    const links = [
      { id: "section-jira", label: t("Integración Jira"), visible: true },
      {
        id: "section-email",
        label: t("Automatización de correos y tickets"),
        visible: Boolean(service?.emailAutomationEnabled),
      },
      {
        id: "section-financial",
        label: t("Simulador financiero"),
        visible: isFinancialService,
      },
      {
        id: "section-pre-eval",
        label: t("Pre-evaluacion"),
        visible: isPreEvaluationService,
      },
      {
        id: "section-self-assessment",
        label: t("Autoevaluacion inteligente"),
        visible: isSelfAssessmentService,
      },
      {
        id: "section-storage",
        label: t("Almacenamiento de archivos"),
        visible: Boolean(service?.fileStorageEnabled),
      },
      {
        id: "section-runtime",
        label: t("Prueba runtime"),
        visible: true,
      },
      {
        id: "section-endpoints",
        label: t("Endpoints del servicio"),
        visible: endpointsEnabled,
      },
      {
        id: "section-third-party",
        label: t("Datos para app de terceros"),
        visible: true,
      },
      { id: "section-users", label: t("Usuarios asignados"), visible: true },
      {
        id: "section-conversations",
        label: t("Conversaciones"),
        visible: canManageConversations,
      },
    ];
    return links.filter((item) => item.visible);
  }, [
    t,
    service?.emailAutomationEnabled,
    service?.fileStorageEnabled,
    isFinancialService,
    isOperationalSupportService,
    isPreEvaluationService,
    isSelfAssessmentService,
    endpointsEnabled,
    canManageConversations,
  ]);

  const [serviceUsers, setServiceUsers] = useState<TenantServiceUser[]>([]);
  const [chatUserModalOpen, setChatUserModalOpen] = useState(false);
  const [newChatUser, setNewChatUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [chatUserBusy, setChatUserBusy] = useState(false);
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [chatConversations, setChatConversations] = useState<
    ChatConversation[]
  >([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [serviceConfigDraft, setServiceConfigDraft] = useState({
    status: "active" as "active" | "suspended",
    apiBaseUrl: "",
    systemPrompt: "",
    providerId: "",
    pricingId: "",
    policyId: "",
    humanHandoffEnabled: true,
    fileStorageEnabled: true,
    documentProcessingEnabled: false,
    ocrEnabled: false,
    semanticSearchEnabled: false,
    internalDocsEnabled: true,
    internalPoliciesEnabled: true,
    internalTemplatesEnabled: true,
    documentDomain: "",
    documentOutputType: "markdown",
  });
  const [storageConfig, setStorageConfig] =
    useState<TenantServiceStorage | null>(null);
  const [storageDraft, setStorageDraft] = useState({
    provider: "cloudinary",
    enabled: true,
    configText: "",
    usingDefault: true,
  });
  const [storageBusy, setStorageBusy] = useState(false);
  const [jiraConfig, setJiraConfig] =
    useState<TenantServiceJiraSettings | null>(null);
  const [jiraDraft, setJiraDraft] = useState({
    jiraEnabled: false,
    jiraProjectKey: "",
    jiraDefaultIssueType: "Task",
    jiraAllowUserPriorityOverride: true,
    jiraAutoLabelWithServiceName: true,
    jiraBaseUrl: "",
    jiraEmail: "",
    jiraApiToken: "",
    jiraCredentialsEnabled: false,
    jiraHasToken: false,
  });
  const [jiraBusy, setJiraBusy] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<
    TenantServiceEmailAccount[]
  >([]);
  const [emailMessages, setEmailMessages] = useState<
    TenantServiceEmailMessage[]
  >([]);
  const [emailAccountDraft, setEmailAccountDraft] = useState({
    id: "",
    label: "",
    email: "",
    host: "",
    port: "",
    username: "",
    password: "",
    folder: "INBOX",
    useSsl: true,
    useStartTls: false,
    enabled: true,
  });
  const [emailAccountMode, setEmailAccountMode] = useState<"create" | "edit">(
    "create",
  );
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSyncBusy, setEmailSyncBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [serviceRuntimeForm, setServiceRuntimeForm] = useState({
    providerId: "",
    model: "",
    payload: '{"messages":[{"role":"user","content":"Hola"}]}',
  });
  const [serviceRuntimeResult, setServiceRuntimeResult] = useState<any>(null);
  const [serviceRuntimeError, setServiceRuntimeError] = useState<string | null>(
    null,
  );
  const [serviceEndpointDraft, setServiceEndpointDraft] = useState({
    id: "",
    slug: "",
    method: "POST",
    path: "",
    baseUrl: "",
    headers: "",
    responsePath: "",
    enabled: true,
  });
  const [serviceEndpointMode, setServiceEndpointMode] = useState<
    "create" | "edit"
  >("create");
  const [serviceAssignUserId, setServiceAssignUserId] = useState("");
  const [serviceBusy, setServiceBusy] = useState(false);
  const [serviceRuntimeBusy, setServiceRuntimeBusy] = useState(false);
  const activeApiKey = useMemo(
    () => apiKeys.find((key) => key.status === "active") || null,
    [apiKeys],
  );
  const apiBaseUrl = (() => {
    const fallback =
      import.meta.env.MODE === "production"
        ? "https://backend-production-fc6a.up.railway.app"
        : "http://localhost:3000";
    let resolved = import.meta.env.VITE_API_BASE_URL || fallback;
    if (
      import.meta.env.MODE === "production" &&
      resolved.includes("localhost")
    ) {
      resolved = "https://backend-production-fc6a.up.railway.app";
    }
    return resolved;
  })();
  const storageProviders = [
    { value: "cloudinary", label: "Cloudinary" },
    { value: "s3", label: "Amazon S3" },
    { value: "minio", label: "MinIO" },
    { value: "azure", label: "Azure Blob" },
    { value: "google", label: "Google Cloud Storage" },
    { value: "ibm", label: "IBM Cloud Object Storage" },
  ];

  const assignedServiceUserIds = useMemo(
    () => new Set(serviceUsers.map((item) => item.userId)),
    [serviceUsers],
  );
  const availableServiceUsers = useMemo(
    () => chatUsers.filter((user) => !assignedServiceUserIds.has(user.id)),
    [chatUsers, assignedServiceUserIds],
  );
  const serviceUserRows = useMemo(
    () =>
      serviceUsers.map((assignment) => ({
        ...assignment,
        email: assignment.user.email,
        name: assignment.user.name || "",
      })),
    [serviceUsers],
  );
  const hasTenantApiKey = useMemo(
    () => apiKeys.some((key) => key.status === "active"),
    [apiKeys],
  );
  const serviceProviderId = useMemo(
    () =>
      serviceConfigDraft.providerId ||
      serviceRuntimeForm.providerId ||
      service?.providerId ||
      "",
    [
      serviceConfigDraft.providerId,
      serviceRuntimeForm.providerId,
      service?.providerId,
    ],
  );
  const serviceModel = useMemo(
    () =>
      pricing.find((entry) => entry.id === serviceConfigDraft.pricingId)
        ?.model ||
      serviceRuntimeForm.model ||
      "",
    [pricing, serviceConfigDraft.pricingId, serviceRuntimeForm.model],
  );
  const canSaveServiceConfig = useMemo(
    () =>
      Boolean(
        serviceConfigDraft.providerId.trim() &&
        serviceConfigDraft.pricingId.trim() &&
        serviceConfigDraft.policyId.trim(),
      ),
    [
      serviceConfigDraft.providerId,
      serviceConfigDraft.pricingId,
      serviceConfigDraft.policyId,
    ],
  );

  const catalogHandoffEnabled = service?.catalogHumanHandoffEnabled !== false;
  const catalogStorageEnabled = service?.catalogFileStorageEnabled !== false;
  const catalogDocumentEnabled =
    service?.catalogDocumentProcessingEnabled !== false;
  const catalogOcrEnabled = service?.catalogOcrEnabled !== false;
  const catalogSemanticEnabled =
    service?.catalogSemanticSearchEnabled !== false;
  const effectiveHandoffEnabled =
    catalogHandoffEnabled && serviceConfigDraft.humanHandoffEnabled;
  const effectiveStorageEnabled =
    catalogStorageEnabled && serviceConfigDraft.fileStorageEnabled;
  const effectiveDocumentEnabled =
    catalogDocumentEnabled &&
    effectiveStorageEnabled &&
    serviceConfigDraft.documentProcessingEnabled;
  const effectiveOcrEnabled =
    effectiveDocumentEnabled &&
    catalogOcrEnabled &&
    serviceConfigDraft.ocrEnabled;
  const effectiveSemanticEnabled =
    effectiveDocumentEnabled &&
    catalogSemanticEnabled &&
    serviceConfigDraft.semanticSearchEnabled;

  useEffect(() => {
    if (!serviceCode) {
      return;
    }
    if (role !== "tenant" || !authTenantId || !tenantId) {
      return;
    }
    if (tenantId !== authTenantId) {
      navigate(`/clients/${authTenantId}/services/${serviceCode}`, {
        replace: true,
      });
    }
  }, [role, authTenantId, tenantId, serviceCode, navigate]);

  useEffect(() => {
    if (!tenantId) {
      setStoredApiKey(null);
      return;
    }
    setStoredApiKey(getTenantApiKey(tenantId));
  }, [tenantId, apiKeys]);

  const refreshServiceSummary = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const list = (await api.getTenantServices(
      tenantId,
    )) as TenantServiceOverview[];
    const match = list.find((item) => item.serviceCode === serviceCode) || null;
    setService(match);
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.getTenantServices(tenantId),
          api.getProviders(tenantId),
          api.getPricing(),
          api.listChatUsers(tenantId),
          api.listChatConversations(tenantId),
          api.listApiKeys(),
          canManagePolicies ? api.listPolicies() : api.getPolicy(tenantId),
          api.getTenantServiceJira(tenantId, serviceCode),
          api.getTenantServiceStorage(tenantId, serviceCode),
        ]);

        const [
          servicesList,
          providerList,
          pricingList,
          chatUsersList,
          chatConversationsList,
          apiKeyList,
          policyData,
          jiraData,
          storageData,
        ] = results.map((result) =>
          result.status === "fulfilled" ? result.value : null,
        );

        const services = (servicesList as TenantServiceOverview[]) || [];
        const match =
          services.find((item) => item.serviceCode === serviceCode) || null;
        if (!match) {
          throw new Error(t("Servicio no encontrado"));
        }

        if (!active) {
          return;
        }

        setService(match);
        setProviders((providerList as Provider[]) || []);
        setPricing((pricingList as PricingEntry[]) || []);
        setChatUsers((chatUsersList as ChatUserSummary[]) || []);
        if (chatConversationsList) {
          const filtered = (chatConversationsList as ChatConversation[]).filter(
            (item) => item.serviceCode === serviceCode,
          );
          setChatConversations(filtered);
        } else {
          setChatConversations([]);
        }
        setChatMessages([]);
        setActiveConversationId(null);
        if (apiKeyList) {
          setApiKeys(
            (apiKeyList as ApiKeySummary[]).filter(
              (item) => item.tenantId === tenantId,
            ),
          );
        }
        if (policyData) {
          if (Array.isArray(policyData)) {
            const list = (policyData as Policy[]).filter(
              (item) => item.tenantId === tenantId,
            );
            setPolicyCatalog(list);
          } else {
            setPolicyCatalog([policyData as Policy]);
          }
        }

        setServiceConfigDraft({
          status: match.configStatus || "active",
          apiBaseUrl: match.apiBaseUrl || "",
          systemPrompt: match.systemPrompt || "",
          providerId: match.providerId || "",
          pricingId: match.pricingId || "",
          policyId: match.policyId || "",
          humanHandoffEnabled:
            match.catalogHumanHandoffEnabled === false
              ? false
              : (match.tenantHumanHandoffEnabled ??
                match.humanHandoffEnabled ??
                true),
          fileStorageEnabled:
            match.catalogFileStorageEnabled === false
              ? false
              : (match.tenantFileStorageEnabled ??
                match.fileStorageEnabled ??
                true),
          documentProcessingEnabled:
            match.catalogDocumentProcessingEnabled === false
              ? false
              : (match.tenantDocumentProcessingEnabled ??
                match.documentProcessingEnabled ??
                false),
          ocrEnabled:
            match.catalogOcrEnabled === false
              ? false
              : (match.tenantOcrEnabled ?? match.ocrEnabled ?? false),
          semanticSearchEnabled:
            match.catalogSemanticSearchEnabled === false
              ? false
              : (match.tenantSemanticSearchEnabled ??
                match.semanticSearchEnabled ??
                false),
          internalDocsEnabled:
            match.tenantInternalDocsEnabled ??
            match.internalDocsEnabled ??
            true,
          internalPoliciesEnabled:
            match.tenantInternalPoliciesEnabled ??
            match.internalPoliciesEnabled ??
            true,
          internalTemplatesEnabled:
            match.tenantInternalTemplatesEnabled ??
            match.internalTemplatesEnabled ??
            true,
          documentDomain: match.documentDomain || "",
          documentOutputType: match.documentOutputType || "markdown",
        });
        if (jiraData) {
          applyJiraResponse(jiraData as TenantServiceJiraSettings);
        } else {
          applyJiraResponse(null);
        }
        if (storageData) {
          const resolved = storageData as TenantServiceStorage;
          setStorageConfig(resolved);
          setStorageDraft({
            provider: resolved.provider || "cloudinary",
            enabled: resolved.enabled ?? true,
            configText: resolved.config
              ? JSON.stringify(resolved.config, null, 2)
              : "",
            usingDefault: Boolean(resolved.usingDefault),
          });
        } else {
          setStorageConfig(null);
          setStorageDraft({
            provider: "cloudinary",
            enabled: true,
            configText: "",
            usingDefault: true,
          });
        }
        const fallbackProviderId =
          match.providerId ||
          (providerList as Provider[])?.find((item) => item.enabled)?.id ||
          (providerList as Provider[])?.[0]?.id ||
          "";
        setServiceRuntimeForm({
          providerId: fallbackProviderId,
          model: "",
          payload: '{"messages":[{"role":"user","content":"Hola"}]}',
        });
        setServiceRuntimeResult(null);
        setServiceRuntimeError(null);
        setServiceEndpointDraft({
          id: "",
          slug: "",
          method: "POST",
          path: "",
          baseUrl: "",
          headers: "",
          responsePath: "",
          enabled: true,
        });
        setServiceEndpointMode("create");
        setServiceAssignUserId("");

        const [endpoints, users] = await Promise.all([
          match.endpointsEnabled !== false
            ? api.listTenantServiceEndpoints(tenantId, serviceCode)
            : Promise.resolve([]),
          api.listTenantServiceUsers(tenantId, serviceCode),
        ]);
        if (!active) {
          return;
        }
        setServiceEndpoints(endpoints as TenantServiceEndpoint[]);
        setServiceUsers(users as TenantServiceUser[]);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || t("Error cargando servicio"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tenantId, serviceCode, canManagePolicies]);

  useEffect(() => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!service?.emailAutomationEnabled) {
      setEmailAccounts([]);
      setEmailMessages([]);
      return;
    }
    refreshEmailAutomation();
  }, [tenantId, serviceCode, service?.emailAutomationEnabled]);

  const handleSaveServiceConfig = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageServices) {
      return;
    }
    if (!serviceConfigDraft.providerId.trim()) {
      emitToast(t("Selecciona un provider."), "error");
      return;
    }
    if (!serviceConfigDraft.pricingId.trim()) {
      emitToast(t("Selecciona un pricing."), "error");
      return;
    }
    if (!serviceConfigDraft.policyId.trim()) {
      emitToast(t("Selecciona una política."), "error");
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceConfig(tenantId, serviceCode, {
        status: serviceConfigDraft.status,
        apiBaseUrl: serviceConfigDraft.apiBaseUrl,
        systemPrompt: serviceConfigDraft.systemPrompt,
        providerId: serviceConfigDraft.providerId,
        pricingId: serviceConfigDraft.pricingId,
        policyId: serviceConfigDraft.policyId,
        humanHandoffEnabled: serviceConfigDraft.humanHandoffEnabled,
        fileStorageEnabled: serviceConfigDraft.fileStorageEnabled,
        documentProcessingEnabled: serviceConfigDraft.documentProcessingEnabled,
        ocrEnabled: serviceConfigDraft.ocrEnabled,
        semanticSearchEnabled: serviceConfigDraft.semanticSearchEnabled,
        internalDocsEnabled: serviceConfigDraft.internalDocsEnabled,
        internalPoliciesEnabled: serviceConfigDraft.internalPoliciesEnabled,
        internalTemplatesEnabled: serviceConfigDraft.internalTemplatesEnabled,
        documentDomain: serviceConfigDraft.documentDomain,
        documentOutputType: serviceConfigDraft.documentOutputType,
      });
      await refreshServiceSummary();
      emitToast(t("Configuración del servicio guardada."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar el servicio"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const applyStorageResponse = (data: TenantServiceStorage | null) => {
    if (!data) {
      setStorageConfig(null);
      setStorageDraft({
        provider: "cloudinary",
        enabled: true,
        configText: "",
        usingDefault: true,
      });
      return;
    }
    setStorageConfig(data);
    setStorageDraft({
      provider: data.provider || "cloudinary",
      enabled: data.enabled ?? true,
      configText: data.config ? JSON.stringify(data.config, null, 2) : "",
      usingDefault: Boolean(data.usingDefault),
    });
  };

  const applyJiraResponse = (data: TenantServiceJiraSettings | null) => {
    if (!data) {
      setJiraConfig(null);
      setJiraDraft({
        jiraEnabled: false,
        jiraProjectKey: "",
        jiraDefaultIssueType: "Task",
        jiraAllowUserPriorityOverride: true,
        jiraAutoLabelWithServiceName: true,
        jiraBaseUrl: "",
        jiraEmail: "",
        jiraApiToken: "",
        jiraCredentialsEnabled: false,
        jiraHasToken: false,
      });
      return;
    }
    setJiraConfig(data);
    setJiraDraft({
      jiraEnabled: data.jiraEnabled ?? false,
      jiraProjectKey: data.jiraProjectKey || "",
      jiraDefaultIssueType: data.jiraDefaultIssueType || "Task",
      jiraAllowUserPriorityOverride: data.jiraAllowUserPriorityOverride ?? true,
      jiraAutoLabelWithServiceName: data.jiraAutoLabelWithServiceName ?? true,
      jiraBaseUrl: data.jiraBaseUrl || "",
      jiraEmail: data.jiraEmail || "",
      jiraApiToken: "",
      jiraCredentialsEnabled: data.jiraCredentialsEnabled ?? false,
      jiraHasToken: data.jiraHasToken ?? false,
    });
  };

  const resetEmailDraft = () => {
    setEmailAccountMode("create");
    setEmailAccountDraft({
      id: "",
      label: "",
      email: "",
      host: "",
      port: "",
      username: "",
      password: "",
      folder: "INBOX",
      useSsl: true,
      useStartTls: false,
      enabled: true,
    });
  };

  const refreshEmailAutomation = async () => {
    if (!tenantId || !serviceCode || !service?.emailAutomationEnabled) {
      setEmailAccounts([]);
      setEmailMessages([]);
      return;
    }
    setEmailBusy(true);
    setEmailError(null);
    try {
      const [accounts, messages] = await Promise.all([
        api.listTenantServiceEmailAccounts(tenantId, serviceCode),
        api.listTenantServiceEmailMessages(tenantId, serviceCode, 50),
      ]);
      setEmailAccounts(accounts as TenantServiceEmailAccount[]);
      setEmailMessages(messages as TenantServiceEmailMessage[]);
    } catch (err: any) {
      setEmailError(err.message || t("No se pudo cargar la bandeja."));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSaveEmailAccount = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageEmailAutomation) {
      return;
    }
    if (!emailAccountDraft.email.trim()) {
      emitToast(t("El email es obligatorio."), "error");
      return;
    }
    if (!emailAccountDraft.host.trim()) {
      emitToast(t("El host IMAP es obligatorio."), "error");
      return;
    }
    if (!emailAccountDraft.username.trim()) {
      emitToast(t("El usuario es obligatorio."), "error");
      return;
    }
    if (emailAccountMode === "create" && !emailAccountDraft.password.trim()) {
      emitToast(t("La contraseña es obligatoria."), "error");
      return;
    }
    setEmailBusy(true);
    try {
      const portValue = emailAccountDraft.port.trim();
      const parsedPort = portValue ? Number(portValue) : null;
      const resolvedPort =
        parsedPort != null && Number.isFinite(parsedPort) ? parsedPort : null;
      const payload: any = {
        label: emailAccountDraft.label.trim() || null,
        email: emailAccountDraft.email.trim(),
        host: emailAccountDraft.host.trim(),
        port: resolvedPort,
        username: emailAccountDraft.username.trim(),
        folder: emailAccountDraft.folder.trim() || null,
        useSsl: emailAccountDraft.useSsl,
        useStartTls: emailAccountDraft.useStartTls,
        enabled: emailAccountDraft.enabled,
      };
      if (emailAccountDraft.password.trim()) {
        payload.password = emailAccountDraft.password.trim();
      }
      if (emailAccountMode === "create") {
        await api.createTenantServiceEmailAccount(
          tenantId,
          serviceCode,
          payload,
        );
        emitToast(t("Cuenta de correo añadida."));
      } else {
        await api.updateTenantServiceEmailAccount(
          tenantId,
          serviceCode,
          emailAccountDraft.id,
          payload,
        );
        emitToast(t("Cuenta de correo actualizada."));
      }
      resetEmailDraft();
      await refreshEmailAutomation();
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar la cuenta."), "error");
    } finally {
      setEmailBusy(false);
    }
  };

  const handleEditEmailAccount = (account: TenantServiceEmailAccount) => {
    setEmailAccountMode("edit");
    setEmailAccountDraft({
      id: account.id,
      label: account.label || "",
      email: account.email || "",
      host: account.host || "",
      port: account.port != null ? String(account.port) : "",
      username: account.username || "",
      password: "",
      folder: account.folder || "INBOX",
      useSsl: account.useSsl,
      useStartTls: account.useStartTls,
      enabled: account.enabled,
    });
  };

  const handleDeleteEmailAccount = async (
    account: TenantServiceEmailAccount,
  ) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const result = await Swal.fire({
      title: t("Eliminar cuenta"),
      text: t("¿Eliminar la cuenta {email}?", { email: account.email }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    setEmailBusy(true);
    try {
      await api.deleteTenantServiceEmailAccount(
        tenantId,
        serviceCode,
        account.id,
      );
      emitToast(t("Cuenta eliminada"));
      await refreshEmailAutomation();
    } catch (err: any) {
      emitToast(err.message || t("No se pudo eliminar la cuenta."), "error");
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSyncEmail = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageEmailAutomation) {
      return;
    }
    setEmailSyncBusy(true);
    try {
      await api.syncTenantServiceEmail(tenantId, serviceCode);
      emitToast(t("Sincronización en cola."));
      await refreshEmailAutomation();
    } catch (err: any) {
      emitToast(err.message || t("No se pudo sincronizar."), "error");
    } finally {
      setEmailSyncBusy(false);
    }
  };

  const emailAccountColumns = useMemo(
    () => [
      {
        key: "email",
        label: t("Email"),
        sortable: true,
      },
      {
        key: "host",
        label: t("Servidor IMAP"),
      },
      {
        key: "folder",
        label: t("Carpeta"),
        render: (row: TenantServiceEmailAccount) => row.folder || "INBOX",
      },
      {
        key: "enabled",
        label: t("Estado"),
        render: (row: TenantServiceEmailAccount) =>
          row.enabled ? t("Activo") : t("Inactivo"),
      },
      {
        key: "lastSyncAt",
        label: t("Última sincronización"),
        render: (row: TenantServiceEmailAccount) =>
          row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        label: t("Acciones"),
        render: (row: TenantServiceEmailAccount) =>
          canManageEmailAutomation ? (
            <div className="row-actions">
              <button
                type="button"
                className="link"
                onClick={() => handleEditEmailAccount(row)}
              >
                {t("Editar")}
              </button>
              <button
                type="button"
                className="link3"
                onClick={() => handleDeleteEmailAccount(row)}
                disabled={emailBusy}
              >
                {t("Eliminar")}
              </button>
            </div>
          ) : (
            "—"
          ),
      },
    ],
    [t, canManageEmailAutomation, emailBusy],
  );

  const emailMessageColumns = useMemo(
    () => [
      {
        key: "subject",
        label: t("Asunto"),
        sortable: true,
        render: (row: TenantServiceEmailMessage) => row.subject || "—",
      },
      {
        key: "fromEmail",
        label: t("Remitente"),
        render: (row: TenantServiceEmailMessage) =>
          row.fromEmail || row.fromName || "—",
      },
      {
        key: "intent",
        label: t("Intención"),
        render: (row: TenantServiceEmailMessage) => row.intent || "—",
      },
      {
        key: "priority",
        label: t("Prioridad"),
        render: (row: TenantServiceEmailMessage) => row.priority || "—",
      },
      {
        key: "actionStatus",
        label: t("Acción"),
        render: (row: TenantServiceEmailMessage) =>
          row.actionStatus || row.actionType || "—",
      },
      {
        key: "jiraIssueKey",
        label: t("Jira"),
        render: (row: TenantServiceEmailMessage) =>
          row.jiraIssueUrl ? (
            <a href={row.jiraIssueUrl} target="_blank" rel="noreferrer">
              {row.jiraIssueKey || t("Ver")}
            </a>
          ) : (
            row.jiraIssueKey || "—"
          ),
      },
      {
        key: "receivedAt",
        label: t("Recibido"),
        render: (row: TenantServiceEmailMessage) =>
          row.receivedAt ? new Date(row.receivedAt).toLocaleString() : "—",
      },
    ],
    [t],
  );

  const handleResetStorage = async () => {
    if (!tenantId || !serviceCode || !canManageServices) {
      return;
    }
    setStorageBusy(true);
    try {
      await api.deleteTenantServiceStorage(tenantId, serviceCode);
      applyStorageResponse({
        provider: "cloudinary",
        enabled: true,
        usingDefault: true,
        config: null,
      });
      emitToast(t("Almacenamiento restablecido"));
    } catch (err: any) {
      setError(err.message || t("Error restableciendo almacenamiento"));
    } finally {
      setStorageBusy(false);
    }
  };

  const handleSaveJira = async () => {
    if (!tenantId || !serviceCode || !canManageServices) {
      return;
    }
    if (jiraDraft.jiraEnabled && !jiraDraft.jiraProjectKey.trim()) {
      emitToast(t("El project key de Jira es obligatorio."), "error");
      return;
    }
    if (jiraDraft.jiraCredentialsEnabled) {
      if (!jiraDraft.jiraBaseUrl.trim()) {
        emitToast(t("La base URL de Jira es obligatoria."), "error");
        return;
      }
      if (!jiraDraft.jiraEmail.trim()) {
        emitToast(t("El email técnico de Jira es obligatorio."), "error");
        return;
      }
      if (!jiraDraft.jiraHasToken && !jiraDraft.jiraApiToken.trim()) {
        emitToast(t("El token de Jira es obligatorio."), "error");
        return;
      }
    }
    setJiraBusy(true);
    try {
      const payload: Record<string, any> = {
        jiraEnabled: jiraDraft.jiraEnabled,
        jiraProjectKey: jiraDraft.jiraProjectKey.trim() || null,
        jiraDefaultIssueType: jiraDraft.jiraDefaultIssueType.trim() || null,
        jiraAllowUserPriorityOverride: jiraDraft.jiraAllowUserPriorityOverride,
        jiraAutoLabelWithServiceName: jiraDraft.jiraAutoLabelWithServiceName,
        jiraBaseUrl: jiraDraft.jiraBaseUrl.trim() || null,
        jiraEmail: jiraDraft.jiraEmail.trim() || null,
        jiraCredentialsEnabled: jiraDraft.jiraCredentialsEnabled,
      };
      if (jiraDraft.jiraApiToken.trim()) {
        payload.jiraApiToken = jiraDraft.jiraApiToken.trim();
      }
      const updated = (await api.updateTenantServiceJira(
        tenantId,
        serviceCode,
        payload,
      )) as TenantServiceJiraSettings;
      applyJiraResponse(updated);
      await refreshServiceSummary();
      emitToast(t("Configuración Jira guardada."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar Jira"), "error");
    } finally {
      setJiraBusy(false);
    }
  };

  const handleSaveStorage = async () => {
    if (!tenantId || !serviceCode || !canManageServices) {
      return;
    }
    setStorageBusy(true);
    try {
      const trimmed = storageDraft.configText.trim();
      if (!trimmed) {
        await api.deleteTenantServiceStorage(tenantId, serviceCode);
        applyStorageResponse({
          provider: "cloudinary",
          enabled: true,
          usingDefault: true,
          config: null,
        });
        emitToast(t("Almacenamiento restablecido"));
        return;
      }
      let config = null;
      try {
        config = JSON.parse(trimmed);
      } catch (error) {
        throw new Error(
          t("JSON inválido en la configuración de almacenamiento."),
        );
      }
      const payload = {
        provider: storageDraft.provider,
        enabled: storageDraft.enabled,
        config,
      };
      const updated = (await api.updateTenantServiceStorage(
        tenantId,
        serviceCode,
        payload,
      )) as TenantServiceStorage;
      applyStorageResponse(updated);
      emitToast(t("Almacenamiento actualizado"));
    } catch (err: any) {
      setError(err.message || t("Error guardando almacenamiento"));
    } finally {
      setStorageBusy(false);
    }
  };

  const handleServiceRuntimeTest = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageServices) {
      return;
    }
    if (!hasTenantApiKey) {
      setServiceRuntimeError(
        t("Necesitas una API key activa para ejecutar runtime."),
      );
      return;
    }
    const providerId =
      serviceConfigDraft.providerId || serviceRuntimeForm.providerId;
    if (!providerId.trim()) {
      setServiceRuntimeError(t("Provider es obligatorio."));
      return;
    }
    if (!serviceRuntimeForm.model.trim()) {
      setServiceRuntimeError(t("Modelo es obligatorio."));
      return;
    }
    let payload: Record<string, any> = {};
    try {
      payload = serviceRuntimeForm.payload
        ? JSON.parse(serviceRuntimeForm.payload)
        : {};
    } catch {
      setServiceRuntimeError(t("Payload debe ser JSON válido."));
      return;
    }
    try {
      setServiceRuntimeBusy(true);
      setServiceRuntimeError(null);
      const result = await api.executeRuntime(tenantId, {
        providerId: providerId.trim(),
        model: serviceRuntimeForm.model.trim(),
        payload,
        serviceCode,
      });
      setServiceRuntimeResult(result);
      emitToast(t("Runtime ejecutado"));
    } catch (err: any) {
      setServiceRuntimeError(err.message || t("Error ejecutando runtime"));
    } finally {
      setServiceRuntimeBusy(false);
    }
  };

  const parseHeaders = (value: string) => {
    if (!value.trim()) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (err) {
      emitToast(t("Headers debe ser un JSON válido."), "error");
      return undefined;
    }
  };

  const handleSaveEndpoint = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageServices) {
      return;
    }
    const headers = parseHeaders(serviceEndpointDraft.headers);
    if (headers === undefined) {
      return;
    }
    setServiceBusy(true);
    try {
      if (serviceEndpointMode === "edit") {
        await api.updateTenantServiceEndpoint(
          tenantId,
          serviceCode,
          serviceEndpointDraft.id,
          {
            slug: serviceEndpointDraft.slug,
            method: serviceEndpointDraft.method,
            path: serviceEndpointDraft.path,
            baseUrl: serviceEndpointDraft.baseUrl || null,
            headers,
            responsePath: serviceEndpointDraft.responsePath || null,
            enabled: serviceEndpointDraft.enabled,
          },
        );
      } else {
        await api.createTenantServiceEndpoint(tenantId, serviceCode, {
          slug: serviceEndpointDraft.slug,
          method: serviceEndpointDraft.method,
          path: serviceEndpointDraft.path,
          baseUrl: serviceEndpointDraft.baseUrl || null,
          headers,
          responsePath: serviceEndpointDraft.responsePath || null,
          enabled: serviceEndpointDraft.enabled,
        });
      }
      const endpoints = await api.listTenantServiceEndpoints(
        tenantId,
        serviceCode,
      );
      setServiceEndpoints(endpoints as TenantServiceEndpoint[]);
      setServiceEndpointDraft({
        id: "",
        slug: "",
        method: "POST",
        path: "",
        baseUrl: "",
        headers: "",
        responsePath: "",
        enabled: true,
      });
      setServiceEndpointMode("create");
      emitToast(t("Endpoint guardado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar el endpoint"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleEditEndpoint = (endpoint: TenantServiceEndpoint) => {
    if (!canManageServices) {
      return;
    }
    setServiceEndpointDraft({
      id: endpoint.id,
      slug: endpoint.slug,
      method: endpoint.method,
      path: endpoint.path,
      baseUrl: endpoint.baseUrl || "",
      headers: endpoint.headers
        ? JSON.stringify(endpoint.headers, null, 2)
        : "",
      responsePath: endpoint.responsePath || "",
      enabled: endpoint.enabled,
    });
    setServiceEndpointMode("edit");
  };

  const handleDeleteEndpoint = async (endpoint: TenantServiceEndpoint) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!canManageServices) {
      return;
    }
    const result = await Swal.fire({
      title: t("¿Eliminar endpoint?"),
      text: endpoint.slug,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.deleteTenantServiceEndpoint(tenantId, serviceCode, endpoint.id);
      setServiceEndpoints((prev) =>
        prev.filter((item) => item.id !== endpoint.id),
      );
      emitToast(t("Endpoint eliminado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo eliminar el endpoint"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleAssignServiceUser = async () => {
    if (!tenantId || !serviceCode || !serviceAssignUserId) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.assignTenantServiceUser(tenantId, serviceCode, {
        userId: serviceAssignUserId,
      });
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      setServiceAssignUserId("");
      await refreshServiceSummary();
      emitToast(t("Usuario asignado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo asignar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const resolvedServiceApiKey = service?.serviceApiKey || storedApiKey || null;

  const handleCopyApiKey = async () => {
    if (!resolvedServiceApiKey) {
      emitToast(t("API key no disponible."), "error");
      return;
    }
    await copyToClipboard(resolvedServiceApiKey, "API key");
  };

  const handleCopyServiceId = async () => {
    if (!service?.tenantServiceId) {
      emitToast(t("Service ID no disponible."), "error");
      return;
    }
    await copyToClipboard(service.tenantServiceId, "Service ID");
  };

  const handleCopyServiceCode = async () => {
    if (!serviceCode) {
      emitToast(t("Service code no disponible."), "error");
      return;
    }
    await copyToClipboard(serviceCode, "Service code");
  };

  const handleCreateServiceChatUser = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!newChatUser.email.trim() || !newChatUser.password.trim()) {
      emitToast(t("Email y password son obligatorios."), "error");
      return;
    }
    const result = await Swal.fire({
      title: t("Crear usuario"),
      text: t("¿Crear y asignar este usuario al servicio?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Confirmar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setChatUserBusy(true);
      const created = await api.createChatUser(tenantId, {
        email: newChatUser.email.trim(),
        name: newChatUser.name.trim() || undefined,
        password: newChatUser.password,
      });
      setChatUsers((prev) => [created as ChatUserSummary, ...prev]);
      await api.assignTenantServiceUser(tenantId, serviceCode, {
        userId: (created as ChatUserSummary).id,
      });
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      setServiceAssignUserId("");
      setChatUserModalOpen(false);
      setNewChatUser({ name: "", email: "", password: "" });
      emitToast(t("Usuario creado y asignado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo crear el usuario"), "error");
    } finally {
      setChatUserBusy(false);
    }
  };

  const handleUpdateServiceUserStatus = async (
    assignment: TenantServiceUser,
    status: "active" | "suspended",
  ) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceUser(
        tenantId,
        serviceCode,
        assignment.userId,
        {
          status,
        },
      );
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      emitToast(t("Usuario actualizado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo actualizar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleRemoveServiceUser = async (assignment: TenantServiceUser) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const result = await Swal.fire({
      title: t("¿Quitar acceso al servicio?"),
      text: assignment.user.email,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Quitar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.removeTenantServiceUser(
        tenantId,
        serviceCode,
        assignment.userId,
      );
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      await refreshServiceSummary();
      emitToast(t("Usuario removido."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo quitar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!tenantId) {
      return;
    }
    if (!canManageConversations) {
      emitToast(t("No tienes permisos para ver mensajes."), "error");
      return;
    }
    try {
      setChatBusy(true);
      const messages = await api.listChatMessages(tenantId, conversationId);
      setChatMessages(messages as ChatMessage[]);
      setActiveConversationId(conversationId);
    } catch (err: any) {
      setError(err.message || t("Error cargando conversación"));
    } finally {
      setChatBusy(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!tenantId) {
      return;
    }
    if (!canManageConversations) {
      return;
    }
    const result = await Swal.fire({
      title: t("Eliminar conversación"),
      text: t("¿Eliminar esta conversación?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setChatBusy(true);
      await api.deleteChatConversation(tenantId, conversationId);
      setChatConversations((prev) =>
        prev.filter((item) => item.id !== conversationId),
      );
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setChatMessages([]);
      }
      emitToast(t("Conversación eliminada"));
    } catch (err: any) {
      setError(err.message || t("Error eliminando conversación"));
    } finally {
      setChatBusy(false);
    }
  };

  if (!tenantId || !serviceCode) {
    return (
      <PageWithDocs slug="tenant-services">
        <div className="muted">
          {t("Selecciona un servicio para gestionarlo.")}
        </div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="tenant-services">
      {error && <div className="error-banner">{error}</div>}
      <div className="card full-width services-detail">
        <div className="row">
          <div className="col-md-2">
            <Link className="btn" to={`/clients/${tenantId}`}>
              {t("Volver al tenant")}
            </Link>
          </div>

          {sectionLinks.length > 0 && (
            <div className="col-md-10">
              <div
                className="row-actions mb-5"
                style={{ flexWrap: "wrap", gap: 22 }}
                role="navigation"
                aria-label={t("Secciones")}
              >
                {sectionLinks.map((link) => (
                  <a key={link.id} className="link" href={`#${link.id}`}>
                    {link.label}
                  </a>
                ))}
                {isOperationalSupportService && (
                  <Link
                    className="link"
                    to={`/clients/${tenantId}/operational-support`}
                  >
                    {t("Abrir panel de soporte operativo")}
                  </Link>
                )}
                {isFinancialService && (
                  <Link
                    className="link"
                    to={`/clients/${tenantId}/financial-simulations`}
                  >
                    {t("Abrir simulador financiero")}
                  </Link>
                )}
                {isPreEvaluationService && (
                  <Link
                    className="link"
                    to={`/clients/${tenantId}/pre-evaluations`}
                  >
                    {t("Abrir pre-evaluaciones")}
                  </Link>
                )}
                {isSelfAssessmentService && (
                  <Link
                    className="link"
                    to={`/clients/${tenantId}/self-assessments`}
                  >
                    {t("Abrir autoevaluaciones")}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card-header">
          <div>
            <h2>{service?.name || serviceCode}</h2>
            <p className="muted">{service?.description}</p>
          </div>
        </div>
        {loading && <LoaderComponent label={t("Cargando servicio")} />}
        {!loading && service && (
          <>
            {service.subscriptionStatus === "pending" && (
              <div className="info-banner">
                {t(
                  "Esta suscripción está pendiente de activación. El servicio no estará operativo",
                )}{" "}
                {service.activateAt
                  ? t("hasta {date}.", {
                      date: new Date(service.activateAt).toLocaleString(),
                    })
                  : t("hasta que se active.")}
              </div>
            )}
            {canManageServices ? (
              <>
                <div className="row g-3 form-grid-13">
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Estado operativo")}
                      <select
                        className="form-select"
                        value={serviceConfigDraft.status}
                        onChange={(event) =>
                          setServiceConfigDraft((prev) => ({
                            ...prev,
                            status: event.target.value as
                              | "active"
                              | "suspended",
                          }))
                        }
                      >
                        <option value="active">{t("Activo")}</option>
                        <option value="suspended">{t("Suspendido")}</option>
                      </select>
                    </label>
                  </div>
                  {endpointsEnabled && (
                    <div className="col-12 col-md-8">
                      <label>
                        {t("URL base de la API")}
                        <input
                          className="form-control"
                          value={serviceConfigDraft.apiBaseUrl}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              apiBaseUrl: event.target.value,
                            }))
                          }
                          placeholder={t("https://api.cliente.com")}
                        />
                      </label>
                    </div>
                  )}
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Provider")}
                      <select
                        className="form-select"
                        value={serviceConfigDraft.providerId}
                        onChange={(event) =>
                          setServiceConfigDraft((prev) => ({
                            ...prev,
                            providerId: event.target.value,
                          }))
                        }
                      >
                        <option value="" disabled>
                          {t("Selecciona provider")}
                        </option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.displayName} · {provider.type}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Pricing")}
                      <select
                        className="form-select"
                        value={serviceConfigDraft.pricingId}
                        onChange={(event) =>
                          setServiceConfigDraft((prev) => ({
                            ...prev,
                            pricingId: event.target.value,
                          }))
                        }
                      >
                        <option value="" disabled>
                          {t("Selecciona pricing")}
                        </option>
                        {pricing.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.providerType} · {entry.model}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Política")}
                      <select
                        className="form-select"
                        value={serviceConfigDraft.policyId}
                        onChange={(event) =>
                          setServiceConfigDraft((prev) => ({
                            ...prev,
                            policyId: event.target.value,
                          }))
                        }
                      >
                        <option value="" disabled>
                          {t("Selecciona política")}
                        </option>
                        {policyCatalog.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.id.slice(0, 8)} ·{" "}
                            {entry.maxRequestsPerMinute}/min
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {catalogHandoffEnabled && (
                    <div className="col-12 col-md-6">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={serviceConfigDraft.humanHandoffEnabled}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              humanHandoffEnabled: event.target.checked,
                            }))
                          }
                        />
                        {t("Permite atención humana")}
                      </label>
                    </div>
                  )}
                  {catalogStorageEnabled && (
                    <div className="col-12 col-md-6">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={serviceConfigDraft.fileStorageEnabled}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              fileStorageEnabled: event.target.checked,
                            }))
                          }
                        />
                        {t("Permite adjuntos y almacenamiento")}
                      </label>
                    </div>
                  )}
                  {catalogDocumentEnabled && effectiveStorageEnabled && (
                    <div className="col-12 col-md-6">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={serviceConfigDraft.documentProcessingEnabled}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              documentProcessingEnabled: event.target.checked,
                            }))
                          }
                        />
                        {t("Procesamiento documental (OCR + IA)")}
                      </label>
                    </div>
                  )}
                  {catalogOcrEnabled && effectiveDocumentEnabled && (
                    <div className="col-12 col-md-6">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={serviceConfigDraft.ocrEnabled}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              ocrEnabled: event.target.checked,
                            }))
                          }
                        />
                        {t("OCR habilitado")}
                      </label>
                    </div>
                  )}
                  {isOperationalSupportService && (
                    <>
                      <div className="col-12 col-md-6">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={serviceConfigDraft.internalDocsEnabled}
                            onChange={(event) =>
                              setServiceConfigDraft((prev) => ({
                                ...prev,
                                internalDocsEnabled: event.target.checked,
                              }))
                            }
                          />
                          {t("Fuentes internas: documentacion")}
                        </label>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={serviceConfigDraft.internalPoliciesEnabled}
                            onChange={(event) =>
                              setServiceConfigDraft((prev) => ({
                                ...prev,
                                internalPoliciesEnabled: event.target.checked,
                              }))
                            }
                          />
                          {t("Fuentes internas: normativas")}
                        </label>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={
                              serviceConfigDraft.internalTemplatesEnabled
                            }
                            onChange={(event) =>
                              setServiceConfigDraft((prev) => ({
                                ...prev,
                                internalTemplatesEnabled: event.target.checked,
                              }))
                            }
                          />
                          {t("Fuentes internas: plantillas")}
                        </label>
                      </div>
                    </>
                  )}
                  {catalogSemanticEnabled && effectiveDocumentEnabled && (
                    <div className="col-12 col-md-6">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={serviceConfigDraft.semanticSearchEnabled}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              semanticSearchEnabled: event.target.checked,
                            }))
                          }
                        />
                        {t("IA semántica habilitada")}
                      </label>
                    </div>
                  )}
                  {effectiveDocumentEnabled && (
                    <div className="col-12 col-md-6">
                      <label>
                        {t("Dominio documental (opcional)")}
                        <input
                          className="form-control"
                          value={serviceConfigDraft.documentDomain}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              documentDomain: event.target.value,
                            }))
                          }
                          placeholder={t("Ej: banca, sanidad, legal")}
                        />
                      </label>
                    </div>
                  )}
                  {effectiveDocumentEnabled && (
                    <div className="col-12 col-md-6">
                      <label>
                        {t("Salida documental")}
                        <select
                          className="form-select"
                          value={serviceConfigDraft.documentOutputType}
                          onChange={(event) =>
                            setServiceConfigDraft((prev) => ({
                              ...prev,
                              documentOutputType: event.target.value,
                            }))
                          }
                        >
                          <option value="markdown">{t("Markdown")}</option>
                          <option value="file">{t("Archivo")}</option>
                        </select>
                      </label>
                    </div>
                  )}
                  <div className="col-12">
                    <label>
                      <span className="label-with-tooltip">
                        {t(
                          "Prompt de comportamiento (aplica a todo el servicio)",
                        )}
                        <InfoTooltip field="serviceSystemPrompt" />
                      </span>
                      <textarea
                        className="form-control"
                        value={serviceConfigDraft.systemPrompt}
                        onChange={(event) =>
                          setServiceConfigDraft((prev) => ({
                            ...prev,
                            systemPrompt: event.target.value,
                          }))
                        }
                        rows={20}
                        placeholder={t(
                          "Define el estilo del asistente, tono y reglas...",
                        )}
                      />
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSaveServiceConfig}
                    disabled={serviceBusy || !canSaveServiceConfig}
                  >
                    {t("Guardar configuración")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mini-list">
                  <div className="mini-row">
                    <span>{t("Estado operativo")}</span>
                    <span>{serviceConfigDraft.status}</span>
                  </div>
                  {endpointsEnabled && (
                    <div className="mini-row">
                      <span>{t("URL base de la API")}</span>
                      <span>{serviceConfigDraft.apiBaseUrl || "—"}</span>
                    </div>
                  )}
                  <div className="mini-row">
                    <span>{t("Provider")}</span>
                    <span>
                      {providers.find(
                        (provider) =>
                          provider.id === serviceConfigDraft.providerId,
                      )?.displayName || "—"}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Pricing")}</span>
                    <span>
                      {pricing.find(
                        (entry) => entry.id === serviceConfigDraft.pricingId,
                      )
                        ? `${pricing.find((entry) => entry.id === serviceConfigDraft.pricingId)?.providerType} · ${pricing.find((entry) => entry.id === serviceConfigDraft.pricingId)?.model}`
                        : "—"}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Política")}</span>
                    <span>
                      {policyCatalog.find(
                        (entry) => entry.id === serviceConfigDraft.policyId,
                      )
                        ? `${serviceConfigDraft.policyId.slice(0, 8)} · ${policyCatalog.find((entry) => entry.id === serviceConfigDraft.policyId)?.maxRequestsPerMinute}/min`
                        : "—"}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Atención humana")}</span>
                    <span>
                      {effectiveHandoffEnabled ? t("Activo") : t("Inactivo")}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Almacenamiento de archivos")}</span>
                    <span>
                      {effectiveStorageEnabled ? t("Activo") : t("Inactivo")}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Procesamiento documental (OCR + IA)")}</span>
                    <span>
                      {effectiveDocumentEnabled ? t("Activo") : t("Inactivo")}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("OCR habilitado")}</span>
                    <span>
                      {effectiveOcrEnabled ? t("Activo") : t("Inactivo")}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("IA semántica habilitada")}</span>
                    <span>
                      {effectiveSemanticEnabled ? t("Activo") : t("Inactivo")}
                    </span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Dominio documental (opcional)")}</span>
                    <span>{serviceConfigDraft.documentDomain || "—"}</span>
                  </div>
                  <div className="mini-row">
                    <span>{t("Salida documental")}</span>
                    <span>{serviceConfigDraft.documentOutputType || "—"}</span>
                  </div>
                </div>
                <div className="code-block">
                  <pre>
                    {serviceConfigDraft.systemPrompt || t("Sin prompt.")}
                  </pre>
                </div>
              </>
            )}

            <div className="section-divider" />

            {isFinancialService && (
              <>
                <h4 id="section-financial">{t("Simulador financiero")}</h4>
                <p className="muted">
                  {t(
                    "Gestiona las simulaciones financieras asociadas a este servicio.",
                  )}
                </p>
                <div className="form-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      navigate(`/clients/${tenantId}/financial-simulations`)
                    }
                    disabled={!tenantId}
                  >
                    {t("Abrir simulador financiero")}
                  </button>
                </div>
                <div className="section-divider" />
              </>
            )}

            {isPreEvaluationService && (
              <>
                <h4 id="section-pre-eval">{t("Pre-evaluacion")}</h4>
                <p className="muted">
                  {t(
                    "Accede al motor de reglas simulado para esta pre-evaluacion.",
                  )}
                </p>
                <div className="form-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      navigate(`/clients/${tenantId}/pre-evaluations`)
                    }
                    disabled={!tenantId}
                  >
                    {t("Abrir pre-evaluaciones")}
                  </button>
                </div>
                <div className="section-divider" />
              </>
            )}

            {isSelfAssessmentService && (
              <>
                <h4 id="section-self-assessment">{t("Autoevaluacion inteligente")}</h4>
                <p className="muted">
                  {t("Gestiona las autoevaluaciones asociadas a este servicio.")}
                </p>
                <div className="form-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      navigate(`/clients/${tenantId}/self-assessments`)
                    }
                    disabled={!tenantId}
                  >
                    {t("Abrir autoevaluaciones")}
                  </button>
                </div>
                <div className="section-divider" />
              </>
            )}

            {service?.emailAutomationEnabled && (
              <>
                <h4 id="section-email">{t("Automatización de correos y tickets")}</h4>
                <p className="muted">
                  {t(
                    "Configura cuentas de correo para analizar incidencias y generar tickets.",
                  )}
                </p>
                {emailError && <div className="error-banner">{emailError}</div>}
                <div className="row g-3 form-grid-13">
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Etiqueta")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.label}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            label: event.target.value,
                          }))
                        }
                        placeholder={t("Ej: Soporte")}
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Email")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.email}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        placeholder={t("soporte@empresa.com")}
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Host IMAP")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.host}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            host: event.target.value,
                          }))
                        }
                        placeholder="imap.empresa.com"
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Puerto")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.port}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            port: event.target.value,
                          }))
                        }
                        placeholder="993"
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Usuario")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.username}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            username: event.target.value,
                          }))
                        }
                        placeholder={t("usuario")}
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Password")}
                      <input
                        className="form-control"
                        type="password"
                        value={emailAccountDraft.password}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        placeholder={
                          emailAccountMode === "edit"
                            ? t("Dejar vacío para mantener")
                            : t("Password")
                        }
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Carpeta")}
                      <input
                        className="form-control"
                        value={emailAccountDraft.folder}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            folder: event.target.value,
                          }))
                        }
                        placeholder="INBOX"
                        disabled={!canManageEmailAutomation}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={emailAccountDraft.useSsl}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            useSsl: event.target.checked,
                          }))
                        }
                        disabled={!canManageEmailAutomation}
                      />
                      {t("Usar SSL")}
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={emailAccountDraft.useStartTls}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            useStartTls: event.target.checked,
                          }))
                        }
                        disabled={!canManageEmailAutomation}
                      />
                      {t("Usar STARTTLS")}
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={emailAccountDraft.enabled}
                        onChange={(event) =>
                          setEmailAccountDraft((prev) => ({
                            ...prev,
                            enabled: event.target.checked,
                          }))
                        }
                        disabled={!canManageEmailAutomation}
                      />
                      {t("Cuenta activa")}
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSaveEmailAccount}
                    disabled={emailBusy || !canManageEmailAutomation}
                  >
                    {emailAccountMode === "edit"
                      ? t("Actualizar cuenta")
                      : t("Añadir cuenta")}
                  </button>
                  <button
                    className="btn"
                    onClick={resetEmailDraft}
                    disabled={emailBusy || !canManageEmailAutomation}
                  >
                    {t("Limpiar")}
                  </button>
                  <button
                    className="btn"
                    onClick={handleSyncEmail}
                    disabled={emailSyncBusy || !canManageEmailAutomation}
                  >
                    {emailSyncBusy ? t("Sincronizando...") : t("Sincronizar")}
                  </button>
                </div>

                <DataTable
                  columns={emailAccountColumns}
                  data={emailAccounts}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  filterKeys={["email", "label", "host", "username", "folder"]}
                />
                {emailAccounts.length === 0 && (
                  <div className="muted">{t("Sin cuentas configuradas.")}</div>
                )}

                <h4 className="mt-4">{t("Bandeja analizada")}</h4>
                <DataTable
                  columns={emailMessageColumns}
                  data={emailMessages}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  filterKeys={["subject", "fromEmail", "intent", "priority"]}
                />
                {emailMessages.length === 0 && (
                  <div className="muted">{t("Sin mensajes procesados.")}</div>
                )}

                <div className="section-divider" />
              </>
            )}

            {service?.fileStorageEnabled && (
              <>
                <h4 id="section-storage">{t("Almacenamiento de archivos")}</h4>
                <p className="muted">
                  {t(
                    "Configura dónde se guardan los adjuntos y documentos del servicio.",
                  )}
                </p>
                {storageConfig?.usingDefault && (
                  <div className="info-banner">
                    {t("Se está usando la configuración por defecto.")}
                  </div>
                )}
                <div className="row g-3 form-grid-13">
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Proveedor")}
                      <select
                        className="form-select"
                        value={storageDraft.provider}
                        onChange={(event) =>
                          setStorageDraft((prev) => ({
                            ...prev,
                            provider: event.target.value,
                          }))
                        }
                        disabled={!canManageServices}
                      >
                        {storageProviders.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={storageDraft.enabled}
                        onChange={(event) =>
                          setStorageDraft((prev) => ({
                            ...prev,
                            enabled: event.target.checked,
                          }))
                        }
                        disabled={!canManageServices}
                      />
                      {t("Almacenamiento habilitado")}
                    </label>
                  </div>
                  <div className="col-12">
                    <label>
                      {t("Configuración (JSON)")}
                      <textarea
                        className="form-control"
                        rows={4}
                        value={storageDraft.configText}
                        onChange={(event) =>
                          setStorageDraft((prev) => ({
                            ...prev,
                            configText: event.target.value,
                          }))
                        }
                        placeholder='{"bucket":"...","region":"..."}'
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSaveStorage}
                    disabled={storageBusy || !canManageServices}
                  >
                    {storageBusy ? t("Guardando...") : t("Guardar almacenamiento")}
                  </button>
                  <button
                    className="btn"
                    onClick={handleResetStorage}
                    disabled={storageBusy || !canManageServices}
                  >
                    {t("Restablecer")}
                  </button>
                </div>

                <div className="section-divider" />
              </>
            )}

            <h4 id="section-runtime">
              <span className="label-with-tooltip">
                {t("Prueba runtime")}
                <InfoTooltip
                  text={t(
                    "Ejecuta una petición de prueba con el provider y modelo seleccionados para validar credenciales y conexión.",
                  )}
                />
              </span>
            </h4>
            {!hasTenantApiKey && (
              <div className="info-banner">
                {t("Necesitas una API key activa para ejecutar runtime.")}
              </div>
            )}
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-6">
                <label>
                  {t("Provider")}
                  <select
                    className="form-select"
                    value={
                      serviceConfigDraft.providerId ||
                      serviceRuntimeForm.providerId
                    }
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        providerId: event.target.value,
                      }))
                    }
                    disabled={!hasTenantApiKey}
                  >
                    <option value="">{t("Selecciona provider")}</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} · {provider.type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label>
                  {t("Modelo")}
                  <input
                    className="form-control"
                    value={serviceRuntimeForm.model}
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        model: event.target.value,
                      }))
                    }
                    placeholder="gpt-4o-mini"
                    disabled={!hasTenantApiKey}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  {t("Payload JSON")}
                  <textarea
                    className="form-control"
                    value={serviceRuntimeForm.payload}
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        payload: event.target.value,
                      }))
                    }
                    rows={6}
                    placeholder='{"messages":[{"role":"user","content":"Hola"}]}'
                    disabled={!hasTenantApiKey}
                  />
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleServiceRuntimeTest}
                disabled={serviceRuntimeBusy || !hasTenantApiKey}
              >
                {t("Ejecutar runtime")}
              </button>
              {serviceRuntimeBusy && (
                <span className="muted">{t("Ejecutando...")}</span>
              )}
            </div>
            {serviceRuntimeError && (
              <div className="error-banner">{serviceRuntimeError}</div>
            )}
            {serviceRuntimeResult && (
              <div className="code-block">
                <pre>{JSON.stringify(serviceRuntimeResult, null, 2)}</pre>
              </div>
            )}

            <div className="section-divider" />

            <h4 id="section-jira">{t("Integración Jira")}</h4>
            <p className="muted mb-4">
              {t(
                "Configura la integración con Jira para crear tickets automáticamente.",
              )}
            </p>
            {!canManageServices && (
              <div className="info-banner">
                {t("No tienes permisos para editar la integración Jira.")}
              </div>
            )}
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-3">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={jiraDraft.jiraEnabled}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraEnabled: event.target.checked,
                      }))
                    }
                    disabled={!canManageServices}
                  />
                  {t("Jira habilitado")}
                </label>
              </div>
              <div className="col-12 col-md-3">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={jiraDraft.jiraCredentialsEnabled}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraCredentialsEnabled: event.target.checked,
                      }))
                    }
                    disabled={!canManageServices}
                  />
                  {t("Credenciales Jira")}
                </label>
              </div>
              <div className="col-12 col-md-3">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={jiraDraft.jiraAllowUserPriorityOverride}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraAllowUserPriorityOverride: event.target.checked,
                      }))
                    }
                    disabled={!canManageServices}
                  />
                  {t("Permitir prioridad")}
                </label>
              </div>
              <div className="col-12 col-md-3">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={jiraDraft.jiraAutoLabelWithServiceName}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraAutoLabelWithServiceName: event.target.checked,
                      }))
                    }
                    disabled={!canManageServices}
                  />
                  {t("Auto-etiquetar")}
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  {t("Project key")}
                  <input
                    className="form-control"
                    value={jiraDraft.jiraProjectKey}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraProjectKey: event.target.value,
                      }))
                    }
                    placeholder={t("Ej: OPS")}
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  {t("Tipo de incidencia")}
                  <input
                    className="form-control"
                    value={jiraDraft.jiraDefaultIssueType}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraDefaultIssueType: event.target.value,
                      }))
                    }
                    placeholder={t("Ej: Task")}
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  {t("Base URL")}
                  <input
                    className="form-control"
                    value={jiraDraft.jiraBaseUrl}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraBaseUrl: event.target.value,
                      }))
                    }
                    placeholder={t("https://tuempresa.atlassian.net")}
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  {t("Email técnico")}
                  <input
                    className="form-control"
                    value={jiraDraft.jiraEmail}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraEmail: event.target.value,
                      }))
                    }
                    placeholder={t("soporte@empresa.com")}
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  {t("API token")}
                  <input
                    className="form-control"
                    value={jiraDraft.jiraApiToken}
                    onChange={(event) =>
                      setJiraDraft((prev) => ({
                        ...prev,
                        jiraApiToken: event.target.value,
                        jiraHasToken: false,
                      }))
                    }
                    placeholder={jiraDraft.jiraHasToken ? t("Token guardado") : t("Pegue un token")}
                    disabled={!canManageServices}
                  />
                </label>
                {jiraDraft.jiraHasToken && !jiraDraft.jiraApiToken && (
                  <div className="muted">
                    {t("Token ya guardado. Deja vacío para mantenerlo.")}
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSaveJira}
                disabled={jiraBusy || !canManageServices}
              >
                {jiraBusy ? t("Guardando...") : t("Guardar Jira")}
              </button>
            </div>

            <div className="section-divider" />

            {endpointsEnabled ? (
              <>
                <h4 className="mt-4" id="section-endpoints">
                  {t("Endpoints del servicio")}
                </h4>
                <p className="muted mb-4">
                  {t(
                    "Configura los endpoints que el asistente consultará para responder con datos actualizados.",
                  )}
                </p>
                {!canManageServices && (
                  <div className="info-banner">
                    {t("No tienes permisos para editar endpoints.")}
                  </div>
                )}
                <div className="row g-3 form-grid-13">
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Slug")}
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.slug}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            slug: event.target.value,
                          }))
                        }
                        placeholder="send-message"
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Método")}
                      <select
                        className="form-select"
                        value={serviceEndpointDraft.method}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            method: event.target.value,
                          }))
                        }
                        disabled={!canManageServices}
                      >
                        {["GET", "POST", "PUT", "PATCH", "DELETE"].map(
                          (method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      {t("Path")}
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.path}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            path: event.target.value,
                          }))
                        }
                        placeholder="/chat/send"
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-6">
                    <label>
                      {t("Base URL (opcional)")}
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.baseUrl}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            baseUrl: event.target.value,
                          }))
                        }
                        placeholder="https://api.cliente.com"
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-6">
                    <label>
                      {t("Path de extracción (opcional)")}
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.responsePath}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            responsePath: event.target.value,
                          }))
                        }
                        placeholder="items"
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                  <div className="col-12">
                    <label>
                      {t("Headers JSON (opcional)")}
                      <textarea
                        className="form-control"
                        value={serviceEndpointDraft.headers}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            headers: event.target.value,
                          }))
                        }
                        placeholder='{"Authorization": "Bearer ..."}'
                        disabled={!canManageServices}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={serviceEndpointDraft.enabled}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            enabled: event.target.checked,
                          }))
                        }
                        disabled={!canManageServices}
                      />
                      {t("Activo")}
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSaveEndpoint}
                    disabled={
                      !canManageServices ||
                      serviceBusy ||
                      !serviceEndpointDraft.slug.trim() ||
                      !serviceEndpointDraft.path.trim()
                    }
                  >
                    {serviceEndpointMode === "edit"
                      ? t("Actualizar endpoint")
                      : t("Crear endpoint")}
                  </button>
                  {serviceEndpointMode === "edit" && (
                    <button
                      className="btn"
                      onClick={() => {
                        setServiceEndpointMode("create");
                        setServiceEndpointDraft({
                          id: "",
                          slug: "",
                          method: "POST",
                          path: "",
                          baseUrl: "",
                          headers: "",
                          responsePath: "",
                          enabled: true,
                        });
                      }}
                      disabled={!canManageServices}
                    >
                      {t("Cancelar edición")}
                    </button>
                  )}
                </div>

                <DataTable
                  columns={[
                    { key: "slug", label: t("Slug"), sortable: true },
                    { key: "method", label: t("Método"), sortable: true },
                    { key: "path", label: t("Path"), sortable: true },
                    {
                      key: "responsePath",
                      label: t("Extracción"),
                      sortable: true,
                      render: (row: TenantServiceEndpoint) =>
                        row.responsePath || "—",
                    },
                    {
                      key: "enabled",
                      label: t("Estado"),
                      sortable: true,
                      render: (row: TenantServiceEndpoint) => (
                        <StatusBadgeIcon status={row.enabled} />
                      ),
                    },
                    {
                      key: "actions",
                      label: t("Acciones"),
                      render: (row: TenantServiceEndpoint) => (
                        <div className="row-actions">
                          <button
                            className="link"
                            onClick={() => handleEditEndpoint(row)}
                            disabled={!canManageServices}
                          >
                            {t("Editar")}
                          </button>
                          <button
                            className="link danger"
                            onClick={() => handleDeleteEndpoint(row)}
                            disabled={!canManageServices}
                          >
                            {t("Eliminar")}
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={serviceEndpoints}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  filterKeys={["slug", "method", "path", "responsePath"]}
                />
                {serviceEndpoints.length === 0 && (
                  <div className="muted">
                    {t("Sin endpoints configurados.")}
                  </div>
                )}
              </>
            ) : (
              <div className="muted">
                {t("Este servicio no requiere endpoints configurables.")}
              </div>
            )}

            <div className="section-divider" />

            <h4 id="section-third-party">{t("Datos para app de terceros")}</h4>
            <p className="muted">
              {t(
                "Resumen para que el desarrollador configure el chatbot en la app externa.",
              )}
            </p>
            <div className="kv-grid">
              <div className="kv-item">
                <span className="kv-label">{t("URL de la API")}</span>
                <span className="kv-value">
                  {serviceConfigDraft.apiBaseUrl ||
                    service?.apiBaseUrl ||
                    apiBaseUrl}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("API key")}</span>
                <div className="kv-row">
                  <span className="kv-text">
                    {resolvedServiceApiKey
                      ? resolvedServiceApiKey
                      : activeApiKey
                        ? t("API key activa (no visible)")
                        : t("No disponible")}
                  </span>
                  <button className="link" onClick={handleCopyApiKey}>
                    {t("Copiar")}
                  </button>
                </div>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Provider ID")}</span>
                <span className="kv-value">{serviceProviderId || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Model")}</span>
                <span className="kv-value">{serviceModel || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Tenant ID")}</span>
                <span className="kv-value">{tenantId || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Service code")}</span>
                <div className="kv-row">
                  <span className="kv-text">{serviceCode || "—"}</span>
                  <button className="link" onClick={handleCopyServiceCode}>
                    {t("Copiar")}
                  </button>
                </div>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Service ID")}</span>
                <div className="kv-row">
                  <span className="kv-text">
                    {service?.tenantServiceId || "—"}
                  </span>
                  <button className="link" onClick={handleCopyServiceId}>
                    {t("Copiar")}
                  </button>
                </div>
              </div>
              <div className="kv-item">
                <span className="kv-label">{t("Chat endpoint")}</span>
                <span className="kv-value">persisted</span>
              </div>
            </div>
            {service.endpointsEnabled !== false ? (
              serviceEndpoints.length > 0 ? (
                <div>
                  <div className="muted">
                    {t("Endpoints configurados (se listan con su método).")}
                  </div>
                  <div className="endpoint-list">
                    {serviceEndpoints.map((endpoint) => (
                      <div className="endpoint-item" key={endpoint.id}>
                        <span className="endpoint-method">
                          {endpoint.method}
                        </span>
                        <span className="endpoint-path">{endpoint.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="info-banner">
                  {t("Este servicio aún no tiene endpoints configurados.")}
                </div>
              )
            ) : (
              <div className="muted">
                {t("Este servicio no requiere endpoints.")}
              </div>
            )}

            <div className="section-divider" />

            <div>
              <h4 id="section-users">{t("Usuarios asignados")}</h4>
            </div>
            <div className="row">
              <div className="col-12 text-end">
                {canManageChatUsers && (
                  <button
                    className="btn"
                    onClick={() => setChatUserModalOpen(true)}
                  >
                    {t("Crear usuario")}
                  </button>
                )}
              </div>
            </div>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-4">
                <label>
                  {t("Asignar usuario existente")}
                  <select
                    className="form-select"
                    value={serviceAssignUserId}
                    onChange={(event) =>
                      setServiceAssignUserId(event.target.value)
                    }
                    disabled={!canManageChatUsers}
                  >
                    <option value="">{t("Selecciona un usuario")}</option>
                    {availableServiceUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleAssignServiceUser}
                    disabled={
                      serviceBusy || !serviceAssignUserId || !canManageChatUsers
                    }
                  >
                    {t("Asignar")}
                  </button>
                </div>
              </div>
            </div>

            <DataTable
              columns={[
                {
                  key: "name",
                  label: t("Usuario"),
                  sortable: true,
                  render: (row: any) => row.name || row.email,
                },
                { key: "email", label: t("Email"), sortable: true },
                {
                  key: "status",
                  label: t("Estado"),
                  sortable: true,
                  render: (row: any) => <StatusBadgeIcon status={row.status} />,
                },
                {
                  key: "actions",
                  label: t("Acciones"),
                  render: (row: any) => (
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() =>
                          handleUpdateServiceUserStatus(
                            row,
                            row.status === "active" ? "suspended" : "active",
                          )
                        }
                        disabled={!canManageChatUsers}
                      >
                        {row.status === "active"
                          ? t("Suspender")
                          : t("Activar")}
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleRemoveServiceUser(row)}
                        disabled={!canManageChatUsers}
                      >
                        {t("Quitar")}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={serviceUserRows as any[]}
              getRowId={(row: any) => row.userId}
              pageSize={6}
              filterKeys={["name", "email", "status"]}
            />
            {serviceUserRows.length === 0 && (
              <div className="muted">{t("Sin usuarios asignados.")}</div>
            )}

            <div className="section-divider" />

            <h4 id="section-conversations">
              {t("Conversaciones del servicio")}
            </h4>
            <p className="muted mb-4">
              {t("Histórico de conversaciones asociadas a este servicio.")}
            </p>
            <DataTable
              columns={[
                {
                  key: "title",
                  label: t("Título"),
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    conversation.title || t("Sin título"),
                },
                {
                  key: "userId",
                  label: t("Usuario"),
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    chatUsers.find((user) => user.id === conversation.userId)
                      ?.email || conversation.userId,
                },
                { key: "model", label: t("Modelo"), sortable: true },
                {
                  key: "createdAt",
                  label: t("Creado"),
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    new Date(conversation.createdAt).toLocaleString(),
                },
                ...(canManageConversations
                  ? [
                      {
                        key: "actions",
                        label: t("Acciones"),
                        render: (conversation: ChatConversation) => (
                          <div className="row-actions">
                            <button
                              className="link"
                              onClick={() =>
                                handleSelectConversation(conversation.id)
                              }
                              disabled={chatBusy}
                            >
                              {t("Ver mensajes")}
                            </button>
                            <button
                              className="link danger"
                              onClick={() =>
                                handleDeleteConversation(conversation.id)
                              }
                              disabled={chatBusy}
                            >
                              {t("Eliminar")}
                            </button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              data={chatConversations}
              getRowId={(conversation) => conversation.id}
              pageSize={6}
              filterKeys={["title", "userId", "model"]}
            />
            {chatConversations.length === 0 && (
              <div className="muted">{t("Sin conversaciones.")}</div>
            )}
            {canManageConversations && activeConversationId && (
              <div className="mini-list conversation-messages">
                {chatMessages.map((message) => (
                  <div className="mini-row" key={message.id}>
                    <span className="muted">{message.role}</span>
                    <span>{message.content}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="muted">{t("Sin mensajes.")}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {canManageChatUsers && chatUserModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">{t("Nuevo usuario")}</div>
                  <h3>{t("Crear usuario de chat")}</h3>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label={t("Cerrar")}
                  onClick={() => setChatUserModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    {t("Nombre")}
                    <input
                      value={newChatUser.name}
                      onChange={(event) =>
                        setNewChatUser((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder={t("María López")}
                    />
                  </label>
                  <label>
                    {t("Email")}
                    <input
                      value={newChatUser.email}
                      onChange={(event) =>
                        setNewChatUser((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder={t("usuario@cliente.com")}
                    />
                  </label>
                  <label>
                    {t("Password")}
                    <input
                      type="password"
                      value={newChatUser.password}
                      onChange={(event) =>
                        setNewChatUser((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder={t("mínimo 6 caracteres")}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn"
                  onClick={() => setChatUserModalOpen(false)}
                >
                  {t("Cancelar")}
                </button>
                <button
                  className="btn primary"
                  onClick={handleCreateServiceChatUser}
                  disabled={
                    chatUserBusy ||
                    !newChatUser.email.trim() ||
                    !newChatUser.password.trim()
                  }
                >
                  {t("Crear usuario")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
