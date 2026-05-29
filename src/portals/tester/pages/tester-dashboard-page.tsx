import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { LogOut } from "lucide-react";

export function TesterDashboardPage() {
  const { profile, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  // Prevent browser back button from navigating away from tester dashboard
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.forward();
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Tester Dashboard</h1>
            <p className="text-purple-200">Test features and report bugs</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Test Environment Card */}
          <div
            onClick={() => navigate("/tester/test-environment")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Test Environment</h3>
            <p className="text-purple-200 text-sm">Access testing features and tools</p>
          </div>

          {/* Bug Reports Card */}
          <div
            onClick={() => navigate("/tester/bug-reports")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Bug Reports</h3>
            <p className="text-purple-200 text-sm">Submit and track bug reports</p>
          </div>

          {/* Test Cases Card */}
          <div
            onClick={() => navigate("/tester/test-cases")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Test Cases</h3>
            <p className="text-purple-200 text-sm">View assigned test cases</p>
          </div>

          {/* Credits Card */}
          <div
            onClick={() => navigate("/tester/credits")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Testing Credits</h3>
            <p className="text-purple-200 text-sm">View your testing credit balance</p>
          </div>

          {/* Video Generator Card */}
          <div
            onClick={() => navigate("/tester/video-generator")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Video Generator</h3>
            <p className="text-purple-200 text-sm">Test video generation features</p>
          </div>

          {/* Documentation Card */}
          <div
            onClick={() => navigate("/tester/documentation")}
            className="bg-purple-700 hover:bg-purple-600 cursor-pointer p-6 rounded-lg transition transform hover:scale-105"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Documentation</h3>
            <p className="text-purple-200 text-sm">Testing guidelines and documentation</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-purple-700 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Your Testing Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Role</p>
              <p className="text-white font-semibold capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Email</p>
              <p className="text-white font-semibold">{profile.email}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Testing Mode</p>
              <p className="text-white font-semibold">{profile.testingModeEnabled ? "✓ Enabled" : "Disabled"}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Credits Available</p>
              <p className="text-white font-semibold">{profile.credits.developerCredits}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
