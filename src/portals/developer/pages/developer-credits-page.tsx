import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { fetchCreditsStats, fetchCreditTransactions, addCreditsToUser } from "../../../services/developer-portal-api.service";

interface Transaction {
  id: string;
  user: string;
  type: string;
  amount: number;
  reason: string;
  date: string;
}

export function DeveloperCreditsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "add">("overview");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [stats, setStats] = useState({
    userCreditsTotal: 0,
    developerCreditsTotal: 0,
    dailyConsumption: 0,
    averagePerUser: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, transactionsData] = await Promise.all([
        fetchCreditsStats(),
        fetchCreditTransactions(),
      ]);
      setStats(statsData);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error("Failed to load credits data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !amount) {
      alert("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    try {
      // Note: In a real app, we'd need to fetch the user ID from email first
      // For now, this is a placeholder
      alert("User lookup by email coming soon");
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits");
    } finally {
      setIsAdding(false);
      setEmail("");
      setAmount("");
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
          <h1 className="text-3xl font-bold">Credits Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user and developer credits separately
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="User Credits (Total)" value={stats.userCreditsTotal.toLocaleString()} />
          <StatCard label="Developer Credits (Total)" value={stats.developerCreditsTotal.toLocaleString()} />
          <StatCard label="Daily Consumption" value={stats.dailyConsumption.toLocaleString()} />
          <StatCard label="Avg Per User" value={stats.averagePerUser} />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-slate-700">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "transactions", label: "Transactions" },
              { id: "add", label: "Add Credits" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded border border-slate-700 p-6">
              <h2 className="text-lg font-bold mb-4">Credit Distribution</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-400">User Credits</span>
                    <span className="text-sm font-bold">0 / 500,000</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-400">Developer Credits</span>
                    <span className="text-sm font-bold">0 / 100,000</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                    <td className="px-6 py-3 text-sm">{tx.user}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          tx.type === "usage"
                            ? "bg-red-500/20 text-red-400"
                            : tx.type === "purchase"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-sm font-bold ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm">{tx.reason}</td>
                    <td className="px-6 py-3 text-sm">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "add" && (
          <div className="bg-slate-800 rounded border border-slate-700 p-6 max-w-md">
            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">User Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Credits to Add</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  min="1"
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition"
              >
                Add Credits
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-slate-800 rounded border border-slate-700">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
