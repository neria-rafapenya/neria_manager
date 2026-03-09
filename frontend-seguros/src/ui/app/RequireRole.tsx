import { Navigate, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { UserRole } from "@/domain/models/auth";
import { useAuth } from "./AuthProvider";
import { getDefaultPathForRole } from "./auth-helpers";

interface Props extends PropsWithChildren {
  roles: UserRole[];
}

export function RequireRole({ roles, children }: Props) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

