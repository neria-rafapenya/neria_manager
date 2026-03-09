import type { Claim, ClaimDocument, CreateClaimInput } from "@/domain/models/claim";
import type { ClaimsRepository } from "@/domain/repositories/claims.repository";

const now = new Date();

const claims: Claim[] = [
  {
    id: "clm-1",
    claimNumber: "CF-20260306-4821",
    type: "auto",
    status: "pendiente_documentos",
    policyNumber: "AUTO-889123",
    lossDate: "2026-03-04",
    reportedAt: now.toISOString(),
    description: "Colision trasera en M-30, tercer vehiculo implicado.",
    urgency: true,
    thirdPartyInvolved: true,
    completenessStatus: "parcial",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "clm-2",
    claimNumber: "CF-20260305-7740",
    type: "hogar",
    status: "en_revision",
    policyNumber: "HOG-552109",
    lossDate: "2026-03-02",
    reportedAt: now.toISOString(),
    description: "Dano por agua en cocina, requiere peritaje.",
    urgency: false,
    thirdPartyInvolved: false,
    completenessStatus: "completo",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "clm-3",
    claimNumber: "CF-20260301-1138",
    type: "salud",
    status: "nuevo",
    policyNumber: "SAL-220011",
    lossDate: "2026-02-28",
    reportedAt: now.toISOString(),
    description: "Reembolso de pruebas medicas.",
    urgency: false,
    thirdPartyInvolved: false,
    completenessStatus: "incompleto",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

const documents: ClaimDocument[] = [
  {
    id: "doc-1",
    claimId: "clm-1",
    kind: "parte_amistoso",
    filename: "parte-amistoso.pdf",
    mimeType: "application/pdf",
    storageKey: "docs/parte-amistoso.pdf",
    sizeBytes: 420012,
    extractedFields: { matricula: "1234-ABC" },
    evidence: { matricula: { page: 1, box: [120, 220, 240, 250] } },
    createdAt: now.toISOString(),
  },
  {
    id: "doc-2",
    claimId: "clm-1",
    kind: "foto",
    filename: "impacto.jpg",
    mimeType: "image/jpeg",
    storageKey: "docs/impacto.jpg",
    sizeBytes: 220010,
    createdAt: now.toISOString(),
  },
];

export class MockClaimsRepository implements ClaimsRepository {
  async list(): Promise<Claim[]> {
    return claims;
  }

  async getById(id: string): Promise<Claim | null> {
    return claims.find((claim) => claim.id === id) ?? null;
  }

  async create(input: CreateClaimInput): Promise<Claim> {
    const now = new Date().toISOString();
    const id = `clm-${Date.now()}`;
    const claimNumber = `CF-${now.slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const claim: Claim = {
      id,
      claimNumber,
      type: input.type,
      status: "nuevo",
      policyNumber: input.policyNumber ?? null,
      lossDate: input.lossDate ?? null,
      reportedAt: now,
      description: input.description ?? null,
      urgency: input.urgency ?? false,
      thirdPartyInvolved: input.thirdPartyInvolved ?? false,
      completenessStatus: "incompleto",
      createdAt: now,
      updatedAt: now,
    };

    claims.unshift(claim);
    return claim;
  }

  async listDocuments(claimId: string): Promise<ClaimDocument[]> {
    return documents.filter((doc) => doc.claimId === claimId);
  }
}
