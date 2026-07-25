import { query } from '../db/pool.js';

export async function runBinaryModel(scanId) {
  // Mock binary classifier: 50% normal, 50% abnormal
  const isAbnormal = Math.random() > 0.5;
  return {
    isAbnormal,
    model_version: 'binary-v1-mock',
  };
}

export async function runMulticlassModel(scanId) {
  // Mock multiclass classifier
  const LABELS = ['Pneumonia', 'Pleural effusion', 'Cardiomegaly'];
  const raw = LABELS.map(() => Math.random());
  const sum = raw.reduce((a, b) => a + b, 0);
  const preds = LABELS.map((label, i) => ({
    label,
    score: +(raw[i] / sum).toFixed(3),
  })).sort((a, b) => b.score - a.score);

  return {
    predictions: preds,
    model_version: 'multiclass-v1-mock',
    heatmap_path: 'mock_heatmap_' + Date.now() + '.png',
  };
}

export function enqueueInference(scanId) {
  setTimeout(async () => {
    try {
      await query(`UPDATE scans SET status = 'processing' WHERE id = $1`, [scanId]);
      const started = Date.now();

      // Stage 1
      const binaryResult = await runBinaryModel(scanId);

      if (!binaryResult.isAbnormal) {
        // Normal
        const ms = Date.now() - started;
        const predictions = [{ label: 'No abnormality detected', score: 1.0 }];
        await query(
          `INSERT INTO ai_results (scan_id, model_version, predictions, heatmap_path, inference_ms, stage)
           VALUES ($1, $2, $3, $4, $5, 'binary')`,
          [scanId, binaryResult.model_version, JSON.stringify(predictions), null, ms]
        );
      } else {
        // Abnormal, Stage 2
        const multiclassResult = await runMulticlassModel(scanId);
        const ms = Date.now() - started;
        await query(
          `INSERT INTO ai_results (scan_id, model_version, predictions, heatmap_path, inference_ms, stage)
           VALUES ($1, $2, $3, $4, $5, 'multiclass')`,
          [scanId, multiclassResult.model_version, JSON.stringify(multiclassResult.predictions), multiclassResult.heatmap_path, ms]
        );
      }

      await query(`UPDATE scans SET status = 'pending_review' WHERE id = $1`, [scanId]);
    } catch (e) {
      console.error('inference failed:', e.message);
    }
  }, 1500);
}
