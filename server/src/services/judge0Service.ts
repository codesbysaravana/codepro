import axios from "axios";
import { JUDGE0_URL } from "../config/constants.js";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface Judge0Status {
  id?: number;
  description?: string;
}

interface Judge0Response {
  token?: string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
  status?: Judge0Status | string;
}

/* ------------------------------------------------------------------ */
/* Submit Code                                                        */
/* ------------------------------------------------------------------ */

// Submit code to Judge0
export const submitToJudge0 = async (
  code: string,
  language_id: number | string,
  stdin = ""
): Promise<string> => {
  const response = await axios.post(
    `${JUDGE0_URL}/submissions`,
    {
      source_code: code,
      language_id,
      stdin,
      base64_encoded: false,
    },
    {
      params: {
        base64_encoded: false,
        fields: "token",
      },
    }
  );

  return response.data.token;
};

/* ------------------------------------------------------------------ */
/* Poll Submission Status                                             */
/* ------------------------------------------------------------------ */

// Get submission status from Judge0
export const getSubmissionStatus = async (
  token: string
): Promise<Judge0Response> => {
  const response = await axios.get(
    `${JUDGE0_URL}/submissions/${token}`,
    {
      params: {
        base64_encoded: false,
        fields: "*",
      },
    }
  );

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Languages                                                          */
/* ------------------------------------------------------------------ */

// Get available languages from Judge0
export const getLanguages = async (): Promise<unknown> => {
  const response = await axios.get(`${JUDGE0_URL}/languages`, {
    params: { base64_encoded: false },
  });

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Payload Normalization                                              */
/* ------------------------------------------------------------------ */

// Build standardized payload from Judge0 response
export const buildPayload = (data: Judge0Response) => {
  const combinedOutput =
    data.stdout || data.stderr || data.compile_output || "";

  // Extract status description safely
  let statusDesc: string = "Unknown";

  if (typeof data.status === "string") {
    statusDesc = data.status;
  } else if (typeof data.status === "object") {
    statusDesc = data.status.description ?? "Unknown";
  }

  const statusId =
    typeof data.status === "object" ? data.status.id : undefined;

  return {
    token: data.token,
    status: statusDesc,
    status_id: statusId,
    stdout: data.stdout ?? "",
    stderr: data.stderr ?? "",
    compile_output: data.compile_output ?? "",
    message: data.message ?? "",
    time: data.time,
    memory: data.memory,
    output: combinedOutput, // backward-friendly field
  };
};
