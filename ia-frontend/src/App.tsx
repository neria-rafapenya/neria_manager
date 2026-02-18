// src/App.tsx
import { ChatbotApp } from "./adapters/ui/components/ChatbotApp";
import { EmailAutomationApp } from "./adapters/ui/components/EmailAutomationApp";
import { getServiceMode } from "./infrastructure/config/env";

export const App = () => {
  const mode = getServiceMode();
  return mode === "email" ? <EmailAutomationApp /> : <ChatbotApp />;
};
