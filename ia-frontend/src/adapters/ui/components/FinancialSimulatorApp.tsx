import { useAuthContext, AuthProvider } from "../../../infrastructure/contexts";
import {
  CHAT_AUTH_MODE,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import FinancialSimulatorLayout from "../layout/FinancialSimulatorLayout";
import { FinancialSimulatorPage } from "./FinancialSimulatorPage";
import { LoginForm } from "./LoginForm";

const FinancialWithAuth = () => {
  const { token, logout } = useAuthContext();

  if (!token) {
    return (
      <FinancialSimulatorLayout>
        <LoginForm />
      </FinancialSimulatorLayout>
    );
  }

  return (
    <FinancialSimulatorLayout onLogout={logout} showLogout>
      <FinancialSimulatorPage />
    </FinancialSimulatorLayout>
  );
};

export const FinancialSimulatorApp = () => {
  if (isAuthModeNone) {
    console.log("[FinancialSimulatorApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE, "(none)");
    return (
      <FinancialSimulatorLayout>
        <FinancialSimulatorPage />
      </FinancialSimulatorLayout>
    );
  }

  console.log("[FinancialSimulatorApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE);
  return (
    <AuthProvider>
      <FinancialWithAuth />
    </AuthProvider>
  );
};
