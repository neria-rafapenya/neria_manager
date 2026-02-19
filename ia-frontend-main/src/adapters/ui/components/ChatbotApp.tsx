// src/adapters/ui/react/chat/ChatbotApp.tsx
import { Chatbot } from "./Chatbot";
import {
  AuthProvider,
  useAuthContext,
  ChatProvider,
} from "../../../infrastructure/contexts";

import {
  CHAT_AUTH_MODE,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import { ChatbotLayout } from "../layout";
import { LoginForm } from "./LoginForm";
import { ChatUsageBadge } from "./ChatUsageBadge";

const ChatWithAuth = () => {
  const { token, logout } = useAuthContext();

  // Sin token → pantalla de login, SIN ChatProvider y SIN badge
  if (!token) {
    return (
      <ChatbotLayout>
        <LoginForm />
      </ChatbotLayout>
    );
  }

  // Con token → ChatProvider + layout + badge + chatbot
  return (
    <ChatProvider>
      <ChatbotLayout
        onLogout={logout}
        showLogout
        usageBadgeSlot={<ChatUsageBadge />}
      >
        <Chatbot />
      </ChatbotLayout>
    </ChatProvider>
  );
};

export const ChatbotApp = () => {
  if (isAuthModeNone) {
    // Modo sin autenticación: no hay AuthProvider ni LoginForm
    console.log("[ChatbotApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE, "(none)");
    return (
      <ChatProvider>
        <ChatbotLayout usageBadgeSlot={<ChatUsageBadge />}>
          <Chatbot />
        </ChatbotLayout>
      </ChatProvider>
    );
  }

  // Modo local / sso (con login)
  console.log("[ChatbotApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE);
  return (
    <AuthProvider>
      <ChatWithAuth />
    </AuthProvider>
  );
};
