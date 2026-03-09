import type { PropsWithChildren } from "react";

export function WidgetLayout({ children }: PropsWithChildren) {
  return (
    <div className="widget-shell">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="widget-card">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
