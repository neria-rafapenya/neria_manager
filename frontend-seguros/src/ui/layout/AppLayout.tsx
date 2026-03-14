import type { PropsWithChildren } from "react";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { AppBreadcrumb } from "../components/AppBreadcrumb";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="main-wrapper">
        <div className="container-fluid">
          <AppBreadcrumb />
          <div className="app-content">{children}</div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
