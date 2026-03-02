import { useAuthContext, AuthProvider } from "../../../infrastructure/contexts";
import {
  getChatAuthMode,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import TaxAssistantLayout from "../layout/TaxAssistantLayout";
import { TaxAssistantPage } from "./TaxAssistantPage";
import { LoginForm } from "./LoginForm";

const TaxWithAuth = () => {
  const { token, logout } = useAuthContext();

  if (!token) {
    return (
      <TaxAssistantLayout>
        <LoginForm />
      </TaxAssistantLayout>
    );
  }

  return (
    <TaxAssistantLayout onLogout={logout} showLogout>
      <TaxAssistantPage />
    </TaxAssistantLayout>
  );
};

export const TaxAssistantApp = () => {
  if (isAuthModeNone) {
    console.log("[TaxAssistantApp] CHAT_AUTH_MODE =", getChatAuthMode(), "(none)");
    return (
      <TaxAssistantLayout>
        <TaxAssistantPage />
      </TaxAssistantLayout>
    );
  }

  console.log("[TaxAssistantApp] CHAT_AUTH_MODE =", getChatAuthMode());
  return (
    <AuthProvider>
      <TaxWithAuth />
    </AuthProvider>
  );
};
