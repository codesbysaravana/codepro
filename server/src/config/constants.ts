// Configuration constants

export const JUDGE0_URL: string =
  //process.env.JUDGE0_URL ?? "http://172.17.0.1:2358";
  process.env.JUDGE0_URL ?? "http://localhost:2358/";

export const PORT: number = Number(process.env.PORT ?? 5000);

// Job statuses (string literal union via `as const`)
export const JOB_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  TIMEOUT: "timeout",
} as const;

// Optional: derive a JobStatus type if you want strong typing elsewhere
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

// Polling configuration
export const POLL_INTERVAL = 500; // ms
export const MAX_POLL_ATTEMPTS = 60; // 30 seconds total

// Cleanup configuration
export const JOB_MAX_AGE = 30 * 60 * 1000; // 30 minutes
export const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

 

