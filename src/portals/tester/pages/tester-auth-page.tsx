import { useEffect } from "react";
import { useNavigate } from "react-router";

export function TesterAuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to user auth for now - testers use user portal to login first
    navigate("/user/auth", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center">
      <div className="bg-purple-700 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Tester Portal</h1>
        <p className="text-purple-200 mb-6">Redirecting to login...</p>
      </div>
    </div>
  );
}
