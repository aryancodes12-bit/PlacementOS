<div align="center">

# PlacementOS

### AI-assisted placement preparation, unified into one operating system

PlacementOS connects DSA practice, resume intelligence, interview replay, readiness scoring, daily planning, and smart notifications into a single preparation workflow.

---

## Product Preview

<table>
  <tr>
    <td width="33%"><img src="docs/architecture/Screenshot%202026-06-28%20024216.png" alt="PlacementOS landing page" /></td>
    <td width="33%"><img src="docs/architecture/Screenshot%202026-06-28%20024223.png" alt="PlacementOS sign in" /></td>
    <td width="33%"><img src="docs/architecture/Screenshot%202026-06-28%20024306.png" alt="PlacementOS dashboard" /></td>
  </tr>
  <tr>
    <td align="center"><b>Landing</b></td>
    <td align="center"><b>Authentication</b></td>
    <td align="center"><b>Readiness Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024324.png" alt="DSA tracker" /></td>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024332.png" alt="Resume intelligence report" /></td>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024351.png" alt="Interview replay dashboard" /></td>
  </tr>
  <tr>
    <td align="center"><b>DSA Tracker</b></td>
    <td align="center"><b>Resume Intelligence</b></td>
    <td align="center"><b>Interview Replay</b></td>
  </tr>
  <tr>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024658.png" alt="Readiness progress chart" /></td>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024716.png" alt="Full stack roadmap" /></td>
    <td><img src="docs/architecture/Screenshot%202026-06-28%20024743.png" alt="Interview replay analysis detail" /></td>
  </tr>
  <tr>
    <td align="center"><b>Progress Analytics</b></td>
    <td align="center"><b>Full-Stack Roadmap</b></td>
    <td align="center"><b>Replay Analysis</b></td>
  </tr>
</table>

---

## Overview

Engineering students usually prepare for placements using disconnected tools:

- coding platforms for DSA;
- document tools for resumes;
- generic interview platforms;
- spreadsheets for progress tracking;
- calendars for reminders.

Each tool records activity, but none maintains a unified understanding of the student's preparation state.

PlacementOS solves this coordination problem by treating preparation activity as connected evidence. DSA performance, resume quality, interview outcomes, revision history, target companies, and consistency signals contribute to one readiness model and one prioritized action system.

```mermaid
flowchart LR
    A[Preparation Evidence] --> B[Diagnosis]
    B --> C[Readiness Signals]
    C --> D[Prioritized Daily Actions]
    D --> E[Practice and Revision]
    E --> A
```

The product is designed as a continuous feedback loop: every action updates the student's preparation model and influences what the system recommends next.

---

## Core Product Modules

| Module | What it provides | Engineering role |
|---|---|---|
| Authentication and Profile | Email/password login, Google authentication, verification, roles, skills, target companies | Identity boundary and personalization context |
| DSA Tracker v2 | Topic, pattern, difficulty, status, revision dates, company tags, notes | Structured learning evidence and weak-area analytics |
| Resume Intelligence | Upload, ATS analysis, structured recommendations, freshness tracking | Document evidence and readiness contribution |
| Interview Replay | Manual/audio/video input, transcription, question replay, AI diagnosis | High-value feedback and media/AI pipeline |
| Readiness Engine | Cross-domain score and readiness history | Shared preparation diagnosis |
| Daily Plan and Roadmap | Bounded preparation tasks and progress-aware planning | Action orchestration |
| Smart Notifications | Real-time completion events and preference-aware reminders | Re-engagement and system feedback |
| Settings and Feedback | Notification preferences, timezone, support, account controls | User control and operational feedback |

---

## Key Capabilities

### Authentication and Identity

- Email and password authentication
- Google authentication through Firebase
- Backend verification of Firebase identity tokens
- Email verification workflow
- JWT access and refresh sessions
- Role-aware authorization
- Protected routes and user-scoped data access
- Telegram alerts for authentication events

### DSA Tracker v2

- Manual problem tracking
- Topic and pattern classification
- Difficulty and completion status
- Platform links and company tags
- Solve count and revision scheduling
- Notes and learning history
- Weak-topic identification
- Pattern-coverage analytics
- Revision queue
- Readiness-score contribution

### Resume Intelligence

- Resume upload and storage
- ATS-oriented analysis
- Structured improvement feedback
- Resume freshness tracking
- Role-fit and readiness signals
- Dashboard score integration
- Real-time analysis-completion notifications

