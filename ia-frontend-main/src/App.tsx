// src/App.tsx
import { ChatbotApp } from "./adapters/ui/components/ChatbotApp";
import { AuthProvider } from "./infrastructure/contexts/AuthContext";

export const App = () => {
  return (
    <AuthProvider>
      <ChatbotApp />
    </AuthProvider>
  );
};
