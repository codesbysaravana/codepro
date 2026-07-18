import { v4 as uuidv4 } from "uuid";
import { type Request, type Response } from "express";

import { jobStore } from "../utils/storage.js";
import { JOB_STATUS, type JobStatus } from "../config/constants.js";
import { executionQueue } from "../config/queue.js";
import problemsData from "../data/problems.json" with { type: "json" };


/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface RunCodeBody {
  code?: string;
  language_id?: number | string;
  languageId?: number | string;
  problemId?: number | string;
  mode?: "run" | "submit";
  userId?: string;
}

interface JobRecord {
  status: JobStatus;
  token?: string | null;
  result?: string | null;
  error?: string | null;
  createdAt?: string;
  userId?: string;
  testCases?: string;
  sampleTestCases?: string;
  hiddenTestCases?: string;
  mode?: string;
  problemId?: string | number;
}

/* ------------------------------------------------------------------ */
/* POST /run                                                          */
/* ------------------------------------------------------------------ */

export const runCode = async (
  req: Request<{}, {}, RunCodeBody>,
  res: Response
): Promise<void> => {
  const {
    code,
    language_id,
    languageId,
    problemId,
    mode = "run",
    userId = "anonymous",
  } = req.body;

  const resolvedLanguageId = languageId ?? language_id;
  const normalizedMode: "run" | "submit" =
    mode === "submit" ? "submit" : "run";

  console.log("\n========== [API] /run REQUEST ==========");
  console.log("User ID:", userId);
  console.log("Language ID:", resolvedLanguageId);
  console.log("Mode:", normalizedMode);
  console.log("Problem ID:", problemId);
  console.log("Code preview:", code?.slice(0, 100) + "...");
  console.log("==================================\n");

  if (!code || !resolvedLanguageId || !problemId) {
    res
      .status(400)
      .json({ error: "code, languageId, and problemId are required" });
    return;
  }

  const problem = problemsData.problems.find(
    (p: any) =>
      p.problem_id === problemId || String(p.id) === String(problemId)
  );

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  const sampleTestCases = problem.testCases?.sample ?? [];
  const hiddenTestCases = problem.testCases?.hidden ?? [];

  const allTestCases =
    normalizedMode === "submit"
      ? [...sampleTestCases, ...hiddenTestCases]
      : sampleTestCases;

  if (!allTestCases.length) {
    res.status(400).json({ error: "No test cases found for this problem" });
    return;
  }

  console.log("Test Cases:", allTestCases.length);
  console.log("Sample Cases:", sampleTestCases.length);
  console.log("Hidden Cases:", hiddenTestCases.length);

  const jobId = uuidv4();

  await jobStore.set(jobId, {
    status: JOB_STATUS.QUEUED,
    token: null,
    result: null,
    error: null,
    createdAt: Date.now(),
    userId,
    testCases: allTestCases,
    sampleTestCases,
    hiddenTestCases,
    mode: normalizedMode,
  });


  console.log(`[API] Job ${jobId} created and queued for user ${userId}`);

  await executionQueue.add("execute", {
    jobId,
    code,
    language_id: resolvedLanguageId,
    userId,
    allTestCases,
    sampleTestCases,
    hiddenTestCases,
    mode: normalizedMode,
  });

  res.json({
    job_id: jobId,
    status: JOB_STATUS.QUEUED,
    message: "Job queued. Poll /job/{job_id} for results or listen via SSE.",
  });
};

/* ------------------------------------------------------------------ */
/* GET /job/:jobId                                                    */
/* ------------------------------------------------------------------ */

export const getJobStatus = async (
  req: Request<{ jobId: string }>,
  res: Response
): Promise<void> => {
  const { jobId } = req.params;

  console.log(`[POLL] /job/${jobId} - Status check`);

  const job = (await jobStore.get(jobId)) as JobRecord | null;

  if (!job) {
    console.log(`[POLL] Job ${jobId} - ✗ NOT FOUND`);
    res.status(404).json({ error: "Job not found" });
    return;
  }

  console.log(`[POLL] Job ${jobId} - Status: ${job.status}`);

  if (
    job.status === JOB_STATUS.QUEUED ||
    job.status === JOB_STATUS.PROCESSING
  ) {
    res.json({
      job_id: jobId,
      status: job.status,
      message:
        job.status === JOB_STATUS.QUEUED ? "Queued..." : "Executing...",
    });
    return;
  }

  if (job.status === JOB_STATUS.COMPLETED) {
    res.json({
      job_id: jobId,
      status: job.status,
      result: job.result ? JSON.parse(job.result) : null,
    });
    return;
  }

  res.status(400).json({
    job_id: jobId,
    status: job.status,
    error: job.error,
  });
};
