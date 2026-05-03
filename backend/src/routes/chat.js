/**
 * @fileoverview Chat route for ElectIQ AI assistant.
 * Handles multi-turn Gemini conversations with full voter-profile
 * context injection and graceful fallback to local intent matching.
 *
 * @module routes/chat
 */

'use strict';

const express = require('express');
const router  = express.Router();

const { chat, localFallback } = require('../services/gemini');
const { saveSession, trackEvent } = require('../services/firebase');

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/* ------------------------------------------------------------------ */

/**
 * Handle a user chat message.
 *
 * @route POST /api/chat
 * @param {Object} req.body
 * @param {string} req.body.message     - User's question (required, max 1000 chars)
 * @param {Object} [req.body.profile]   - Voter profile { state, electionType, isFirstTime, age }
 * @param {Array}  [req.body.history]   - Conversation turns [{ role, text }]
 * @param {string} [req.body.sessionId] - Session ID for persistence
 * @returns {{ reply: string, timestamp: number }}
 */
router.post('/', async(req, res, next) => {
  try {
    const { message, profile = {}, history = [], sessionId, language = 'English', image } = req.body;

    /* ---------- validation ---------- */
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '`message` (string) is required' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' });
    }

    /* ---------- persist session ---------- */
    if (sessionId && profile.state) {
      await saveSession(sessionId, profile).catch(() => {});
    }

    /* ---------- Gemini → local fallback ---------- */
    let reply;
    try {
      reply = await chat(message, profile, history, language, image);
    } catch (err) {
      console.warn('[Chat] Gemini unavailable, using local fallback:', err.message);
      reply = localFallback(message, profile);
    }

    /* ---------- analytics ---------- */
    await trackEvent('chat_message', {
      sessionId: sessionId || 'anon',
      state: profile.state || 'unknown',
      isFirstTime: profile.isFirstTime || false,
    }).catch(() => {});

    return res.json({ reply, timestamp: Date.now() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
