# GraphGen Backend — Low-Level Design (LLD)

---

## 1. System Overview

GraphGen is an AI-powered diagram generation platform. The backend is a **Node.js / Express** REST API that handles user authentication, JWT-based authorization, AI diagram generation via the Google Gemini API, and user history persistence in MongoDB.

```
┌─────────────┐       HTTPS        ┌──────────────────────────────┐
│  React SPA   │ ◄──────────────► │  Express Server (port 5050)  │
│  (Vite)      │   JSON + JWT     │  app.js                      │
└─────────────┘                   └──────────┬───────────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   ┌───────────┐     ┌──────────────┐   ┌────────────┐
                   │  MongoDB  │     │  Gemini API  │   │ Brevo SMTP │
                   │  Atlas    │     │  (Google)    │   │ (Email)    │
                   └───────────┘     └──────────────┘   └────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js (ES Modules) | Server runtime |
| Framework | Express 4 | HTTP routing & middleware |
| Database | MongoDB Atlas + Mongoose 8 | Document storage & ODM |
| AI Engine | `@google/genai` (Gemini) | Two-stage diagram generation |
| Auth | `jsonwebtoken` + `bcrypt` | JWT tokens & password hashing |
| Email | `sib-api-v3-sdk` (Brevo) | Transactional email delivery |
| Security | `express-rate-limit`, CORS | Rate limiting & cross-origin |
| Dev | `nodemon` | Hot-reload in development |

---

## 3. Directory Structure

```
backend/
├── server.js                    # Entry point — loads env, connects DB, starts listener
├── app.js                       # Express app — middleware chain & route mounting
├── configure/
│   ├── mongoDB.js               # Mongoose connection helper
│   └── gemini.js                # GoogleGenAI client singleton
├── models/
│   ├── userModel.js             # User schema (bcrypt hooks)
│   └── historyModel.js          # History schema (mixed I/O storage)
├── controllers/
│   ├── authorization.js         # JWT verification middleware
│   ├── historyController.js     # CRUD for diagram history
│   ├── authentication/
│   │   ├── createUser.js        # Sign-up + email verification trigger
│   │   ├── login.js             # Credential check + JWT issuance
│   │   ├── verifyEmail.js       # Token-based email confirmation
│   │   ├── password.js          # Forgot-password flow
│   │   └── resetPassword.js     # Reset form (GET) + reset handler (POST)
│   ├── diagramsGenerator/
│   │   ├── FINATE_AUTOMATA/
│   │   │   ├── DFA/dfaDiagram.js
│   │   │   └── NFA/nfaDiagram.js
│   │   ├── Flowchart/flowChart.js
│   │   ├── ER/erDiagram.js
│   │   ├── DataStructure/dsDiagram.js
│   │   └── UML/umlDiagram.js
│   └── Error/
│       ├── globalErrorhandler.js
│       ├── developmentError.js
│       └── production.js
├── routes/
│   ├── userRoute.js             # /api/auth/*
│   ├── diagram.js               # /api/diagram/*
│   └── historyRoute.js          # /api/history/*
├── service/
│   ├── JWT.js                   # sign / verify helpers
│   ├── email.js                 # Brevo transactional emails
│   └── token.js                 # crypto.randomBytes token generator
├── utils/
│   ├── asyncFunctionHandler.js  # try/catch wrapper for async controllers
│   └── customError.js           # Operational error class
└── prompts/                     # LLM prompt templates (per diagram type)
    ├── FINATE-AUTOMATA/dfa/     # DFA_REASONING.txt, DFA.txt
    ├── nfa/                     # NFA prompts
    ├── flowchart/               # FLOWCHART_REASONING.txt, FLOWCHART.txt
    ├── er/                      # ER_REASONING.txt, ER.txt
    ├── data-structure/          # DS_REASONING.txt, DS.txt
    └── uml/                     # UML_REASONING.txt, UML.txt
