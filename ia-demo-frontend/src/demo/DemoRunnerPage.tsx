import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadDemos } from "./demoLoader";
import type { DemoConfig } from "./types";
import { setRuntimeConfig } from "../infrastructure/config/runtimeConfig";
import { ChatbotApp } from "../adapters/ui/components/ChatbotApp";
import { EmailAutomationApp } from "../adapters/ui/components/EmailAutomationApp";
import { FinancialSimulatorApp } from "../adapters/ui/components/FinancialSimulatorApp";
import { SurveyDemoPage } from "./SurveyDemoPage";

export const DemoRunnerPage = () => {
  const { code } = useParams();
  const [demo, setDemo] = useState<DemoConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setConfigReady(false);
    loadDemos()
      .then((items) => {
        if (!mounted) return;
        const found = items.find((item) => item.code === code) || null;
        setDemo(found);
        setLoading(false);
        if (!found) {
          setError("Demo no encontrada");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "No se pudo cargar la demo");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (!demo) return;
    setRuntimeConfig({
      demoCode: demo.code,
      name: demo.name,
      description: demo.description || undefined,
      mode: demo.mode || "chat",
      serviceMode:
        demo.serviceMode ||
        (demo.mode === "email"
          ? "email"
          : demo.mode === "financial"
            ? "financial"
            : "chat"),
      apiBaseUrl: demo.apiBaseUrl || undefined,
      apiUrl: demo.apiUrl || undefined,
      apiKey: demo.apiKey || undefined,
      tenantId: demo.tenantId || undefined,
      serviceCode: demo.serviceCode || demo.code,
      serviceId: demo.serviceId || undefined,
      providerId: demo.providerId || undefined,
      model: demo.model || undefined,
      chatEndpoint: demo.chatEndpoint || undefined,
      chatAuthMode: demo.chatAuthMode || undefined,
      chatbotRestricted: demo.chatbotRestricted,
      chatbotOpened: demo.chatbotOpened,
      captchaEnabled: demo.captchaEnabled,
      recaptchaSiteKey: demo.recaptchaSiteKey || undefined,
      embedUrl: demo.embedUrl || undefined,
    });
    document.title = demo.name;
    setConfigReady(true);
    return () => {
      setRuntimeConfig(null);
      document.title = "Demos";
      setConfigReady(false);
    };
  }, [demo]);

  const mode = demo?.mode || "chat";
  const embedUrl = demo?.embedUrl || "";

  const renderContent = () => {
    if (!demo || !configReady) return null;
    if (mode === "embed" && embedUrl) {
      return (
        <div className="demo-embed">
          <iframe src={embedUrl} title={demo.name} />
        </div>
      );
    }
    if (mode === "surveys") {
      return <SurveyDemoPage />;
    }
    if (mode === "email" && embedUrl) {
      return (
        <div className="demo-embed">
          <iframe src={embedUrl} title={demo.name} />
        </div>
      );
    }
    if (mode === "email") {
      return <EmailAutomationApp />;
    }
    if (mode === "financial") {
      return <FinancialSimulatorApp />;
    }
    return <ChatbotApp />;
  };

  if (loading) {
    return (
      <div className="demo-shell">
        <p className="muted">Cargando demo...</p>
      </div>
    );
  }

  if (error || !demo) {
    return (
      <div className="demo-shell">
        <p className="demo-error">{error || "Demo no encontrada"}</p>
        <Link to="/" className="demo-link">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <div>
          <h1>{demo.name}</h1>
          {demo.description && <p className="muted">{demo.description}</p>}
        </div>
        <div className="demo-actions">
          <Link to="/" className="demo-link">
            Volver a demos
          </Link>
        </div>
      </header>
      <div className="demo-body">{renderContent()}</div>
    </div>
  );
};
