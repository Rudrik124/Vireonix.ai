import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState } from "react";
import { CheckCircle, Circle, AlertCircle, Plus } from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  featureArea: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: "pass" | "fail" | "blocked" | "skipped";
  evidence?: string;
  notes?: string;
  assignedSprint: string;
}

export function TesterTestCasesPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterFeature, setFilterFeature] = useState<string>("all");

  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: "TC-001",
      name: "Generate video with basic prompt",
      featureArea: "Video Generator",
      description: "Test basic video generation with a simple text prompt",
      steps: [
        "Navigate to Video Generator",
        "Enter prompt: 'A cat playing with a ball'",
        "Click Generate",
        "Wait for completion",
      ],
      expectedResult: "Video generated successfully within 60 seconds",
      status: "pass",
      evidence: "Screenshot: generation-result-01.png",
      notes: "Generation completed in 45 seconds",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-002",
      name: "Test authentication with invalid credentials",
      featureArea: "Authentication",
      description: "Verify system rejects invalid login attempts",
      steps: [
        "Open login page",
        "Enter invalid email and password",
        "Click Sign In",
        "Observe error message",
      ],
      expectedResult: "Error message displayed: 'Invalid credentials'",
      status: "pass",
      evidence: "Screenshot: auth-error-message.png",
      notes: "Error appears after 1 second",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-003",
      name: "Generate video with advanced parameters",
      featureArea: "Video Generator",
      description: "Test video generation with custom style, duration, and resolution",
      steps: [
        "Navigate to Video Generator",
        "Enter prompt with advanced options",
        "Set style to 'Cinematic'",
        "Set duration to 30 seconds",
        "Set resolution to 4K",
        "Click Generate",
      ],
      expectedResult: "Video generated with correct parameters",
      status: "blocked",
      notes: "Waiting for 4K feature release",
      assignedSprint: "Sprint 25",
    },
    {
      id: "TC-004",
      name: "Payment processing with test card",
      featureArea: "Billing",
      description: "Verify payment processing works with test credit card",
      steps: [
        "Initiate purchase",
        "Enter test card details",
        "Complete payment",
        "Verify confirmation email",
      ],
      expectedResult: "Payment processed successfully",
      status: "skipped",
      notes: "Deferred until staging environment is ready",
      assignedSprint: "Sprint 25",
    },
  ]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const featureAreas = ["all", ...new Set(testCases.map((tc) => tc.featureArea))];
  const filteredCases = testCases.filter((tc) => filterFeature === "all" || tc.featureArea === filterFeature);

  const stats = {
    total: filteredCases.length,
    pass: filteredCases.filter((tc) => tc.status === "pass").length,
    fail: filteredCases.filter((tc) => tc.status === "fail").length,
    blocked: filteredCases.filter((tc) => tc.status === "blocked").length,
    skipped: filteredCases.filter((tc) => tc.status === "skipped").length,
  };

  const passPercentage = stats.total > 0 ? Math.round((stats.pass / (stats.total - stats.skipped)) * 100) : 0;

  const statusIcons = {
    pass: <CheckCircle className="w-5 h-5 text-green-400" />,
    fail: <AlertCircle className="w-5 h-5 text-red-400" />,
    blocked: <Circle className="w-5 h-5 text-yellow-400" />,
    skipped: <Circle className="w-5 h-5 text-gray-400" />,
  };

  const statusColors = {
    pass: "bg-green-100 text-green-800",
    fail: "bg-red-100 text-red-800",
    blocked: "bg-yellow-100 text-yellow-800",
    skipped: "bg-gray-100 text-gray-800",
  };

  const handleStatusChange = (id: string, newStatus: TestCase["status"]) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, status: newStatus } : tc))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Test Cases</h1>
            <p className="text-purple-200">Execute assigned test cases and track results</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        {/* Progress Overview */}
        <div className="mb-8 bg-purple-700 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Progress Overview</h2>
            <span className="text-3xl font-bold text-green-400">{passPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-purple-600 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${passPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Total Cases</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Passed</p>
              <p className="text-white text-2xl font-bold">{stats.pass}</p>
            </div>
            <div>
              <p className="text-red-200 text-sm">Failed</p>
              <p className="text-white text-2xl font-bold">{stats.fail}</p>
            </div>
            <div>
              <p className="text-yellow-200 text-sm">Blocked</p>
              <p className="text-white text-2xl font-bold">{stats.blocked}</p>
            </div>
            <div>
              <p className="text-gray-200 text-sm">Skipped</p>
              <p className="text-white text-2xl font-bold">{stats.skipped}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="text-white font-semibold mr-3">Filter by Feature:</label>
          <select
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
            className="px-4 py-2 rounded text-white bg-purple-600"
          >
            {featureAreas.map((area) => (
              <option key={area} value={area}>
                {area === "all" ? "All Features" : area}
              </option>
            ))}
          </select>
        </div>

        {/* Test Cases List */}
        <div className="space-y-4">
          {filteredCases.map((testCase) => (
            <div key={testCase.id} className="bg-purple-700 rounded-lg overflow-hidden">
              <div
                onClick={() => setExpandedId(expandedId === testCase.id ? null : testCase.id)}
                className="p-6 cursor-pointer hover:bg-purple-600 transition flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {statusIcons[testCase.status]}
                    <span className="text-gray-300 font-mono text-sm">{testCase.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[testCase.status]}`}>
                      {testCase.status.charAt(0).toUpperCase() + testCase.status.slice(1)}
                    </span>
                    <span className="text-purple-300 text-xs bg-purple-600 px-2 py-1 rounded">
                      {testCase.featureArea}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{testCase.name}</h3>
                  <p className="text-purple-200 text-sm mt-1">{testCase.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-purple-300 text-xs">{testCase.assignedSprint}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === testCase.id && (
                <div className="bg-purple-600 px-6 py-4 border-t border-purple-500 space-y-4">
                  {/* Steps */}
                  <div>
                    <h4 className="font-semibold text-white mb-2">Test Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-purple-200">
                      {testCase.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Expected Result */}
                  <div>
                    <h4 className="font-semibold text-white mb-2">Expected Result:</h4>
                    <p className="text-purple-200">{testCase.expectedResult}</p>
                  </div>

                  {/* Evidence */}
                  {testCase.evidence && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Evidence:</h4>
                      <p className="text-purple-200">{testCase.evidence}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {testCase.notes && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Notes:</h4>
                      <p className="text-purple-200">{testCase.notes}</p>
                    </div>
                  )}

                  {/* Status Update */}
                  <div>
                    <h4 className="font-semibold text-white mb-2">Update Status:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(["pass", "fail", "blocked", "skipped"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(testCase.id, status)}
                          className={`px-4 py-2 rounded transition ${
                            testCase.status === status
                              ? "bg-white text-purple-700 font-semibold"
                              : "bg-purple-500 text-white hover:bg-purple-400"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attach Evidence */}
                  <div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
                      + Attach Evidence
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
