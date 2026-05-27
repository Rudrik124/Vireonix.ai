import { useState, useEffect } from "react";
import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import type { TestingCredentials } from "../../../shared/types/auth";

export function TestingCredentialsPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<TestingCredentials[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    description: "",
    expiresAt: "",
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/admin/auth");
    return null;
  }

  const handleGeneratePassword = () => {
    const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
    setFormData({ ...formData, password });
  };

  const handleCreateCredential = () => {
    if (!formData.email || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    const newCredential: TestingCredentials = {
      id: Math.random().toString(36).substr(2, 9),
      createdBy: profile.id,
      email: formData.email,
      password: formData.password,
      description: formData.description,
      createdAt: new Date().toISOString(),
      expiresAt: formData.expiresAt || undefined,
      isActive: true,
    };

    setCredentials([...credentials, newCredential]);
    setFormData({ email: "", password: "", description: "", expiresAt: "" });
    setShowForm(false);
  };

  const handleDeleteCredential = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id));
  };

  const handleToggleCredential = (id: string) => {
    setCredentials(
      credentials.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Testing Credentials</h1>
            <p className="text-slate-400">Create and manage credentials for testers</p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Create New Credential Form */}
        {showForm && (
          <div className="bg-slate-700 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Create New Testing Credentials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Tester Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tester@example.com"
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter or generate password"
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleGeneratePassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Backend testing team"
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateCredential}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition"
                >
                  Create Credentials
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition font-semibold"
          >
            + Create New Credentials
          </button>
        )}

        {/* Credentials List */}
        <div className="space-y-4">
          {credentials.length === 0 ? (
            <div className="bg-slate-700 p-8 rounded-lg text-center">
              <p className="text-slate-400 text-lg">No testing credentials created yet</p>
            </div>
          ) : (
            credentials.map((cred) => (
              <div key={cred.id} className="bg-slate-700 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{cred.email}</h3>
                    <p className="text-slate-400 text-sm mt-1">{cred.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCredential(cred.id)}
                      className={`px-4 py-2 rounded transition ${
                        cred.isActive
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      } text-white`}
                    >
                      {cred.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleDeleteCredential(cred.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Password</p>
                    <p className="text-white font-mono break-all">{cred.password}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Created</p>
                    <p className="text-white">{new Date(cred.createdAt).toLocaleDateString()}</p>
                  </div>
                  {cred.expiresAt && (
                    <div>
                      <p className="text-slate-400">Expires</p>
                      <p className="text-white">{new Date(cred.expiresAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
