import { useAuthContext, AuthProvider } from "../../../infrastructure/contexts";
import {
  CHAT_AUTH_MODE,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import EmailAutomationLayout from "../layout/EmailAutomationLayout";
import { EmailAutomationInbox } from "./EmailAutomationInbox";
import { LoginForm } from "./LoginForm";

const EmailWithAuth = () => {
  const { token, logout } = useAuthContext();

  if (!token) {
    return (
      <EmailAutomationLayout>
        <LoginForm />
      </EmailAutomationLayout>
    );
  }

  return (
    <EmailAutomationLayout onLogout={logout} showLogout>
      <EmailAutomationInbox />
    </EmailAutomationLayout>
  );
};

export const EmailAutomationApp = () => {
  if (isAuthModeNone) {
    console.log("[EmailAutomationApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE, "(none)");
    return (
      <EmailAutomationLayout>
        <EmailAutomationInbox />
      </EmailAutomationLayout>
    );
  }

  console.log("[EmailAutomationApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE);
  return (
    <AuthProvider>
      <EmailWithAuth />
    </AuthProvider>
  );
};
