CREATE TABLE IF NOT EXISTS seguros_claims (
  id CHAR(36) PRIMARY KEY,
  claim_number VARCHAR(32) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  policy_number VARCHAR(64) NULL,
  loss_date DATE NULL,
  reported_at DATETIME NOT NULL,
  description TEXT NULL,
  urgency BOOLEAN NOT NULL DEFAULT 0,
  third_party_involved BOOLEAN NOT NULL DEFAULT 0,
  completeness_status VARCHAR(20) NOT NULL DEFAULT 'incompleto',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seguros_claims_type (type),
  INDEX idx_seguros_claims_status (status)
);

CREATE TABLE IF NOT EXISTS seguros_claim_documents (
  id CHAR(36) PRIMARY KEY,
  claim_id CHAR(36) NOT NULL,
  kind VARCHAR(30) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  size_bytes INT NOT NULL,
  extracted_fields JSON NULL,
  evidence JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seguros_claim_documents_claim (claim_id),
  CONSTRAINT fk_seguros_claim_documents_claim
    FOREIGN KEY (claim_id) REFERENCES seguros_claims(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seguros_users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seguros_users_role (role)
);
