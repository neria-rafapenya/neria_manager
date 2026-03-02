// src/App.tsx
import { ChatbotApp } from "./adapters/ui/components/ChatbotApp";
import { EmailAutomationApp } from "./adapters/ui/components/EmailAutomationApp";
import { FinancialSimulatorApp } from "./adapters/ui/components/FinancialSimulatorApp";
import { SelfAssessmentApp } from "./adapters/ui/components/SelfAssessmentApp";
import { TaxAssistantApp } from "./adapters/ui/components/TaxAssistantApp";
import { getServiceMode } from "./infrastructure/config/env";

export const App = () => {
  const mode = getServiceMode();
  if (mode === "email") return <EmailAutomationApp />;
  if (mode === "financial") return <FinancialSimulatorApp />;
  if (mode === "self-assessment") return <SelfAssessmentApp />;
  if (mode === "tax") return <TaxAssistantApp />;
  return <ChatbotApp />;
};