### Interview Replay

- Manual, audio, and video interview input
- Browser-side video-to-audio extraction
- Adaptive single-file or chunked upload
- Sequential transcription
- Boundary-aware transcript reconstruction
- Structured AI analysis
- Question-level candidate-answer evaluation
- Expected-answer checklists
- Missed points and likely knowledge gaps
- Root-cause analysis
- Practice tasks and revision plans
- Interview-readiness contribution

### Daily Planning and Notifications

- Personalized preparation plans
- Bounded daily tasks
- DSA, profile, resume, and interview actions
- Selected-task preservation during regeneration
- Real-time Socket.IO notifications
- Unread notification state
- User-controlled notification preferences
- Timezone-aware digest configuration
- Protected automation endpoint for scheduled reminder evaluation

---

## Readiness Engine

PlacementOS converts activity from multiple domains into one materialized readiness model.

```mermaid
flowchart TB
    DSA[DSA Performance] --> SCORE[Placement Readiness Score]
    RESUME[Resume Quality] --> SCORE
    INTERVIEW[Interview Performance] --> SCORE
    PROFILE[Profile Completion] --> SCORE
    STREAK[Preparation Consistency] --> SCORE

    SCORE --> DB[(ReadinessScore)]
    DB --> DASHBOARD[Fast Dashboard Reads]
    DB --> HISTORY[Readiness History]
```

The aggregate is recalculated after relevant domain updates. This creates predictable dashboard performance while preserving a traceable history of readiness changes.

---

# System Architecture

PlacementOS uses a **domain-oriented modular-monolith architecture**.

The frontend and backend are deployed independently, while the backend remains one Node.js application with explicit boundaries around authentication, preparation evidence, AI analysis, readiness aggregation, notifications, and external integrations.

```mermaid
flowchart TB
    USER([Student / Placement Candidate])

    subgraph CLIENT["Frontend — Vercel"]
        SPA["React 19 + TypeScript + Vite"]
        ROUTES["React Router"]
        STATE["Zustand + TanStack Query"]
        HTTP["Axios API Client"]
        SOCKET_CLIENT["Socket.IO Client"]
        MEDIA["FFmpeg WebAssembly"]
    end

    subgraph SERVER["Backend — Render"]
        API["Node.js + Express + TypeScript"]
        MIDDLEWARE["Auth · Validation · CORS · Rate Limits · Upload Guards"]
        CONTROLLERS["Controllers"]
        SERVICES["Domain Services"]
        REALTIME["Socket.IO Server"]
    end

    subgraph DATA["Persistence"]
        PRISMA["Prisma ORM"]
        POSTGRES[("Neon PostgreSQL")]
    end

    subgraph PROVIDERS["External Services"]
        FIREBASE["Firebase Authentication"]
        GROQ["Groq Transcription + AI Analysis"]
        CLOUDINARY["Cloudinary"]
        EMAIL["EmailJS"]
        TELEGRAM["Telegram Bot API"]
        RAZORPAY["Razorpay"]
    end

    USER --> SPA
    SPA --> ROUTES
    ROUTES --> STATE
    STATE --> HTTP
    SPA --> MEDIA
    HTTP -- "HTTPS REST / multipart" --> API
    SOCKET_CLIENT <-- "WebSocket / fallback" --> REALTIME

    API --> MIDDLEWARE
    MIDDLEWARE --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> PRISMA
    PRISMA --> POSTGRES

    SERVICES --> FIREBASE
    SERVICES --> GROQ
    SERVICES --> CLOUDINARY
    SERVICES --> EMAIL
    SERVICES --> TELEGRAM
    SERVICES --> RAZORPAY
    SERVICES --> REALTIME
```

### Live Deployment

