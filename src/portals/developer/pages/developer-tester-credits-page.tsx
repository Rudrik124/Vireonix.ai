import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Plus, Send, AlertCircle, Zap, TrendingUp } from "lucide-react";
import {
  assignCreditsToTester,
  createTester,
  fetchTesterCreditHistory,
  fetchTesters,
} from "../../../services/developer-portal-api.service";

interface Tester {
  id: string;
  email: string;
  name: string;
  currentCredits: number;
  weeklyAllocation: number;
  totalUsed: number;
  status: "active" | "inactive";
}

interface CreditTransaction {
  id: string;
  testerId: string;
  amount: number;
  reason: string;
  assignedBy: string;
  timestamp: string;
  type: "assigned" | "used" | "refunded";
}

export function DeveloperTesterCreditsPage() {
  const navigate = useNavigate();
  const [testers, setTesters] = useState<Tester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTester, setSelectedTester] = useState<Tester | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAddTester, setShowAddTester] = useState(false);
  const [newTesterEmail, setNewTesterEmail] = useState("");
  const [newTesterName, setNewTesterName] = useState("");

  const loadTesters = async () => {
    setIsLoading(true);
    try {
      const testerData = await fetchTesters();
      setTesters(testerData.testers || []);
    } catch (error) {
      console.error("Failed to load testers:", error);
      setTesters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTesters();
  }, []);

  const handleAddTester = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTesterEmail || !newTesterName) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await createTester(newTesterEmail, newTesterName);
      setNewTesterEmail("");
      setNewTesterName("");
      setShowAddTester(false);
      await loadTesters();

      const message = response.temporaryPassword
        ? `Tester created for ${response.email}. Temporary password: ${response.temporaryPassword}`
        : `Tester access updated for ${response.email}.`;

      alert(message);
    } catch (error) {
      console.error("Failed to add tester:", error);
      alert(error instanceof Error ? error.message : "Failed to add tester");
    }
  };

  const handleSelectTester = async (tester: Tester) => {
    setSelectedTester(tester);
    try {
      const historyData = await fetchTesterCreditHistory(tester.id);
      setHistory(historyData.transactions || []);
    } catch (error) {
      console.error("Failed to load tester history:", error);
      setHistory([]);
    }
  };

  const handleAssignCredits = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTester || !creditAmount || !reason) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid credit amount");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await assignCreditsToTester(selectedTester.id, amount, reason);
      const updatedBalance = response.newBalance ?? selectedTester.currentCredits + amount;

      setTesters((prev) =>
        prev.map((tester) =>
          tester.id === selectedTester.id
            ? { ...tester, currentCredits: updatedBalance }
            : tester,
        ),
      );

      setSelectedTester((prev) =>
        prev ? { ...prev, currentCredits: updatedBalance } : null,
      );

      const newTransaction: CreditTransaction = {
        id: `TXN-${Date.now()}`,
        testerId: selectedTester.id,
        amount,
        reason,
        assignedBy: "Developer",
        timestamp: new Date().toLocaleString(),
        type: "assigned",
      };

      setHistory((prev) => [newTransaction, ...prev]);
      setCreditAmount("");
      setReason("");
      setShowForm(false);

      alert(`Assigned ${amount} credits to ${selectedTester.email}`);
    } catch (error: any) {
      alert(`Failed to assign credits: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="text-white text-lg">Loading testers...</div>
      </div>
    );
  }

  const totalCreditsAssigned = testers.reduce((sum, tester) => sum + tester.currentCredits, 0);
  const totalCreditsUsed = testers.reduce((sum, tester) => sum + tester.totalUsed, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Tester Credits Management</h1>
            <p className="text-blue-200">Assign and manage testing credits for your testers</p>
          </div>
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-700 p-6 rounded-lg">
            <p className="text-blue-200 text-sm mb-2">TOTAL TESTERS</p>
            <p className="text-white text-3xl font-bold">{testers.length}</p>
            <p className="text-blue-300 text-xs mt-2">Active & Managed</p>
          </div>

          <div className="bg-blue-700 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-2">CREDITS ASSIGNED</p>
                <p className="text-white text-3xl font-bold">{totalCreditsAssigned}</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </div>

          <div className="bg-blue-700 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-2">TOTAL USED</p>
                <p className="text-white text-3xl font-bold">{totalCreditsUsed}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-400 opacity-50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-blue-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Your Testers</h2>
                <button
                  onClick={() => setShowAddTester(!showAddTester)}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {showAddTester && (
                <form onSubmit={handleAddTester} className="mb-4 bg-blue-600 p-4 rounded space-y-3">
                  <div>
                    <label className="text-white text-sm font-semibold block mb-1">Tester Email</label>
                    <input
                      type="email"
                      value={newTesterEmail}
                      onChange={(e) => setNewTesterEmail(e.target.value)}
                      placeholder="qa@example.com"
                      className="w-full px-3 py-2 rounded text-white bg-blue-500 placeholder-blue-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-semibold block mb-1">Tester Name</label>
                    <input
                      type="text"
                      value={newTesterName}
                      onChange={(e) => setNewTesterName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 rounded text-white bg-blue-500 placeholder-blue-300 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded transition font-semibold text-sm"
                  >
                    Create Tester
                  </button>
                </form>
              )}

              {testers.length === 0 ? (
                <div className="text-blue-300 text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No testers assigned yet</p>
                  <p className="text-xs mt-2">Click "Add" to create one</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testers.map((tester) => (
                    <button
                      key={tester.id}
                      onClick={() => handleSelectTester(tester)}
                      className={`w-full text-left p-3 rounded transition ${
                        selectedTester?.id === tester.id
                          ? "bg-blue-600 border-2 border-yellow-400"
                          : "bg-blue-600 hover:bg-blue-500 border-2 border-transparent"
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{tester.name || tester.email}</p>
                      <p className="text-blue-200 text-xs truncate">{tester.email}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-yellow-300 font-bold text-sm">
                          {tester.currentCredits} credits
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            tester.status === "active"
                              ? "bg-green-600 text-green-100"
                              : "bg-red-600 text-red-100"
                          }`}
                        >
                          {tester.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedTester ? (
              <div className="space-y-6">
                <div className="bg-blue-700 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{selectedTester.name || selectedTester.email}</h3>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-600 p-3 rounded">
                      <p className="text-blue-200 text-xs">Current Balance</p>
                      <p className="text-white text-2xl font-bold">{selectedTester.currentCredits}</p>
                    </div>
                    <div className="bg-blue-600 p-3 rounded">
                      <p className="text-blue-200 text-xs">Weekly Limit</p>
                      <p className="text-white text-2xl font-bold">{selectedTester.weeklyAllocation}</p>
                    </div>
                    <div className="bg-blue-600 p-3 rounded">
                      <p className="text-blue-200 text-xs">Total Used</p>
                      <p className="text-white text-2xl font-bold">{selectedTester.totalUsed}</p>
                    </div>
                  </div>

                  <p className="text-blue-200 text-sm">Email: {selectedTester.email}</p>
                </div>

                <div className="bg-blue-700 rounded-lg p-6">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition font-semibold mb-4"
                  >
                    <Plus className="w-5 h-5" />
                    {showForm ? "Hide" : "Assign Credits"}
                  </button>

                  {showForm && (
                    <form onSubmit={handleAssignCredits} className="space-y-4">
                      <div>
                        <label className="text-white font-semibold block mb-2">Credit Amount</label>
                        <input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Enter number of credits"
                          className="w-full px-4 py-2 rounded text-white bg-blue-600 placeholder-blue-300"
                          min="1"
                          max="10000"
                        />
                        <p className="text-blue-300 text-xs mt-1">
                          Weekly allocation: {selectedTester.weeklyAllocation} credits
                        </p>
                      </div>

                      <div>
                        <label className="text-white font-semibold block mb-2">Reason for Assignment</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g., Sprint 26 testing, Performance regression tests, etc."
                          className="w-full px-4 py-2 rounded text-white bg-blue-600 placeholder-blue-300 h-20 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAssigning}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition font-semibold flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        {isAssigning ? "Assigning..." : "Confirm Assignment"}
                      </button>
                    </form>
                  )}
                </div>

                <div className="bg-blue-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Credit History</h3>

                  {history.length === 0 ? (
                    <p className="text-blue-300 text-center py-6">No transactions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {history.map((tx) => (
                        <div key={tx.id} className="bg-blue-600 p-3 rounded flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{tx.reason}</p>
                            <p className="text-blue-200 text-xs">{tx.timestamp}</p>
                          </div>
                          <span
                            className={`font-bold ml-2 ${
                              tx.type === "assigned"
                                ? "text-green-400"
                                : tx.type === "used"
                                ? "text-red-400"
                                : "text-blue-400"
                            }`}
                          >
                            {tx.type === "assigned" ? "+" : "-"}
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-700 rounded-lg p-12 text-center">
                <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                <p className="text-blue-200 text-lg">Select a tester to assign credits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
