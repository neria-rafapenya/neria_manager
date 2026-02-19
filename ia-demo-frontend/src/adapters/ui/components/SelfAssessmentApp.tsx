import { useAuthContext, AuthProvider } from "../../../infrastructure/contexts";
import {
  getChatAuthMode,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import SelfAssessmentLayout from "../layout/SelfAssessmentLayout";
import { SelfAssessmentPage } from "./SelfAssessmentPage";
import { LoginForm } from "./LoginForm";

const AssessmentWithAuth = () => {
  const { token, logout } = useAuthContext();

  if (!token) {
    return (
      <SelfAssessmentLayout>
        <LoginForm />
      </SelfAssessmentLayout>
    );
  }

  return (
    <SelfAssessmentLayout onLogout={logout} showLogout>
      <SelfAssessmentPage />
    </SelfAssessmentLayout>
  );
};

export const SelfAssessmentApp = () => {
  if (isAuthModeNone()) {
    console.log("[SelfAssessmentApp] CHAT_AUTH_MODE =", getChatAuthMode(), "(none)");
    return (
      <SelfAssessmentLayout>
        <SelfAssessmentPage />
      </SelfAssessmentLayout>
    );
  }

  console.log("[SelfAssessmentApp] CHAT_AUTH_MODE =", getChatAuthMode());
  return (
    <AuthProvider>
      <AssessmentWithAuth />
    </AuthProvider>
  );
};
