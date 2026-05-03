/**
 * @fileoverview Gemini AI service for ElectIQ.
 * Centralises all Gemini 2.5 Flash interactions including chat,
 * quiz generation, checklist generation, and local fallback.
 * Supports multilingual responses via state-to-language mapping.
 *
 * @module services/gemini
 * @requires @google/generative-ai
 */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

/* ------------------------------------------------------------------ */
/*  Singleton client                                                  */
/* ------------------------------------------------------------------ */

/** @type {GoogleGenerativeAI|null} Cached Gemini client instance */
let client = null;

/**
 * Map of Indian states/UTs to their official regional language.
 * Used to determine the AI response language when the user
 * toggles away from English.
 *
 * @constant {Object<string, string>}
 */
const STATE_LANGUAGES = {
  'Andhra Pradesh': 'Telugu', 'Arunachal Pradesh': 'English', 'Assam': 'Assamese',
  'Bihar': 'Hindi', 'Chhattisgarh': 'Hindi', 'Goa': 'Konkani', 'Gujarat': 'Gujarati',
  'Haryana': 'Hindi', 'Himachal Pradesh': 'Hindi', 'Jharkhand': 'Hindi',
  'Karnataka': 'Kannada', 'Kerala': 'Malayalam', 'Madhya Pradesh': 'Hindi',
  'Maharashtra': 'Marathi', 'Manipur': 'Manipuri', 'Meghalaya': 'English',
  'Mizoram': 'Mizo', 'Nagaland': 'English', 'Odisha': 'Odia', 'Punjab': 'Punjabi',
  'Rajasthan': 'Hindi', 'Sikkim': 'Nepali', 'Tamil Nadu': 'Tamil',
  'Telangana': 'Telugu', 'Tripura': 'Bengali', 'Uttar Pradesh': 'Hindi',
  'Uttarakhand': 'Hindi', 'West Bengal': 'Bengali', 'Delhi': 'Hindi',
  'Jammu & Kashmir': 'Urdu', 'Ladakh': 'Hindi', 'Puducherry': 'Tamil',
  'Chandigarh': 'Hindi',
};

function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set in environment');
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

/**
 * Build the system prompt with the current date and language injected
 * so Gemini always knows "today" and responds in the correct language.
 *
 * @param {string} [language='English'] - Response language
 * @returns {string} Complete system instruction
 */
function buildSystemPrompt(language = 'English') {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const langInstruction = language === 'English'
    ? 'LANGUAGE: You MUST respond ONLY in English. Do NOT use any regional language.'
    : `LANGUAGE: You MUST respond in ${language} script/language. Use ${language} for all text. Only use English for proper nouns like "Election Commission of India", URLs, and form names like "Form 6".`;

  return `You are ElectIQ, an expert AI election companion for Indian citizens.
You help voters understand the election process, their rights, required documents, polling procedures, and civic responsibilities.

TODAY'S DATE: ${today}

${langInstruction}

CRITICAL 2026 ELECTION FACTS (use these to give accurate, timely answers):
- The Tamil Nadu Vidhan Sabha (State Assembly) election was held on **April 24, 2026**.
- Voter registration deadline was approximately 30 days before polling day.
- Results are expected to be declared by the Election Commission of India shortly after counting.
- For official results and schedules, direct users to https://eci.gov.in and https://results.eci.gov.in.
- If a user asks about "when is the election" for Tamil Nadu 2026, it has ALREADY happened on April 24, 2026.

Your personality: warm, clear, encouraging, and non-partisan. You never express political opinions or favour any party, candidate, or ideology.

Response rules:
- ALWAYS tailor answers to the user's specific state, election type, and voter profile provided in context
- Use simple language accessible to first-time voters
- Bold key information using **text** (deadlines, document names, section numbers)
- Structure complex answers with clear numbered steps
- Keep responses to 3-4 sentences for simple questions, longer for complex procedures
- Always mention if deadlines are approaching or have already passed
- When you don't know a specific local rule, say so clearly and direct to official sources (https://eci.gov.in)
- Never make up registration numbers, constituency data, or polling booth addresses
- Always end responses about voting rights with encouragement to vote`;
}

/* ------------------------------------------------------------------ */
/*  Chat                                                               */
/* ------------------------------------------------------------------ */

