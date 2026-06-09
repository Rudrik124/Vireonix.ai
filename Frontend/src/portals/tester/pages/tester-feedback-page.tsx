import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState } from "react";
import { ThumbsUp, MessageSquare, AlertCircle, Plus, Lightbulb } from "lucide-react";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: "ux-issue" | "performance" | "feature-request" | "security";
  status: "under-review" | "planned" | "in-progress" | "declined";
  upvotes: number;
  userUpvoted: boolean;
  timestamp: string;
  replies?: number;
}

export function TesterFeedbackPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "feature-request" as const,
  });

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([
    {
      id: "FB-001",
      title: "Add side-by-side video comparison tool",
      description:
        "When comparing outputs from different builds, it would be helpful to see current vs previous generation side-by-side with play controls synced.",
      category: "feature-request",
      status: "planned",
      upvotes: 24,
      userUpvoted: true,
      timestamp: "2026-05-26",
      replies: 5,
    },
    {
      id: "FB-002",
      title: "Video generation times are inconsistent",
      description:
        "Same prompt and parameters sometimes generates in 30 seconds, sometimes 90 seconds. Would be useful to see processing queue status.",
      category: "performance",
      status: "under-review",
      upvotes: 18,
      userUpvoted: false,
      timestamp: "2026-05-25",
      replies: 3,
    },
    {
      id: "FB-003",
      title: "Dark mode for the dashboard",
      description: "The current dashboard is bright and can be tiring during long testing sessions. A dark theme option would be appreciated.",
      category: "ux-issue",
      status: "under-review",
      upvotes: 32,
      userUpvoted: false,
      timestamp: "2026-05-24",
      replies: 8,
    },
    {
      id: "FB-004",
      title: "Batch test execution",
      description: "Ability to run multiple test cases sequentially without manual intervention. Save time on repetitive test suites.",
      category: "feature-request",
      status: "in-progress",
      upvotes: 15,
      userUpvoted: false,
      timestamp: "2026-05-23",
      replies: 2,
    },
    {
      id: "FB-005",
      title: "API rate limiting during load tests",
      description: "When stress testing the API, we should have higher rate limits or be able to request temporary limit increases.",
      category: "security",
      status: "declined",
      upvotes: 7,
      userUpvoted: false,
      timestamp: "2026-05-20",
      replies: 1,
    },
  ]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const categories = ["all", "feature-request", "ux-issue", "performance", "security"];
  const statuses = ["all", "under-review", "planned", "in-progress", "declined"];

  const categoryLabels = {
    "feature-request": "💡 Feature Request",
    "ux-issue": "🎨 UX Issue",
    performance: "⚡ Performance",
    security: "🔒 Security",
  };

  const categoryColors = {
    "feature-request": "bg-blue-100 text-blue-800",
    "ux-issue": "bg-purple-100 text-purple-800",
    performance: "bg-orange-100 text-orange-800",
    security: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    "under-review": "🔍 Under Review",
    planned: "📋 Planned",
    "in-progress": "⚙️ In Progress",
    declined: "❌ Declined",
  };

  const statusColors = {
    "under-review": "bg-yellow-100 text-yellow-800",
    planned: "bg-blue-100 text-blue-800",
    "in-progress": "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const newFeedback: FeedbackItem = {
      id: `FB-${String(feedbackItems.length + 1).padStart(3, "0")}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: "under-review",
      upvotes: 0,
      userUpvoted: false,
      timestamp: new Date().toISOString().split("T")[0],
      replies: 0,
    };

    setFeedbackItems([newFeedback, ...feedbackItems]);
    setFormData({
      title: "",
      description: "",
      category: "feature-request",
    });
    setShowForm(false);
  };

  const toggleUpvote = (id: string) => {
    setFeedbackItems(
      feedbackItems.map((item) =>
        item.id === id
          ? {
              ...item,
              upvotes: item.userUpvoted ? item.upvotes - 1 : item.upvotes + 1,
              userUpvoted: !item.userUpvoted,
            }
          : item
      )
    );
  };

  let filtered = feedbackItems.filter((item) => {
    const categoryMatch = filterCategory === "all" || item.category === filterCategory;
    const statusMatch = filterStatus === "all" || item.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (sortBy === "popular") {
    filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Feedback & Feature Requests</h1>
            <p className="text-purple-200">Share ideas, report UX issues, and help shape the product</p>
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
              Submit Feedback
            </button>
          </div>
        </div>

        {/* Submission Form */}
        {showForm && (
          <div className="mb-8 bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Share Your Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white font-semibold block mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 rounded text-white bg-purple-600"
                >
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat as keyof typeof categoryLabels]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white font-semibold block mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's your feedback about?"
                  className="w-full px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300"
                  required
                />
              </div>

              <div>
                <label className="text-white font-semibold block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details. What is the issue? Why is it important? Do you have suggestions?"
                  className="w-full px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300 h-32 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition font-semibold"
                >
                  Submit Feedback
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

        {/* Filters & Sorting */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded text-white bg-purple-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : categoryLabels[cat as keyof typeof categoryLabels]}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded text-white bg-purple-600"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Status" : statusLabels[status as keyof typeof statusLabels]}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded text-white bg-purple-600 ml-auto"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Upvotes</option>
          </select>
        </div>

        {/* Feedback Items */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-purple-700 p-8 rounded-lg text-center">
              <AlertCircle className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <p className="text-purple-200">No feedback items matching your filters</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[item.category]}`}>
                        {categoryLabels[item.category]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <button
                    onClick={() => toggleUpvote(item.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded transition ${
                      item.userUpvoted
                        ? "bg-blue-600 text-white"
                        : "bg-purple-600 text-purple-200 hover:bg-blue-600"
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {item.upvotes}
                  </button>
                </div>

                <p className="text-purple-200 mb-4">{item.description}</p>

                <div className="flex justify-between items-center text-sm text-purple-300">
                  <span>{item.timestamp}</span>
                  <div className="flex items-center gap-4">
                    {item.replies && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {item.replies} replies
                      </span>
                    )}
                    <button className="text-blue-400 hover:text-blue-300 transition">View →</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-900 p-4 rounded-lg">
            <p className="text-blue-200 text-sm">Feature Requests</p>
            <p className="text-white text-2xl font-bold">
              {feedbackItems.filter((f) => f.category === "feature-request").length}
            </p>
          </div>
          <div className="bg-orange-900 p-4 rounded-lg">
            <p className="text-orange-200 text-sm">UX Issues</p>
            <p className="text-white text-2xl font-bold">
              {feedbackItems.filter((f) => f.category === "ux-issue").length}
            </p>
          </div>
          <div className="bg-green-900 p-4 rounded-lg">
            <p className="text-green-200 text-sm">In Progress</p>
            <p className="text-white text-2xl font-bold">
              {feedbackItems.filter((f) => f.status === "in-progress").length}
            </p>
          </div>
          <div className="bg-purple-900 p-4 rounded-lg">
            <p className="text-purple-200 text-sm">Total Upvotes</p>
            <p className="text-white text-2xl font-bold">{feedbackItems.reduce((sum, f) => sum + f.upvotes, 0)}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-green-900 border border-green-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Your Feedback Matters
          </h3>
          <p className="text-green-200">
            The team reviews all submissions carefully. High-upvote feedback is prioritized for the roadmap. You'll receive
            notifications when your feedback is marked as Planned or In Progress.
          </p>
        </div>
      </div>
    </div>
  );
}
