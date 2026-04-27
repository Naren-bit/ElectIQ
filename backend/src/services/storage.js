/**
 * @fileoverview Cloud Storage service for ElectIQ.
 * Uploads periodic snapshots of database analytics for historical tracking.
 * @module storage
 */

const { getStorage } = require('firebase-admin/storage');
const { getDB } = require('./firebase');

let bucket = null;

/**
 * Initialize Cloud Storage bucket.
 */
function initStorage() {
  if (!process.env.GCLOUD_STORAGE_BUCKET) {
    console.warn('[Storage] GCLOUD_STORAGE_BUCKET not set. Snapshot archiving disabled.');
    return;
  }
  try {
    bucket = getStorage().bucket(process.env.GCLOUD_STORAGE_BUCKET);
    console.log('[Storage] Connected to bucket:', process.env.GCLOUD_STORAGE_BUCKET);
  } catch (err) {
    console.error('[Storage] Init failed:', err.message);
  }
}

/**
 * Take a snapshot of current quiz results and session analytics
 * and upload it to Cloud Storage.
 */
async function uploadAnalyticsSnapshot() {
  if (!bucket) return;

  try {
    const db = getDB();
    const [quizSnap, sessionsSnap] = await Promise.all([
      db.ref('quiz_results').once('value'),
      db.ref('sessions').once('value')
    ]);

    const snapshotData = {
      timestamp: Date.now(),
      quiz_results: quizSnap.val() || {},
      sessions: sessionsSnap.val() || {}
    };

    const fileName = `snapshots/analytics-${Date.now()}.json`;
    const file = bucket.file(fileName);

    await file.save(JSON.stringify(snapshotData, null, 2), {
      metadata: { contentType: 'application/json' }
    });

    console.log(`[Storage] Uploaded snapshot: ${fileName}`);
  } catch (err) {
    console.error('[Storage] Snapshot upload failed:', err.message);
  }
}

module.exports = { initStorage, uploadAnalyticsSnapshot };
