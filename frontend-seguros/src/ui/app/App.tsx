import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { LoginLayout } from "../layout/LoginLayout";
import { MicrositeLayout } from "../layout/MicrositeLayout";
import { WidgetLayout } from "../layout/WidgetLayout";
import { ClaimsInboxPage } from "../pages/ClaimsInboxPage";
import { ClaimDetailPage } from "../pages/ClaimDetailPage";
import { NewClaimPage } from "../pages/NewClaimPage";
import { LoginPage } from "../pages/LoginPage";
import { ServicesProvider } from "./ServicesProvider";
import { AuthProvider } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import { RoleDashboard } from "./RoleDashboard";
import { UserDashboardPage } from "../pages/UserDashboardPage";

export default function App() {
  const appType = (import.meta.env.VITE_APP_TYPE ?? "microsite").toLowerCase();
  const isWidget = appType === "widget";
  const isMicrosite = appType === "microsite";

  if (isWidget) {
    return (
      <AuthProvider>
        <ServicesProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginLayout>
                  <LoginPage />
                </LoginLayout>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <WidgetLayout>
                    <RoleDashboard />
                  </WidgetLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/portal"
              element={
                <RequireRole roles={["user"]}>
                  <WidgetLayout>
                    <UserDashboardPage />
                  </WidgetLayout>
                </RequireRole>
              }
            />
            <Route
              path="/claims"
              element={
                <RequireRole roles={["admin", "agente"]}>
                  <WidgetLayout>
                    <ClaimsInboxPage />
                  </WidgetLayout>
                </RequireRole>
              }
            />
            <Route
              path="/claims/new"
              element={
                <RequireAuth>
                  <WidgetLayout>
                    <NewClaimPage />
                  </WidgetLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/claims/:id"
              element={
                <RequireRole roles={["admin", "agente"]}>
                  <WidgetLayout>
                    <ClaimDetailPage />
                  </WidgetLayout>
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ServicesProvider>
      </AuthProvider>
    );
  }

  if (isMicrosite) {
    return (
      <AuthProvider>
        <ServicesProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginLayout>
                  <LoginPage />
                </LoginLayout>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MicrositeLayout>
                    <RoleDashboard />
                  </MicrositeLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/portal"
              element={
                <RequireRole roles={["user"]}>
                  <MicrositeLayout>
                    <UserDashboardPage />
                  </MicrositeLayout>
                </RequireRole>
              }
            />
            <Route
              path="/claims"
              element={
                <RequireRole roles={["admin", "agente"]}>
                  <MicrositeLayout>
                    <ClaimsInboxPage />
                  </MicrositeLayout>
                </RequireRole>
              }
            />
            <Route
              path="/claims/new"
              element={
                <RequireAuth>
                  <MicrositeLayout>
                    <NewClaimPage />
                  </MicrositeLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/claims/:id"
              element={
                <RequireRole roles={["admin", "agente"]}>
                  <MicrositeLayout>
                    <ClaimDetailPage />
                  </MicrositeLayout>
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ServicesProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ServicesProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginLayout>
                <LoginPage />
              </LoginLayout>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout>
                  <RoleDashboard />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/portal"
            element={
              <RequireRole roles={["user"]}>
                <AppLayout>
                  <UserDashboardPage />
                </AppLayout>
              </RequireRole>
            }
          />
          <Route
            path="/claims"
            element={
              <RequireRole roles={["admin", "agente"]}>
                <AppLayout>
                  <ClaimsInboxPage />
                </AppLayout>
              </RequireRole>
            }
          />
          <Route
            path="/claims/new"
            element={
              <RequireAuth>
                <AppLayout>
                  <NewClaimPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/claims/:id"
            element={
              <RequireRole roles={["admin", "agente"]}>
                <AppLayout>
                  <ClaimDetailPage />
                </AppLayout>
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/claims" replace />} />
        </Routes>
      </ServicesProvider>
    </AuthProvider>
  );
}
