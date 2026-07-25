-- ====================================================================
-- Radiology Platform - Complete Production PostgreSQL Database Schema
-- Doctor-centric, Consent-gated AI Diagnosis & Patient Management
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('doctor', 'technician', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scan_status AS ENUM ('queued', 'processing', 'pending_review', 'declined_ai', 'reviewed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('draft', 'finalized');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM ('diagnosis_only', 'diagnosis_research', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL DEFAULT 'doctor',
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  preferences   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PATIENTS ----------
CREATE TABLE IF NOT EXISTS patients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  dob                DATE,
  sex                TEXT,
  mrn                TEXT,
  history            TEXT,
  email              TEXT,
  phone              TEXT,
  address            TEXT,
  notes              TEXT,
  authorized         BOOLEAN NOT NULL DEFAULT FALSE,
  auth_token         TEXT,
  auth_token_expires TIMESTAMPTZ,
  authorized_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_email  ON patients(email);

-- ---------- CONSENTS (The Gate) ----------
CREATE TABLE IF NOT EXISTS consents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type                consent_type NOT NULL,
  usable_for_training BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);

-- ---------- SCANS ----------
CREATE TABLE IF NOT EXISTS scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES users(id),
  store_ref    TEXT,
  modality     TEXT NOT NULL DEFAULT 'chest_xray',
  status       scan_status NOT NULL DEFAULT 'queued',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scans_patient ON scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_scans_status  ON scans(status);

-- ---------- AI_RESULTS ----------
CREATE TABLE IF NOT EXISTS ai_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  predictions   JSONB NOT NULL,
  heatmap_path  TEXT,
  inference_ms  INTEGER,
  stage         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_scan ON ai_results(scan_id);

-- ---------- REPORTS ----------
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES users(id),
  doctor_name     TEXT,
  registration_no TEXT,
  findings        TEXT,
  impression      TEXT,
  treatment_plan  TEXT,
  comments        TEXT,
  status          report_status NOT NULL DEFAULT 'draft',
  finalized_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_scan    ON reports(scan_id);

-- ---------- APPOINTMENTS ----------
CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id    UUID NOT NULL REFERENCES users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  type         TEXT,
  status       TEXT NOT NULL DEFAULT 'scheduled',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

-- ---------- DELETION_REQUESTS ----------
CREATE TABLE IF NOT EXISTS deletion_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_patient ON deletion_requests(patient_id);

-- ---------- AUDIT_LOG (Append-only) ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
