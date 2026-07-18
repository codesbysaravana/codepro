# JudgeWeb - Online Code Execution Platform

A LeetCode-style competitive programming IDE with real-time code execution powered by Judge0.

---

## Quick Overview

**Frontend**: React + Vite (port 5174)  
**Backend**: Express.js (port 5000)  
**Judge0**: Docker container (port 2358)  
**Languages**: Python, JavaScript, C++, Java

---

## Main Application Flow

```
User Interface (React)
    ↓
[Frontend] LeetCodeApp.jsx
    ├─ Problem sidebar navigation (4 problems)
    ├─ Code editor with language selector
    ├─ Test case tabs (visible test cases)
    ├─ RUN / SUBMIT buttons
    └─ Results display with pass/fail indicators
    
         ↓ POST /run { code, language_id, test_cases[] }
    
[Backend] Express Server
    └─ Non-blocking Job Queue (Map-based)
    
         ↓ SSE real-time updates
    
[Frontend] Results rendered instantly
```

---

## Backend Flow (After POST /run Request)

```
1. REQUEST RECEIVED
   └─ Controller receives: code, language_id, test_cases[], userId

2. JOB QUEUING (IMMEDIATE RESPONSE)
   ├─ Generate unique jobId (UUID)
   ├─ Store job in jobStore Map with status: "QUEUED"
   ├─ Return jobId to frontend immediately (non-blocking)
   └─ Frontend connects to SSE stream for updates

3. BACKGROUND WORKER PROCESSING (Async)
   └─ executeSubmission() worker starts in background
      ├─ Change status → "PROCESSING"
      ├─ Build stdin from test_cases array
      │  (Format: count\ninput1\ninput2\n...)
      ├─ Submit to Judge0 (single call, all inputs)
      │  └─ Receive token
      └─ Start polling loop (every 500ms)

4. POLLING PHASE (Max 30 seconds)
   └─ Check Judge0 status every 500ms
      ├─ If status ≤ 2: Still executing
      ├─ If status > 2: Complete!
      │  ├─ Evaluate test cases (line-by-line comparison)
      │  ├─ Build results: {testResults[], passedTests, totalTests}
      │  ├─ Change status → "COMPLETED"
      │  └─ Broadcast via SSE to user
      │
      └─ If 30s timeout: status → "TIMEOUT"

5. SSE BROADCAST
   └─ Server sends "job-complete" event to frontend
      └─ Frontend receives and displays results

```

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Job Queue Type | In-Memory Map (non-persistent) |
| Polling Interval | 500ms |
| Max Wait Time | 30 seconds |
| Test Cases Per Problem | 3 |
| Supported Languages | 4 |
| SSE Connections | Per-user management |
| Auto-Cleanup | 30 min job retention |

---

## Architecture

```
backend/
├── index.js                          (Express app entry)
├── config/constants.js               (Centralized config)
├── controllers/
│   ├── executionController.js        (Request handler)
│   ├── sseController.js              (SSE connections)
│   └── systemController.js           (Health/languages)
├── services/
│   ├── executionService.js           (Core execution logic + polling)
│   └── judge0Service.js              (Judge0 API wrapper)
├── routes/
│   ├── executionRoutes.js            (POST /run, GET /job/:id)
│   ├── sseRoutes.js                  (GET /events)
│   └── systemRoutes.js               (GET /health, /languages)
└── utils/
    ├── storage.js                    (jobStore, tokenToJobId Map)
    ├── sse.js                        (Broadcast utilities)
    └── cleanup.js                    (Auto-delete old jobs)

frontend/
├── LeetCodeApp.jsx                   (Main component)
├── LeetCodeApp.css                   (Dark theme styling)
├── problems.json                     (Problem bank with test cases)
└── main.jsx                          (React entry point)
```

---

## Pros ✅

- **Non-blocking**: Frontend gets immediate response, no waiting for Judge0
- **Real-time Updates**: SSE provides instant result notifications
- **Single Judge0 Call**: All test cases execute in one submission (efficient)
- **Line-by-Line Evaluation**: Accurate pass/fail determination
- **LeetCode UI**: Professional, familiar interface for users
- **Modularized Backend**: Clean separation of concerns (controllers/services/routes)
- **Multi-language Support**: Python, JavaScript, C++, Java
- **Auto-cleanup**: Old jobs auto-deleted (30 min retention)
- **Per-user Results**: SSE routes results only to requesting user

---

## Cons ❌

- **In-Memory Queue**: Jobs lost on server restart (no persistence)
- **No Job Persistence**: Cannot resume/replay past submissions
- **Single Server**: Horizontal scaling requires session/state management
- **30s Timeout**: Long-running tests will fail
- **No Queue Prioritization**: FIFO only (can't prioritize)
- **Fixed Polling**: 500ms interval may be inefficient
- **No Rate Limiting**: Users can spam /run endpoint
- **No Job History**: No database tracking of attempts
- **No Concurrent Test Processing**: Sequential evaluation (slower for many tests)
- **Test Case Visibility**: All test cases shown to user (no hidden test suites)

---

## Production Readiness Checklist

| Item | Status |
|------|--------|
| Non-blocking execution | ✅ Done |
| Real-time updates | ✅ Done |
| Multi-language support | ✅ Done |
| Error handling | ⚠️ Basic |
| Input validation | ⚠️ Basic |
| Rate limiting | ❌ TODO |
| Database persistence | ❌ TODO |
| Job queue (Redis/BullMQ) | ❌ TODO |
| Load balancing | ❌ TODO |
| Monitoring/Logging | ⚠️ Console only |
| Unit tests | ❌ TODO |

---

## Quick Start

```bash
# Backend
cd backend && npm install && node index.js

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Access at http://localhost:5174
```

---

## Next Steps to Production

1. **Replace Map with Redis** → BullMQ for persistent, scalable queue
2. **Add Database** → PostgreSQL for job history & user tracking
3. **Implement Rate Limiting** → Prevent abuse
4. **Add Authentication** → User accounts & submission history
5. **Enable Load Balancing** → Multiple backend instances
6. **Add Caching** → Cache language lists, problem data
7. **Monitoring** → Prometheus metrics, error tracking (Sentry)
8. **Write Tests** → Unit & integration tests
