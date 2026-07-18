import { redis } from "./storage.js";
import axios from "axios";
import {
  JOB_MAX_AGE,
  CLEANUP_INTERVAL,
} from "../config/constants.js";

// Cleanup old jobs periodically from Redis
export const startCleanupJob = (): void => {
  setInterval(async () => {
    try {
      const now = Date.now();
      const keys: string[] = await redis.keys("job:*");

      for (const key of keys) {
        const job = await redis.hgetall(key);

        const createdAt = job.createdAt
          ? Number(job.createdAt)
          : null;

        if (createdAt && now - createdAt > JOB_MAX_AGE) {
          await redis.del(key);
          console.log(`[CLEANUP] Deleted job ${key}`);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error(`[CLEANUP] Error during cleanup:`, error.message);
    }
  }, CLEANUP_INTERVAL);

  console.log(
    `✅ Cleanup job started (runs every ${CLEANUP_INTERVAL / 60000} minutes)`
  );

  // Keep Render free tier service alive
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    // Ping every 14 minutes (Render spins down after 15 mins of inactivity)
    setInterval(async () => {
      try {
        await axios.get(`${RENDER_URL}/health`);
        console.log(`[PING] Kept Render service alive at ${RENDER_URL}`);
      } catch (err) {
        const error = err as Error;
        console.error(`[PING] Error keeping service alive:`, error.message);
      }
    }, 14 * 60 * 1000);
    console.log(`✅ Render Keep-Alive job started for ${RENDER_URL}`);
  }
};
