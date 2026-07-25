import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';

async function seed() {
  const hash = await bcrypt.hash('password123', 10);

  const { rows: [doc] } = await query(
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
    const isAuthorized = ctype !== 'declined';
    const { rows: [p] } = await query(
      `INSERT INTO patients (doctor_id, name, dob, sex, mrn, authorized, authorized_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [doc.id, name, dob, sex, mrn, isAuthorized, isAuthorized ? new Date() : null]
    );
    await query(
      `INSERT INTO consents (patient_id, type, usable_for_training)
       VALUES ($1, $2, $3)`,
      [p.id, ctype, train]
    );
  }

  console.log('Seeded. Login: doctor@demo.dev / password123');
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
