import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import {
  REDIS_CONFIG,
  getJob,
  updateJob,
} from "../config/queue.js";
import {
  JOB_STATUS,
  POLL_INTERVAL,
  MAX_POLL_ATTEMPTS,
} from "../config/constants.js";
import {
  submitToJudge0,
  getSubmissionStatus,
  buildPayload,
} from "./judge0Service.js";
import { tokenToJobId } from "../utils/storage.js";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface TestCase {
  input: string;
  expected_output: string;
}

interface WorkerJobData {
  jobId: string;
  code: string;
  language_id: number | string;
  allTestCases?: TestCase[] | null;
  sampleTestCases?: TestCase[];
  hiddenTestCases?: TestCase[];
  mode?: "run" | "submit";
  userId?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Build stdin for multiple test cases
export const buildStdinWithTestCases = (testCases: TestCase[]): string => {
  if (!testCases || testCases.length === 0) return "";
  const count = testCases.length;
  const inputs = testCases.map(tc => tc.input).join("");
  return `${count}\n${inputs}`;
};

// Compare stdout with expected output
export const evaluateTestCases = (
  stdout: string,
  testCases: TestCase[],
  offset = 0
) => {
  if (!testCases || testCases.length === 0) return [];

  const outputLines = stdout
    .trim()
    .split("\n")
    .map(line => line.trim());

  return testCases.map((testCase, index) => {
    const actualOutput = outputLines[index + offset] ?? "";
    const expectedOutput = testCase.expected_output.trim();
    const passed = actualOutput === expectedOutput;

    return {
      testCase: index + 1,
      input: testCase.input.trim(),
      expected: expectedOutput,
      actual: actualOutput,
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
    };
  });
};

/* ------------------------------------------------------------------ */
/* Worker Factory                                                     */
/* ------------------------------------------------------------------ */

export const createWorker = (): Worker<WorkerJobData> => {
  const workerRedis = new Redis(REDIS_CONFIG);

  const worker = new Worker<WorkerJobData>(
    "execution-queue",
    async (job: Job<WorkerJobData>) => {
      const {
        jobId,
        code,
        language_id,
        allTestCases,
        sampleTestCases = [],
        hiddenTestCases = [],
        mode = "run",
        userId = "anonymous",
      } = job.data;

      console.log("🔥 Worker picked job:", job.id, jobId);

      try {
        await updateJob(jobId, { status: JOB_STATUS.PROCESSING });

        console.log(
          `[WORKER] Job ${jobId} - Submitting to Judge0 (user: ${userId}, mode: ${mode})`
        );

        const finalStdin = allTestCases
          ? buildStdinWithTestCases(allTestCases)
          : "";

        const token = await submitToJudge0(code, language_id, finalStdin);
        if (!token) throw new Error("No token from Judge0");

        await tokenToJobId.set(token, jobId);
        await updateJob(jobId, { token });

        let attempts = 0;

        while (attempts < MAX_POLL_ATTEMPTS) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL));
          attempts++;

          const data = await getSubmissionStatus(token);
          const statusId =
            typeof data.status === "object"
              ? data.status.id
              : undefined;

          console.log(
            `🔁 Poll ${attempts} → status ${statusId} for job ${jobId}`
          );

          if (statusId && statusId > 2) {
            const payload = buildPayload(data);
            const jobData = await getJob(jobId);

            const storedTestCases = jobData?.testCases
              ? JSON.parse(jobData.testCases)
              : null;
            const storedSampleCases = jobData?.sampleTestCases
              ? JSON.parse(jobData.sampleTestCases)
              : [];
            const storedHiddenCases = jobData?.hiddenTestCases
              ? JSON.parse(jobData.hiddenTestCases)
              : [];

            const jobMode = jobData?.mode ?? "run";
            const hasExecutionError =
              !!payload.compile_output || !!payload.stderr;

            let finalResult: unknown = payload;

            if (hasExecutionError && jobMode === "submit") {
              let verdict = "Runtime Error";
              if (payload.compile_output) verdict = "Compilation Error";
              else if (payload.status_id === 5)
                verdict = "Time Limit Exceeded";

              finalResult = {
                verdict,
                status: verdict,
                status_id: payload.status_id,
                compile_output: payload.compile_output ?? "",
                stderr: payload.stderr ?? "",
                message: payload.message ?? "",
                time: payload.time,
                memory: payload.memory,
              };
            } else if (storedTestCases?.length) {
              const testResults = evaluateTestCases(
                payload.stdout ?? "",
                storedTestCases
              );

              if (jobMode === "submit") {
                const sampleResults = evaluateTestCases(
                  payload.stdout ?? "",
                  storedSampleCases
                );

                const hiddenOffset = storedSampleCases.length;
                const hiddenResults = evaluateTestCases(
                  payload.stdout ?? "",
                  storedHiddenCases,
                  hiddenOffset
                );

                const verdict =
                  hiddenResults.length &&
                  hiddenResults.some(r => !r.passed)
                    ? "Wrong Answer"
                    : "Accepted";

                finalResult = {
                  verdict,
                  status: verdict,
                  status_id: payload.status_id,
                  sampleTestResults: sampleResults,
                  compile_output: payload.compile_output ?? "",
                  stderr: payload.stderr ?? "",
                  message: payload.message ?? "",
                  time: payload.time,
                  memory: payload.memory,
                };
              } else {
                finalResult = {
                  ...payload,
                  testResults,
                  totalTests: testResults.length,
                  passedTests: testResults.filter(r => r.passed).length,
                };
              }
            }

            await updateJob(jobId, {
              status: JOB_STATUS.COMPLETED,
              result: JSON.stringify(finalResult),
              delivered: "false",
            });

            await tokenToJobId.delete(token);
            return finalResult;
          }
        }

        // Timeout
        const timeoutResult =
          mode === "submit"
            ? { verdict: "Time Limit Exceeded", status: "Time Limit Exceeded" }
            : { error: "Execution timeout (30 seconds)" };

        await updateJob(jobId, {
          status: JOB_STATUS.TIMEOUT,
          result: JSON.stringify(timeoutResult),
          error: "Execution timeout",
          delivered: "false",
        });

        await tokenToJobId.delete(token);
        throw new Error("Execution timeout");
      } catch (err) {
        const error = err as Error;
        console.error(`[WORKER] Job ${jobId} - ✗ Error:`, error.message);

        await updateJob(jobId, {
          status: JOB_STATUS.FAILED,
          error: error.message,
        });

        throw error;
      }
    },
    {
      connection: workerRedis,
      concurrency: 5,
    }
  );

  /* ---------------------------------------------------------------- */
  /* Worker Events                                                    */
  /* ---------------------------------------------------------------- */

  worker.on("ready", () => {
    console.log("✅ Worker ready and listening for jobs");
  });

  worker.on("active", job => {
    console.log("▶️ Job active:", job.id);
  });

  worker.on("completed", job => {
    console.log("🏁 Job finished:", job.id);
  });

  worker.on("failed", (job, err) => {
    console.error("❌ Job failed:", job?.id, err.message);
  });

  worker.on("error", err => {
    console.error("🔥 Worker error:", err);
  });

  return worker;
};