/**
 * Send a message to Gemini with full voter-profile context and
 * multi-turn conversation history.
 *
 * @param {string}  message            - The user's question
 * @param {Object}  [profile={}]       - Voter profile
 * @param {string}  [profile.state]    - Indian state name
 * @param {string}  [profile.electionType] - Lok Sabha / Vidhan Sabha / etc.
 * @param {boolean} [profile.isFirstTime]  - First-time voter flag
 * @param {number}  [profile.age]      - Voter age
 * @param {Array<{role:string,text:string}>} [history=[]] - Prior turns
 * @param {string}  [language='English']  - BCP-47 language name for response (e.g. 'Tamil', 'Hindi')
 * @param {string|null} [imageBase64=null] - Base64-encoded image data for multimodal vision queries
 * @returns {Promise<string>} Gemini's response text
 */
async function chat(message, profile = {}, history = [], language = 'English', imageBase64 = null) {
  const profileContext = profile.state
    ? `\n\nUser profile: State: ${profile.state} | Election type: ${profile.electionType || 'General'} | First-time voter: ${profile.isFirstTime ? 'Yes' : 'No'} | Age: ${profile.age || 'Unknown'}`
    : '\n\nUser profile: Not yet set — ask a clarifying question about their state if location-specific.';

  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
    systemInstruction: { parts: [{ text: buildSystemPrompt(language) + profileContext }] },
  });

  const chatSession = model.startChat({
    history: history.slice(-12).map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
  });

  let payload = message;
  if (imageBase64) {
    // Attempt to parse mime type from base64 if needed, default to jpeg
    payload = [
      { text: message },
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
    ];
  }

  const result = await chatSession.sendMessage(payload);
  return result.response.text();
}

/* ------------------------------------------------------------------ */
/*  Quiz question generation                                           */
/* ------------------------------------------------------------------ */

/**
 * Generate a single adaptive multiple-choice quiz question about the
 * Indian election process.  Difficulty scales 1-3 and previously
 * covered topics are excluded.
 *
 * @param {Object}   profile                  - Voter profile
 * @param {number}   [difficulty=1]           - 1 = basic, 2 = intermediate, 3 = advanced
 * @param {string[]} [previousTopics=[]]      - Topics already asked
 * @param {string}   [language='English']      - Response language
 * @returns {Promise<{question:string,options:string[],correctIndex:number,explanation:string,topic:string}>}
 */
async function generateQuizQuestion(profile, difficulty = 1, previousTopics = [], language = 'English') {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
  });

  const difficultyLabel = ['', 'basic', 'intermediate', 'advanced'][difficulty] || 'basic';
  const stateContext = profile.state ? `for someone in ${profile.state}` : '';
  const avoidTopics = previousTopics.length
    ? `Avoid these topics already covered: ${previousTopics.join(', ')}.`
    : '';
  const langNote = language === 'English'
    ? 'Write everything in English.'
    : `Write the question, options, and explanation in ${language} language/script. Keep JSON keys in English.`;

  const prompt = `Generate one ${difficultyLabel} multiple-choice quiz question about the Indian election process ${stateContext}.
${avoidTopics}
${langNote}
Topics to draw from: voter registration, EPIC cards, EVM machines, VVPAT, Model Code of Conduct, polling procedures, constitutional rights, Election Commission of India, delimitation, nomination process, counting procedures.

Respond ONLY with valid JSON (no markdown):
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "2-sentence explanation of why this is correct",
  "topic": "short topic name"
}`;

  const result = await model.generateContent(prompt);
  return _extractJson(result.response.text());
}

/* ------------------------------------------------------------------ */
/*  Checklist generation                                               */
/* ------------------------------------------------------------------ */

/**
 * Generate a personalised election-preparation document checklist
 * based on the voter's state, election type, and experience level.
 *
 * @param {Object}  profile
 * @param {string}  [profile.state]
 * @param {string}  [profile.electionType]
 * @param {boolean} [profile.isFirstTime]
 * @param {number}  [profile.age]
 * @param {string}  [language='English'] - Response language
 * @returns {Promise<Array<{id:string,category:string,task:string,detail:string,isRequired:boolean,officialLink:string|null}>>}
 */
async function generateChecklist(profile, language = 'English') {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
  });

  const langNote = language === 'English'
    ? 'Write all task and detail text in English.'
    : `Write task and detail text in ${language} language/script. Keep JSON keys, category values, and URLs in English.`;

  const prompt = `Generate a personalised election preparation checklist for:
State: ${profile.state || 'India (general)'}
Election type: ${profile.electionType || 'Lok Sabha'}
First-time voter: ${profile.isFirstTime ? 'Yes' : 'No'}
Age: ${profile.age || 'Adult'}
${langNote}

Return ONLY valid JSON array (no markdown):
[
  {
    "id": "unique_id",
    "category": "Registration|Identity|Polling Day|Post-Voting",
    "task": "Task description",
    "detail": "One sentence of helpful detail",
    "isRequired": true,
    "officialLink": "https://eci.gov.in or relevant URL or null"
  }
]
Include 10-14 items. First-time voters need registration steps. All voters need ID and polling day steps.`;

  const result = await model.generateContent(prompt);
  return _extractJson(result.response.text());
}

