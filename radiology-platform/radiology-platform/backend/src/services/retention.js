import { query } from '../db/pool.js';
import { deleteImage } from './imageStore.js';

export async function runRetentionJob() {
  const retentionDays = parseInt(process.env.RETENTION_DAYS || '90', 10);
  console.log(`[Retention Job] Running check for scans older than ${retentionDays} days...`);

  try {
    // Select scans to delete (excluding the single most recent scan per patient)
    const { rows } = await query(
      `SELECT s.id, s.store_ref, s.patient_id
       FROM scans s
       WHERE s.store_ref IS NOT NULL
         AND s.created_at < NOW() - INTERVAL '1 day' * $1
         AND s.id NOT IN (
           SELECT id FROM scans
           WHERE patient_id = s.patient_id
           ORDER BY created_at DESC LIMIT 1
         )`,
      [retentionDays]
    );

    console.log(`[Retention Job] Found ${rows.length} expired scans to prune.`);

    for (const scan of rows) {
      console.log(`[Retention Job] Pruning scan image: ${scan.id} (store_ref: ${scan.store_ref})`);
      
      // Delete image from Orthanc
      await deleteImage(scan.store_ref);

      // Null out store_ref
      await query(
        `UPDATE scans SET store_ref = NULL WHERE id = $1`,
        [scan.id]
      );

      // Log to audit log
      await query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip)
         VALUES (NULL, 'auto_delete_expired_scan', 'scan', $1, '127.0.0.1')`,
        [scan.id]
      ).catch((e) => console.error('Failed to log retention audit:', e.message));
    }
  } catch (e) {
    console.error('[Retention Job] Error running job:', e.message);
  }
}

export function startRetentionScheduler() {
  // Run once on startup after 5 seconds
  setTimeout(runRetentionJob, 5000);

  // Run every 24 hours
  setInterval(runRetentionJob, 1000 * 60 * 60 * 24);
}
