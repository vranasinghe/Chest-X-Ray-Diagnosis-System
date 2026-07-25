# Radiology Platform

Doctor-centric, consent-gated AI diagnosis + patient management. Node.js/Express +
PostgreSQL + React. The consent check is the control valve: unconsented scans are
physically routed away from the model.

## Stack
- **Backend**: Express, `pg`, JWT auth, multer uploads, mock async inference
- **Database**: PostgreSQL (schema in `backend/src/db/schema.sql`)
- **Frontend**: React + Vite + React Router

## Prerequisites
- Node 18+
- PostgreSQL 14+ running locally

## 1. Database
```bash
createdb radiology
psql "postgres://postgres:postgres@localhost:5432/radiology" -f backend/src/db/schema.sql
```

## 2. Backend
```bash
cd backend
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET
npm install
npm run seed                # creates doctor@demo.dev / password123 + demo patients
npm run dev                 # http://localhost:4000
```

## 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Sign in with **doctor@demo.dev / password123**.

## The consent gate (where to look)
- `backend/src/routes/scans.js` — reads the patient's latest consent, sets scan
  status to `queued` (AI) or `declined_ai` (manual), and only calls
  `enqueueInference()` when consented.
- `backend/src/services/inference.js` — the mock model. Replace `runModel()` with an
  HTTP call to your real Python inference service; the status transitions stay identical.
- `backend/src/routes/research.js` — analytics filter on `usable_for_training` only.

## Swapping in the real model
The Express `enqueueInference` is a stand-in for a Celery worker + model ensemble.
For production, point it at a Python FastAPI inference service that runs DenseNet /
EfficientNet / ResNet-ViT and returns predictions + a Grad-CAM heatmap path. Nothing
above the worker changes — the API contract is the same for one model or an ensemble.

## Data model
See `backend/src/db/schema.sql`: users, patients, consents, scans, ai_results,
reports, appointments, audit_log. Reports link to a scan (the doctor's sign-off on
specific findings); only `status = finalized` reports are eligible to surface to a
patient.
