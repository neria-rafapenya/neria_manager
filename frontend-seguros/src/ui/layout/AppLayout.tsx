import type { PropsWithChildren } from "react";
import { TopNav } from "../components/TopNav";
import { SideNav } from "../components/SideNav";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <TopNav />
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-2">
            <SideNav />
          </div>
          <div className="col-12 col-lg-10">
            <main className="app-content">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
