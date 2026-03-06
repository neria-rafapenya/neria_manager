import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./adapters/ui/layout/AppShell";
import { DashboardPage } from "./adapters/ui/pages/DashboardPage";
import { ConversationsPage } from "./adapters/ui/pages/ConversationsPage";
import { AgendaPage } from "./adapters/ui/pages/AgendaPage/AgendaPage";
import { ProtocolsPage } from "./adapters/ui/pages/ProtocolsPage";
import { TriagePage } from "./adapters/ui/pages/TriagePage";
import { ReportsPage } from "./adapters/ui/pages/ReportsPage";
import { AnalyticsPage } from "./adapters/ui/pages/AnalyticsPage";
import { AdminPage } from "./adapters/ui/pages/AdminPage";
import { PatientsPage } from "./adapters/ui/pages/PatientsPage";
import { NotFoundPage } from "./adapters/ui/pages/NotFoundPage";
import { PatientHomePage } from "./adapters/ui/pages/PatientHomePage";
import { ChatBotVisitasPage } from "./adapters/ui/pages/ChatBotVisitas";
import { PatientSettingsPage } from "./adapters/ui/pages/PatientSettingsPage";
import { LoginPage } from "./adapters/ui/pages/LoginPage";
import { GlobalToast } from "./adapters/ui/components/shared/GlobalToast";
import { useAuthContext } from "./infrastructure/contexts/AuthContext";
import { getRolePermissions, normalizeClinicRole } from "./core/domain/roles";

const App = () => {
  const { token, user } = useAuthContext();
  const role = normalizeClinicRole(user?.role);
  const permissions = getRolePermissions(role);

  return (
    <>
      <GlobalToast />
      <Routes>
        {!token ? (
          <>
            <Route element={<AppShell />}>
              <Route path="/paciente/visitas" element={<ChatBotVisitasPage />} />
            </Route>
            <Route path="*" element={<LoginPage />} />
          </>
        ) : permissions.isPatient ? (
          <>
            <Route element={<AppShell />}>
              <Route path="/paciente" element={<PatientHomePage />} />
              <Route path="/paciente/visitas" element={<ChatBotVisitasPage />} />
              <Route path="/paciente/ajustes" element={<PatientSettingsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/paciente" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </>
        ) : (
          <>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route
                path="/conversaciones"
                element={
                  permissions.canViewConversations ? (
                    <ConversationsPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/agenda"
                element={
                  permissions.canViewAgenda ? (
                    <AgendaPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/pacientes"
                element={
                  permissions.canViewPatients ? (
                    <PatientsPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/protocolos"
                element={
                  permissions.canViewProtocols ? (
                    <ProtocolsPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/triaje"
                element={
                  permissions.canViewTriage ? (
                    <TriagePage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/informes"
                element={
                  permissions.canViewReports ? (
                    <ReportsPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/metricas"
                element={
                  permissions.canViewMetrics ? (
                    <AnalyticsPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  permissions.canViewAdmin ? (
                    <AdminPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Route>
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </>
        )}
      </Routes>
    </>
  );
};

export default App;
