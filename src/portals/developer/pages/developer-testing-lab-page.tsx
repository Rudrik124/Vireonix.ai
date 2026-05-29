import { useNavigate } from "react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export function DeveloperTestingLabPage() {
  const navigate = useNavigate();
  const [testType, setTestType] = useState<"prompt" | "api" | "upload">("prompt");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleTest = () => {
    // Mock test execution
    setResult({
      status: "success",
      responseTime: "2.34s",
      tokenUsage: 1240,
      costEstimate: 0.062,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">AI Testing Lab</h1>
          <p className="text-sm text-slate-400 mt-1">
            Test AI workflows without affecting production analytics
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Important Notice */}
        <div className="mb-8 p-4 bg-blue-900/30 border border-blue-700/50 rounded">
          <p className="text-sm">
            <span className="font-bold text-blue-400">ℹ️ Note:</span> All testing in this lab is marked with{" "}
            <code className="bg-slate-800 px-2 py-1 rounded text-xs">usageType=test</code> and does not affect production
            analytics or billing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Interface */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded border border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4">Test Configuration</h2>

              {/* Test Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Test Type</label>
                <div className="flex gap-3">
                  {(["prompt", "api", "upload"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTestType(type)}
                      className={`px-4 py-2 rounded font-bold transition ${
                        testType === type
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Test */}
              {testType === "prompt" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Test Prompt</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your test prompt here..."
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Model</label>
                      <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500">
                        <option>GPT-4</option>
                        <option>GPT-3.5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Temperature</label>
                      <input
                        type="number"
                        defaultValue="0.7"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleTest}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition"
                  >
                    Run Test
                  </button>
                </div>
              )}

              {/* API Test */}
              {testType === "api" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Endpoint</label>
                    <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500">
                      <option>/api/videos/generate</option>
                      <option>/api/videos/status</option>
                      <option>/api/credits/balance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Request Payload</label>
                    <textarea
                      defaultValue='{\n  "prompt": "test"\n}'
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white font-mono text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <button
                    onClick={handleTest}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition"
                  >
                    Send Request
                  </button>
                </div>
              )}

              {/* File Upload Test */}
              {testType === "upload" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Upload Type</label>
                    <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-slate-500">
                      <option>Image Sequence</option>
                      <option>Video File</option>
                      <option>Audio File</option>
                    </select>
                  </div>
                  <div className="border-2 border-dashed border-slate-600 rounded p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Drag and drop file here</p>
                    <input
                      type="file"
                      className="block w-full text-sm text-slate-400"
                    />
                  </div>
                  <button
                    onClick={handleTest}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition"
                  >
                    Start Upload Test
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div>
            <div className="bg-slate-800 rounded border border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4">Results</h2>
              {result ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className={`font-bold ${result.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {result.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Response Time</p>
                    <p className="font-bold">{result.responseTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Token Usage</p>
                    <p className="font-bold">{result.tokenUsage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Cost Estimate</p>
                    <p className="font-bold">${result.costEstimate.toFixed(3)}</p>
                  </div>
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-xs text-slate-500">{new Date(result.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Run a test to see results</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
