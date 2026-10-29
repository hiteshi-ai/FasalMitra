# FasalMitra AI 🌾

**Multiportal AI Platform for Climate-Based Crop Disease Prediction & Agricultural Advisory**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

> FasalMitra AI is an agricultural intelligence platform that combines real-time microclimate weather data, Google Gemini multimodal vision diagnostics, and expert agronomic triage to help farmers identify and act on crop disease risks before they cause widespread loss.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Project Folder Structure](#project-folder-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Environment Variables](#environment-variables)
9. [Supabase Configuration](#supabase-configuration)
10. [Running the Application](#running-the-application)
11. [API Endpoints](#api-endpoints)
12. [Database Schema](#database-schema)
13. [Example Workflow](#example-workflow)
14. [Security Considerations](#security-considerations)
15. [Troubleshooting](#troubleshooting)
16. [Future Improvements](#future-improvements)
17. [Contributing](#contributing)
18. [License](#license)

---

## Problem Statement

Smallholder farmers in India often lack timely, actionable information about crop diseases. By the time visible symptoms appear and a specialist is consulted, significant crop damage may already have occurred. FasalMitra AI addresses this by:

- Providing **instant AI-powered leaf image diagnostics** using Google Gemini multimodal vision.
- Correlating **live microclimate weather data** with crop-specific disease vulnerability.
- Generating **3–7 day disease risk forecasts** so farmers can take preventive action.
- Enabling **expert consultation escalation** when AI confidence is low.
- Supporting **three languages** — English, Hindi (हिंदी), and Punjabi (ਪੰਜਾਬੀ).

---

## Key Features

### Farmer Portal
- **Crop Selection** — Searchable database of 13 Indian crops (Cereals, Oilseeds, Pulses, Commercial, Vegetables) with English, Hindi, and Punjabi names.
- **Crop Growth Stage** — Selector for Seedling, Vegetative, Flowering, Fruiting, and Maturity stages.
- **Location Detection** — Browser Geolocation ("Use My Location") with manual fallback to major Indian agricultural districts.
- **Live Weather Integration** — Real-time temperature, humidity, rain probability, rainfall, and wind speed via the backend weather proxy (Open-Meteo — no API key required).
- **Soil Details (Optional)** — Soil type, approximate pH, moisture level, and irrigation method inputs.
- **Leaf Photo Upload** — Drag-and-drop / file picker with mobile camera support, image preview, and 10 MB size validation.
- **Gemini Multimodal Disease Analysis** — Real-time leaf disease identification, severity estimation, symptom extraction, and confidence scoring powered by Gemini.
- **3–7 Day Disease Risk Forecast** — Correlates live microclimate conditions and soil data with crop vulnerability to estimate the disease development window.
- **Expert Consultation Escalation** — Direct case submission to the expert consultation queue when AI confidence is low or the farmer requests specialist review.
- **Analysis History Persistence** — Completed analyses are saved to Supabase (`farmer_analyses` table) and associated with the logged-in farmer account.
- **Agricultural Advisory Q&A (RAG)** — Gemini-powered contextual question-and-answer for agronomic guidance.

### Authentication
- **Farmer Registration & Login** — Account creation persisted to Supabase (`farmer_profiles` table); session cached in `localStorage` for offline resilience.
- **Expert Login** — Fixed single-identity login for the agricultural specialist role (credentials managed locally, not stored in the database).
- **Route Guards** — Unauthenticated access to `/farmer` or `/expert` redirects to the appropriate login page.

### Expert Portal
- **Consultation Triage Dashboard** — View, filter, and manage pending, active, and resolved farmer cases.
- **Case Update** — Experts can add assessment notes and update case status (`Pending` → `Under Review` → `Resolved` → `Closed`).
- **Permanent Persistence** — All consultation data and expert updates are saved to Supabase (`expert_consultations` table).

### Backend API Gateway (Node.js + Express)
- Gemini multimodal AI service via `@google/genai`.
- Live weather proxy with Open-Meteo integration (no weather API key required by default).
- Supabase PostgreSQL integration with graceful in-memory fallback.
- Centralized error handling, CORS, and file upload (Multer, 10 MB limit).
- Health monitoring endpoint.

### Internationalisation (i18n)
- UI fully translated into **English**, **Hindi**, and **Punjabi**.
- Language preference persisted across sessions via `localStorage`.
- Cross-tab synchronisation for language changes.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Frontend Build Tool | Vite | 8 |
| Backend Runtime | Node.js + Express | 18+ / 4 |
| AI Engine | Google Gemini (`@google/genai`) | 2.27+ |
| Database | Supabase (PostgreSQL) | hosted |
| Weather Data | Open-Meteo (keyless) | free tier |
| File Uploads | Multer | 2 |
| Linter | oxlint | 1.81+ |
| Auth Storage | Browser `localStorage` | — |

---

## System Architecture

```
+----------------------------------------------------------+
|                      Browser Client                       |
|                                                           |
|   React 19 + Vite SPA                                     |
|   +---------------+  +---------------+  +-------------+  |
|   | Farmer Portal |  | Expert Portal |  | Auth Pages  |  |
|   +-------+-------+  +-------+-------+  +------+------+  |
|           |                  |                 |          |
|   src/services/ (authService, weatherService, ...)        |
+-----------+------------------+-----------------+----------+
            |    HTTP (fetch)  |                 |
            v                  v                 v
+----------------------------------------------------------+
|              Node.js / Express Backend                    |
|              (backend/server.js, Port 5000)               |
|                                                           |
|   Routes -> Controllers -> Services                       |
|   +----------+ +-----------+ +-----------+ +----------+  |
|   | aiRoutes | | authRoutes| | expertRts | |analysisRt|  |
|   +----+-----+ +-----+-----+ +-----+-----+ +----+-----+  |
|        |             |             |             |         |
|   +----+-------------+-------------+-------------+-----+  |
|   |                  Services Layer                     |  |
|   |  geminiService.js  |  weatherService.js             |  |
|   |  databaseService.js|  supabaseClient.js             |  |
|   +--------+--------------------------------------------+  |
+------------+----------------------------------------------+
             |
    +--------+-----------+
    |                    |
    v                    v
+----------+    +--------------------+
|  Google  |    |  Supabase (Free)   |
|  Gemini  |    |  PostgreSQL        |
|  API     |    |                    |
+----------+    |  farmer_profiles   |
                |  farmer_analyses   |
                |  expert_consult..  |
                +--------------------+
```

**Data Flow:**
1. The React SPA (served by Vite at port `5173`) calls the Express backend at port `5000`.
2. The backend proxies weather requests to Open-Meteo and AI requests to Google Gemini.
3. All persistent data (farmer accounts, analysis records, expert consultations) is stored in Supabase PostgreSQL.
4. The backend uses the `SUPABASE_SERVICE_ROLE_KEY` which bypasses Supabase Row Level Security — it is **never** exposed to the browser.
5. When Supabase is not configured, the backend falls back to an in-memory store (data is lost on server restart — a warning is printed to the console).

---

## Project Folder Structure

```
FasalMitra/
├── index.html                  # Vite SPA entry point
├── vite.config.js              # Vite + React plugin config
├── package.json                # Frontend deps & root npm scripts
├── .env.example                # Frontend env template (no secrets)
├── .gitignore                  # Git exclusions
├── .oxlintrc.json              # oxlint configuration
│
├── public/                     # Static assets served as-is
│   ├── favicon.svg
│   ├── icons.svg
│   └── wheat_leaf.jpg
│
├── src/                        # React frontend source
│   ├── main.jsx                # React root, LanguageProvider
│   ├── App.jsx                 # SPA router, session state, route guards
│   ├── App.css                 # Global component styles
│   ├── index.css               # CSS reset and base variables
│   │
│   ├── layouts/
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   └── Footer.jsx          # Site footer
│   │
│   ├── pages/
│   │   ├── Home/               # Landing page
│   │   ├── Farmer/             # Farmer portal + sub-components
│   │   │   ├── FarmerPortal.jsx
│   │   │   └── components/
│   │   ├── Expert/             # Expert triage dashboard
│   │   │   ├── ExpertPortal.jsx
│   │   │   └── components/
│   │   └── Auth/               # Login / signup pages
│   │       ├── FarmerLogin.jsx
│   │       ├── FarmerSignup.jsx
│   │       └── ExpertLogin.jsx
│   │
│   ├── components/
│   │   └── Icons.jsx           # Shared SVG icon components
│   │
│   ├── services/               # Frontend API call layer
│   │   ├── authService.js      # Farmer register/login (Supabase via backend)
│   │   ├── weatherService.js   # Weather data via backend proxy
│   │   ├── diseaseService.js   # Leaf disease analysis calls
│   │   ├── ragService.js       # Agricultural advisory Q&A
│   │   ├── expertService.js    # Expert consultation API calls
│   │   ├── analysisService.js  # Save / retrieve analysis records
│   │   ├── locationService.js  # Geolocation + district fallback
│   │   ├── bhashiniService.js  # (Stub) Bhashini translation service
│   │   └── index.js            # Service barrel exports
│   │
│   ├── data/
│   │   ├── crops.js            # 13 crop definitions + 5 growth stages
│   │   └── districts.js        # Indian agricultural district list
│   │
│   └── i18n/                   # Internationalisation (EN / HI / PA)
│       ├── translations.js     # Full translation strings
│       ├── LanguageContext.jsx # React Context provider
│       ├── LanguageSelector.jsx
│       ├── useLanguage.js
│       ├── context.js
│       └── index.js
│
└── backend/                    # Node.js + Express API gateway
    ├── init-env.js             # Entry point — loads dotenv BEFORE server.js
    ├── server.js               # Express app, CORS, routes, error handler
    ├── package.json            # Backend dependencies
    ├── .env.example            # Backend env template (no secrets)
    ├── supabase_schema.sql     # PostgreSQL schema — run once in Supabase SQL Editor
    │
    ├── routes/
    │   ├── aiRoutes.js         # /predict-disease, /risk-forecast, /rag, /expert
    │   ├── authRoutes.js       # /auth/farmer/*
    │   ├── expertRoutes.js     # /expert (CRUD)
    │   ├── analysisRoutes.js   # /analyses (CRUD)
    │   ├── weatherRoutes.js    # /weather
    │   └── healthRoutes.js     # /health
    │
    ├── controllers/
    │   ├── aiController.js     # Disease analysis, risk forecast, RAG
    │   ├── authController.js   # Farmer register / login
    │   ├── expertController.js # Consultation create / read / update
    │   ├── analysisController.js # Analysis record save / read
    │   └── weatherController.js  # Weather proxy
    │
    └── services/
        ├── geminiService.js    # Google Gemini AI calls with retry logic
        ├── weatherService.js   # Open-Meteo integration
        ├── databaseService.js  # Supabase CRUD + in-memory fallback
        └── supabaseClient.js   # Supabase client init + readiness check
```

---

## Prerequisites

- **Node.js v18 or higher** — [Download](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **Google Gemini API Key** — [Get one at Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase project** *(optional, but required for farmer registration and data persistence)* — [Free tier at Supabase](https://supabase.com/)

Verify your Node.js version:
```bash
node --version   # should be v18 or higher
npm --version
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hiteshi-ai/FasalMitra.git
cd FasalMitra
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure Frontend Environment

Copy the frontend environment template:

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

Edit `.env` (the default values work for local development):

```env
# URL of the FasalMitra backend server
VITE_BACKEND_URL=http://localhost:5000

# Optional: direct weather key (not needed for default Open-Meteo setup)
VITE_WEATHER_API_KEY=
```

### 5. Configure Backend Environment

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` with your actual credentials:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Required: Your Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Weather (leave blank to use Open-Meteo free tier — no key needed)
WEATHER_API_KEY=
WEATHER_PROVIDER=open-meteo

# Supabase (required for farmer accounts and data persistence)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> **Warning:** Never commit `backend/.env` or `.env` to version control. Both are excluded by `.gitignore`.

---

## Environment Variables

### Frontend (`.env` in project root)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_BACKEND_URL` | Yes | `http://localhost:5000` | Base URL of the backend API |
| `VITE_WEATHER_API_KEY` | No | *(empty)* | Optional direct weather key (not used in default flow) |

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key for all AI features |
| `WEATHER_API_KEY` | No | *(empty)* | Custom weather API key (Open-Meteo is used if blank) |
| `WEATHER_PROVIDER` | No | `open-meteo` | Weather data provider |
| `SUPABASE_URL` | For persistence | — | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For persistence | — | Supabase service role key (server-side only) |

---

## Supabase Configuration

Supabase provides the PostgreSQL database for farmer profiles, analysis records, and expert consultations. **Without it, data is lost when the backend restarts.**

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/) and create a free account.
2. Click **New Project** and choose a name, password, and region closest to your users.

### Step 2 — Get Your API Credentials

1. Open your Supabase project dashboard.
2. Navigate to **Project Settings → API**.
3. Copy the **Project URL** → paste into `SUPABASE_URL` in `backend/.env`.
4. Copy the **`service_role` secret key** → paste into `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

> **Warning:** Keep the service_role key private. It bypasses Row Level Security and must only be used server-side. Never expose it to the browser or commit it to git.

### Step 3 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor → New query**.
2. Open the file `backend/supabase_schema.sql` from this repository.
3. Paste the entire contents into the SQL editor.
4. Click **Run**.

This script is **idempotent** — safe to run multiple times. It creates:
- `farmer_profiles` table
- `farmer_analyses` table
- `expert_consultations` table
- Row Level Security policies
- Indexes for performance
- One seed consultation record so the Expert Portal is not empty on first load

---

## Running the Application

Both the backend and frontend must be running simultaneously. Use **two terminal windows**.

### Terminal 1 — Start the Backend

```bash
# From the project root:
npm run server
```

The backend starts at **http://localhost:5000**.

For auto-reload during development:
```bash
npm run server:dev
```

You should see output like:
```
[FasalMitra] Environment loaded.
[FasalMitra] SUPABASE_URL set: true
[FasalMitra] SUPABASE_SERVICE_ROLE_KEY set: true
[Supabase] Client initialized.
[FasalMitra AI] Backend server running on http://localhost:5000
[FasalMitra AI] Health check available at: http://localhost:5000/api/health
```

### Terminal 2 — Start the Frontend

```bash
# From the project root:
npm run dev
```

The frontend starts at **http://localhost:5173** (Vite default).

Open **http://localhost:5173** in your browser.

---

## API Endpoints

All endpoints are prefixed with `/api`. The backend runs on port `5000` by default.

| Method | Endpoint | Purpose | Notes |
|---|---|---|---|
| `GET` | `/api/health` | Backend service health check | Returns status, version, timestamp |
| `GET` | `/api/weather` | Live weather data proxy | Query params: `lat`, `lng`, `location` |
| `POST` | `/api/predict-disease` | Gemini leaf disease diagnosis | `multipart/form-data` with `image` field |
| `POST` | `/api/risk-forecast` | 3–7 day disease risk estimate | JSON: `crop`, `cropStage`, `weather`, `soil`, `diseaseAnalysis` |
| `POST` | `/api/rag` | Agricultural advisory Q&A | JSON: `question`, `crop` |
| `POST` | `/api/analyses` | Save farmer analysis record | JSON analysis payload |
| `GET` | `/api/analyses` | Retrieve analysis records | Query param: `farmerId` (optional) |
| `POST` | `/api/expert` | Submit expert consultation case | JSON consultation details |
| `GET` | `/api/expert` | Retrieve all consultation cases | Returns array from Supabase |
| `PATCH` | `/api/expert/:id` | Update consultation (expert notes/status) | JSON: `expertNotes`, `expertAssessment`, `status` |
| `PUT` | `/api/expert/:id` | Update consultation (full replace) | Same fields as PATCH |
| `POST` | `/api/auth/farmer/register` | Register a new farmer account | JSON: `name`, `email`, `phone`, `passwordHash` |
| `POST` | `/api/auth/farmer/login` | Farmer login | JSON: `email`, `passwordHash` |
| `GET` | `/api/auth/farmer/accounts` | List all farmer accounts | For admin/debug use |

### Request Examples

**Check backend health:**
```bash
curl http://localhost:5000/api/health
```

**Get weather by coordinates:**
```bash
curl "http://localhost:5000/api/weather?lat=30.9&lng=75.85&location=Ludhiana"
```

---

## Database Schema

The schema is defined in [`backend/supabase_schema.sql`](backend/supabase_schema.sql).

### `farmer_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | Generated by backend |
| `name` | TEXT | Farmer's full name |
| `email` | TEXT (UNIQUE) | Lowercased, used for login |
| `phone` | TEXT | Optional phone number |
| `password_hash` | TEXT | Client-side SHA-256 hash |
| `created_at` | TIMESTAMPTZ | UTC timestamp |
| `updated_at` | TIMESTAMPTZ | UTC timestamp |

### `farmer_analyses`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | Generated by backend |
| `farmer_id` | TEXT (FK) | References `farmer_profiles`; nullable for guest analyses |
| `farmer_name` | TEXT | Display name |
| `crop` | TEXT | Selected crop |
| `crop_stage` | TEXT | Growth stage |
| `location` | JSONB | `{ name, lat, lng }` |
| `weather` | JSONB | Live weather at time of analysis |
| `soil` | JSONB | Soil inputs from farmer |
| `image` | JSONB | Image metadata (name, size, type) |
| `disease_analysis` | JSONB | Full Gemini diagnosis output |
| `risk_forecast` | JSONB | 3–7 day risk estimate output |
| `created_at` | TIMESTAMPTZ | UTC timestamp |

### `expert_consultations`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | Generated by backend (`FM-EXP-{timestamp}`) |
| `farmer_id` | TEXT (FK) | References `farmer_profiles`; nullable |
| `farmer_name` | TEXT | Farmer's display name |
| `crop` | TEXT | Affected crop |
| `crop_stage` | TEXT | Growth stage |
| `location` | TEXT | Location string |
| `weather` | JSONB | Weather at time of submission |
| `soil` | JSONB | Soil details |
| `image` | JSONB | Image metadata |
| `disease_analysis` | JSONB | AI diagnosis at time of submission |
| `image_analysis` | JSONB | Alternate analysis reference |
| `risk_forecast` | JSONB | Risk estimate at time of submission |
| `farmer_notes` | TEXT | Notes from the farmer |
| `question` | TEXT | Farmer's specific question |
| `status` | TEXT | `Pending` / `Under Review` / `Resolved` / `Closed` |
| `expert_notes` | TEXT | Expert's written notes |
| `expert_assessment` | TEXT | Expert's formal assessment |
| `created_at` | TIMESTAMPTZ | UTC timestamp |
| `updated_at` | TIMESTAMPTZ | UTC timestamp |

---

## Example Workflow

1. **Open the app** at `http://localhost:5173`.
2. **Register a farmer account** via the Sign Up page. Your account is created in Supabase and cached in `localStorage`.
3. **Log in** with your email and password.
4. **In the Farmer Portal:**
   - Select your crop (e.g., Wheat) and growth stage (e.g., Vegetative).
   - Click "Use My Location" or select a district from the dropdown.
   - Weather data is automatically fetched for your location.
   - (Optional) Enter soil details.
   - Upload a photo of an affected leaf.
   - Click **Analyse** — Gemini returns a disease diagnosis with severity, symptoms, and treatment recommendations.
   - A **3–7 day disease risk forecast** is generated based on current microclimate data.
5. **If confidence is low**, use the "Request Expert Review" button to submit the case to the Expert Portal queue.
6. **Expert login** — Username: `Expert`, Password: `expert@123` — opens the triage dashboard.
7. The expert opens the case, adds assessment notes, and changes the status to `Resolved`.

---

## Security Considerations

- **No secrets in source code.** All API keys and database credentials are loaded exclusively from `backend/.env` (excluded from git by `.gitignore`).
- **The Supabase service role key is backend-only.** It is never sent to the browser or logged to the console.
- **Passwords are hashed client-side** using the Web Crypto API (SHA-256) before transmission. The backend stores and compares hashes only — plaintext passwords are never sent over the network or stored.
- **CORS** restricts cross-origin requests to the configured `FRONTEND_URL`.
- **Multer** enforces a 10 MB upload limit and accepts only `image/jpeg`, `image/png`, and `image/webp` MIME types.
- **Expert authentication** uses a fixed-identity credential suitable for demo/development. For production, replace with a proper server-side authentication flow.
- **AI outputs are advisory.** Gemini diagnoses should be verified by a field agronomist before chemical treatments are applied.

---

## Troubleshooting

### Backend does not start — "Cannot find module"

Make sure backend dependencies are installed:
```bash
cd backend && npm install && cd ..
```

---

### AI requests return HTTP 401 — missing API key

```json
{ "code": "MISSING_API_KEY", "message": "Gemini API key is not configured..." }
```

Open `backend/.env` and set your actual Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...
```

---

### Farmer registration returns HTTP 503

```json
{ "supabaseReady": false, "message": "Database not configured..." }
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` and run the SQL schema (see [Supabase Configuration](#supabase-configuration)).

---

### Supabase warning in the console on startup

```
[Supabase] Running WITHOUT Supabase — all data will be lost on server restart.
```

Configure Supabase credentials. The app still works without Supabase (AI analysis and weather work), but data will not persist across server restarts.

---

### Weather data does not load

If your coordinates are outside India or Open-Meteo is unreachable, weather data will not load. The UI falls back gracefully and still allows analysis without weather data.

---

### Frontend cannot connect to backend

Ensure the backend is running (`npm run server`) and that `VITE_BACKEND_URL` in `.env` matches the backend address (default: `http://localhost:5000`).

---

### Errors after pulling updates

```bash
# In project root
npm install

# In backend directory
cd backend && npm install && cd ..
```

---

## Future Improvements

> The following are **planned enhancements** — they are not currently implemented in the codebase.

- **Real-time expert chat** — WebSocket-based messaging between farmers and experts.
- **Push notifications** — Alert farmers when their consultation status changes.
- **Bhashini translation integration** — The `bhashiniService.js` stub exists but is not yet connected to the Bhashini API.
- **Supabase Auth** — Replace the current custom hash-based auth with Supabase Auth (JWT, OAuth providers).
- **Offline PWA support** — Service worker and offline caching for low-connectivity rural environments.
- **Satellite imagery integration** — NDVI-based crop health monitoring.
- **Historical analysis dashboard** — Charts and trends from a farmer's analysis history.
- **Mobile application** — React Native or Flutter app using the existing backend API.
- **Multi-language voice input** — Voice-to-text for farmers who prefer to speak rather than type.
- **Production deployment** — Docker containerisation, CI/CD pipeline, and Supabase storage for uploaded images.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit with a clear message: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against the `main` branch.

**Please:**
- Do not commit any `.env` files or API keys.
- Keep the existing code style and language support (EN/HI/PA).
- Add comments for any new backend endpoints or services.
- Test AI-dependent features with a valid Gemini API key before opening a PR.

---

## License

No license has been specified for this project yet. All rights are reserved by the author until a license is formally added.

---

<p align="center">
  Built with care for Indian farmers &middot; Powered by Google Gemini &middot; Weather by Open-Meteo &middot; Data by Supabase
</p>
