import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Zap, TrendingDown, AlertTriangle, Loader } from "lucide-react";
import { fetchTesterCredits, fetchTesterCreditHistory } from "../../../services/developer-portal-api.service";

interface CreditTransaction {
  id: string;
  type: "usage" | "refund" | "topup" | "allocation";
  description: string;
  amount: number;
  balance: number;
  timestamp: string;
  details?: string;
}

interface CreditData {
  currentBalance: number;
  weeklyAllocation: number;
  weeklyUsed: number;
  monthlyUsed: number;
}

export function TesterCreditsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");
  const [creditData, setCreditData] = useState<CreditData>({
    currentBalance: 0,
    weeklyAllocation: 0,
    weeklyUsed: 0,
    monthlyUsed: 0,
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile?.id) {
      loadCreditData();
    }
  }, [profile, authLoading]);

  const loadCreditData = async () => {
    setIsLoading(true);
    try {
      // Fetch current credit info
      const creditsData = await fetchTesterCredits(profile!.id);
      setCreditData({
        currentBalance: creditsData.currentBalance || 0,
        weeklyAllocation: creditsData.weeklyAllocation || 0,
        weeklyUsed: creditsData.weeklyUsed || 0,
        monthlyUsed: creditsData.monthlyUsed || 0,
      });

      // Fetch transaction history
      const historyData = await fetchTesterCreditHistory(profile!.id);
      setTransactions(historyData.transactions || []);
    } catch (error) {
      console.error("Failed to load credit data:", error);
      // Data will remain as 0 if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white text-lg">Loading your credits...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const getLowBalanceAlert = () => {
    if (creditData.currentBalance < 50) {
      return { show: true, color: "red", message: "⚠️ Low balance - request more credits!" };
    } else if (creditData.currentBalance < 100) {
      return { show: true, color: "yellow", message: "⚠️ Balance getting low" };
    }
    return { show: false, color: "", message: "" };
  };

  const alert = getLowBalanceAlert();
  const filteredTransactions = transactions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Testing Credits</h1>
            <p className="text-purple-200">Manage your testing credit budget</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        {/* Low Balance Alert */}
        {alert.show && (
          <div
            className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${
              alert.color === "red"
                ? "bg-red-900 border border-red-600"
                : "bg-yellow-900 border border-yellow-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6 text-white" />
            <div>
              <p className={alert.color === "red" ? "text-red-100" : "text-yellow-100"}>{alert.message}</p>
              <p className={alert.color === "red" ? "text-red-200 text-sm" : "text-yellow-200 text-sm"}>
                Consider requesting more credits or optimizing test parameters to reduce consumption.
              </p>
            </div>
          </div>
        )}

        {/* Main Credit Display */}
        <div className="mb-8 bg-gradient-to-r from-purple-700 to-purple-600 p-8 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-200 text-sm mb-2">CURRENT BALANCE</p>
              <p className="text-5xl font-bold text-white">{creditData.currentBalance}</p>
              <p className="text-purple-200 text-sm mt-2">Testing Credits</p>
            </div>
            <Zap className="w-20 h-20 text-yellow-400 opacity-50" />
          </div>
        </div>

        {/* Credit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-700 p-6 rounded-lg">
            <p className="text-purple-200 text-sm mb-2">WEEKLY ALLOCATION</p>
            <p className="text-white text-3xl font-bold">{creditData.weeklyAllocation}</p>
            <p className="text-purple-300 text-xs mt-2">Resets every Monday</p>
          </div>

          <div className="bg-purple-700 p-6 rounded-lg">
            <p className="text-purple-200 text-sm mb-2">USED THIS WEEK</p>
            <p className="text-white text-3xl font-bold">{creditData.weeklyUsed}</p>
            <div className="mt-3 bg-purple-600 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${(creditData.weeklyUsed / creditData.weeklyAllocation) * 100}%` }}
              />
            </div>
            <p className="text-purple-300 text-xs mt-2">
              {((creditData.weeklyUsed / creditData.weeklyAllocation) * 100).toFixed(0)}% used
            </p>
          </div>

          <div className="bg-purple-700 p-6 rounded-lg">
            <p className="text-purple-200 text-sm mb-2">USED THIS MONTH</p>
            <p className="text-white text-3xl font-bold">{creditData.monthlyUsed}</p>
            <p className="text-purple-300 text-xs mt-2">Cumulative usage</p>
          </div>
        </div>

        {/* Usage Chart Info */}
        <div className="mb-8 bg-purple-700 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Credit Cost Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-200">
            <div className="bg-purple-600 p-3 rounded">
              <span className="font-semibold">720p Video (10s):</span> 10 credits
            </div>
            <div className="bg-purple-600 p-3 rounded">
              <span className="font-semibold">1080p Video (15s):</span> 25 credits
            </div>
            <div className="bg-purple-600 p-3 rounded">
              <span className="font-semibold">4K Video (30s):</span> 50 credits
            </div>
            <div className="bg-purple-600 p-3 rounded">
              <span className="font-semibold">API Test Call:</span> 2 credits
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">Transaction History</h2>
          <div className="flex gap-2">
            {(["week", "month", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded transition ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-purple-700 text-purple-200 hover:bg-purple-600"
                }`}
              >
                {range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="bg-purple-700 p-8 rounded-lg text-center">
              <p className="text-purple-200">No transactions yet</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const isCredit = transaction.amount > 0;
              const typeColors = {
                usage: "text-red-400",
                refund: "text-green-400",
                topup: "text-blue-400",
                allocation: "text-purple-400",
              };

              return (
                <div key={transaction.id} className="bg-purple-700 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-xs">{transaction.id}</span>
                      <h4 className="text-white font-semibold">{transaction.description}</h4>
                      {transaction.details && (
                        <span className="text-purple-300 text-xs bg-purple-600 px-2 py-1 rounded">
                          {transaction.details}
                        </span>
                      )}
                    </div>
                    <p className="text-purple-300 text-sm mt-1">{transaction.timestamp}</p>
                  </div>

                  <div className="text-right">
                    <p className={`text-xl font-bold ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : ""}{transaction.amount}
                    </p>
                    <p className="text-purple-300 text-sm">Balance: {transaction.balance}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Request More Credits */}
        <div className="mt-8 bg-blue-900 border border-blue-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Need More Credits?</h3>
          <p className="text-blue-200 mb-4">
            Submit a request to your team lead or administrator to increase your weekly allocation.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
            Request Credits
          </button>
        </div>
      </div>
    </div>
  );
}
