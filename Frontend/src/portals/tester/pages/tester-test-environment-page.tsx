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
          {/* Test AI Generate Video */}
          <div className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition">
            <h2 className="text-2xl font-semibold text-white mb-4">Test AI Generate Video</h2>
            <p className="text-purple-200 mb-4">Create videos from text prompts using AI with unlimited credits</p>
            <button 
              onClick={() => navigate("/create?redirect=/tester/test-environment")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Open Generator
            </button>
          </div>

          {/* Reference Video */}
          <div className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition">
            <h2 className="text-2xl font-semibold text-white mb-4">Reference Video</h2>
            <p className="text-purple-200 mb-4">Create videos based on reference footage and styling</p>
            <button 
              onClick={() => navigate("/reference-video/setup?redirect=/tester/test-environment")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Start Reference Video
            </button>
          </div>

          {/* Direct Pic to Video */}
          <div className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition">
            <h2 className="text-2xl font-semibold text-white mb-4">Direct Pic to Video</h2>
            <p className="text-purple-200 mb-4">Convert your images directly into animated videos</p>
            <button 
              onClick={() => navigate("/images-to-video/upload?redirect=/tester/test-environment")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Upload Images
            </button>
          </div>

          {/* Manual Edit */}
          <div className="bg-purple-700 p-6 rounded-lg hover:bg-purple-600 transition">
            <h2 className="text-2xl font-semibold text-white mb-4">Manual Edit</h2>
            <p className="text-purple-200 mb-4">Manually edit and fine-tune your videos with precision controls</p>
            <button 
              onClick={() => navigate("/quick-edit/upload?redirect=/tester/test-environment")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
            >
              Open Editor
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-purple-700 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Testing Mode Benefits</h2>
          <div className="space-y-2 text-purple-200">
            <p>✓ Unlimited credits for all features</p>
            <p>✓ Full access to all video creation tools</p>
            <p>✓ Real-time error reporting and feedback</p>
            <p>✓ Priority support and testing environment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
