import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useAppStore } from "../store/useAppStore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface Problem {
  id: number;
  title: string;
  difficulty: string;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { setCurrentProblemId } = useAppStore();

  useEffect(() => {
    fetch(`${API_BASE}/api/problems`)
      .then((res) => res.json())
      .then((data) => {
        setProblems(data.problems || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load problems:", err);
        setIsLoading(false);
      });
  }, []);

  const handleProblemClick = (id: number) => {
    setCurrentProblemId(id);
    navigate("/workspace");
  };

  return (
    <MainLayout>
      <div className="max-w-container-max mx-auto px-lg py-xl w-full flex-grow">
        <h1 className="font-display-lg text-headline-md font-bold text-on-surface mb-lg">Problems</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="py-md px-lg font-label-md text-on-surface-variant font-semibold">Status</th>
                  <th className="py-md px-lg font-label-md text-on-surface-variant font-semibold">Title</th>
                  <th className="py-md px-lg font-label-md text-on-surface-variant font-semibold">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr 
                    key={problem.id} 
                    onClick={() => handleProblemClick(problem.id)}
                    className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group"
                  >
                    <td className="py-md px-lg text-center w-16">
                      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">circle</span>
                    </td>
                    <td className="py-md px-lg font-body-md text-on-surface group-hover:text-primary transition-colors">
                      {problem.id}. {problem.title}
                    </td>
                    <td className="py-md px-lg font-label-md">
                      <span className={`px-sm py-xs rounded-full ${
                        problem.difficulty.toLowerCase() === 'easy' ? 'text-[#00b8a3] bg-[#00b8a3]/10' :
                        problem.difficulty.toLowerCase() === 'medium' ? 'text-[#ffa116] bg-[#ffa116]/10' :
                        'text-[#ef4743] bg-[#ef4743]/10'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
                {problems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-xl text-center text-on-surface-variant font-body-md">
                      No problems found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
