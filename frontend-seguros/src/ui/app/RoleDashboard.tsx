import { ClaimsInboxPage } from "../pages/ClaimsInboxPage";
import { UserDashboardPage } from "../pages/UserDashboardPage";
import { useAuth } from "./AuthProvider";

export function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === "admin" || user?.role === "agente") {
    return <ClaimsInboxPage />;
  }

  return <UserDashboardPage />;
}

