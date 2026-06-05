import { useNavigate } from "react-router";
import { useState } from "react";
import { ChevronLeft, Search, Lock, Unlock } from "lucide-react";
import { useUserList } from "../../../hooks/useDashboardData";
import { addCreditsToUser, reactivateUser, suspendUser } from "../../../services/developer-portal-api.service";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended';
  credits: number;
  portalAccess: string[];
  joinDate: string;
}

export function DeveloperUsersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);

  const { users: allUsers, isLoading } = useUserList(page, 20);

  const filteredUsers = (allUsers?.users || []).filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspendUser = async (userId: string) => {
    setIsUpdating(true);
    try {
      await suspendUser(userId);

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: "suspended" });
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
      alert("Failed to suspend user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setIsUpdating(true);
    try {
      await reactivateUser(userId);

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: "active" });
      }
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      alert("Failed to reactivate user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    setIsUpdating(true);
    try {
      const currentUser = allUsers?.users.find(u => u.id === userId);
      if (!currentUser) return;

      const response = await addCreditsToUser(userId, amount, "Manual adjustment from developer portal");
      const newBalance = response.newBalance ?? currentUser.credits + amount;

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, credits: newBalance });
      }
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits");
    } finally {
      setIsUpdating(false);
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
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-sm text-slate-400 mt-1">View, search, and manage user accounts</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        {selectedUser ? (
          // User Detail View
          <div className="bg-slate-800 rounded border border-slate-700 p-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to List
            </button>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-lg font-bold">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Name</p>
                <p className="text-lg font-bold">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className={`text-lg font-bold ${selectedUser.status === "active" ? "text-green-400" : "text-red-400"}`}>
                  {selectedUser.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Credits Available</p>
                <p className="text-lg font-bold">{selectedUser.credits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Join Date</p>
                <p className="text-lg font-bold">{selectedUser.joinDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Login</p>
                <p className="text-lg font-bold">{selectedUser.lastLogin}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Videos Generated</p>
                <p className="text-lg font-bold">{selectedUser.videos}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-bold mb-4">Actions</h3>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm font-bold">
                  Add Credits
                </button>
                <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition text-sm font-bold">
                  Remove Credits
                </button>
                {selectedUser.status === "active" ? (
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Suspend User
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition text-sm font-bold flex items-center gap-2">
                    <Unlock className="w-4 h-4" />
                    Reactivate User
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // User List View
          <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Credits</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Videos</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Join Date</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                    <td className="px-6 py-3 text-sm">{user.email}</td>
                    <td className="px-6 py-3 text-sm">{user.name}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{user.credits.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">{user.videos}</td>
                    <td className="px-6 py-3 text-sm">{user.joinDate}</td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:text-blue-300 font-bold transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
