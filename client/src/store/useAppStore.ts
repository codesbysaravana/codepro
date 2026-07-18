import { create } from "zustand";

// ── Shared interfaces (used by both store and App.tsx) ──────────────────────

export interface TestResult {
  testCase: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  status?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: string;
}

export interface OutputResult {
  error?: string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  status?: string;
  time?: string;
  memory?: string;
  verdict?: string;
  testResults?: TestResult[];
  sampleTestResults?: TestResult[];
  passedTests?: number;
  totalTests?: number;
  samplePassedTests?: number;
  sampleTotalTests?: number;
}

export interface Submission {
  time: string;
  verdict: string;
  language: string;
  runtime: string;
  memory: string;
}

export interface User {
  id: number;
  email: string;
}

// ── Store state + actions ───────────────────────────────────────────────────

interface AppState {
  // Navigation
  currentProblemId: number;
  showSidebar: boolean;

  // Editor
  languageId: number;
  code: string;

  // Execution
  output: OutputResult | null;
  isRunning: boolean;
  testResults: TestResult[];
  lastMode: string;
  currentJobId: string | null;

  // UI tabs
  activeTab: string;
  outputTab: string;
  selectedTestCase: number;

  // History
  submissions: Submission[];

  // Layout
  leftPanelWidth: number;
  editorPanelHeight: number;
  isResizingHorizontal: boolean;
  isResizingVertical: boolean;

  // Auth
  token: string | null;
  user: User | null;
}

interface AppActions {
  setCurrentProblemId: (id: number) => void;
  setShowSidebar: (show: boolean) => void;
  setLanguageId: (id: number) => void;
  setCode: (code: string) => void;
  setOutput: (output: OutputResult | null) => void;
  setIsRunning: (running: boolean) => void;
  setTestResults: (results: TestResult[]) => void;
  setLastMode: (mode: string) => void;
  setCurrentJobId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setOutputTab: (tab: string) => void;
  setSelectedTestCase: (idx: number) => void;
  setSubmissions: (
    updater: Submission[] | ((prev: Submission[]) => Submission[])
  ) => void;
  setLeftPanelWidth: (width: number) => void;
  setEditorPanelHeight: (height: number) => void;
  setIsResizingHorizontal: (resizing: boolean) => void;
  setIsResizingVertical: (resizing: boolean) => void;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  // ── Default state ─────────────────────────────────────────────────────────
  currentProblemId: 1,
  showSidebar: false,
  languageId: 71,
  code: "",
  output: null,
  isRunning: false,
  testResults: [],
  lastMode: "run",
  currentJobId: null,
  activeTab: "description",
  outputTab: "testcase",
  selectedTestCase: 0,
  submissions: [],
  leftPanelWidth: 50,
  editorPanelHeight: 62,
  isResizingHorizontal: false,
  isResizingVertical: false,
  token: localStorage.getItem("codepro_token"),
  user: localStorage.getItem("codepro_user") 
    ? JSON.parse(localStorage.getItem("codepro_user")!) 
    : null,

  // ── Actions (mirror the original useState setters) ────────────────────────
  setCurrentProblemId: (id) => set({ currentProblemId: id }),
  setShowSidebar: (show) => set({ showSidebar: show }),
  setLanguageId: (id) => set({ languageId: id }),
  setCode: (code) => set({ code }),
  setOutput: (output) => set({ output }),
  setIsRunning: (running) => set({ isRunning: running }),
  setTestResults: (results) => set({ testResults: results }),
  setLastMode: (mode) => set({ lastMode: mode }),
  setCurrentJobId: (id) => set({ currentJobId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOutputTab: (tab) => set({ outputTab: tab }),
  setSelectedTestCase: (idx) => set({ selectedTestCase: idx }),
  setSubmissions: (updater) =>
    set((state) => ({
      submissions:
        typeof updater === "function" ? updater(state.submissions) : updater,
    })),
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setEditorPanelHeight: (height) => set({ editorPanelHeight: height }),
  setIsResizingHorizontal: (resizing) =>
    set({ isResizingHorizontal: resizing }),
  setIsResizingVertical: (resizing) => set({ isResizingVertical: resizing }),
  
  setAuth: (token, user) => {
    localStorage.setItem("codepro_token", token);
    localStorage.setItem("codepro_user", JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem("codepro_token");
    localStorage.removeItem("codepro_user");
    set({ token: null, user: null });
  },
}));
