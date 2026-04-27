# 🚀 Google Services Integration

ElectIQ heavily leverages the Google Cloud and Firebase ecosystems to provide a seamless, scalable, and intelligent civic experience. This document outlines exactly how we satisfy the "Google Services" evaluation criteria for PromptWars.

## 1. Gemini AI Integration (Core Engine)
The entire intelligence layer of ElectIQ is powered by the Gemini API.

- **Context-Aware Chat:** We use **Gemini 2.5 Flash** for the primary chat interface. Instead of basic RAG, we dynamically inject the user's "Voter Profile" (State, Election Type, First-Time Status) into the system prompt of every multi-turn conversation. This allows Gemini to give hyper-specific, localized answers.
- **Multimodal Vision:** We implemented **Gemini Vision** capabilities. Users can tap the camera icon in the chat composer to upload an image (like a photo of an ID document), which is sent as `inlineData` to Gemini 2.5 Flash for analysis and guidance.
- **Generative UI:** Gemini is used dynamically in the backend to generate structured JSON payloads that power our UI. Specifically:
  - Generating state-specific **Document Checklists**.
  - Generating adaptive **Civic Quizzes** that scale in difficulty based on the user's previous answers.

## 2. Firebase Realtime Database
We use Firebase RTDB as our primary NoSQL persistence layer for all user states to ensure high performance and low latency.
- **Session Management:** Storing the voter profile state across page reloads.
- **Progress Tracking:** Storing real-time progress for the interactive journey timeline and the dynamic document checklist.
- **Quiz Analytics:** Tracking user scores, streaks, and previously covered topics to ensure Gemini generates *new* questions.

## 3. Firebase Admin SDK
Security is paramount for civic technology. Instead of exposing our database to the frontend, we use the **Firebase Admin SDK** in our Express.js backend.
- Service Account authentication ensures that all database writes are securely handled server-side.
- The `firebase-seed.json` structure is automatically injected into the database on boot if the timeline data is missing.

## 4. Google Analytics 4 (via Firebase Web SDK)
We integrated Google Analytics natively on the frontend via the Firebase Web SDK to track explicit user journeys and feature adoption.
- **Events tracked:** `profile_set`, `tab_viewed`, `chat_sent`, `timeline_step_completed`, `checklist_item_checked`, `quiz_answer`, and `booth_map_opened`.
- This provides operators with immediate insight into which parts of the civic pipeline users engage with most heavily.

## 5. Server-Side Analytics Tracking
To maintain a high-performance, lightweight PWA frontend (and to bypass ad-blockers), we migrated our user analytics server-side.
- We track critical user interactions (e.g., `chat_sent`, `quiz_answer`, `booth_map_opened`) by piping them through our Express backend directly into Firebase. This creates a secure, robust analytics pipeline without bloating the client with tracking scripts.

---

*Note: While we initially integrated Google Maps for the polling booth finder, we swapped to OpenStreetMap/Leaflet strictly to avoid exposing a client-side API key in the public GitHub repository for the hackathon submission. However, our architecture is fully compatible with the Google Maps JS SDK.*
