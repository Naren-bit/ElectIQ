# ElectIQ 🗳️ — Your Personal Election Journey Companion

[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-Powered-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase_RTDB-Connected-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps-Integrated-34A853?logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Jest](https://img.shields.io/badge/Tests-39_passing-green?logo=jest)](https://jestjs.io/)

> AI-powered civic guide that makes the Indian election process **personal, clear, and accessible** for every voter.

---

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your app before submission)*

| Dashboard | Election Journey | Ask AI Chat | Document Checklist |
|:---:|:---:|:---:|:---:|
| <img src="https://via.placeholder.com/200x400.png?text=Dashboard" alt="Dashboard" width="200"/> | <img src="https://via.placeholder.com/200x400.png?text=Journey" alt="Journey" width="200"/> | <img src="https://via.placeholder.com/200x400.png?text=Chat" alt="Chat" width="200"/> | <img src="https://via.placeholder.com/200x400.png?text=Checklist" alt="Checklist" width="200"/> |

---

## Chosen Vertical

**Election Process Assistant** — Challenge 2: *Help users understand the election process, timelines, and steps in an interactive and easy-to-follow way.*

---

## The Problem

Millions of Indians — especially first-time voters — don't vote because the process feels confusing, bureaucratic, and impersonal. Generic government websites answer nobody's specific question. A voter in Maharashtra needs different guidance than one in Tamil Nadu, and a first-time 18-year-old needs fundamentally different help than a seasoned voter.

## The Solution

**ElectIQ adapts everything to YOU.** Your state. Your election type. Your experience level. Powered by Gemini AI with real civic knowledge, it provides:

- **Personalised onboarding** — 3 questions to build your voter profile
- **Visual election journey** — step-by-step timeline with your state's deadlines
- **AI chat** — context-aware answers from Gemini, tailored to your exact situation
- **Multilingual support** — ask questions and get answers in your state's regional language
- **Document checklist** — personalised, trackable preparation list
- **Adaptive civic quiz** — Gemini-generated questions that scale to your knowledge level
- **Voice accessibility** — speak your questions, hear the answers

---

## Google Services Integration

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
│              Express + Socket.IO Backend                 │
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
│  2.5 Flash│  │  sessions / quiz / checklists /   │
│           │  │  timelines / analytics             │
└───────────┘  └───────────────────────────────────┘
```

---

## Key Engineering Decisions

### 1. Voter Profile Context Injection
Every Gemini API call receives the user's **state + election type + first-time status**. This transforms generic election answers into specific, actionable guidance. A first-time voter in Maharashtra gets different advice than an experienced voter in Kerala.

### 2. Multilingual Architecture
The app dynamically maps the user's selected state to its official regional language (e.g., Tamil Nadu → Tamil, Maharashtra → Marathi). This is passed as an enforced instruction in the Gemini system prompt, allowing the same UI to serve diverse linguistic needs without hardcoding translations.

### 3. Adaptive Quiz Difficulty
Correct answers increase difficulty (1→2→3), wrong answers decrease it. Firebase tracks topic coverage to avoid repetition. Gemini generates unique questions each time — no static question bank.

### 4. Graceful Degradation
`localFallback()` provides useful intent-matched responses when Gemini is unavailable or quota-exceeded. Every tab has hardcoded fallback data. The app works meaningfully even fully offline with cached content.

### 5. Light Theme for Civic Trust
Unlike most hackathon projects, ElectIQ uses a **light theme**. Civic applications require high contrast and trust signals — a dark hacker aesthetic would undermine credibility with actual voters. All text passes **WCAG AA** contrast ratios.

### 6. Security-First Backend
- **Helmet** with strict Content Security Policy
- **Per-route rate limiting** (60 req/min global, 20 req/min for chat)
- **Input sanitisation** — strips HTML tags, event handlers, `javascript:` URIs
- **Request ID tracing** — every request gets a UUID for debugging
- No API keys in client code — all Gemini calls are server-side

### 7. Comprehensive Test Coverage
**39 tests** covering all routes, validation rules, edge cases, and error handling. All external services (Firebase, Gemini) are mocked for deterministic execution.

---

## Setup

### Prerequisites
- Node.js 18+
- Gemini API key ([Get one free](https://aistudio.google.com/))
- Firebase project with Realtime Database

### Installation

```bash
# Clone the repository
git clone https://github.com/Naren-bit/ElectIQ.git
cd ElectIQ

# Install backend dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Run tests
npm test

# Start development server
npm run dev
```

### Environment Variables

```
GEMINI_API_KEY=your_key_from_aistudio.google.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
PORT=3001
```

### Deploy with Docker (Recommended for Production)

A `Dockerfile` is included for containerised deployment:

```bash
# Build the image
docker build -t electiq .

# Run the container (pass your .env file)
docker run -p 3001:3001 --env-file backend/.env electiq
```

### Deploy to Google Cloud Run

```bash
gcloud run deploy electiq-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=xxx,FIREBASE_DATABASE_URL=xxx
```

---

## Accessibility

ElectIQ is built with accessibility as a core requirement, not an afterthought:

- **Skip link** — keyboard users can jump directly to content
- **ARIA roles** — `tablist`, `tab`, `tabpanel` with `aria-selected` and `aria-controls`
- **Live region** — `aria-live="polite"` announces state changes to screen readers
- **Keyboard navigation** — arrow keys navigate tabs, Enter/Space activates controls
- **44px minimum touch targets** — all interactive elements meet mobile accessibility standards
- **Reduced motion** — `prefers-reduced-motion` media query disables all animations
- **High contrast** — all text passes WCAG AA on the light theme
- **Voice I/O** — Web Speech API for input and SpeechSynthesis for spoken responses
- **Focus visible** — clear 2px blue outline on all focusable elements

---

## Testing

```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

```
Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Time:        1.476s
```

### Test Coverage

| Area | Tests | Coverage |
|------|-------|----------|
| Health check | 1 | Uptime, status |
| Chat | 7 | Validation, profile context, history, error cases |
| Quiz | 8 | Question generation, answer recording, difficulty bounds |
| Timeline | 6 | State lookup, XSS prevention, edge cases |
| Checklist | 9 | Generation, progress save/load, validation |

---

## Assumptions

- Election data is seeded from public ECI knowledge ([eci.gov.in](https://eci.gov.in))
- Polling booth addresses require integration with ECI's electoral roll API (simulated with Maps)
- App targets Indian elections; internationalisation is a future extension
- Timeline deadlines are general — state-specific dates would come from ECI API integration

---

## License

MIT — Built for PromptWars Virtual Challenge 2
