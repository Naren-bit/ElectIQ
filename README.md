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

| Service | Integration | Purpose |
|---|---|---|
| **Gemini 2.5 Flash** | Core AI engine | Multi-turn chat with voter profile context injection |
| **Gemini 2.5 Flash** | Quiz generation | Adaptive difficulty questions with topic coverage tracking |
| **Gemini 2.5 Flash** | Checklist generation | State-specific document checklists based on voter profile |
| **Firebase Realtime DB** | Core persistence | Sessions, quiz results, checklist progress, election timelines |
| **Firebase Admin SDK** | Server-side access | Secure database operations with service account auth |
| **Firebase Analytics (GA4)** | Event tracking | User journey analytics, feature adoption metrics |
| **Google Maps JS API** | Booth finder | Polling area visualisation and directions |

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
