import { useState } from "react";
import { useAuth } from "../../../app/context/auth-context";
import { buildUsageContext, logUsageEvent } from "../../../services/usage.service";
import { generateVideo } from "../../../api/generatevideo";

export function DeveloperWorkflowLabPage() {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState("Internal test prompt for workflow validation.");
  const [usageType, setUsageType] = useState<"test" | "production">("test");
  const [status, setStatus] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    const usageContext = buildUsageContext(profile, {
      usageType,
      portal: "internal",
    });

    setIsLoading(true);
    setStatus("");
    setResponseText("");

    try {
      await logUsageEvent({
        profile,
        featureKey: "developer.workflow-lab",
        status: "started",
        usageType: usageContext.usageType,
        portal: usageContext.portal,
      });

      const result = await generateVideo({
        prompt,
        duration: 10,
        frame: "16:9",
        usageContext,
      });

      setStatus("Test completed successfully.");
      setResponseText(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setStatus(error?.message || "Test failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#264d39_0%,#0f172a_45%,#020617_100%)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-white/5 p-8 backdrop-blur-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-200">Workflow Lab</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Internal AI function trigger panel.</h1>
          <p className="mt-4 text-slate-300">
            Use this screen to test prompts, send internal tags to the backend, and verify credit logic without contaminating user billing analytics.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Usage type</span>
              <select
                value={usageType}
                onChange={(event) => setUsageType(event.target.value as "test" | "production")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              >
                <option value="test">test</option>
                <option value="production">production</option>
              </select>
            </label>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-4 min-h-36 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-4 py-4 outline-none"
          />

          <button
            onClick={runTest}
            disabled={isLoading}
            className="mt-5 rounded-full bg-emerald-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"
          >
            {isLoading ? "Running..." : "Run internal test"}
          </button>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Usage context</p>
            <pre className="mt-3 overflow-auto text-xs text-slate-300">{JSON.stringify(buildUsageContext(profile, {
              usageType,
              portal: "internal",
            }), null, 2)}</pre>
          </div>

          {status && <p className="mt-5 text-sm text-slate-200">{status}</p>}
          {responseText && <pre className="mt-4 overflow-auto rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5 text-xs text-slate-300">{responseText}</pre>}
        </div>
      </div>
    </div>
  );
}
