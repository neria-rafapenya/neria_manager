import type { PropsWithChildren } from "react";

export function MicrositeLayout({ children }: PropsWithChildren) {
  return (
    <div className="microsite-shell">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <header className="microsite-header">
              <div>
                <p className="microsite-kicker">Siniestros online</p>
                <h1>ClaimsFlow AI</h1>
                <p className="microsite-sub">
                  Completa tu expediente en minutos. Te guiamos paso a paso y pedimos solo lo necesario.
                </p>
              </div>
              <div className="microsite-badge">
                <span>Soporte 24/7</span>
                <strong>900 000 000</strong>
              </div>
            </header>
          </div>
        </div>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <main className="microsite-content">{children}</main>
          </div>
          <div className="col-12 col-lg-4">
            <aside className="microsite-aside">
              <h3>Que necesitas</h3>
              <ul>
                <li>Numero de poliza</li>
                <li>Descripcion del incidente</li>
                <li>Fotos o documentos</li>
              </ul>
              <div className="microsite-box">
                <p>Al finalizar recibiras un numero de expediente y seguimiento automatico.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
