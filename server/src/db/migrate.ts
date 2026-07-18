import "dotenv/config";
import { pool } from "./db.js";

const migrate = async () => {
  console.log("Starting database migration...");

  try {
    await pool.query(`
      DROP TABLE IF EXISTS test_cases CASCADE;
      DROP TABLE IF EXISTS problem_examples CASCADE;
      DROP TABLE IF EXISTS problems CASCADE;
      DROP TABLE IF EXISTS code_templates CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE problems (
        id SERIAL PRIMARY KEY,
        problem_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        constraints JSONB,
        starter_code JSONB,
        wrapper_code JSONB
      );
      CREATE INDEX idx_problems_problem_id ON problems(problem_id);

      CREATE TABLE problem_examples (
        id SERIAL PRIMARY KEY,
        problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        explanation TEXT,
        order_index INTEGER NOT NULL
      );
      CREATE INDEX idx_problem_examples_problem_id ON problem_examples(problem_id);

      CREATE TABLE test_cases (
        id SERIAL PRIMARY KEY,
        problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('sample', 'hidden')),
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        order_index INTEGER NOT NULL
      );
      CREATE INDEX idx_test_cases_problem_id ON test_cases(problem_id);

      CREATE TABLE code_templates (
        id SERIAL PRIMARY KEY,
        language VARCHAR(50) UNIQUE NOT NULL,
        template_code TEXT NOT NULL
      );
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
