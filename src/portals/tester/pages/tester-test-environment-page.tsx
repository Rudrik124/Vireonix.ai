import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";

export function TesterTestEnvironmentPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Test Environment</h1>
            <p className="text-purple-200">Test all features in a controlled environment</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Generation Test */}
          <div className="bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Video Generation Test</h2>
            <p className="text-purple-200 mb-4">Test the video generation pipeline with unlimited credits</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
              Start Test
            </button>
          </div>

          {/* API Testing */}
          <div className="bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">API Testing</h2>
            <p className="text-purple-200 mb-4">Test API endpoints with sample requests</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
              Open API Tester
            </button>
          </div>

          {/* UI Component Testing */}
          <div className="bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">UI Components</h2>
            <p className="text-purple-200 mb-4">Test and interact with all UI components</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
              View Components
            </button>
          </div>

          {/* Performance Testing */}
          <div className="bg-purple-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Performance Testing</h2>
            <p className="text-purple-200 mb-4">Monitor app performance and metrics</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
              View Metrics
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-purple-700 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Testing Mode Info</h2>
          <div className="space-y-2 text-purple-200">
            <p>✓ Unlimited credits for testing</p>
            <p>✓ Access to all beta features</p>
            <p>✓ Real-time error reporting</p>
            <p>✓ Performance monitoring enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
