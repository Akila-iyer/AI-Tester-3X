import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";

const stages = [
  { id: "extracting", label: "Extracting", detail: "Retrieving data from sources" },
  { id: "matching", label: "Matching", detail: "Aligning Figma elements to web elements" },
  { id: "comparing", label: "Comparing", detail: "Running visual comparisons" },
  { id: "analyzing", label: "Analyzing", detail: "Generating AI explanations" },
  { id: "reporting", label: "Reporting", detail: "Building reports" },
];

export default function Progress() {
  const { sessionId } = useParams();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("running");

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus("complete");
          return 100;
        }
        const newP = p + Math.random() * 8 + 2;
        const stage = Math.min(Math.floor((newP / 100) * stages.length), stages.length - 1);
        setCurrentStage(stage);
        return Math.min(newP, 100);
      });
    }, 600);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="max-w-2xl mx-auto text-center">
      {status === "running" ? (
        <div className="space-y-8">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
            </div>
            <h2 className="text-xl font-bold">Comparison in Progress</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Session: {sessionId}</p>

            <div className="mt-8">
              <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-[var(--color-primary)] font-semibold mt-2">{Math.round(progress)}%</p>
            </div>

            <div className="mt-8 space-y-3">
              {stages.map((stage, i) => (
                <div key={stage.id} className={clsx("flex items-center gap-3 p-3 rounded-xl text-sm transition-all", i === currentStage ? "bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20" : i < currentStage ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-secondary)] opacity-50")}>
                  {i < currentStage ? <CheckCircle2 size={18} className="text-[var(--color-success)] shrink-0" />
                    : i === currentStage ? <div className="w-4 h-4 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)] shrink-0" />}
                  <div className="text-left">
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-[var(--color-success)]" />
          </div>
          <h2 className="text-xl font-bold">Comparison Complete</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">All checks finished successfully</p>
          <a href={`/results/${sessionId}`} className="inline-block mt-6 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">View Results</a>
        </div>
      )}
    </div>
  );
}