```

---

## 4. Data Models

### 4.1 User Model (`userModel.js`)

```
┌───────────────────────────────────┐
│            User                   │
├───────────────────────────────────┤
│ name         : String (1-50)      │
│ email        : String (unique)    │
│ password     : String (hashed)    │  ← select: false
│ verified     : Boolean            │
│ token        : String | null      │  ← email verify / reset token
│ tokenExpires : Date | null        │
│ passwordChangedAt : Date | null   │
│ createdAt    : Date (auto)        │
│ updatedAt    : Date (auto)        │
├───────────────────────────────────┤
│ Pre-save Hook:                    │
│   if password modified →          │
│     bcrypt.hash(password, 10)     │
│     set passwordChangedAt         │
│                                   │
│ Instance Method:                  │
│   comparePassword(plain) →        │
│     bcrypt.compare(plain, hash)   │
└───────────────────────────────────┘
```

### 4.2 History Model (`historyModel.js`)

```
┌───────────────────────────────────┐
│           History                 │
├───────────────────────────────────┤
│ userId     : ObjectId → User      │
│ actionType : String (e.g. "dfa")  │
│ inputData  : Mixed (query text)   │
│ outputData : Mixed (DOT code)     │
│ createdAt  : Date (auto)          │
│ updatedAt  : Date (auto)          │
└───────────────────────────────────┘
```

---

## 5. API Routes

### 5.1 Authentication (`/api/auth`)

| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|------------|------------|-------------|
| POST | `/sign-up` | `createUser` | — | Register + send verification email |
| GET | `/verify/:token` | `verifyEmail` | — | Confirm email via token link |
| POST | `/login` | `login` | — | Authenticate → JWT |
| POST | `/forgot-password` | `forgotPassword` | `rateLimit(5/10min)` | Send reset email |
| GET | `/reset-password/:token` | `passwordResetClient` | — | Serve reset HTML form |
| POST | `/reset-password/:token` | `passwordResetServer` | `rateLimit(5/10min)` | Execute password change |

### 5.2 Diagram Generation (`/api/diagram`)

All routes require `authorization` middleware (valid JWT).

| Method | Endpoint | Controller | AI Model |
|--------|----------|------------|----------|
| POST | `/flow-chart` | `flowChartGenerator` | gemma-3-27b-it |
| POST | `/toc/dfa` | `dfaDiagramGenerator` | gemini-2.5-flash |
| POST | `/toc/nfa` | `nfaDiagramGenerator` | gemini-2.5-flash |
| POST | `/toc/er` | `erDiagramGenerator` | gemma-3-27b-it |
| POST | `/ds` | `dsDiagramGenerator` | gemma-3-27b-it |
| POST | `/uml` | `umlDiagramGenerator` | gemma-3-27b-it |

### 5.3 History (`/api/history`)

All routes require `authorization` middleware.

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/` | `createHistory` | Save a diagram generation record |
| GET | `/` | `getHistory` | Fetch all records for current user |
| DELETE | `/:id` | `deleteHistory` | Delete a specific record |

---

## 6. Core Architectural Patterns

### 6.1 Middleware Pipeline

```
Request
  │
  ▼
[ CORS ] → [ express.json() ] → [ Route Matcher ]
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                      ▼
            /api/auth/*                          /api/diagram/* & /api/history/*
            (public routes)                      (protected routes)
                    │                                      │
                    ▼                                      ▼
              Controller                         [ authorization ]
                    │                                      │
                    ▼                                      ▼
               Response                             Controller
                                                       │
                                                       ▼
                                                   Response
                                                       │
                                      (if error) ──────┘
                                                       ▼
                                          [ globalErrorHandler ]
```

### 6.2 Authorization Flow

```
1. Extract "Authorization: Bearer <token>" header
2. Split → extract raw JWT
3. jwt.verify(token, SECRET_CODE) → { id, email, username, iat }
4. userModel.findById(decoded.id) → ensure user still exists
5. Check passwordChangedAt vs token iat → reject if password changed after token issued
6. Attach req.user = user → call next()
```

### 6.3 Two-Stage AI Diagram Pipeline

This is the **core innovation** of the system. Every diagram type follows an identical pattern:

