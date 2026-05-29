import { useEffect } from "react";
import { useNavigate } from "react-router";

export function AdminAuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to user auth for now - admins use user portal to login first
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="bg-slate-700 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Portal</h1>
        <p className="text-slate-300 mb-6">Redirecting to login...</p>
      </div>
    </div>
  );
}
