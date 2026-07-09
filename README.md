# 👁️ SenseVision: Multimodal Assistive Intelligence & Vocal Navigation Suite

[![Intensive Vibe Coding Capstone](https://img.shields.io/badge/Capstone-AI_Agents_Intensive-6366f1.svg?style=for-the-badge)](https://ai.studio/build)
[![Kaggle Community Hackathon](https://img.shields.io/badge/Hackathon-Kaggle_Community-3b82f6.svg?style=for-the-badge)](https://www.kaggle.com/)
[![React](https://img.shields.io/badge/React-19.0.1-61dafb.svg?style=flat&logo=react)](https://react.dev)
[![Gemini API](https://img.shields.io/badge/Gemini_API-v2.4.0-de5918.svg?style=flat&logo=google)](https://ai.google.dev/)

**SenseVision** is an advanced, AI-powered assistive technology platform designed to empower visually impaired, elderly, and physically challenged individuals to understand, read, and safely navigate their physical surroundings. By combining real-time camera streams, drag-and-drop image auditing, server-side multimodal intelligence via the Google Gen AI SDK, and rich audio feedback, SenseVision serves as a highly reliable, verbal digital companion.

---

## 🚀 Key Features & Architectural Modules

### 1. 📷 Sense Sight: Multi-Mode Visual Analyzer
SenseVision integrates an active edge camera capture stream and drag-and-drop file uploaders to ingest visual data. Users can alternate between five specialized accessibility modes, backed by dedicated multimodal prompt instructions:
- **Obstacle & Route Navigation**: Identifies potential hazards, staircases, furniture paths, doorways, and dynamic spatial threats in the user's line of walk.
- **Text Reader (OCR)**: Scans, interprets, and reads aloud signage, prescription labels, book chapters, and documents.
- **Object Recognition**: Detects everyday household items, tools, and personal belongings with estimated safety categories and distance tracking.
- **Scene Description**: Generates rich, atmospheric, spatial descriptions detailing lighting, spatial depth, colors, and contextual environments.
- **Multimodal Companion Assistant**: An interactive conversation pane with persistent memory, enabling users to speak or type direct contextual questions about the active visual field.

### 2. 🎙️ Comprehensive Auditory Engine
- **Cloud-Synthesized Voices**: Leverages Gemini's high-fidelity audio synthesis voices (*Zephyr, Kore, Puck, Fenrir, Charon*) via custom proxy endpoints (`/api/tts`).
- **Resilient Offline Fallback**: Features automatic local fallback to the browser's `window.speechSynthesis` (Web Speech API) utilizing custom-mapped gender and pitch characters (*Emma, Alex, Maya, Sophia, Arjun*) if cloud connection drops.
- **Safety Audio Indicators**: Incorporates non-verbal acoustic chime triggers for key actions: clicks, scan triggers, alarms, authentication success, and error signals.

### 3. 🛡️ Voice Identity & PIN Security Locking
- Includes a security layer allowing users to lock or lock-out custom sessions.
- **Double-Safe Auth**: Features an authenticating 15-second voice capture mic session or standard 4-digit PIN bypass.
- **Continuous Listening Protocol**: Implements a continuous voice command listener that safely parses real-time micro-instructions without overlapping recognition state conflicts.

### 4. 🎛️ Accessibility Preferences & Large Touch UI
- Designed from the ground up for high-contrast accessibility (deep cosmic background matched with bright accessibility icons).
- **Adaptive Layout Scaling**: One-click scaling toggle for oversized touch targets (44px+) and large visual feedback indicators.
- **Assistance Tone Controls**: Tailor assistant readout personality across *Informative*, *Safe & Defensive*, *Minimalist*, and *Expressive/Hybrid* guidance levels.
- **LocalStorage Audit Log**: Automatically saves past scans, text transcriptions, and safety recommendations with timestamps for auditory review.

---

## 🛠️ Tech Stack & Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │                     REACT CLIENT                       │
   │   - React 19 / TypeScript 5.8 / Vite 6                 │
   │   - Tailwind CSS v4 / Motion Animations                │
   │   - Web Speech API (SpeechRecognition + Synthesis)     │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    JSON / Base64 Payload
                              │
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │                    EXPRESS BACKEND                     │
   │   - Node.js (tsx dev, esbuild bundled prod server)     │
   │   - High payload base64 limit parsing (50MB)           │
   │   - Proxy endpoint for Gemini Pro/Flash API calls      │
   └──────────────────────────┬─────────────────────────────┘
                              │
                    Google Gen AI SDK
                              │
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │                    GEMINI AI SERVICES                  │
   │   - Multimodal Image & OCR Analysis (Gemini API)       │
   │   - High-fidelity Voice Synthesis & Text-to-Speech     │
   └────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19 (Hooks, Context, Refs), Vite, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Express.js server on Node.js. Serves API endpoints under `/api/*` to securely keep the Gemini API keys hidden from the browser.
- **Build System**: Production builds are bundled cleanly using `esbuild` to compile a single CJS server file (`dist/server.cjs`), eliminating ESM import issues on deployment containers.

---

## 🎙️ Interactive Voice Command Dictionary

While in active camera session, users can speak verbal commands to control the device hands-free:
| Voice Command | Action Triggered | Vocal Confirmation |
| :--- | :--- | :--- |
| **"Select Sense Sight Module"** | Focuses on active Camera and scan screen | *"Sense Sight module selected."* |
| **"Trigger Voice Scan"** | Captures active camera frame and triggers Gemini analysis | *"Scanning surroundings now."* |
| **"Reset Camera"** | Resets camera stream and clears current uploaded visual frame | *"Camera reset. Returning to live feed."* |
| **"Upload Image"** | Opens native file-upload dialog selector | *"Opening file browser to upload an image."* |
| **"Speak Report"** | Re-reads the latest processed visual results report aloud | *"Reading latest report aloud."* |
| **"Open Auditory Logs"** | Opens the Historical Audits log list pane | *"Opening Auditory Logs."* |
| **"Accessibility Preferences"** | Switches to Accessibility and Voice settings screen | *"Opening accessibility preferences."* |
| **"Stop" / "Mute"** | Instantly mutes any active text-to-speech output | *"Muted speech feedback."* |
| **"Help"** | Opens a helpful overview of all vocal navigation commands | Reads voice guidance guidelines |

---

## ⚙️ Getting Started & Local Development

### 1. Configure Secrets
Ensure you have a `.env` file in the root workspace (copied from `.env.example`):
```env
GEMINI_API_KEY="your_actual_api_key_here"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
Spins up both the Express API and the Vite development hot reload environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
Compiles client assets and bundles server-side code:
```bash
npm run build
```

### 5. Launch Production Server
```bash
npm run start
```

---

## 💖 Contributing & Hackathon Acknowledgments
Developed as a submission for the **AI Agents: Intensive Vibe Coding Capstone Project (Kaggle Community Hackathon)**. Dedicated to leveraging cutting-edge LLM vision pipelines to solve high-impact, real-world accessibility hurdles.
