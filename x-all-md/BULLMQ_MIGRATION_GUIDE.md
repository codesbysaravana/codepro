# BullMQ Integration - Startup Guide

## ✅ Migration Complete

Your backend has been successfully migrated from Map-based in-memory queueing to **BullMQ + Redis** for production-ready job queue management.

## 🏗️ Architecture Overview

### Components:
1. **API Server** (`index.js`) - Handles HTTP requests, creates jobs, manages SSE connections
2. **Worker Process** (`worker.js`) - Processes jobs from the queue, executes code on Judge0
3. **Redis** - Stores job data and manages the BullMQ queue
4. **BullMQ** - Distributed job queue system

### Job Flow:
```
Frontend → POST /run → API creates job → BullMQ Queue → Worker picks job
                                                          ↓
Frontend ← SSE /events ← Redis job completed ← Worker submits to Judge0
```

## 🚀 How to Start

### Prerequisites:
- Redis server running on `100.126.169.48:6379` (or update `config/queue.js`)
- Judge0 server running on `100.126.169.48:2358`

### Start in Development:

**Terminal 1 - API Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Worker Process:**
```bash
cd backend
npm run worker
```

### Start in Production:

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start index.js --name "judgeweb-api"

# Start worker
pm2 start worker.js --name "judgeweb-worker"

# Start multiple workers for better concurrency
pm2 start worker.js --name "judgeweb-worker" -i 3

# Monitor
pm2 monit

# Save configuration
pm2 save
pm2 startup
```

## 📡 API Endpoints (Unchanged)

All endpoints remain the same as before:

- `POST /run` - Submit code for execution
- `GET /job/:jobId` - Get job status
- `GET /events?jobId=<jobId>` - SSE connection for real-time updates
- `GET /health` - Health check
- `GET /languages` - List available languages

## 🔧 Configuration

### Redis Configuration
Edit `backend/config/queue.js`:
```javascript
const REDIS_CONFIG = {
  host: "100.126.169.48",  // Change to your Redis host
  port: 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};
```

### Judge0 Configuration
Edit `backend/config/constants.js`:
```javascript
JUDGE0_URL: "http://100.126.169.48:2358"
```

### Worker Concurrency
Edit `backend/services/workerService.js`:
```javascript
{
  connection: workerRedis,
  concurrency: 5  // Number of jobs processed simultaneously
}
```

## 📊 Monitoring

### Check Queue Status:
```bash
# Using Redis CLI
redis-cli -h 100.126.169.48
> KEYS job:*
> HGETALL job:<jobId>
> KEYS execution-queue:*
```

### View Worker Logs:
```bash
# If using PM2
pm2 logs judgeweb-worker

# If running directly
# Check terminal output
```

## 🧪 Testing

### Test Job Submission:
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "language_id": 71,
    "problemId": "two-sum",
    "userId": "test-user"
  }'
```

### Test SSE Connection:
```bash
curl -N http://localhost:5000/events?jobId=<job-id-from-above>
```

## 🔍 What Changed?

### Removed:
- ❌ Map-based in-memory storage (`jobStore`, `tokenToJobId`)
- ❌ Direct polling in `executionService.js`
- ❌ In-memory job queue

### Added:
- ✅ Redis-based job storage (`config/queue.js`)
- ✅ BullMQ queue system
- ✅ Separate worker process (`worker.js`)
- ✅ Worker service (`services/workerService.js`)
- ✅ Redis-based SSE polling

### Updated:
- 🔄 `controllers/executionController.js` - Uses BullMQ queue
- 🔄 `controllers/sseController.js` - Polls Redis for job completion
- 🔄 `utils/storage.js` - Now uses Redis instead of Map
- 🔄 `utils/cleanup.js` - Cleans up Redis keys
- 🔄 `index.js` - Added graceful shutdown

## ⚠️ Important Notes

1. **Always run both API and Worker** - Jobs won't process without a worker running
2. **Redis must be running** - The system will fail if Redis is unavailable
3. **No breaking changes** - All API endpoints and responses remain the same
4. **Horizontal scaling** - You can now run multiple workers for better performance
5. **Job persistence** - Jobs survive API server restarts (stored in Redis)

## 🐛 Troubleshooting

### Jobs stuck in QUEUED status:
- Check if worker is running: `pm2 list` or check terminal
- Check Redis connection: `redis-cli -h 100.126.169.48 ping`

### Worker not picking up jobs:
- Verify Redis connection in worker logs
- Check if queue name matches ("execution-queue")
- Restart worker process

### SSE not receiving results:
- Verify job status in Redis: `redis-cli HGETALL job:<jobId>`
- Check if worker completed the job
- Check browser console for SSE connection errors

## 📈 Performance Tips

1. **Scale workers horizontally** - Run multiple worker processes
2. **Adjust concurrency** - Increase/decrease based on Judge0 capacity
3. **Monitor Redis memory** - Set up Redis memory limits and eviction policies
4. **Use Redis persistence** - Enable RDB or AOF for job recovery

## 🎉 Benefits

- ✅ Production-ready queue system
- ✅ Job persistence across server restarts
- ✅ Horizontal scalability (multiple workers)
- ✅ Better error handling and retry logic
- ✅ Job monitoring and management
- ✅ No breaking changes to existing API
