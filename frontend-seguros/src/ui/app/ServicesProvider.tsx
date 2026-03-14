import { createContext, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { ClaimsService } from "@/domain/services/claims.service";
import { HttpClaimsRepository } from "@/infrastructure/repositories/claims.repository.http";
import { MockClaimsRepository } from "@/infrastructure/repositories/claims.repository.mock";
import { AuthService } from "@/domain/services/auth.service";
import { HttpAuthRepository } from "@/infrastructure/repositories/auth.repository.http";

interface Services {
  claimsService: ClaimsService;
  authService: AuthService;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ children }: PropsWithChildren) {
  const services = useMemo<Services>(() => {
    const useMock = import.meta.env.VITE_USE_MOCK === "true";

    const repository = useMock
      ? new MockClaimsRepository()
      : new HttpClaimsRepository();

    return {
      claimsService: new ClaimsService(repository),
      authService: new AuthService(new HttpAuthRepository()),
    };
  }, []);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("ServicesProvider missing");
  }
  return context;
}