```
┌──────────────────────────────────────────────────────────────┐
│                    TWO-STAGE PIPELINE                        │
│                                                              │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │ User Query   │ ──► │  STAGE 1:    │ ──► │  STAGE 2:    │  │
│  │ (plain text) │     │  REASONING   │     │  DOT CODE    │  │
│  └─────────────┘     │              │     │  GENERATION  │  │
│                       │  Prompt:     │     │              │  │
│                       │  *_REASONING │     │  Prompt:     │  │
│                       │  .txt        │     │  *.txt       │  │
│                       │              │     │              │  │
│                       │  Output:     │     │  Output:     │  │
│                       │  Structured  │     │  Raw DOT     │  │
│                       │  analysis    │     │  code        │  │
│                       └──────────────┘     └──────┬───────┘  │
│                                                    │          │
│                                          ┌─────────▼────────┐│
│                                          │ Post-process:    ││
│                                          │ Strip ```fences  ││
│                                          │ .trim()          ││
│                                          └─────────┬────────┘│
│                                                    │          │
│                                             { vizCode }      │
└──────────────────────────────────────────────────────────────┘
```

**Why two stages?**
- **Stage 1 (Reasoning):** The LLM analyzes the user's natural-language description and produces a structured breakdown (states, transitions, entities, relationships, etc.).
- **Stage 2 (Code Generation):** A second LLM call takes that structured analysis and converts it into valid Graphviz DOT syntax that Viz.js can render on the frontend.

This separation dramatically improves output quality vs. a single-prompt approach.

### 6.4 Error Handling Architecture

```
┌──────────────────────────┐
│      CustomError         │
│  extends Error           │
├──────────────────────────┤
│ statusCode : Number      │
│ status     : "fail"|"error" │
│ isoperational : true     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  handelAsyncFunction(fn)         │
│  Wraps async controllers in     │
│  try/catch → forwards to next() │
└──────────┬───────────────────────┘
           │ on error
           ▼
┌──────────────────────────────────┐
│  globalErrorHandler              │
│  NODE_ENV === "DEV"              │
│    → developmentError (full)     │
│  else                            │
│    → productionError (sanitized) │
└──────────────────────────────────┘
```

---

## 7. Authentication Flows

### 7.1 Sign-Up Flow

```
Client                    Server                         MongoDB          Brevo
  │                         │                               │               │
  │── POST /sign-up ───────►│                               │               │
  │   {name,email,password} │                               │               │
  │                         │── findOne({email}) ──────────►│               │
  │                         │◄── user | null ──────────────│               │
  │                         │                               │               │
  │                         │ [if exists & verified → 400]  │               │
  │                         │ [if exists & !verified →      │               │
  │                         │    update with new token]     │               │
  │                         │ [if !exists → create record]  │               │
  │                         │                               │               │
  │                         │── generateToken(32) ─────────►│  (save)       │
  │                         │── mail(name,link,email) ─────────────────────►│
  │                         │                               │               │
  │◄── 201 {status,message}│                               │               │
```

### 7.2 Login Flow

```
Client                    Server                         MongoDB
  │                         │                               │
  │── POST /login ─────────►│                               │
  │   {email, password}     │── findOne({email}) ──────────►│
  │                         │   .select("+password")        │
  │                         │◄── user ─────────────────────│
  │                         │                               │
  │                         │── bcrypt.compare() ──────────►│
  │                         │                               │
  │                         │── jwt.sign({id,email,         │
  │                         │    username}, SECRET, 1h) ───►│
  │                         │                               │
  │◄── 200 {token} ────────│                               │
```

### 7.3 Password Reset Flow

```
Client                Server                    MongoDB         Brevo
  │                      │                         │               │
  │─ POST /forgot ──────►│─ findOne({email}) ─────►│               │
  │                      │◄── user ────────────────│               │
  │                      │─ generateToken() ──────►│ (save)        │
  │                      │─ mailForgotPassword() ──────────────── ►│
  │◄── 200 "email sent"─│                         │               │
  │                      │                         │               │
  │   (user clicks link) │                         │               │
  │─ GET /reset/:token ─►│─ findOne({token,        │               │
  │                      │    expires > now}) ─────►│               │
  │◄── HTML reset form──│                         │               │
  │                      │                         │               │
  │─ POST /reset/:token─►│─ user.password = new ──►│ (save+hash)   │
  │◄── 201 "success" ───│                         │               │