| Layer | Platform | Endpoint |
|---|---|---|
| Frontend | Vercel | [placement-os-kappa.vercel.app](https://placement-os-kappa.vercel.app) |
| Backend API | Render | [placementos-api-2acg.onrender.com](https://placementos-api-2acg.onrender.com) |
| Health Check | Render | [placementos-api-2acg.onrender.com/api/health](https://placementos-api-2acg.onrender.com/api/health) |
| Database | Neon PostgreSQL | Managed production database |
| Media | Cloudinary | Managed object storage |
| Identity | Firebase + PlacementOS JWT | Federated and first-party authentication |
| AI | Groq | Transcription and structured analysis |

A full engineering study can be kept at:

```text
docs/architecture/PlacementOS_Complete_Architecture_Blueprint.pdf
```

---

## Architectural Style

The modular-monolith design was selected because PlacementOS has:

- strongly connected relational data;
- shared readiness calculations;
- cross-domain workflows;
- one primary engineering owner;
- moderate current traffic;
- no immediate requirement for independently scaled microservices.

This structure avoids premature operational complexity while preserving clear extraction paths for future workers, queues, and distributed services.

```mermaid
flowchart LR
    ROUTES[Routes] --> MIDDLEWARE[Middleware]
    MIDDLEWARE --> CONTROLLERS[Controllers]
    CONTROLLERS --> SERVICES[Domain Services]
    SERVICES --> PERSISTENCE[Prisma and PostgreSQL]
    SERVICES --> ADAPTERS[External Provider Adapters]
```

---

## Frontend Architecture

The frontend is a React single-page application built with TypeScript and Vite.

```mermaid
flowchart TB
    subgraph PRESENTATION["Presentation"]
        PUBLIC["Public and Authentication Pages"]
        SHELL["Protected Application Shell"]
        MODULES["Dashboard · DSA · Resume · Interviews · Profile · Settings"]
    end

    subgraph APPLICATION["Application State"]
        QUERY["TanStack Query"]
        STORE["Zustand"]
        API["Axios Client"]
        SOCKET["Socket.IO Client"]
    end

    subgraph PLATFORM["Browser Capabilities"]
        ROUTER["React Router"]
        MEDIA["FFmpeg WebAssembly"]
        STORAGE["Local and Session Storage"]
    end

    PUBLIC --> APPLICATION
    SHELL --> APPLICATION
    MODULES --> APPLICATION
    APPLICATION --> PLATFORM
```

### Frontend Responsibilities

| Area | Responsibility |
|---|---|
| Routing | Public, authenticated, and protected route orchestration |
| Server state | Caching, invalidation, loading, and error handling |
| Client state | Authentication and local UI state |
| API communication | Bearer-token injection and centralized request configuration |
| Real time | Live notification delivery and unread-state updates |
| Media preprocessing | Local audio extraction and chunk preparation |
| Responsive UI | Desktop shell, mobile layouts, and touch-safe controls |
| Accessibility | Focus states, semantic structure, reduced-motion support, explicit status messaging |

### Design System

The UI follows a dark navy and charcoal visual system with:

- indigo-violet accents;
- rounded surfaces;
- subtle borders and glows;
- responsive spacing;
- accessible focus states;
- reduced-motion support;
- explicit loading, success, and error feedback.

---

## Backend Architecture

The backend is organized into layered modules with domain-specific services.

```mermaid
flowchart TB
    subgraph HTTP["HTTP and Real-Time Layer"]
        EXPRESS["Express App"]
        ROUTES["REST and Multipart Routes"]
        HEALTH["Health Endpoints"]
        SOCKET["Socket.IO Server"]
    end

    subgraph SECURITY["Middleware Layer"]
        AUTH["Authentication and Authorization"]
        VALIDATION["Validation"]
        CORS["CORS"]
        RATE["Rate Limiting"]
        UPLOAD["Upload Guards"]
        ERRORS["Error Mapping"]
    end

    subgraph APP["Application Layer"]
        CONTROLLERS["Controllers"]
        SERVICES["Domain Services"]
    end

    subgraph DOMAIN["Domain Modules"]
        IDENTITY["Authentication and Profile"]
        DSA["DSA Tracker"]
        RESUME["Resume Intelligence"]
        INTERVIEW["Interview Replay"]
        READINESS["Readiness Engine"]
        PLAN["Daily Plan"]
        NOTIFICATIONS["Notifications"]
        PAYMENTS["Payments"]
        FEEDBACK["Feedback"]
    end

    subgraph INFRA["Infrastructure"]
        PRISMA["Prisma Client"]
        DATABASE[("PostgreSQL")]
        PROVIDERS["External Provider Adapters"]
    end

    HTTP --> SECURITY
    SECURITY --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> DOMAIN
    DOMAIN --> PRISMA
    PRISMA --> DATABASE
    DOMAIN --> PROVIDERS
```

### Backend Design Principles

- Controllers remain thin and delegate business rules to services.
- User ownership is enforced through user-scoped queries.
- Cross-domain readiness updates are centralized.
- External providers are accessed through service boundaries.
- AI output is validated and normalized before persistence.
- Provider failures are mapped to stable HTTP responses.
- Sensitive credentials remain server-side.
- Interview processing is protected by retry, queue, and duplicate-work controls.

---

## Data Architecture

Neon PostgreSQL is the system of record, accessed through Prisma ORM.

### Core Entities

| Entity | Purpose |
|---|---|
| `User` | Identity, role, authentication state, ownership root |
| `Profile` | Skills, target companies, college, biography, social links |
| `DSAProblem` | Problem metadata, topic, pattern, difficulty, status, notes |
| `DSARevision` | Revision scheduling and revision history |
| `Resume` | Uploaded document, score, analysis, and freshness metadata |
| `InterviewSession` | Source, transcript, analysis, score, and workflow status |
| `InterviewQuestionReplay` | Question-level candidate answer and AI feedback |
| `ReadinessScore` | Materialized cross-domain readiness aggregate |
| `ReadinessHistory` | Historical readiness changes |
| `DailyPlan` | Generated tasks and completion state |
| `Streak` | Preparation consistency |
| `Notification` | In-app and email notification record |
| `NotificationPreference` | Digest, timezone, and reminder settings |
| `Feedback` | User feedback and bug reports |
| `Payment` | Premium-payment records |

### Entity Relationships

```mermaid
erDiagram
    USER ||--|| PROFILE : has
    USER ||--|| READINESS_SCORE : has
    USER ||--|| NOTIFICATION_PREFERENCE : configures

    USER ||--o{ DSA_PROBLEM : owns
    DSA_PROBLEM ||--o{ DSA_REVISION : schedules

    USER ||--o{ RESUME : uploads

    USER ||--o{ INTERVIEW_SESSION : records
    INTERVIEW_SESSION ||--o{ INTERVIEW_QUESTION_REPLAY : contains

    USER ||--o{ DAILY_PLAN : receives
    USER ||--o{ STREAK : maintains
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ READINESS_HISTORY : generates
    USER ||--o{ FEEDBACK : submits
    USER ||--o{ PAYMENT : makes
```

### Data-Modeling Principles

- Every preparation record is tied to its owner.
- One-to-one aggregates use stable upsert semantics.
- Enum-backed fields constrain critical workflow states.
- Readiness is materialized for predictable dashboard reads.
- Interview AI output is stored as structured product data.
- Prisma migrations preserve schema history across environments.

---

## Critical Workflows

### Authentication

```mermaid
sequenceDiagram
    actor User
    participant Client as React Client
    participant API as Express API
    participant Firebase
    participant DB as PostgreSQL
    participant Telegram

    User->>Client: Sign in
    Client->>API: Credentials or Firebase ID token

    alt Google authentication
        API->>Firebase: Verify ID token
        Firebase-->>API: Verified identity
    else Email and password
        API->>API: Verify password hash
    end

    API->>DB: Lookup or create user
    DB-->>API: User and profile
    API->>API: Issue access and refresh tokens
    API-->>Client: Authenticated session
    API-->>Telegram: Optional operational alert
```

The backend verifies Google identity server-side before issuing PlacementOS tokens.

### Interview Replay and AI Pipeline

```mermaid
flowchart TD
    INPUT[Manual, Audio, or Video Input] --> VALIDATE[Browser Metadata Validation]
    VALIDATE --> VIDEO{Video?}

    VIDEO -- Yes --> EXTRACT[FFmpeg Extracts Audio Locally]
    VIDEO -- No --> AUDIO[Use Provided Audio]
    EXTRACT --> SIZE[Evaluate Processed Audio Size]
    AUDIO --> SIZE

    SIZE --> CHUNK{Chunking Required?}
    CHUNK -- No --> SINGLE[Single Multipart Upload]
    CHUNK -- Yes --> PARTS[Generate Ordered Overlapping Chunks]

    SINGLE --> SERVER[Backend Validation]
    PARTS --> SERVER

    SERVER --> TRANSCRIBE[Sequential Groq Transcription]
    TRANSCRIBE --> COMBINE[Boundary-Aware Transcript Merge]
    COMBINE --> ANALYZE[Structured AI Analysis]
    ANALYZE --> PERSIST[Persist Session and Question Replays]
    PERSIST --> SCORE[Recalculate Readiness]
    SCORE --> EVENT[Emit Socket.IO Completion Event]
```

### Resume Analysis

```mermaid
flowchart LR
    UPLOAD[Resume Upload] --> VALIDATE[Multipart Validation]
    VALIDATE --> STORAGE[Cloudinary Storage]
    STORAGE --> ANALYZE[Text Extraction and AI Analysis]
    ANALYZE --> RESULT[Structured Score and Recommendations]
    RESULT --> DB[(Resume Record)]
    DB --> READINESS[Readiness Recalculation]
    READINESS --> NOTIFY[Real-Time Completion Notification]
```

### Real-Time Notifications

```mermaid
flowchart LR
    EVENTS[Domain Completion Events] --> RECORD[Notification Record]
    RECORD --> SOCKET[Socket.IO notification:new]
    SOCKET --> BELL[Bell UI and Unread Count]
```

---

## AI and Media Engineering

The Interview Replay pipeline is one of the most technically significant parts of PlacementOS.

### Privacy-Aware Browser Processing

Original video is intentionally not uploaded.

For video input:

1. The browser validates the media.
2. FFmpeg WebAssembly loads only when needed.
3. Audio is extracted locally.
4. Audio is converted into a compressed transcription-compatible format.
5. The original video remains on the user's device.

This reduces:

- backend bandwidth;
- object-storage cost;
- unnecessary exposure of personal video;
- provider upload-limit failures.

### Adaptive Upload Strategy

```mermaid
flowchart TD
    SOURCE[Processed Audio] --> LIMIT{Within Safe Size Limit?}
    LIMIT -- Yes --> ONE[Single Upload]
    LIMIT -- No --> MANY[Overlapping Chunks]
    MANY --> ORDER[Ordered Upload]
    ORDER --> SERIAL[Sequential Transcription]
    SERIAL --> MERGE[Transcript Merge]
    ONE --> TRANSCRIBE[Transcription]
    TRANSCRIBE --> FINAL[Final Transcript]
    MERGE --> FINAL
```

### AI Output Contract

The AI layer produces structured output containing:

- overall and category-level scores;
- strengths and weaknesses;
- question-level candidate answers;
- expected-answer points;
- missed concepts;
- likely root causes;
- practice tasks;
- short revision plans;
- company-readiness guidance.

Responses are parsed, normalized, and range-checked before persistence.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS |
| Client State | Zustand, TanStack Query |
| Networking | Axios, Socket.IO Client |
| Browser Media | FFmpeg WebAssembly |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Authentication | JWT, bcrypt, Firebase Admin |
| AI | Groq SDK |
| Storage | Cloudinary |
| Email | EmailJS |
| Payments | Razorpay |
| Deployment | Vercel, Render, Neon |
| Tooling | GitHub, Vitest, TypeScript builds |

---

## External Integrations

| Integration | Responsibility |
|---|---|
| Neon | Production PostgreSQL hosting |
| Prisma | Typed ORM, migrations, and relational access |
| Render | Backend deployment |
| Vercel | Frontend deployment |
| Firebase | Google authentication and identity-token verification |
| Groq | Transcription and structured AI analysis |
| Cloudinary | Resume and processed-audio storage |
| EmailJS | Verification and notification email delivery |
| Socket.IO | Real-time in-app notifications |
| Telegram Bot API | Operational authentication alerts |
| Razorpay | Premium-payment integration |

---

## Security and Privacy

PlacementOS stores sensitive preparation data, including resumes, interview transcripts, scores, target companies, and profile information.

Implemented controls include:

- bcrypt password hashing;
- JWT-protected API routes;
- access and refresh token separation;
- backend verification of Firebase tokens;
- role-aware authorization;
- user-scoped database queries;
- production CORS restrictions;
- request validation;
- upload and duration limits;
- rate limiting;
- server-only provider credentials;
- environment-variable-based secret management;
- generic provider-error responses;
- original-video exclusion by design.

The media architecture intentionally sends only processed audio required for transcription.

---

## Reliability and Failure Handling

PlacementOS includes resilience mechanisms beyond standard CRUD behavior:

- exponential backoff for retryable AI failures;
- provider `Retry-After` handling;
- explicit `429` and `503` response mapping;
- serial transcription queue;
- per-user interview-processing lock;
- duplicate-notification prevention;
- structured fallback parsing for malformed AI output;
- health and database-health endpoints;
- production deployment checks.

### Current Scope

The queue and processing lock are process-local and appropriate for the current single-instance backend.

Future horizontal scaling should introduce:

- distributed locks;
- durable background jobs;
- shared provider-rate coordination;
- worker-based transcription and analysis;
- structured execution history and metrics.

---

## Production Deployment

```mermaid
flowchart TB
    GITHUB[GitHub main branch]

    GITHUB --> VERCEL[Vercel]
    VERCEL --> CLIENT[Build client with Vite]
    CLIENT --> CDN[Deploy Static SPA]

    GITHUB --> RENDER[Render]
    RENDER --> INSTALL[Install Dependencies]
    INSTALL --> PRISMA[Generate Prisma Client]
    PRISMA --> MIGRATE[Apply Migrations]
    MIGRATE --> BUILD[Compile TypeScript]
    BUILD --> START[Start Express and Socket.IO]
```

| Component | Deployment |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |
| Media | Cloudinary |
| Authentication | Firebase + PlacementOS JWT |
| AI | Groq |
| Real-Time | Socket.IO |

---

## Repository Structure

```text
PlacementOS/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── types/
│   │   └── utils/
│   ├── vercel.json
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── prisma/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── index.ts
│   └── package.json
│
├── docs/
│   └── architecture/
│       └── PlacementOS_Complete_Architecture_Blueprint.pdf
│
└── README.md
```

---

## Engineering Decisions

| Decision | Rationale | Current trade-off |
|---|---|---|
| Modular monolith | Preserves delivery speed and relational consistency | Process-local coordination |
| PostgreSQL and Prisma | Supports connected domain data and typed access | Migration and schema discipline |
| REST plus Socket.IO | Separates command/query requests from push events | Two communication models |
| Browser-side FFmpeg | Protects privacy and reduces backend bandwidth | Browser CPU and memory cost |
| Structured AI JSON | Converts probabilistic output into stable product data | Prompt and parser maintenance |
| Adaptive audio chunking | Handles provider upload limits transparently | More upload and merge logic |
| Materialized readiness score | Enables predictable dashboard reads | Additional write-time computation |
| Feature branches and atomic commits | Improves traceability and rollback safety | More disciplined Git workflow |

---

## Current Limitations

- Interview transcription and analysis remain request-bound.
- Processing locks and the transcription queue are process-local.
- Large multipart uploads still use memory-backed handling.
- External-object deletion requires stronger reconciliation.
- Readiness calibration needs long-term outcome validation.
- Production observability currently relies mainly on application and platform logs.
- External scheduling for notification automation is optional and not required for core product usage.

---

## Future Engineering Roadmap

### Priority 0

- Add idempotency keys to upload and AI-analysis commands
- Add structured correlation IDs
- Enforce total multipart-byte limits
- Strengthen external-object deletion reconciliation
- Expand end-to-end production tests

### Priority 1

- Move transcription and analysis to durable background jobs
- Introduce distributed locks
- Add Redis-backed provider coordination
- Stream large uploads to object storage
- Add automation-run history and failure alerts
- Add provider latency, retry, and success-rate metrics

### Priority 2

- Version readiness formulas and AI prompt schemas
- Add per-user AI usage accounting
- Build an admin observability dashboard
- Extract dedicated notification and media workers when load requires them

---

## Project Status

PlacementOS is deployed as a production-style portfolio application with:

- a live React frontend;
- a deployed Node.js API;
- managed PostgreSQL persistence;
- Firebase-backed Google authentication;
- AI-assisted resume and interview workflows;
- real-time notifications;
- responsive desktop and mobile interfaces;
- production health checks;
- automatic deployments from GitHub.

The project demonstrates engineering beyond a standard CRUD application through privacy-aware media processing, provider resilience, cross-domain scoring, real-time events, relational modeling, and structured AI workflows.

---

## Architecture Documentation

Detailed architecture study:

```text
docs/architecture/PlacementOS_Complete_Architecture_Blueprint.pdf
```

---

## Author

**Aryan Jaiswal**

[GitHub — aryancodes12-bit](https://github.com/aryancodes12-bit)

Full-stack engineering · AI-assisted workflows · System design · Placement technology

---

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Aryan Jaiswal

