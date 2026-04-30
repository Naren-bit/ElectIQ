# 🗳️ ElectIQ — Your Personal Election Journey Companion

[![Express](https://img.shields.io/badge/Express-4.x-000?style=for-the-badge&logo=express)](https://expressjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Jest](https://img.shields.io/badge/Tested_with_Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io)

> **AI-powered civic guide that makes the Indian election process personal, clear, and accessible.** Ask questions, track your checklist, test your knowledge, and find your polling booth — tailored exactly to your voter profile.

---

## 🎯 Chosen Vertical
**Election Process Assistant — Challenge 2**
ElectIQ is designed to help voters understand the complex election process, timelines, and legal requirements in an interactive, easy-to-follow way. We target the millions of Indians (especially first-time voters) who find generic government portals confusing.

## 🧠 Approach & Logic
Our core logic shifts civic engagement from *static FAQ pages* to *dynamic, context-aware routing*.
Instead of giving generic answers, ElectIQ asks 3 onboarding questions (State, Election Type, Experience Level) and injects this profile into every interaction. Gemini 2.5 Flash reasons over this specific context, ensuring a first-time voter in Maharashtra gets fundamentally different, localized advice compared to a veteran voter in Tamil Nadu.

---

## 🚀 Live Demo Guide for Judges

To see the **Top Hackathon features**, follow this 90-second demo sequence:

1. **Open the App (`/`)**: You are presented with the clean, light-themed PWA. Complete the 3-step personalized onboarding to set your Voter Profile.
2. **View Election Journey**: Navigate to the "Journey" tab. Notice how the timeline is dynamically seeded from Firebase, showing real deadlines for your selected state.
3. **Multimodal AI Vision**: Switch to the **Ask AI** tab. Click the 📷 Camera icon next to the chat bar and upload an image (e.g., a photo of an ID document). Gemini 2.5 Flash analyzes it instantly and tells you if it's a valid voting ID.
4. **Adaptive Civic Quiz**: Open the **Quiz** tab. Answer a question incorrectly and watch Gemini automatically generate a slightly easier question (or a harder one if you get it right), adjusting the difficulty on the fly.
5. **Interactive Booth Map**: Go to the **Dashboard** and tap "Find my booth". A live, interactive map (OpenStreetMap/Leaflet) immediately renders your approximate polling zone without needing a refresh.

---

## Problem Statement Alignment

This project directly addresses the PromptWars challenge parameters:

| Challenge Dimension | ElectIQ Solution |
|---|---|
| **Understand the process** | Personalised visual timeline breaking down complex legal jargon into steps |
| **Interactive experience** | Adaptive Gemini-powered civic quiz that scales in difficulty |
| **Easy-to-follow steps** | Dynamic checklist generated specifically for the user's voter profile |
| **Conversational AI** | Gemini 2.5 Flash provides natural, context-aware answers in regional languages |
| **Real-world navigation** | Integrated mapping to visualize polling booth locations |

---

## ✨ What Makes ElectIQ Different

- 🎯 **Profile-Aware Intelligence** — Pick your state once. Every Gemini response is personalized for your specific regional rules and experience level.
- 👁️ **Multimodal AI Vision** — Upload a photo of any document; Gemini analyzes it visually to confirm if it's a valid ID for polling day.
- 🌐 **Multilingual Architecture** — ElectIQ automatically detects your state (e.g., Tamil Nadu) and instructs Gemini to respond in the native regional language (Tamil).
- 🧩 **Adaptive Quizzes** — Not a static question bank. Gemini generates unique multiple-choice questions in real-time, tracking your topic coverage via Firebase.
- 📋 **Generative UI** — Gemini generates structured JSON payloads in the backend that render into interactive HTML document checklists.
- 🗣️ **Voice Accessibility** — Push-to-talk Web Speech API integration with native TTS for hands-free civic navigation.

---

## 🎨 UI Design: "Civic Trust"

Unlike most hackathon projects that use a dark "hacker" aesthetic, ElectIQ uses a **clean, light theme**. Civic applications require high contrast and trust signals to feel authoritative and accessible to actual voters.

| Design Token | Value |
|---|---|
| **Background** | `#f8f9fa` (off-white) |
| **Surface** | `#ffffff` (elevated cards) |
| **Accent Primary** | `#4285F4` (Google Blue - trust) |
| **Success** | `#34A853` (green) |
| **Warning** | `#FBBC04` / **Danger** `#EA4335` |
| **Typography** | Inter (highly legible, accessible sans-serif) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    PWA Frontend                          │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────┐ ┌──────┐    │
│  │ Home │ │Journey │ │ Chat │ │Checklist│ │ Quiz │    │
│  └──┬───┘ └───┬────┘ └──┬───┘ └────┬────┘ └──┬───┘    │
│     │         │         │          │          │         │
│  Profile   Timeline   Gemini    Gemini     Gemini      │
│  Setup     Render     Chat      Checklist  Quiz Gen    │
│     │         │         │          │          │         │
│  Session    Firebase   REST      REST       REST       │
│  Storage    Cache      API       API        API        │
└─────┼─────────┼─────────┼──────────┼──────────┼────────┘
      │         │         │          │          │
      ▼         ▼         ▼          ▼          ▼
┌──────────────────────────────────────────────────────────┐
│              Express Backend (Node.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Helmet  │ │   Rate   │ │  Input   │ │  Request  │  │
│  │   CSP    │ │ Limiting │ │ Sanitise │ │    ID     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                                                          │
│  /api/chat  /api/quiz  /api/timeline  /api/checklist    │
└─────┬──────────┬───────────┬──────────────┬─────────────┘
      │          │           │              │
      ▼          ▼           ▼              ▼
┌───────────┐  ┌───────────────────────────────────┐
│  Gemini   │  │        Firebase RTDB              │
│ 2.5 Flash │  │  sessions / quiz / checklists /   │
│  + Vision │  │  timelines / analytics             │
└───────────┘  └───────────────────────────────────┘
```

---

## How It Works

### 1. 🤖 Gemini AI — Profile-Aware Conversations
When a voter asks *"What documents do I need?"*, the backend:
1. Reads the voter's **profile** (State, First-Time Voter)
2. Injects this as strict context into **Gemini 2.5 Flash**
3. Returns a **specific, localized answer** (e.g., mentioning Maharashtra-specific forms).
Multi-turn conversation history is maintained.

### 2. 👁️ Multimodal ID Verification
Users can upload an image of a document directly in the chat. The image is converted to Base64, passed as `inlineData` to Gemini 2.5 Flash, and the AI verifies if it's an acceptable ECI ID proof.

### 3. 🧠 Adaptive Civic Quiz
Correct answers increase difficulty (1→2→3), wrong answers decrease it. The backend tracks topic coverage in Firebase to avoid repetition. Gemini dynamically generates unique questions and explanations each time.

### 4. 🗄️ Firebase Seeded Timelines
Election timelines are not hardcoded. On boot, the backend uses `firebase-seed.json` to automatically populate the Firebase RTDB with state-specific election dates, which the frontend renders dynamically.

---

## 🚀 Google Services Integration

ElectIQ heavily leverages the Google Cloud and Firebase ecosystems to provide a seamless, scalable, and intelligent civic experience. This document outlines exactly how we satisfy the "Google Services" evaluation criteria for PromptWars.

### 1. Gemini AI Integration (Core Engine)
The entire intelligence layer of ElectIQ is powered by the Gemini API.

- **Context-Aware Chat:** We use **Gemini 2.5 Flash** for the primary chat interface. Instead of basic RAG, we dynamically inject the user's "Voter Profile" (State, Election Type, First-Time Status) into the system prompt of every multi-turn conversation. This allows Gemini to give hyper-specific, localized answers.
- **Multimodal Vision:** We implemented **Gemini Vision** capabilities. Users can tap the camera icon in the chat composer to upload an image (like a photo of an ID document), which is sent as `inlineData` to Gemini 2.5 Flash for analysis and guidance.
- **Generative UI:** Gemini is used dynamically in the backend to generate structured JSON payloads that power our UI. Specifically:
  - Generating state-specific **Document Checklists**.
  - Generating adaptive **Civic Quizzes** that scale in difficulty based on the user's previous answers.

### 2. Firebase Realtime Database
We use Firebase RTDB as our primary NoSQL persistence layer for all user states to ensure high performance and low latency.
- **Session Management:** Storing the voter profile state across page reloads.
- **Progress Tracking:** Storing real-time progress for the interactive journey timeline and the dynamic document checklist.
- **Quiz Analytics:** Tracking user scores, streaks, and previously covered topics to ensure Gemini generates *new* questions.

### 3. Firebase Admin SDK
Security is paramount for civic technology. Instead of exposing our database to the frontend, we use the **Firebase Admin SDK** in our Express.js backend.
- Service Account authentication ensures that all database writes are securely handled server-side.
- The `firebase-seed.json` structure is automatically injected into the database on boot if the timeline data is missing.

### 4. Google Analytics 4 (via Firebase Web SDK)
We integrated Google Analytics natively on the frontend via the Firebase Web SDK to track explicit user journeys and feature adoption.
- **Events tracked:** `profile_set`, `tab_viewed`, `chat_sent`, `timeline_step_completed`, `checklist_item_checked`, `quiz_answer`, and `booth_map_opened`.
- This provides operators with immediate insight into which parts of the civic pipeline users engage with most heavily.

### 5. Server-Side Analytics Tracking
To maintain a high-performance, lightweight PWA frontend (and to bypass ad-blockers), we migrated our user analytics server-side.
- We track critical user interactions (e.g., `chat_sent`, `quiz_answer`, `booth_map_opened`) by piping them through our Express backend directly into Firebase. This creates a secure, robust analytics pipeline without bloating the client with tracking scripts.

### 6. Cloud Storage (Firebase) — Analytics Archive
Every 20 minutes, a full JSON snapshot of all session and quiz analytics is uploaded to Google Cloud Storage.
- **Path pattern:** `snapshots/analytics-{timestamp}.json`
- **Purpose:** Historical user behavior pattern analysis and civic engagement tracking.
- **Graceful degradation:** If the bucket is not configured, uploads are silently skipped without affecting performance.

### 7. Google Cloud Run — Production Deployment
The backend is containerized for deployment on Google Cloud Run, enabling:
- **Auto-scaling** from 0 to N instances based on traffic.
- **Session affinity** for Socket.IO WebSocket persistence.
- **Cold start optimization** via lightweight Alpine-based Node.js image.

### 8. Google Cloud Build — CI/CD Pipeline
Automated build pipeline (`cloudbuild.yaml`) that:
1. Installs dependencies
2. Runs the full Jest test suite
3. Builds the Docker container
4. Deploys to Cloud Run

---

### Service Integration Summary

| Google Service | SDK/Package | Purpose | File |
|---|---|---|---|
| **Gemini 2.5 Flash** | `@google/generative-ai` | AI chat, context analysis, quizzes | `services/gemini.js` |
| **Firebase RTDB** | `firebase-admin` | Real-time session and journey tracking | `services/firebase.js` |
| **Firebase Admin SDK** | `firebase-admin` | Server-side authentication | `services/firebase.js` |
| **Firebase Analytics** | `firebase-admin` | Server-side event tracking | `services/firebase.js` |
| **Cloud Storage** | `firebase-admin/storage` | Analytics snapshot archive | `services/storage.js` |
| **Cloud Run** | `Dockerfile` | Containerized backend deployment | `Dockerfile` |
| **Cloud Build** | `cloudbuild.yaml` | Automated CI/CD pipeline | `cloudbuild.yaml` |
| **Google Analytics 4** | `firebase-analytics-compat.js` | Frontend usage telemetry | `public/index.html` |

*Note: While we initially integrated Google Maps for the polling booth finder, we swapped to OpenStreetMap/Leaflet strictly to avoid exposing a client-side API key in the public GitHub repository for the hackathon submission. However, our architecture is fully compatible with the Google Maps JS SDK.*

---

## Deployment

### Frontend (Static)
The `public/` directory can be deployed directly via Firebase Hosting or served via the Express backend.

### Backend (Google Cloud Run)
The backend is containerized via the included `Dockerfile` and deployed with auto-scaling enabled. CI/CD is managed via `cloudbuild.yaml`.

```bash
gcloud run deploy electiq-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=xxx,FIREBASE_DATABASE_URL=xxx
```

---

## Local Development Setup

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- A Firebase project with **Realtime Database** enabled
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/Naren-bit/ElectIQ.git
cd ElectIQ

# Install backend dependencies
cd backend
npm install

# Copy env template
cp .env.example .env
```

### 2. Configure Environment
Edit `backend/.env` with your keys.

### 3. Start Development

```bash
# Start backend and serve frontend
npm run dev
# → App runs on http://localhost:3002
```

### 4. Run Tests

```bash
npm test              # Run all 39 Jest tests
npm run test:coverage # With coverage report
```

---

## Project Structure

```
ElectIQ/
├── public/                         ← Frontend PWA
│   ├── index.html                  ← Main Application UI
│   ├── app.js                      ← Frontend logic & state
│   ├── index.css                   ← Light-theme UI styling
│   └── manifest.json               ← PWA manifest
│
├── backend/                        ← Express backend
│   ├── src/
│   │   ├── server.js               ← Entry point (Express)
│   │   ├── routes/
│   │   │   ├── chat.js             ← Gemini chat with profile + image upload
│   │   │   ├── quiz.js             ← Adaptive Quiz Generation
│   │   │   ├── timeline.js         ← Firebase Timeline retrieval
│   │   │   └── checklist.js        ← JSON Checklist generation
│   │   └── services/
│   │       ├── firebase.js         ← Admin SDK + RTDB + Analytics
│   │       ├── gemini.js           ← Gemini Flash + Vision integrations
│   │       └── storage.js          ← Cloud Storage snapshot archiver
│   ├── tests/
│   │   └── api.test.js             ← 39 tests (Jest + Supertest)
│   ├── .env.example
│   └── package.json
│
├── firebase-seed.json              ← Bootstraps RTDB on startup
├── cloudbuild.yaml                 ← Google Cloud Build CI/CD
├── Dockerfile                      ← Containerization
├── GOOGLE_SERVICES.md              ← Detailed Service Architecture
└── README.md
```

---

## Key Engineering Decisions

1. **Voter Profile Context Injection.** Every Gemini API call receives the user's state + election type + first-time status. This transforms generic election answers into specific, actionable guidance.
2. **Multilingual Architecture.** The app dynamically maps the user's selected state to its official regional language (e.g., Tamil Nadu → Tamil). This is passed as an enforced instruction in the Gemini system prompt.
3. **Adaptive Quiz Difficulty.** Correct answers increase difficulty; wrong answers decrease it. Firebase tracks topic coverage to avoid repetition. Gemini generates unique questions each time — no static question bank.
4. **Graceful Degradation.** `localFallback()` provides useful intent-matched responses when Gemini is unavailable. Every tab has hardcoded fallback data.
5. **Security-First Backend.** Helmet strict CSP, per-route rate limiting (60 req/min), input sanitisation (strips HTML), and server-only API keys.
6. **Gemini as a JSON Generator.** We enforce strict JSON schemas for the Checklist and Quiz routes, turning Gemini into a robust backend data generator rather than just a chatbot.

---

## Accessibility

ElectIQ is built with accessibility as a core requirement:

- **ARIA attributes** on all interactive elements (`role="tab"`, `aria-selected`, `aria-live="polite"`)
- **Keyboard navigation** for tab bar
- **Focus-visible outlines** for keyboard users
- **High contrast** — all text passes WCAG AA on the trust-based light theme
- **Voice I/O** — Web Speech API for input and SpeechSynthesis for spoken responses
- **44px minimum touch targets** for mobile accessibility

---

## 🏆 Evaluation Focus Areas

To assist the judges, here is how ElectIQ maximizes the 6 core criteria:

1. **Code Quality**: Modular Express backend. Clear separation of concerns. Clean frontend JavaScript.
2. **Security**: Helmet for HTTP headers, `express-rate-limit`, DOM sanitization, and backend-only Gemini execution.
3. **Efficiency**: Firebase caching, lazy-loaded Leaflet map to preserve bandwidth, and lightweight Alpine Docker image.
4. **Testing**: **39/39 passing Jest tests** covering all API routes, validation edge cases, and mocked Gemini/Firebase services.
5. **Accessibility**: Voice integration, semantic ARIA roles, WCAG AA contrast, and fully responsive layout.
6. **Google Services**: Deep integration of **Gemini 2.5 Flash + Vision** (context-aware chat, image upload, generative UI), **Firebase RTDB** (data layer), **Cloud Storage** (snapshots), and **Google Analytics 4** (telemetry).

---

## Assumptions

- **Election data:** Seeded from public ECI knowledge. Timelines are structurally accurate but exact state-specific dates would require live ECI API integration in a production environment.
- **Mapping Provider:** Polling booth addresses use OpenStreetMap/Leaflet for demo purposes to avoid exposing a client-side Google Maps API key in a public repository, though the architecture natively supports the Google Maps JS SDK.
- **Simulated Polling Booths:** Because live voter roll data is restricted by the ECI, the map assigns mock, realistic polling locations based on the user's selected state (e.g., "Simulated Booth: Chennai Public School" for Tamil Nadu, or "Mumbai Central School" for Maharashtra) rather than querying a real electoral database.
- **Scope:** The application specifically targets Indian elections; internationalization would be a future extension.

---

## 📸 Screenshots

| Home / Onboarding | Ask AI (Chat) | Civic Quiz |
|---|---|---|
| Profile setup with state, election type, voter experience | Gemini 2.5 Flash answering in regional language with voter context | Adaptive quiz with difficulty scaling and streak tracking |

| Election Journey | Document Checklist |
|---|---|
| 6-step visual timeline with Firebase-backed deadlines | Gemini-generated personalised checklist with Firebase progress sync |

> **Live demo:** Deploy using the Docker/Cloud Run instructions below and open the PWA in any browser.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** — ensure all tests pass: `cd backend && npm test`
4. **Commit** with a descriptive message: `git commit -m 'feat: add your feature'`
5. **Push** to your branch: `git push origin feature/your-feature-name`
6. **Open a Pull Request** against `main` with a clear description

### Code standards
- All backend functions must have JSDoc comments (`@param`, `@returns`)
- New routes must have corresponding tests in `api.test.js`
- No secrets or API keys in committed code — use `.env` (see `.env.example`)
- Run `npm test` before every commit; PRs with failing tests will not be merged

---

<p align="center">
  Built for <strong>PromptWars Hackathon</strong> 🏆<br/>
  <em>Making the civic journey personal, clear, and accessible.</em>
</p>
