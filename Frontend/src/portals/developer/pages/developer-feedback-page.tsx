import { useNavigate } from "react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useFeedbackData } from "../../../hooks/useDashboardData";

export function DeveloperFeedbackPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "progress" | "resolved">("all");
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const { feedback: feedbackList, isLoading } = useFeedbackData(50);

  const filteredFeedback = filterStatus === "all" ? feedbackList : feedbackList.filter((f) => f.status === filterStatus);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "bg-red-500/20 text-red-400";
      case "feature_request":
        return "bg-green-500/20 text-green-400";
      case "feedback":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-500/20 text-yellow-400";
      case "progress":
        return "bg-blue-500/20 text-blue-400";
      case "resolved":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
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
          <h1 className="text-3xl font-bold">User Feedback</h1>
          <p className="text-sm text-slate-400 mt-1">Manage bugs, suggestions, and feature requests</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["all", "open", "progress", "resolved"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded font-bold transition ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {status === "all" ? "All" : status === "progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {selectedFeedback ? (
          // Feedback Detail View
          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <button
              onClick={() => setSelectedFeedback(null)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to List
            </button>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">{selectedFeedback.title}</h2>
                <div className="flex gap-2 mb-4">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${getTypeColor(selectedFeedback.type)}`}>
                    {selectedFeedback.type.toUpperCase()}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status === "progress" ? "IN PROGRESS" : selectedFeedback.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400">Submitted By</p>
                  <p className="font-bold">{selectedFeedback.user}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Date</p>
                  <p className="font-bold">{selectedFeedback.date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Community Votes</p>
                  <p className="font-bold text-lg">{selectedFeedback.votes}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Description</p>
                <p className="text-slate-300">{selectedFeedback.description}</p>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-bold mb-4">Change Status</h3>
                <div className="flex gap-3">
                  {(["open", "progress", "resolved"] as const).map((status) => (
                    <button
                      key={status}
                      className={`px-4 py-2 rounded font-bold transition ${
                        selectedFeedback.status === status
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {status === "progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Feedback List View
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Loading feedback...</p>
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No feedback found</p>
              </div>
            ) : (
              filteredFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  onClick={() => setSelectedFeedback(feedback)}
                  className="bg-slate-800 rounded border border-slate-700 p-6 hover:border-slate-600 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{feedback.title}</h3>
                      <p className="text-sm text-slate-400 mb-3">{feedback.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${getTypeColor(feedback.type)}`}>
                          {feedback.type === 'feature_request' ? 'Feature Request' : feedback.type}
                        </span>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${getStatusColor('open')}`}>
                          Open
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
