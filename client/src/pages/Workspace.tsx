import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import "../App.css";
import {
  useAppStore,
  type OutputResult,
  type Submission,
} from "../store/useAppStore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LANGUAGE_MAP: Record<number, string> = {
  71: "python",
  63: "javascript",
  54: "cpp",
  62: "java"
};

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestCase {
  input: string;
  expected_output: string;
}

interface Problem {
  id: number;
  problem_id?: number | string;
  title: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  testCases: {
    sample: TestCase[];
  };
  starter_code?: Record<string, string>;
}

interface CodeTemplates {
  python?: string;
  javascript?: string;
  cpp?: string;
  java?: string;
}

interface ProblemsData {
  problems: Problem[];
  codeTemplates: CodeTemplates;
}

interface JobCompleteData {
  jobId: string;
  error?: string;
  mode?: string;
  result?: OutputResult;
}

function Workspace() {
  const [problemsDataState, setProblemsDataState] = useState<ProblemsData | null>(null);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/problems`)
      .then(res => res.json())
      .then(data => {
        setProblemsDataState(data);
        setIsLoadingProblems(false);
      })
      .catch(err => {
        console.error("Failed to load problems:", err);
        setIsLoadingProblems(false);
      });
  }, []);

  const problems: Problem[] = problemsDataState?.problems || [];
  const codeTemplates: CodeTemplates = useMemo(() => problemsDataState?.codeTemplates || {}, [problemsDataState?.codeTemplates]);
  // ── Zustand store ─────────────────────────────────────────────────────────
  const {
    currentProblemId, setCurrentProblemId,
    showSidebar, setShowSidebar,
    languageId, setLanguageId,
    code, setCode,
    output, setOutput,
    isRunning, setIsRunning,
    testResults, setTestResults,
    activeTab, setActiveTab,
    outputTab, setOutputTab,
    selectedTestCase, setSelectedTestCase,
    setCurrentJobId,
    lastMode, setLastMode,
    submissions, setSubmissions,
    leftPanelWidth, setLeftPanelWidth,
    editorPanelHeight, setEditorPanelHeight,
    isResizingHorizontal, setIsResizingHorizontal,
    isResizingVertical, setIsResizingVertical,
    token
  } = useAppStore();

  // ── Refs (non-serializable / DOM) ─────────────────────────────────────────
  const eventSourceRef = useRef<EventSource | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const currentProblem: Problem | undefined = problems.find(p => p.id === currentProblemId) || problems[0];


  /*   const getRuntimePercent = (timeSeconds: string | number): number => {
      const seconds = Number(timeSeconds);
      if (!Number.isFinite(seconds) || seconds <= 0) return 50;
      const ms = seconds * 1000;
      const baseline = 1000; // 1s baseline for visualization
      const ratio = baseline / ms;
      const raw = 20 + ratio * 60; // 20-80 range
      return Math.max(10, Math.min(100, raw));
    };
   */
  // Load starter code when problem or language changes
  useEffect(() => {
    const starterCode = currentProblem?.starter_code?.[languageId.toString()];
    if (starterCode) {
      setCode(starterCode);
    } else {
      const langKey = LANGUAGE_MAP[languageId] as keyof CodeTemplates;
      if (codeTemplates?.[langKey]) {
        setCode(codeTemplates[langKey] || "");
      }
    }
    setOutput(null);
    setTestResults([]);
    setSelectedTestCase(0);
  }, [currentProblemId, languageId, codeTemplates, currentProblem?.starter_code, setCode, setOutput, setTestResults, setSelectedTestCase]);

  // Setup job-scoped SSE listener
  const setupSSEListener = (jobId: string) => {
    console.log(`[SSE-SETUP] Opening SSE connection for job: ${jobId}`);

    // Close any previous SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      console.log(`[SSE-CLEANUP] Closed previous SSE connection`);
    }

    // Create NEW SSE connection for this specific job
    const newEventSource = new EventSource(`${API_BASE}/events?jobId=${jobId}`);

    newEventSource.addEventListener("connected", () => {
      console.log(`[SSE] Connected to job: ${jobId}`);
    });

    newEventSource.addEventListener("job-complete", (e: MessageEvent) => {
      console.log(`[SSE] Received job-complete for job: ${jobId}`);
      try {
        const data: JobCompleteData = JSON.parse(e.data);

        // Verify this result belongs to the current job
        if (data.jobId === jobId) {
          if (data.error) {
            setOutput({ error: data.error });
            setIsRunning(false);
            setTestResults([]);
            setOutputTab("result");
            return;
          }
          const resultMode = data.mode || lastMode;
          console.log(`[SSE] Result data:`, data.result);
          setLastMode(resultMode);
          setOutput(data.result || null);
          setIsRunning(false);
          setOutputTab("result");

          // If backend returned testResults (from while-loop execution)
          // BUT: Don't set testResults if there's a compile or runtime error
          const hasError = data.result?.compile_output || data.result?.stderr;

          if (hasError) {
            console.log(`[SSE] Execution error detected, clearing testResults`);
            setTestResults([]);
          } else if (resultMode === "submit" && data.result?.sampleTestResults) {
            setTestResults(data.result.sampleTestResults);
          } else if (resultMode === "run" && data.result?.testResults) {
            setTestResults(data.result.testResults);
          } else if (resultMode === "run" && currentProblem?.testCases?.sample?.[selectedTestCase]) {
            // Legacy: single test case comparison
            compareResults(data.result!);
          } else {
            setTestResults([]);
          }

          if (resultMode === "submit") {
            const verdict = data.result?.verdict || data.result?.status || "Unknown";
            const submission: Submission = {
              time: new Date().toLocaleTimeString(),
              verdict,
              language: LANGUAGE_MAP[languageId] || "unknown",
              runtime: data.result?.time || "-",
              memory: data.result?.memory || "-"
            };
            setSubmissions((prev) => [submission, ...prev]);
            if (verdict === "Accepted") {
              setActiveTab("accepted");
            }
          }

          // Close connection after receiving result (server will also close)
          setTimeout(() => {
            newEventSource.close();
            eventSourceRef.current = null;
            console.log(`[SSE] Closed connection after receiving result for job: ${jobId}`);
          }, 100);
        }
      } catch (err) {
        console.error(`[SSE] Error parsing job-complete event:`, err);
      }
    });

    newEventSource.addEventListener("error", (err: Event) => {
      // Error event fires when connection closes - this is EXPECTED after receiving result
      // Only treat as error if we're still running (haven't received result yet)
      if (isRunning) {
        console.error(`[SSE] Connection error before result received:`, err);
        setOutput({ error: "Connection lost. Please try again." });
        setIsRunning(false);
      } else {
        console.log(`[SSE] Connection closed (expected after result)`);
      }
      newEventSource.close();
      eventSourceRef.current = null;
    });

    eventSourceRef.current = newEventSource;
  };

  const compareResults = (result: OutputResult) => {
    const actual = (result.stdout || "").trim();
    const testCase = currentProblem.testCases.sample[selectedTestCase];
    const expected = testCase.expected_output.trim();

    const passed = actual === expected;
    setTestResults([{
      testCase: selectedTestCase + 1,
      input: testCase.input,
      expected,
      actual,
      passed,
      status: result.status,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory
    }]);
  };

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log(`[SSE-CLEANUP] Closed SSE connection on unmount`);
      }
    };
  }, []);

  const handleLanguageChange = (langId: string) => {
    const newLangId = Number(langId);
    setLanguageId(newLangId);

    const starterCode = currentProblem?.starter_code?.[newLangId.toString()];
    if (starterCode) {
      setCode(starterCode);
    } else {
      const langKey = LANGUAGE_MAP[newLangId] as keyof CodeTemplates;
      if (codeTemplates?.[langKey]) {
        setCode(codeTemplates[langKey] || "");
      }
    }
  };

  const handleProblemChange = (problemId: number) => {
    setCurrentProblemId(problemId);
    setShowSidebar(false);
  };

  const startHorizontalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingHorizontal(true);
  };

  const startVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingVertical(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingHorizontal) {
        const percent = (e.clientX / window.innerWidth) * 100;
        const clamped = Math.min(75, Math.max(25, percent));
        setLeftPanelWidth(clamped);
      }

      if (isResizingVertical && rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const percent = (y / rect.height) * 100;
        const clamped = Math.min(80, Math.max(30, percent));
        setEditorPanelHeight(clamped);
      }
    };

    const handleMouseUp = () => {
      if (isResizingHorizontal) {
        setIsResizingHorizontal(false);
      }
      if (isResizingVertical) {
        setIsResizingVertical(false);
      }
    };

    if (isResizingHorizontal || isResizingVertical) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingHorizontal, isResizingVertical, setLeftPanelWidth, setEditorPanelHeight, setIsResizingHorizontal, setIsResizingVertical]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput(null);
    setTestResults([]);
    setOutputTab("result");
    setLastMode("run");

    const sampleCases = currentProblem?.testCases?.sample || [];
    console.log(`[RUN] Sending ${sampleCases.length} sample test cases to backend`);

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code,
          languageId,
          problemId: currentProblem?.problem_id || currentProblem?.id,
          mode: "run"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setOutput({ error: data.error });
        setIsRunning(false);
        return;
      }

      // Got jobId from backend
      const jobId = data.job_id;
      console.log(`[RUN] Received jobId: ${jobId}, setting up SSE listener`);
      setCurrentJobId(jobId);

      // Setup SSE listener ONLY for this job
      setupSSEListener(jobId);
    } catch (err) {
      console.error(`[RUN] Error:`, err);
      setOutput({ error: (err as Error).message });
      setIsRunning(false);
    }
  }, [code, languageId, currentProblem, setIsRunning, setOutput, setTestResults, setOutputTab, setLastMode, setCurrentJobId, setupSSEListener]);

  const submitCode = useCallback(async () => {
    setIsRunning(true);
    setOutput(null);
    setTestResults([]);
    setOutputTab("result");
    setLastMode("submit");
    console.log(`[SUBMIT] Running hidden test cases on backend`);

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code,
          languageId,
          problemId: currentProblem?.problem_id || currentProblem?.id,
          mode: "submit"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setOutput({ error: data.error });
        setIsRunning(false);
        return;
      }

      // Got jobId from backend
      const jobId = data.job_id;
      console.log(`[SUBMIT] Received jobId: ${jobId}, setting up SSE listener`);
      setCurrentJobId(jobId);

      // Setup SSE listener ONLY for this job
      setupSSEListener(jobId);
    } catch (err) {
      console.error(`[SUBMIT] Error:`, err);
      setOutput({ error: (err as Error).message });
      setIsRunning(false);
    }
  }, [code, languageId, currentProblem, setIsRunning, setOutput, setTestResults, setOutputTab, setLastMode, setCurrentJobId, setupSSEListener]);

  // Keyboard shortcuts: Ctrl + ' to run, Ctrl + Enter to submit (like LeetCode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + ' to run code
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        if (!isRunning) {
          console.log("[SHORTCUT] Ctrl+' pressed - Running code");
          runCode();
        }
      }

      // Ctrl + Enter to submit code
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isRunning) {
          console.log("[SHORTCUT] Ctrl+Enter pressed - Submitting code");
          submitCode();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRunning, runCode, submitCode]);



  if (isLoadingProblems) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', color: 'white' }}>
        <h2>Loading Workspace...</h2>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e1e', color: 'white' }}>
        <h2>No problems found in database</h2>
      </div>
    );
  }

  return (
    <div className="leetcode-container">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h3>Problems</h3>
          <button className="close-sidebar" onClick={() => setShowSidebar(false)}>✕</button>
        </div>
        <div className="problem-list">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className={`problem-item ${currentProblemId === problem.id ? 'active' : ''}`}
              onClick={() => handleProblemChange(problem.id)}
            >
              <div className="problem-number">{problem.id}</div>
              <div className="problem-info">
                <div className="problem-name">{problem.title}</div>
                <div className={`problem-difficulty ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {showSidebar && <div className="overlay" onClick={() => setShowSidebar(false)} />}

      {/* Left Panel - Problem Description */}
      <div className="left-panel" style={{ width: `${leftPanelWidth}%` }}>
        <div className="panel-header">
          <button className="menu-btn" onClick={() => setShowSidebar(true)}>
            ☰ Problems
          </button>
          <div className="tabs">
            <button
              className={activeTab === "description" ? "tab active" : "tab"}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={activeTab === "accepted" ? "tab active" : "tab"}
              onClick={() => setActiveTab("accepted")}
            >
              Accepted
            </button>
            <button
              className={activeTab === "solutions" ? "tab active" : "tab"}
              onClick={() => setActiveTab("solutions")}
            >
              Solution
            </button>
            <button
              className={activeTab === "submissions" ? "tab active" : "tab"}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>
          </div>
        </div>

        <div className="panel-content">
          {activeTab === "description" && (
            <>
              <h1 className="problem-title">
                {currentProblem.id}. {currentProblem.title}
                <span className={`difficulty ${currentProblem.difficulty.toLowerCase()}`}>
                  {currentProblem.difficulty}
                </span>
              </h1>

              <div className="problem-description">
                {currentProblem.description.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="examples">
                {currentProblem.examples.map((example, i) => (
                  <div key={i} className="example">
                    <strong>Example {i + 1}:</strong>
                    <pre className="example-box">
                      <div><strong>Input:</strong> {example.input}</div>
                      <div><strong>Output:</strong> {example.output}</div>
                      {example.explanation && (
                        <div><strong>Explanation:</strong> {example.explanation}</div>
                      )}
                    </pre>
                  </div>
                ))}
              </div>

              <div className="constraints">
                <strong>Constraints:</strong>
                <ul>
                  {currentProblem.constraints.map((constraint, i) => (
                    <li key={i}>{constraint}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {activeTab === "accepted" && (
            <div className="accepted-panel">
              {output?.verdict === "Accepted" ? (
                <>
                  {/* STATUS HERO CARD */}
                  <div className="hero-card">
                    <div className="hero-check-wrapper">
                      <svg className="hero-check-circle" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="check-bg" />
                        <path d="M30 50 L45 65 L70 35" className="check-mark" />
                      </svg>
                    </div>
                    <div className="hero-text">
                      <h2 className="hero-title">Accepted</h2>
                      <p className="hero-subtitle">All test cases passed</p>
                    </div>
                  </div>

                  {/* RUNTIME GAUGE */}
                  <div className="gauge-section">
                    <div className="gauge-wrapper">
                      <svg className="gauge-svg" viewBox="0 0 200 200">
                        {/* Background ring */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#2a2a2a"
                          strokeWidth="12"
                        />
                        {/* Progress ring */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="url(#gaugeGradient)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(100 - Math.min(95, Math.max(60, 100 - Number(output.time || 0) * 50))) * 5.026} 502.6`}
                          className="gauge-progress"
                        />
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={
                              Number(output.time || 0) < 0.5 ? "#00b8a3" :
                                Number(output.time || 0) < 1.5 ? "#ffa116" : "#ef4444"
                            } />
                            <stop offset="100%" stopColor={
                              Number(output.time || 0) < 0.5 ? "#00e5cc" :
                                Number(output.time || 0) < 1.5 ? "#ffb84d" : "#ff6b6b"
                            } />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="gauge-center">
                        <div className="gauge-time">{Number(output.time || 0).toFixed(3)}s</div>
                        <div className="gauge-label">Runtime</div>
                      </div>
                    </div>
                    <div className="gauge-percentile">
                      Faster than {Math.min(95, Math.max(60, 100 - Number(output.time || 0) * 50)).toFixed(0)}% of submissions
                    </div>
                  </div>

                  {/* PERFORMANCE SPARKLINE */}
                  <div className="sparkline-section">
                    <div className="sparkline-header">
                      <span className="sparkline-title">Performance History</span>
                      <span className="sparkline-count">{submissions.filter(s => s.verdict === "Accepted").length} submission{submissions.filter(s => s.verdict === "Accepted").length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sparkline-chart">
                      {submissions.filter(s => s.verdict === "Accepted").length === 0 ? (
                        <div className="sparkline-empty">
                          <div className="sparkline-dot single" />
                          <div className="sparkline-label">First submission</div>
                        </div>
                      ) : submissions.filter(s => s.verdict === "Accepted").length === 1 ? (
                        <div className="sparkline-empty">
                          <div className="sparkline-dot single" />
                          <div className="sparkline-label">First submission</div>
                        </div>
                      ) : (
                        <svg className="sparkline-svg" viewBox="0 0 300 60" preserveAspectRatio="none">
                          {(() => {
                            const acceptedSubs = submissions.filter(s => s.verdict === "Accepted");
                            const times = acceptedSubs.map(s => Number(s.time || 0));
                            const maxTime = Math.max(...times, 0.001);
                            const points = times.map((t, i) => ({
                              x: (i / Math.max(times.length - 1, 1)) * 280 + 10,
                              y: 50 - (t / maxTime) * 40
                            }));
                            const pathData = points.map((p, i) =>
                              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                            ).join(' ');

                            return (
                              <>
                                <path d={pathData} fill="none" stroke="#00b8a3" strokeWidth="2" />
                                {points.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00b8a3" />
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="coming-soon">Submit and get Accepted to see stats</div>
              )}
            </div>
          )}

          {activeTab === "solutions" && (
            <div className="coming-soon">Solutions coming soon...</div>
          )}

          {activeTab === "submissions" && (
            <div className="submissions-panel">
              {submissions.length === 0 ? (
                <div className="coming-soon">No submissions yet</div>
              ) : (
                <div className="submission-list">
                  {submissions.map((sub, i) => (
                    <div key={i} className={`submission-item ${sub.verdict === "Accepted" ? "accepted" : "failed"}`}>
                      <div className="submission-time">{sub.time}</div>
                      <div className="submission-verdict">{sub.verdict}</div>
                      <div className="submission-lang">{sub.language}</div>
                      <div className="submission-runtime">{sub.runtime}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="resize-handle-vertical"
        onMouseDown={startHorizontalResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
      />

      {/* Right Panel - Code Editor */}
      <div className="right-panel" ref={rightPanelRef}>
        <div className="editor-header">
          <select
            value={languageId}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-select"
          >
            <option value={71}>Python</option>
            <option value={63}>JavaScript</option>
            <option value={54}>C++</option>
            <option value={62}>Java</option>
          </select>
        </div>

        <div className="editor-output-area">
          <div className="code-editor" style={{ height: `${editorPanelHeight}%` }}>
            <div className="monaco-editor-container">
              <Editor
                height="100%"
                theme="vs-dark"
                language={LANGUAGE_MAP[languageId]}
                value={code}
                onChange={(value) => setCode(value ?? "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          <div
            className="resize-handle-horizontal"
            onMouseDown={startVerticalResize}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor and output"
          />

          {/* Test Case Section */}
          <div className="testcase-section" style={{ height: `${100 - editorPanelHeight}%` }}>
            <div className="testcase-tabs">
              <button
                className={outputTab === "testcase" ? "tab active" : "tab"}
                onClick={() => setOutputTab("testcase")}
              >
                Testcase
              </button>
              <button
                className={outputTab === "result" ? "tab active" : "tab"}
                onClick={() => setOutputTab("result")}
              >
                Test Result
              </button>
            </div>

            <div className="testcase-content">
              {outputTab === "testcase" && (
                <div className="testcase-selector">
                  <div className="case-buttons">
                    {currentProblem.testCases.sample.map((_, i) => (
                      <button
                        key={i}
                        className={selectedTestCase === i ? "case-btn active" : "case-btn"}
                        onClick={() => setSelectedTestCase(i)}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="testcase-display">
                    <div className="testcase-label">Input:</div>
                    <pre className="testcase-input">
                      {currentProblem.testCases.sample[selectedTestCase].input}
                    </pre>
                    <div className="testcase-label">Expected Output:</div>
                    <pre className="testcase-input">
                      {currentProblem.testCases.sample[selectedTestCase].expected_output}
                    </pre>
                  </div>
                </div>
              )}

              {outputTab === "result" && (
                <div className="test-results">
                  {!output && !isRunning && (
                    <div className="no-results">Run code to see results</div>
                  )}

                  {isRunning && (
                    <div className="running-indicator">
                      <div className="spinner"></div>
                      <span>Running your code...</span>
                    </div>
                  )}

                  {/* Summary when multiple tests ran */}
                  {output?.testResults && output.testResults.length > 0 && (
                    <div className="test-summary">
                      <div className={`summary-header ${output.passedTests === output.totalTests ? 'all-passed' : 'some-failed'}`}>
                        {output.passedTests === output.totalTests ? '✓' : '✗'} {output.passedTests}/{output.totalTests} Test Cases Passed
                      </div>
                    </div>
                  )}

                  {output?.verdict && typeof output.samplePassedTests !== "undefined" && (
                    <div className="test-summary">
                      <div className={`summary-header ${output.samplePassedTests === output.sampleTotalTests ? 'all-passed' : 'some-failed'}`}>
                        {output.samplePassedTests === output.sampleTotalTests ? '✓' : '✗'} {output.samplePassedTests}/{output.sampleTotalTests} Sample Tests Passed
                      </div>
                    </div>
                  )}

                  {/* Test Results with Comparison (RUN only) */}
                  {!output?.verdict && testResults.length > 0 && testResults.map((result, i) => (
                    <div key={i} className={`result ${result.passed ? "passed" : "failed"}`}>
                      <div className="result-header">
                        <span>{result.passed ? "✓" : "✗"} Test Case {result.testCase}</span>
                        <span className={result.passed ? "status-pass" : "status-fail"}>
                          {result.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <div className="result-details">
                        <div className="result-section">
                          <strong>Input:</strong>
                          <pre>{result.input}</pre>
                        </div>

                        <div className="result-section">
                          <strong>Expected Output:</strong>
                          <pre className="expected">{result.expected}</pre>
                        </div>

                        <div className="result-section">
                          <strong>Your Output:</strong>
                          <pre className={result.passed ? "actual-pass" : "actual-fail"}>
                            {result.actual || "(no output)"}
                          </pre>
                        </div>

                        {result.stderr && (
                          <div className="result-section">
                            <strong className="error-text">Error Output:</strong>
                            <pre className="error-text">{result.stderr}</pre>
                          </div>
                        )}

                        {result.compile_output && (
                          <div className="result-section">
                            <strong className="error-text">Compile Error:</strong>
                            <pre className="error-text">{result.compile_output}</pre>
                          </div>
                        )}

                        {result.time && (
                          <div className="result-meta">
                            Runtime: {result.time}s {result.memory && `• Memory: ${result.memory} KB`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Submit Accepted (no final verdict card) */}
                  {output?.verdict === "Accepted" && !isRunning && (
                    <div className="accepted-card">
                      <div className="accepted-header">
                        <span className="accepted-check">✓</span>
                        <span className="accepted-title">Accepted</span>
                      </div>
                      <div className="verdict-metrics">
                        <span>Runtime: {output.time ? `${Math.round(Number(output.time) * 1000)} ms` : "-"}</span>
                        <span>Memory: {output.memory ? `${output.memory} KB` : "-"}</span>
                      </div>
                    </div>
                  )}

                  {output?.verdict && testResults.length > 0 && (
                    <div className="sample-results">
                      <div className="sample-results-title">Sample Testcases</div>
                      {testResults.map((result, i) => (
                        <div key={i} className={`sample-item ${result.passed ? "passed" : "failed"}`}>
                          <div className="sample-header">
                            <span>Sample {result.testCase}</span>
                            <span className={result.passed ? "status-pass" : "status-fail"}>
                              {result.passed ? "✓ Passed" : "✗ Failed"}
                            </span>
                          </div>
                          <div className="sample-body">
                            <div>
                              <strong>Input:</strong>
                              <pre>{result.input}</pre>
                            </div>
                            <div>
                              <strong>Expected Output:</strong>
                              <pre>{result.expected}</pre>
                            </div>
                            <div>
                              <strong>Your Output:</strong>
                              <pre>{result.actual || "(no output)"}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isRunning && (output?.stderr || output?.compile_output || output?.message) && (
                    <div className="console-output">
                      {output.stderr && (
                        <div className="output-section">
                          <strong className="error-text">Runtime Error:</strong>
                          <pre className="error-text">{output.stderr}</pre>
                        </div>
                      )}
                      {output.compile_output && (
                        <div className="output-section">
                          <strong className="error-text">Compilation Error:</strong>
                          <pre className="error-text">{output.compile_output}</pre>
                        </div>
                      )}
                      {output.message && (
                        <div className="output-section">
                          <strong className="error-text">Message:</strong>
                          <pre className="error-text">{output.message}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw Output (no test case comparison) */}
                  {output && testResults.length === 0 && !isRunning && !output.verdict && !(output.stderr || output.compile_output || output.message) && (
                    <div className="console-output">
                      {output.status && (
                        <div className="status-badge">
                          Status: {output.status}
                        </div>
                      )}

                      {output.stdout && (
                        <div className="output-section">
                          <strong>Output:</strong>
                          <pre>{output.stdout}</pre>
                        </div>
                      )}

                      {output.stderr && (
                        <div className="output-section">
                          <strong className="error-text">Runtime Error:</strong>
                          <pre className="error-text">{output.stderr}</pre>
                        </div>
                      )}

                      {output.compile_output && (
                        <div className="output-section">
                          <strong className="error-text">Compilation Error:</strong>
                          <pre className="error-text">{output.compile_output}</pre>
                        </div>
                      )}

                      {output.error && (
                        <div className="output-section">
                          <strong className="error-text">Error:</strong>
                          <pre className="error-text">{output.error}</pre>
                        </div>
                      )}

                      {output.message && (
                        <div className="output-section">
                          <strong className="error-text">Message:</strong>
                          <pre className="error-text">{output.message}</pre>
                        </div>
                      )}

                      {output.time && (
                        <div className="result-meta">
                          Runtime: {output.time}s {output.memory && `• Memory: ${output.memory} KB`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-run"
            onClick={runCode}
            disabled={isRunning}
            title="Run code (Ctrl + ')"
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>
          <button
            className="btn-submit"
            onClick={submitCode}
            disabled={isRunning}
            title="Submit code (Ctrl + Enter)"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default Workspace;