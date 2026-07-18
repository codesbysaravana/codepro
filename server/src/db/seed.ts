import "dotenv/config";
import { pool } from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seed = async () => {
  console.log("Starting database seeding...");

  try {
    const clientProblemsPath = path.resolve(__dirname, "../../dist/data/problems.json");
    const fileContent = fs.readFileSync(clientProblemsPath, "utf-8");
    const data = JSON.parse(fileContent);

    if (data.codeTemplates) {
      console.log("Seeding code templates...");
      for (const [language, template_code] of Object.entries(data.codeTemplates)) {
        await pool.query(
          "INSERT INTO code_templates (language, template_code) VALUES ($1, $2) ON CONFLICT (language) DO UPDATE SET template_code = EXCLUDED.template_code",
          [language, template_code as string]
        );
      }
    }

    if (data.problems) {
      console.log("Seeding problems...");
      for (const problem of data.problems) {
        const problemResult = await pool.query(
          `INSERT INTO problems (problem_id, title, difficulty, description, constraints, starter_code, wrapper_code) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (problem_id) DO UPDATE SET 
             title = EXCLUDED.title, 
             difficulty = EXCLUDED.difficulty, 
             description = EXCLUDED.description, 
             constraints = EXCLUDED.constraints,
             starter_code = EXCLUDED.starter_code,
             wrapper_code = EXCLUDED.wrapper_code
           RETURNING id`,
          [
            problem.problem_id, 
            problem.title, 
            problem.difficulty, 
            problem.description, 
            JSON.stringify(problem.constraints),
            problem.starter_code ? JSON.stringify(problem.starter_code) : null,
            problem.wrapper_code ? JSON.stringify(problem.wrapper_code) : null
          ]
        );
        const internalId = problemResult.rows[0].id;

        await pool.query("DELETE FROM problem_examples WHERE problem_id = $1", [internalId]);
        await pool.query("DELETE FROM test_cases WHERE problem_id = $1", [internalId]);

        if (problem.examples) {
          for (let i = 0; i < problem.examples.length; i++) {
            const ex = problem.examples[i];
            await pool.query(
              "INSERT INTO problem_examples (problem_id, input, output, explanation, order_index) VALUES ($1, $2, $3, $4, $5)",
              [internalId, ex.input, ex.output, ex.explanation, i]
            );
          }
        }

        if (problem.testCases?.sample) {
          for (let i = 0; i < problem.testCases.sample.length; i++) {
            const tc = problem.testCases.sample[i];
            await pool.query(
              "INSERT INTO test_cases (problem_id, type, input, expected_output, order_index) VALUES ($1, $2, $3, $4, $5)",
              [internalId, 'sample', tc.input, tc.expected_output, i]
            );
          }
        }

        if (problem.testCases?.hidden) {
          for (let i = 0; i < problem.testCases.hidden.length; i++) {
            const tc = problem.testCases.hidden[i];
            await pool.query(
              "INSERT INTO test_cases (problem_id, type, input, expected_output, order_index) VALUES ($1, $2, $3, $4, $5)",
              [internalId, 'hidden', tc.input, tc.expected_output, i]
            );
          }
        }
      }
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
