import type { PropsWithChildren } from "react";

export function LoginLayout({ children }: PropsWithChildren) {
  return <div className="login-shell">{children}</div>;
}
