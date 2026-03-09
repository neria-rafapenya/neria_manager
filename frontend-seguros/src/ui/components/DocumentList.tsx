import type { ClaimDocument } from "@/domain/models/claim";

interface Props {
  documents: ClaimDocument[];
}

export function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return <p className="text-muted">No hay documentos adjuntos.</p>;
  }

  return (
    <div className="doc-list">
      {documents.map((doc) => (
        <div key={doc.id} className="doc-item">
          <div>
            <strong>{doc.filename}</strong>
            <p>{doc.kind} · {Math.round(doc.sizeBytes / 1024)} KB</p>
          </div>
          <button type="button" className="btn btn-outline-light btn-sm">
            Ver evidencia
          </button>
        </div>
      ))}
    </div>
  );
}
