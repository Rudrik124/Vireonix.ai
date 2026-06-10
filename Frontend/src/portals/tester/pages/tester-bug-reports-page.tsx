import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { AlertCircle, Plus, Filter, ChevronDown } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  component: string;
  status: "open" | "in-review" | "fixed" | "verified";
  os: string;
  browser: string;
  device: string;
  attachment_count: number;
  created_at: string;
  updated_at: string;
}

export function TesterBugReportsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in-review" | "fixed" | "verified">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    component: "video-generator",
    os: "windows",
    browser: "chrome",
    device: "desktop",
    attachments: [] as File[],
  });

  const severityColors = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  const statusColors = {
    open: "bg-red-500/20 text-red-300",
    "in-review": "bg-yellow-500/20 text-yellow-300",
    fixed: "bg-green-500/20 text-green-300",
    verified: "bg-blue-500/20 text-blue-300",
  };

  const filteredBugs = bugReports.filter((bug) => {
    const statusMatch = filter === "all" || bug.status === filter;
    const severityMatch = severityFilter === "all" || bug.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        navigate("/");
        return;
      }
      fetchBugReports();
    }
  }, [authLoading, profile, navigate]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bug reports:", error);
        return;
      }

      setBugReports(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("bug_reports").insert({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        component: formData.component,
        status: "open",
        os: formData.os,
        browser: formData.browser,
        device: formData.device,
        attachment_count: formData.attachments.length,
        submitted_by: profile?.id,
      });

      if (error) {
        console.error("Error submitting bug report:", error);
        return;
      }

      // Reset form and refresh
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        component: "video-generator",
        os: "windows",
        browser: "chrome",
        device: "desktop",
        attachments: [],
      });
      setShowForm(false);
      await fetchBugReports();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Bug Reports</h1>
            <p className="text-purple-200">Submit and track defects</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/tester/dashboard")}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
            >
              Back
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              <Plus className="w-5 h-5" />
              Report Bug
            </button>
          </div>
        </div>

        {/* Submit Form */}
        {showForm && (
          <div className="mb-8 bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Submit Bug Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Bug Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300"
                  required
                />
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="px-4 py-2 rounded text-white bg-purple-600"
                >
                  <option value="low">Low Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="high">High Severity</option>
                  <option value="critical">Critical Severity</option>
                </select>
              </div>

              <textarea
                placeholder="Describe the bug in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300 h-24 resize-none"
                required
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <select
                  value={formData.component}
                  onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                  className="px-4 py-2 rounded text-white bg-purple-600 text-sm"
                >
                  <option value="video-generator">Video Generator</option>
                  <option value="auth">Authentication</option>
                  <option value="billing">Billing</option>
                  <option value="ui">UI</option>
                </select>

                <select
                  value={formData.os}
                  onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                  className="px-4 py-2 rounded text-white bg-purple-600 text-sm"
                >
                  <option value="windows">Windows</option>
                  <option value="macos">macOS</option>
                  <option value="linux">Linux</option>
                </select>

                <select
                  value={formData.browser}
                  onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
                  className="px-4 py-2 rounded text-white bg-purple-600 text-sm"
                >
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="safari">Safari</option>
                  <option value="edge">Edge</option>
                </select>

                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  className="px-4 py-2 rounded text-white bg-purple-600 text-sm"
                >
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Filter:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded text-white bg-purple-600"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-review">In Review</option>
            <option value="fixed">Fixed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 rounded text-white bg-purple-600"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Bug Reports List */}
        <div className="space-y-4">
          {filteredBugs.length === 0 ? (
            <div className="bg-purple-700 p-8 rounded-lg text-center">
              <AlertCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-purple-200">No bug reports found matching your filters</p>
            </div>
          ) : (
            filteredBugs.map((bug) => (
              <div
                key={bug.id}
                className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-300 font-mono text-sm">{bug.id}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColors[bug.severity]}`}
                      >
                        {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[bug.status]}`}>
                        {bug.status === "in-review" ? "In Review" : bug.status.charAt(0).toUpperCase() + bug.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{bug.title}</h3>
                  </div>
                  <ChevronDown className="w-5 h-5 text-purple-300" />
                </div>

                <p className="text-purple-200 mb-3 line-clamp-2">{bug.description}</p>

                <div className="grid grid-cols-4 gap-4 text-sm text-purple-200">
                  <div>
                    <span className="font-semibold">Component:</span> {bug.component}
                  </div>
                  <div>
                    <span className="font-semibold">OS:</span> {bug.os}
                  </div>
                  <div>
                    <span className="font-semibold">Browser:</span> {bug.browser}
                  </div>
                  <div>
                    <span className="font-semibold">Device:</span> {bug.device}
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center text-xs text-purple-300">
                  <span>Attachments: {bug.attachment_count}</span>
                  <span>Updated: {new Date(bug.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-600 p-4 rounded-lg">
            <p className="text-red-200 text-sm">Critical</p>
            <p className="text-white text-2xl font-bold">
              {bugReports.filter((b) => b.severity === "critical").length}
            </p>
          </div>
          <div className="bg-orange-600 p-4 rounded-lg">
            <p className="text-orange-200 text-sm">High</p>
            <p className="text-white text-2xl font-bold">
              {bugReports.filter((b) => b.severity === "high").length}
            </p>
          </div>
          <div className="bg-yellow-600 p-4 rounded-lg">
            <p className="text-yellow-200 text-sm">Open Bugs</p>
            <p className="text-white text-2xl font-bold">
              {bugReports.filter((b) => b.status === "open").length}
            </p>
          </div>
          <div className="bg-blue-600 p-4 rounded-lg">
            <p className="text-blue-200 text-sm">Total Reported</p>
            <p className="text-white text-2xl font-bold">{bugReports.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
