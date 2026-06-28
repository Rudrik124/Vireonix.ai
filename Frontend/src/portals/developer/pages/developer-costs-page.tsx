import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowUpRight,
  ChevronLeft,
  Plus,
  RefreshCw,
  Server,
  Globe2,
  Cpu,
  Trash2,
} from "lucide-react";
import {
  createCostExpense,
  deleteCostExpense,
  fetchCostExpenses,
  updateCostExpense,
} from "../../../services/developer-portal-api.service";

const validCategories = ["SERVER", "DOMAIN", "API"];
const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const yearOptions = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

export function DeveloperCostsPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [createSql, setCreateSql] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(validCategories[0]);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCostExpenses();
      setSchemaMissing(Boolean(response?.schemaMissing));
      setCreateSql(response?.createExpensesTableSql || null);
      setExpenses(response?.expenses || []);
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const total = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const currentMonthTotal = expenses
      .filter((row) => row.month === currentMonth && row.year === currentYear)
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const currentYearTotal = expenses
      .filter((row) => row.year === currentYear)
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { total, currentMonthTotal, currentYearTotal };
  }, [expenses]);

  const handleResetForm = () => {
    setSelectedExpenseId(null);
    setAmount("");
    setCategory(validCategories[0]);
    setMonth(String(new Date().getMonth() + 1));
    setYear(String(new Date().getFullYear()));
    setNotes("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount || !category || !month || !year) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        category: category.toUpperCase(),
        month: Number(month),
        year: Number(year),
        notes: notes.trim(),
      };

      if (selectedExpenseId) {
        await updateCostExpense(selectedExpenseId, payload);
      } else {
        await createCostExpense(payload);
      }
      await loadExpenses();
      handleResetForm();
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Unable to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (expense: any) => {
    setSelectedExpenseId(expense.id);
    setAmount(String(expense.amount || ""));
    setCategory(String(expense.category || validCategories[0]));
    setMonth(String(expense.month || new Date().getMonth() + 1));
    setYear(String(expense.year || new Date().getFullYear()));
    setNotes(String(expense.notes || ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm("Delete this expense record?")) {
      return;
    }
    try {
      await deleteCostExpense(expenseId);
      await loadExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Unable to delete expense.");
    }
  };

  const title = selectedExpenseId ? "Edit Expense" : "Add Expense";

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/developer/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Cost Tracking</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Track developer expenses across SERVER, DOMAIN, and API costs with monthly and annual summaries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadExpenses}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <Plus className="w-4 h-4" /> New Expense
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Summary</h2>
                  <p className="text-sm text-slate-400">Overview of expense totals and current cost run rate.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
                  <Server className="w-4 h-4 text-cyan-400" /> Active categories
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total Spend</p>
                  <p className="mt-4 text-3xl font-bold text-white">${totals.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">This Month</p>
                  <p className="mt-4 text-3xl font-bold text-white">${totals.currentMonthTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">This Year</p>
                  <p className="mt-4 text-3xl font-bold text-white">${totals.currentYearTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/10">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-1">Save expense records for hosted services, domains, and API usage.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Amount ($)
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1200"
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Category
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {validCategories.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-sm text-slate-300">
                    Month
                    <select
                      value={month}
                      onChange={(event) => setMonth(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {monthOptions.map((opt) => (
                        <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Year
                    <select
                      value={year}
                      onChange={(event) => setYear(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {yearOptions.map((yearOption) => (
                        <option key={yearOption} value={String(yearOption)}>{yearOption}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Notes
                    <input
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Optional description"
                      className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">Expense categories are limited to SERVER, DOMAIN, and API.</p>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" /> {selectedExpenseId ? "Update Expense" : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Expense Records</h2>
                  <p className="text-sm text-slate-400">Manage costs by category and period.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" /> {expenses.length} records
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-white/5 bg-slate-950/80">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading expenses...</td>
                      </tr>
                    ) : expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No expenses found.</td>
                      </tr>
                    ) : (
                      expenses.map((expense) => (
                        <tr key={expense.id} className="border-t border-white/5 even:bg-slate-950/90">
                          <td className="px-4 py-4 text-slate-100">{expense.category}</td>
                          <td className="px-4 py-4 text-slate-100">${Number(expense.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-4 text-slate-400">{monthOptions.find((m) => m.value === expense.month)?.label || expense.month}</td>
                          <td className="px-4 py-4 text-slate-400">{expense.year}</td>
                          <td className="px-4 py-4 text-slate-400">{expense.notes || "—"}</td>
                          <td className="px-4 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(expense)}
                                className="rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white transition hover:border-indigo-500"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(expense.id)}
                                className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {schemaMissing && createSql ? (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                  <p className="font-semibold text-amber-200">Cost tracking schema is not ready.</p>
                  <p className="mt-2 text-slate-300">The database table for expenses is missing. You may need to initialize it using the SQL below.</p>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/90 p-3 text-xs text-slate-200 border border-white/10">
                    {createSql}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