```

---

## 8. Diagram Generation — Controller Detail

Each controller follows this template:

```javascript
// 1. Extract query from req.body
// 2. Validate input (non-empty, length limits)
// 3. Read API key from process.env.GEMINI_API
// 4. Create per-request GoogleGenAI client
// 5. Stage 1: Send REASONING prompt + user query → get structured analysis
// 6. Stage 2: Send DOT prompt + reasoning output → get raw DOT code
// 7. Post-process: strip markdown fences, trim
// 8. Return { status: "success", data: { vizCode } }
```

### Prompt File Mapping

| Diagram Type | Reasoning Prompt | DOT Prompt | Default Model |
|---|---|---|---|
| DFA | `FINATE-AUTOMATA/dfa/DFA_REASONING.txt` | `FINATE-AUTOMATA/dfa/DFA.txt` | `gemini-2.5-flash` |
| NFA | `nfa/NFA_REASONING.txt` | `nfa/NFA.txt` | `gemini-2.5-flash` |
| Flowchart | `flowchart/FLOWCHART_REASONING.txt` | `flowchart/FLOWCHART.txt` | `gemma-3-27b-it` |
| ER Diagram | `er/ER_REASONING.txt` | `er/ER.txt` | `gemma-3-27b-it` |
| Data Structure | `data-structure/DS_REASONING.txt` | `data-structure/DS.txt` | `gemma-3-27b-it` |
| UML | `uml/UML_REASONING.txt` | `uml/UML.txt` | `gemma-3-27b-it` |

**Flowchart special case:** Supports a `language` field in the request body. When provided, it prefixes the reasoning prompt with a language hint (e.g., `"The following is JAVA code..."`) so the LLM interprets input as source code rather than a natural-language description.

---

## 9. Security Design

| Concern | Implementation |
|---|---|
| **Password Storage** | bcrypt with 10 salt rounds; `select: false` on schema |
| **JWT** | HS256, 1-hour expiry, server-side secret |
| **Token Invalidation** | `passwordChangedAt` check rejects tokens issued before password change |
| **API Key** | Stored server-side in `.env`; never exposed to client |
| **Rate Limiting** | `express-rate-limit`: 5 requests per 10 minutes on sensitive endpoints |
| **CORS** | Restricted to `FRONTEND_URL` origin with credentials |
| **Email Verification** | 32-byte random hex token, 10-minute expiry |
| **Input Validation** | Length checks on diagram queries (max 3000 chars for flowchart) |

---

## 10. Environment Variables

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `NODE_ENV` | `DEV` or `PROD` — controls error detail level |
| `PORT` | Server port (default: 5050) |
| `FRONTEND_URL` | Allowed CORS origin |
| `SALTROUNDS` | bcrypt cost factor |
| `SECRECT_CODE` | JWT signing secret |
| `GEMINI_API` | Google Gemini API key (server-only) |
| `MODEL_TYPE` | Default Gemini model for DFA/NFA |
| `BREVO_API_KEY` | Brevo transactional email key |
| `BREVO_SENDER_EMAIL` | From address for emails |
| `BREVO_SENDER_NAME` | From name for emails |

---

## 11. Request Lifecycle (End-to-End Example)

**Scenario:** Authenticated user generates a DFA diagram.

```
1.  Client sends POST /api/diagram/toc/dfa
    Headers: { Authorization: "Bearer <jwt>" }
    Body:    { query: "DFA that accepts strings ending with abb" }

2.  Express matches route → runs authorization middleware
    → extracts JWT → verifies → loads user from DB → attaches req.user

3.  dfaDiagramGenerator runs:
    a. Validates query is non-empty
    b. Reads GEMINI_API from process.env
    c. Creates GoogleGenAI client
    d. STAGE 1: Sends DFA_REASONING.txt + query to gemini-2.5-flash
       → receives structured state/transition analysis
    e. STAGE 2: Sends DFA.txt + reasoning output to gemini-2.5-flash
       → receives raw Graphviz DOT code
    f. Strips markdown fences, trims whitespace

4.  Response: 200 { status: "success", data: { vizCode: "digraph G { ... }" } }

5.  Client renders vizCode using Viz.js (Graphviz-react) in the browser
```

---

*Document generated on 2026-05-05 by analyzing the complete backend source code.*
