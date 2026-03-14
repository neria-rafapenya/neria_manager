export const CLAIM_DOCUMENT_KINDS = [
  "parte_amistoso",
  "atestados",
  "factura",
  "presupuesto",
  "informe_medico",
  "foto",
  "poliza",
  "dni",
  "otro",
] as const;

export type ClaimDocumentKind = (typeof CLAIM_DOCUMENT_KINDS)[number];

export interface ClaimDocumentProps {
  id: string;
  claimId: string;
  kind: ClaimDocumentKind;
  filename: string;
  mimeType: string;
  storageKey: string;
  sizeBytes: number;
  extractedFields: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  createdAt: Date;
}

export class ClaimDocument {
  constructor(private readonly props: ClaimDocumentProps) {}

  get id() {
    return this.props.id;
  }

  get claimId() {
    return this.props.claimId;
  }

  get kind() {
    return this.props.kind;
  }

  get filename() {
    return this.props.filename;
  }

  get mimeType() {
    return this.props.mimeType;
  }

  get storageKey() {
    return this.props.storageKey;
  }

  get sizeBytes() {
    return this.props.sizeBytes;
  }

  get extractedFields() {
    return this.props.extractedFields;
  }

  get evidence() {
    return this.props.evidence;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  toPrimitives(): ClaimDocumentProps {
    return { ...this.props };
  }
}
