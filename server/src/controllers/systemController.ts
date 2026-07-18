import { type Request, type Response } from "express";
import { getLanguages } from "../services/judge0Service.js";

/**
 * GET /languages
 * Fetch available languages from Judge0
 */
export const listLanguages = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const languages = await getLanguages();
    res.json(languages);
  } catch (err) {
    const error = err as any;

    const apiMessage =
      error?.response?.data ??
      error?.message ??
      "Unable to fetch languages";

    res.status(500).json({ error: apiMessage });
  }
};

/**
 * GET /health
 * Simple health check endpoint
 */
export const healthCheck = (_req: Request, res: Response): void => {
  res.json({ ok: true });
};
