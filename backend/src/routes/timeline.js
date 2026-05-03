/**
 * @fileoverview Election timeline route.
 * Returns personalised step-by-step election journey for a given state.
 *
 * @module routes/timeline
 */

'use strict';

const express = require('express');
const router = express.Router();

const { getTimeline } = require('../services/firebase');

/* ------------------------------------------------------------------ */
/*  GET /api/timeline/:state?                                          */
/* ------------------------------------------------------------------ */

/**
 * Retrieve election timeline steps for a state.
 * Falls back to the general timeline if no state-specific data exists.
 *
 * @route GET /api/timeline/:state?
 * @param {string} [req.params.state='general'] - Indian state name (alpha + spaces only)
 * @returns {{ timeline: Array, state: string, timestamp: number }}
 */
router.get('/:state?', async(req, res, next) => {
  try {
    const state = req.params.state || 'general';

    // Validate state parameter — alpha, spaces, hyphens, underscores only
    if (!/^[a-zA-Z\s_-]{1,50}$/.test(state)) {
      return res.status(400).json({ error: 'Invalid state name' });
    }

    const timeline = await getTimeline(state);
    return res.json({ timeline, state, timestamp: Date.now() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
