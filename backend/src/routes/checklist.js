/**
 * @fileoverview Personalised document checklist route.
 * Generates Gemini-powered checklists and persists completion progress
 * in Firebase for cross-session continuity.
 *
 * @module routes/checklist
 */

'use strict';

const express = require('express');
const router  = express.Router();

const { generateChecklist } = require('../services/gemini');
const {
  saveChecklistProgress,
  getChecklistProgress,
  trackEvent,
} = require('../services/firebase');

/* ------------------------------------------------------------------ */
/*  POST /api/checklist/generate                                       */
/* ------------------------------------------------------------------ */

/**
 * Generate a personalised election-preparation checklist.
 *
 * @route POST /api/checklist/generate
 * @param {Object} req.body.profile - { state, electionType, isFirstTime, age }
 * @returns {{ checklist: Array, timestamp: number }}
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { profile = {}, language = 'English' } = req.body;
    const checklist = await generateChecklist(profile, language);
    return res.json({ checklist, timestamp: Date.now() });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/checklist/progress                                       */
/* ------------------------------------------------------------------ */

/**
 * Save a single checklist item's completion status.
 *
 * @route POST /api/checklist/progress
 * @param {Object} req.body
 * @param {string}  req.body.sessionId - Session identifier (required)
 * @param {string}  req.body.itemId    - Checklist item ID (required)
 * @param {boolean} req.body.completed - Completion state (required)
 * @returns {{ success: boolean }}
 */
router.post('/progress', async (req, res, next) => {
  try {
    const { sessionId, itemId, completed } = req.body;

    if (!sessionId || !itemId || typeof completed !== 'boolean') {
      return res.status(400).json({
        error: '`sessionId`, `itemId`, and `completed` (boolean) are required',
      });
    }

    await saveChecklistProgress(sessionId, { [itemId]: completed });
    await trackEvent('checklist_item_completed', { sessionId, itemId });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/checklist/progress/:sessionId                             */
/* ------------------------------------------------------------------ */

/**
 * Retrieve checklist completion progress for a session.
 *
 * @route GET /api/checklist/progress/:sessionId
 * @param {string} req.params.sessionId - 8-64 char alphanumeric + hyphen/underscore
 * @returns {{ progress: Object }}
 */
router.get('/progress/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId format' });
    }

    const progress = await getChecklistProgress(sessionId);
    return res.json({ progress });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
