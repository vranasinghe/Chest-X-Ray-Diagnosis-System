import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually to ensure process.env.DATABASE_URL is populated
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key === 'DATABASE_URL') {
        process.env.DATABASE_URL = val;
      }
    }
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/radiology';

console.log('Connecting to database...');

const ssl = (connectionString.includes('sslmode=require') || connectionString.includes('neon.tech'))
  ? { rejectUnauthorized: false }
  : false;

const client = new pg.Client({
  connectionString,
  ssl,
});

async function main() {
  await client.connect();
  console.log('Connected successfully. Initializing database schema...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema.sql
  await client.query(schemaSql);
  console.log('Database schema applied successfully.');

  console.log('Seeding demo data...');
  const hash = await bcrypt.hash('password123', 10);

  const { rows: [doc] } = await client.query(
    `INSERT INTO users (role, name, email, password_hash)
     VALUES ('doctor', 'Dr. Amara Silva', 'doctor@demo.dev', $1)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [hash]
  );

  const patients = [
    ['James Tran', '1967-03-11', 'M', '40192', 'diagnosis_research', true],
    ['Priya Nair', '1985-09-02', 'F', '40193', 'diagnosis_only', false],
    ['Leo Fischer', '1954-12-20', 'M', '40194', 'declined', false],
  ];

  for (const [name, dob, sex, mrn, ctype, train] of patients) {
    // Check if patient already exists by MRN to make seeding re-runnable
    const { rows: [existing] } = await client.query(
      `SELECT id FROM patients WHERE mrn = $1`,
      [mrn]
    );

    let patientId;
    const isAuthorized = ctype !== 'declined';
    
    if (existing) {
      patientId = existing.id;
      await client.query(
        `UPDATE patients SET doctor_id = $1, name = $2, dob = $3, sex = $4, authorized = $5, authorized_at = $6
         WHERE id = $7`,
        [doc.id, name, dob, sex, isAuthorized, isAuthorized ? new Date() : null, patientId]
      );
    } else {
      const { rows: [p] } = await client.query(
        `INSERT INTO patients (doctor_id, name, dob, sex, mrn, authorized, authorized_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [doc.id, name, dob, sex, mrn, isAuthorized, isAuthorized ? new Date() : null]
      );
      patientId = p.id;
    }

    // Check if consent already exists
    const { rows: [existingConsent] } = await client.query(
      `SELECT id FROM consents WHERE patient_id = $1`,
      [patientId]
    );

    if (existingConsent) {
      await client.query(
        `UPDATE consents SET type = $1, usable_for_training = $2 WHERE id = $3`,
        [ctype, train, existingConsent.id]
      );
    } else {
      await client.query(
        `INSERT INTO consents (patient_id, type, usable_for_training)
         VALUES ($1, $2, $3)`,
        [patientId, ctype, train]
      );
    }
  }

  console.log('Database seeded successfully. Login: doctor@demo.dev / password123');
}

main()
  .catch((err) => {
    console.error('Initialization failed:', err);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });
