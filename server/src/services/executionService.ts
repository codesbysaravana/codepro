import { jobStore, tokenToJobId } from "../utils/storage.js";
import {
  JOB_STATUS,
  POLL_INTERVAL,
  MAX_POLL_ATTEMPTS,
  type JobStatus,
} from "../config/constants.js";
import {
  submitToJudge0,
  getSubmissionStatus,
  buildPayload,
} from "./judge0Service.js";
import { broadcastToJob } from "../utils/sse.js";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface TestCase {
  input: string;
  expected_output: string;
}

interface ExecutionOptions {
  allTestCases?: TestCase[] | null;
  sampleTestCases?: TestCase[];
  hiddenTestCases?: TestCase[];
  mode?: "run" | "submit";
}

interface Judge0Payload {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
  status_id?: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Build stdin for multiple test cases using while-loop format
export const buildStdinWithTestCases = (testCases: TestCase[]): string => {
  if (!testCases || testCases.length === 0) return "";

  const count = testCases.length;
  const inputs = testCases.map(tc => tc.input).join("");

  return `${count}\n${inputs}`;
};

// Compare stdout against expected outputs
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
/* Worker Execution Logic                                             */
/* ------------------------------------------------------------------ */

export const executeSubmission = async (
  jobId: string,
  code: string,
  language_id: number | string,
  options: ExecutionOptions = {}
): Promise<void> => {
  const {
    allTestCases = null,
    sampleTestCases = [],
    hiddenTestCases = [],
    mode = "run",
  } = options;

  try {
    // ⚠️ FIXED: jobStore.get is async
    const existingJob = await jobStore.get(jobId);
    const userId = existingJob?.userId ?? "anonymous";

    await jobStore.set(jobId, {
      status: JOB_STATUS.PROCESSING,
      token: null,
      result: null,
      error: null,
      createdAt: Date.now(),
      userId,
      testCases: allTestCases ?? undefined,
      sampleTestCases,
      hiddenTestCases,
      mode,
    });

    console.log(
      `[WORKER] Job ${jobId} - Submitting to Judge0 (user: ${userId}, mode: ${mode})`
    );

    const finalStdin = allTestCases
      ? buildStdinWithTestCases(allTestCases)
      : "";

    console.log(
      `[WORKER] Job ${jobId} - Test cases: ${allTestCases?.length ?? 0}`
    );

    const token = await submitToJudge0(code, language_id, finalStdin);
    if (!token) throw new Error("No token from Judge0");

    console.log(`[WORKER] Job ${jobId} - Token: ${token}`);

    const jobData = await jobStore.get(jobId);
    if (!jobData) throw new Error("Job not found after submission");

    jobData.token = token;
    await tokenToJobId.set(token, jobId);

    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const data: Judge0Payload = await getSubmissionStatus(token);
        const statusId = data.status_id;

        console.log(
          `[POLL] Job ${jobId} - Status ID: ${statusId}, Attempt: ${attempts}`
        );

        if (statusId && statusId > 2) {
          console.log(`[POLL] Job ${jobId} - ✓ COMPLETED`);

          const payload = buildPayload(data);
          const jobData = await jobStore.get(jobId);
          if (!jobData) return;

          jobData.status = JOB_STATUS.COMPLETED;
          jobData.result = payload;

          const storedTestCases = jobData.testCases ?? [];
          const storedSampleCases = jobData.sampleTestCases ?? [];
          const storedHiddenCases = jobData.hiddenTestCases ?? [];

          const hasExecutionError =
            !!payload.compile_output || !!payload.stderr;

          if (hasExecutionError && jobData.mode === "submit") {
            let verdict = "Runtime Error";

            if (payload.compile_output) verdict = "Compilation Error";
            else if (payload.status_id === 5)
              verdict = "Time Limit Exceeded";

            jobData.result = {
              verdict,
              status: verdict,
              status_id: payload.status_id,
              compile_output: payload.compile_output ?? "",
              stderr: payload.stderr ?? "",
              message: payload.message ?? "",
              time: payload.time,
              memory: payload.memory,
            };
          } else if (storedTestCases.length > 0) {
            const testResults = evaluateTestCases(
              payload.stdout ?? "",
              storedTestCases
            );

            if (jobData.mode === "submit") {
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
                hiddenResults.length > 0 &&
                hiddenResults.some(r => !r.passed)
                  ? "Wrong Answer"
                  : "Accepted";

              jobData.result = {
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
              jobData.result = {
              ...(jobData.result as Record<string, unknown>),
              testResults,
              totalTests: testResults.length,
              passedTests: testResults.filter(r => r.passed).length,
            };
            }
          }

          broadcastToJob(jobId, {
            jobId,
            result: jobData.result,
            mode: jobData.mode ?? "run",
          });

          clearInterval(pollInterval);
          await tokenToJobId.delete(token);
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          const jobData = await jobStore.get(jobId);
          if (!jobData) return;

          jobData.status = JOB_STATUS.TIMEOUT;
          jobData.error = "Execution timeout (30 seconds)";

          broadcastToJob(jobId, {
            jobId,
            error: "Timeout",
            mode: jobData.mode ?? "run",
          });

          clearInterval(pollInterval);
          await tokenToJobId.delete(token);
        }
      } catch (pollErr) {
        const error = pollErr as Error;
        console.error(
          `[POLL] Job ${jobId} - Polling error:`,
          error.message
        );

        if (attempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(pollInterval);
        }
      }
    }, POLL_INTERVAL);
  } catch (err) {
    const error = err as Error;
    console.error(`[WORKER] Job ${jobId} - ✗ Error:`, error.message);

    const jobData = await jobStore.get(jobId);
    if (jobData) {
      jobData.status = JOB_STATUS.FAILED;
      jobData.error = error.message;
    }
  }
};
