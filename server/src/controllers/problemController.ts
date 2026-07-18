import { type Request, type Response } from "express";
import { pool } from "../db/db.js";

export const getProblemsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const templatesResult = await pool.query("SELECT language, template_code FROM code_templates");
    const codeTemplates: Record<string, string> = {};
    for (const row of templatesResult.rows) {
      codeTemplates[row.language] = row.template_code;
    }

    const problemsResult = await pool.query(
      "SELECT id, problem_id, title, difficulty, description, constraints, starter_code FROM problems ORDER BY id ASC"
    );
    const problems = problemsResult.rows;

    const examplesResult = await pool.query(
      "SELECT problem_id, input, output, explanation FROM problem_examples ORDER BY problem_id, order_index ASC"
    );

    // We only fetch 'sample' test cases to send to the client for security reasons
    const testCasesResult = await pool.query(
      "SELECT problem_id, input, expected_output FROM test_cases WHERE type = 'sample' ORDER BY problem_id, order_index ASC"
    );

    const examplesByProblemId: Record<number, any[]> = {};
    for (const ex of examplesResult.rows) {
      if (!examplesByProblemId[ex.problem_id]) examplesByProblemId[ex.problem_id] = [];
      examplesByProblemId[ex.problem_id]!.push({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation,
      });
    }

    const sampleTestCasesByProblemId: Record<number, any[]> = {};
    for (const tc of testCasesResult.rows) {
      if (!sampleTestCasesByProblemId[tc.problem_id]) sampleTestCasesByProblemId[tc.problem_id] = [];
      sampleTestCasesByProblemId[tc.problem_id]!.push({
        input: tc.input,
        expected_output: tc.expected_output,
      });
    }

    const finalProblems = problems.map((p) => ({
      id: p.id,
      problem_id: p.problem_id,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
      constraints: p.constraints,
      starter_code: p.starter_code || {},
      examples: examplesByProblemId[p.id] || [],
      testCases: {
        sample: sampleTestCasesByProblemId[p.id] || [],
      },
    }));

    res.json({
      problems: finalProblems,
      codeTemplates,
    });
  } catch (error) {
    console.error("❌ Error fetching problems data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
