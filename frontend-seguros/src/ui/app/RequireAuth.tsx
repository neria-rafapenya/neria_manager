import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