/* ------------------------------------------------------------------ */
/*  Local fallback (offline / quota-exceeded)                          */
/* ------------------------------------------------------------------ */

/**
 * Intent-matched fallback responses that work without any API key.
 * Provides genuinely useful civic information from a curated knowledge base.
 *
 * @param {string} message        - The user's message
 * @param {Object} [profile={}]   - Voter profile for state-specific answers
 * @returns {string} Formatted response text
 */
function localFallback(message, profile = {}) {
  const m = message.toLowerCase();
  const state = profile.state || 'your state';

  if (m.match(/register|registration|voter\s*id|epic|enrol/)) {
    return `To register as a voter in ${state}, visit the **National Voter Services Portal** (voters.eci.gov.in) and fill **Form 6**. You'll need proof of age, address, and a photograph. The process typically takes 2-4 weeks. **You must be 18+ as of the qualifying date** for that election. Visit https://voters.eci.gov.in to begin.`;
  }

  if (m.match(/booth|polling|where.*vote|find.*station|location/)) {
    return 'To find your polling booth, visit **voters.eci.gov.in** and enter your details under "Know Your Polling Booth." You can also search by your Voter ID number. The booth details show address, building name, and your serial number on the electoral roll.';
  }

  if (m.match(/document|id\b|identity|what.*bring|carry|aadhaar/)) {
    return 'At the polling booth you must carry **one of these 12 approved photo IDs**: Aadhaar card, Voter ID (EPIC), Passport, Driving licence, PAN card, MNREGA job card, Smart card, Bank passbook with photo, Health insurance smart card, Pension document with photo, NPR smart card, or Official identity card. Your **Voter ID (EPIC) is the most reliable choice**.';
  }

  if (m.match(/evm|machine|voting\s*machine|press\s*button|electronic/)) {
    return 'EVMs (Electronic Voting Machines) are used in all Indian elections. At the booth: **Step 1** — your name is verified on the electoral roll. **Step 2** — you receive a slip. **Step 3** — press the button next to your chosen candidate\'s symbol on the Balloting Unit. **Step 4** — a VVPAT slip will appear briefly confirming your vote. The process takes under 2 minutes.';
  }

  if (m.match(/model\s*code|mcc|conduct/)) {
    return 'The **Model Code of Conduct (MCC)** is a set of guidelines issued by the Election Commission of India when elections are announced. It restricts: use of government machinery for campaigning, announcement of new policies/schemes, use of official vehicles for electioneering. It applies to all political parties and candidates until results are declared. Violations can be reported to the ECI.';
  }

  if (m.match(/result|count|winner|when.*result/)) {
    return 'Vote counting happens at counting centres after polling ends. Candidates with the **most votes (first-past-the-post system)** in each constituency win. Results are announced by the Returning Officer and published on **results.eci.gov.in** in real time. Lok Sabha results are usually declared within 24 hours of counting beginning.';
  }

  if (m.match(/right|constitutional|fundamental|article/)) {
    return 'Voting is a **constitutional right** under **Article 326** of the Indian Constitution. Every citizen aged 18 and above can vote regardless of caste, religion, gender, or economic status. The right to vote is also protected under the **Representation of the People Act, 1951**. Exercise your right — every vote shapes the nation\'s future!';
  }

  if (m.match(/deadline|last\s*date|when.*register|time/)) {
    return `Key deadlines vary by election. Generally: **Voter registration closes 30 days before polling day**. The election schedule is announced by the Election Commission of India on **eci.gov.in**. Check your state-specific dates for the ${profile.electionType || 'upcoming'} election. Setting up early is always recommended!`;
  }

  return `I'm your election guide! You can ask me about: **voter registration**, **required documents**, **finding your polling booth**, **how EVMs work**, **election timelines**, **your voting rights**, or take a **civic knowledge quiz**. What would you like to know about the ${profile.electionType || 'election'} process?`;
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

module.exports = {
  chat,
  generateQuizQuestion,
  generateChecklist,
  localFallback,
  STATE_LANGUAGES,
};
