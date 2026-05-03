/**
 * @fileoverview Firebase Admin SDK service for ElectIQ.
 * Manages session data, quiz scores, checklist progress, timelines,
 * and server-side analytics event tracking.
 *
 * @module services/firebase
 * @requires firebase-admin
 */

'use strict';

const admin = require('firebase-admin');

/* ------------------------------------------------------------------ */
/*  Singleton database reference                                       */
/* ------------------------------------------------------------------ */

/** @type {admin.database.Database|null} */
let db = null;

/* ------------------------------------------------------------------ */
/*  Seed data — general Indian election timeline                       */
/* ------------------------------------------------------------------ */

/**
 * Default election timeline steps seeded into Firebase on first boot.
 * Structured as a map of state keys to ordered step objects.
 *
 * @constant {Object}
 */
const ELECTION_TIMELINES = {
  general: {
    step1: {
      id: 1,
      title: 'Check voter registration',
      description:
        'Verify your name on the electoral roll at voters.eci.gov.in',
      deadline: 'Before nomination period',
      status: 'pending',
      icon: '📋',
      link: 'https://voters.eci.gov.in',
      category: 'Registration',
    },
    step2: {
      id: 2,
      title: 'Register if not enrolled',
      description: 'Submit Form 6 on NVSP portal with supporting documents',
      deadline: '30 days before polls',
      status: 'pending',
      icon: '✍️',
      link: 'https://voters.eci.gov.in/register-as-voter',
      category: 'Registration',
    },
    step3: {
      id: 3,
      title: 'Download / update voter ID',
      description: 'Download e-EPIC card from voterportal.eci.gov.in',
      deadline: 'Anytime',
      status: 'pending',
      icon: '🪪',
      link: 'https://voterportal.eci.gov.in',
      category: 'Identity',
    },
    step4: {
      id: 4,
      title: 'Find your polling booth',
      description:
        'Search your booth address and serial number on electoral roll',
      deadline: '1 week before polling',
      status: 'pending',
      icon: '📍',
      link: 'https://voters.eci.gov.in',
      category: 'Preparation',
    },
    step5: {
      id: 5,
      title: 'Polling day — cast your vote',
      description:
        'Carry approved photo ID. Press button next to your chosen symbol on EVM. VVPAT confirms your vote.',
      deadline: 'Election day',
      status: 'pending',
      icon: '🗳️',
      link: null,
      category: 'Voting',
    },
    step6: {
      id: 6,
      title: 'Track results',
      description: 'Watch live results on results.eci.gov.in after polls close',
      deadline: 'Results day',
      status: 'pending',
      icon: '📊',
      link: 'https://results.eci.gov.in',
      category: 'Results',
    },
  },
  maharashtra: {
    step1: {
      id: 1,
      title: 'Check Maharashtra electoral roll',
      description:
        'Verify your name at ceo.maharashtra.gov.in or voters.eci.gov.in',
      deadline: 'Before nomination period',
      status: 'pending',
      icon: '📋',
      link: 'https://ceo.maharashtra.gov.in',
      category: 'Registration',
    },
    step2: {
      id: 2,
      title: 'Register via Form 6',
      description:
        'Submit online at NVSP portal or offline at your Taluka office',
      deadline: '30 days before polls',
      status: 'pending',
      icon: '✍️',
      link: 'https://voters.eci.gov.in/register-as-voter',
      category: 'Registration',
    },
    step3: {
      id: 3,
      title: 'Download e-EPIC card',
      description:
        'Maharashtra voters can download digital EPIC from voterportal.eci.gov.in',
      deadline: 'Anytime',
      status: 'pending',
      icon: '🪪',
      link: 'https://voterportal.eci.gov.in',
      category: 'Identity',
    },
    step4: {
      id: 4,
      title: 'Find your polling booth',
      description: 'Search your booth via CEO Maharashtra or NVSP portal',
      deadline: '1 week before polling',
      status: 'pending',
      icon: '📍',
      link: 'https://ceo.maharashtra.gov.in',
      category: 'Preparation',
    },
    step5: {
      id: 5,
      title: 'Cast your vote on polling day',
      description: 'Carry approved photo ID. Use EVM + VVPAT verification.',
      deadline: 'Election day',
      status: 'pending',
      icon: '🗳️',
      link: null,
      category: 'Voting',
    },
    step6: {
      id: 6,
      title: 'Track Maharashtra results',
      description:
        'Live results on results.eci.gov.in and CEO Maharashtra portal',
      deadline: 'Results day',
      status: 'pending',
      icon: '📊',
      link: 'https://results.eci.gov.in',
      category: 'Results',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Initialisation                                                     */
/* ------------------------------------------------------------------ */

/**
 * Initialise Firebase Admin SDK and seed timeline data if missing.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * @returns {Promise<void>}
 * @throws {Error} If FIREBASE_DATABASE_URL is missing or connection fails
 */
async function initFirebase() {
  if (admin.apps.length) {
    return;
  }

  let serviceAccount;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}';
    const clean =
      (raw.startsWith("'") && raw.endsWith("'")) ||
      (raw.startsWith('"') && raw.endsWith('"'))
        ? raw.slice(1, -1)
        : raw;
    serviceAccount = JSON.parse(clean);
  } catch (err) {
    console.error('[Firebase] JSON Parse Error:', err.message);
    console.error(
      '[Firebase] Raw value starts with:',
      (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').substring(0, 20),
    );
    throw err;
  }

  const credential = admin.credential.cert(serviceAccount);

  admin.initializeApp({
    credential,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.GCLOUD_STORAGE_BUCKET,
  });

  db = admin.database();

  // Seed election timeline data if not present or general key missing
  const snap = await db.ref('timelines').once('value');
  const hasGeneral = snap.exists() && snap.child('general').exists();

  if (!snap.exists() || !hasGeneral) {
    console.log('[Firebase] Seeding/Updating election timeline data...');
    // Use update to merge instead of set to overwrite everything
    await db.ref('timelines').update(ELECTION_TIMELINES);
  }
}

/* ------------------------------------------------------------------ */
/*  Database accessor                                                  */
/* ------------------------------------------------------------------ */

/**
 * Returns the initialised Firebase Realtime Database reference.
 *
 * @returns {admin.database.Database}
 * @throws {Error} If Firebase has not been initialised yet
 */
function getDB() {
  if (!db) {
    throw new Error('Firebase not initialised — call initFirebase() first');
  }
  return db;
}

/* ------------------------------------------------------------------ */
/*  Session management                                                 */
/* ------------------------------------------------------------------ */

/**
 * Save or update a user session with their voter profile.
 *
 * @param {string} sessionId - Unique session identifier
 * @param {Object} profile   - Voter profile data
 * @returns {Promise<void>}
 */
async function saveSession(sessionId, profile) {
  await getDB()
    .ref(`sessions/${sessionId}`)
    .update({
      ...profile,
      updatedAt: Date.now(),
    });
}

/* ------------------------------------------------------------------ */
/*  Quiz results                                                       */
/* ------------------------------------------------------------------ */

/**
 * Record a quiz attempt result for analytics and adaptive difficulty.
 *
 * @param {string} sessionId
 * @param {Object} result - { topic, correct, difficulty }
 * @returns {Promise<void>}
 */
async function recordQuizResult(sessionId, result) {
  await getDB()
    .ref(`quiz_results/${sessionId}`)
    .push({
      ...result,
      timestamp: Date.now(),
    });
}

/* ------------------------------------------------------------------ */
/*  Checklist progress                                                 */
/* ------------------------------------------------------------------ */

/**
 * Save a single checklist item's completion status.
 *
 * @param {string} sessionId
 * @param {Object} progress - { [itemId]: boolean } map
 * @returns {Promise<void>}
 */
async function saveChecklistProgress(sessionId, progress) {
  await getDB()
    .ref(`checklists/${sessionId}`)
    .update({
      ...progress,
      updatedAt: Date.now(),
    });
}

/**
 * Retrieve checklist progress for a session.
 *
 * @param {string} sessionId
 * @returns {Promise<Object>} Progress map or empty object
 */
async function getChecklistProgress(sessionId) {
  const snap = await getDB().ref(`checklists/${sessionId}`).once('value');
  return snap.exists() ? snap.val() : {};
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */

/**
 * Track a feature-usage event in Firebase RTDB.
 * Non-critical — failures are silently swallowed.
 *
 * @param {string} eventName  - Event identifier
 * @param {Object} [params={}] - Event parameters
 * @returns {Promise<void>}
 */
async function trackEvent(eventName, params = {}) {
  try {
    await getDB().ref('analytics/events').push({
      event: eventName,
      params,
      timestamp: Date.now(),
    });
  } catch {
    /* Analytics is non-critical — do not block the request */
  }
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

/**
 * Get election timeline steps for a specific state.
 * Falls back to the general timeline if state-specific data is unavailable.
 *
 * @param {string} [state='general'] - State name
 * @returns {Promise<Array<Object>>} Array of timeline step objects
 */
async function getTimeline(state) {
  const key = state?.toLowerCase().replace(/\s+/g, '_') || 'general';
  const snap = await getDB().ref(`timelines/${key}`).once('value');

  if (snap.exists()) {
    return Object.values(snap.val());
  }

  // Fall back to general timeline
  const generalSnap = await getDB().ref('timelines/general').once('value');
  if (generalSnap.exists()) {
    return Object.values(generalSnap.val());
  }

  // Final hardcoded safety fallback if database is empty
  return [
    {
      id: 1,
      title: 'Check voter registration',
      description: 'Verify your name on the electoral roll',
      deadline: 'Before polls',
      icon: '📋',
      category: 'Registration',
    },
    {
      id: 2,
      title: 'Cast your vote',
      description: 'Carry approved ID to your polling booth',
      deadline: 'Election day',
      icon: '🗳️',
      category: 'Voting',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

module.exports = {
  initFirebase,
  getDB,
  saveSession,
  recordQuizResult,
  saveChecklistProgress,
  getChecklistProgress,
  trackEvent,
  getTimeline,
};
