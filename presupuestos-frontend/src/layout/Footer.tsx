interface FooterProps {
  tenantName: string;
}

export default function Footer({ tenantName }: FooterProps) {
  return (
    <footer className="bg-dark text-light py-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <span className="small">Espacio usuario · {tenantName}</span>
        <span className="small">Presupuestos</span>
      </div>
    </footer>
  );
}
