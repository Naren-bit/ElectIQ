/**
 * @fileoverview Quiz route — Gemini-generated adaptive civic knowledge questions.
 * Difficulty scales automatically based on correct / incorrect answers.
 *
 * @module routes/quiz
 */

'use strict';

const express = require('express');
const router = express.Router();

const { generateQuizQuestion } = require('../services/gemini');
const { recordQuizResult, trackEvent } = require('../services/firebase');

/* ------------------------------------------------------------------ */
/*  GET /api/quiz/question                                             */
/* ------------------------------------------------------------------ */

/**
 * Generate a single quiz question at the requested difficulty.
 *
 * @route GET /api/quiz/question
 * @query {number} [difficulty=1] - 1 (basic), 2 (intermediate), 3 (advanced)
 * @query {string} [state]        - Indian state for regional questions
 * @query {string} [previousTopics] - Comma-separated list of covered topics
 * @returns {{ question: Object, timestamp: number }}
 */
router.get('/question', async(req, res, next) => {
  try {
    const difficulty = Math.min(
      3,
      Math.max(1, parseInt(req.query.difficulty, 10) || 1),
    );
    const profile = { state: req.query.state || null };
    const language = req.query.language || 'English';
    const prevTopics = req.query.previousTopics
      ? req.query.previousTopics.split(',').map((t) => t.trim())
      : [];

    const question = await generateQuizQuestion(
      profile,
      difficulty,
      prevTopics,
      language,
    );
    return res.json({ question, timestamp: Date.now() });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/quiz/answer                                              */
/* ------------------------------------------------------------------ */

/**
 * Record a quiz answer and return the next suggested difficulty.
 *
 * @route POST /api/quiz/answer
 * @param {Object} req.body
 * @param {string}  req.body.sessionId  - Session identifier (required)
 * @param {string}  [req.body.topic]    - Topic of the question
 * @param {boolean} req.body.correct    - Whether the answer was correct (required)
 * @param {number}  [req.body.difficulty] - Current difficulty level
 * @returns {{ success: boolean, nextDifficulty: number }}
 */
router.post('/answer', async(req, res, next) => {
  try {
    const { sessionId, topic, correct, difficulty } = req.body;

    if (!sessionId || typeof correct !== 'boolean') {
      return res
        .status(400)
        .json({ error: '`sessionId` and `correct` (boolean) are required' });
    }

    await recordQuizResult(sessionId, { topic, correct, difficulty });
    await trackEvent('quiz_answer', { sessionId, correct, topic });

    // Adaptive difficulty: correct → harder, wrong → easier
    const nextDifficulty = correct
      ? Math.min(3, (difficulty || 1) + 1)
      : Math.max(1, (difficulty || 1) - 1);

    return res.json({ success: true, nextDifficulty });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
