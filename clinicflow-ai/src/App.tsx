import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./adapters/ui/layout/AppShell";
import { DashboardPage } from "./adapters/ui/pages/DashboardPage";
import { ConversationsPage } from "./adapters/ui/pages/ConversationsPage";
import { AgendaPage } from "./adapters/ui/pages/AgendaPage";
import { ProtocolsPage } from "./adapters/ui/pages/ProtocolsPage";
import { TriagePage } from "./adapters/ui/pages/TriagePage";
import { ReportsPage } from "./adapters/ui/pages/ReportsPage";
import { AnalyticsPage } from "./adapters/ui/pages/AnalyticsPage";
import { AdminPage } from "./adapters/ui/pages/AdminPage";
import { NotFoundPage } from "./adapters/ui/pages/NotFoundPage";
import { LoginPage } from "./adapters/ui/pages/LoginPage";
import { useAuthContext } from "./infrastructure/contexts/AuthContext";

const App = () => {
  const { token } = useAuthContext();

  if (!token) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/conversaciones" element={<ConversationsPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/protocolos" element={<ProtocolsPage />} />
        <Route path="/triaje" element={<TriagePage />} />
        <Route path="/informes" element={<ReportsPage />} />
        <Route path="/metricas" element={<AnalyticsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
