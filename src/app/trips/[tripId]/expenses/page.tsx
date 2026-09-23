"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type Expense = {
  id: number;
  trip_id: number;
  name: string;
  amount: number;
  category: string;
  expense_date: string;
  paid_by?: string | null;
};

const categories = [
  "Accommodation",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Other",
];

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.tripId as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [budget, setBudget] = useState("");

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paidBy, setPaidBy] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadExpenses() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await api.get(
        `/api/trips/${tripId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExpenses(response.data);
    } catch (error) {
      console.error(error);
      setError("Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, [tripId]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter an expense name.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      await api.post(
        `/api/trips/${tripId}/expenses`,
        {
          name: name.trim(),
          amount: Number(amount),
          category,
          expense_date: date,
          paid_by: paidBy.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setName("");
      setAmount("");
      setPaidBy("");

      setSuccess("Expense added successfully.");

      await loadExpenses();
    } catch (error) {
      console.error(error);
      setError("Unable to add expense.");
    }
  }

  async function deleteExpense(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("access_token");

    try {
      await api.delete(
        `/api/trips/${tripId}/expenses/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadExpenses();
    } catch (error) {
      console.error(error);
      setError("Unable to delete expense.");
    }
  }

  const totalSpent = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    );
  }, [expenses]);

  const budgetAmount = Number(budget) || 0;

  const remaining = budgetAmount - totalSpent;

  const categoryTotals = categories.map((item) => ({
    category: item,
    total: expenses
      .filter((expense) => expense.category === item)
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount),
        0
      ),
  }));

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold tracking-widest text-blue-400">
              TRIP FINANCES
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Budget & Expenses
            </h1>

            <p className="mt-2 text-gray-400">
              Keep track of your travel spending.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/trips/${tripId}`)
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            ← Back to Trip
          </button>

        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-300">
            {success}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* BUDGET */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <p className="text-sm text-gray-400">
              Total Budget
            </p>

            <div className="mt-3 flex items-center gap-2">

              <span className="text-2xl text-gray-400">
                ₹
              </span>

              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value)
                }
                placeholder="Set budget"
                className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-gray-600"
              />

            </div>

          </div>

          {/* SPENT */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <p className="text-sm text-gray-400">
              Total Spent
            </p>

            <p className="mt-3 text-3xl font-bold">
              ₹{totalSpent.toFixed(2)}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {expenses.length} expense
              {expenses.length !== 1 ? "s" : ""}
            </p>

          </div>

          {/* REMAINING */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

            <p className="text-sm text-gray-400">
              Remaining
            </p>

            <p
              className={`mt-3 text-3xl font-bold ${
                budgetAmount > 0 && remaining < 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              ₹{remaining.toFixed(2)}
            </p>

            {budgetAmount > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all ${
                    totalSpent > budgetAmount
                      ? "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (totalSpent / budgetAmount) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}

          </div>

        </div>

        {/* ADD EXPENSE */}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Add Expense
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record spending for this trip.
            </p>
          </div>

          <form
            onSubmit={addExpense}
            className="grid gap-4 md:grid-cols-2"
          >

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Expense name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Hotel, dinner, taxi..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="5000"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none"
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Paid by
              </label>

              <input
                value={paidBy}
                onChange={(e) =>
                  setPaidBy(e.target.value)
                }
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
              >
                + Add Expense
              </button>
            </div>

          </form>

        </section>

        {/* CATEGORY BREAKDOWN */}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

          <h2 className="text-xl font-semibold">
            Spending by Category
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {categoryTotals.map((item) => (
              <div
                key={item.category}
                className="rounded-xl border border-white/5 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-400">
                    {item.category}
                  </span>

                  <span className="font-semibold">
                    ₹{item.total.toFixed(2)}
                  </span>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* EXPENSE LIST */}

        <section className="mt-8">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Expenses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your recorded trip expenses.
              </p>
            </div>

            <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">
              {expenses.length}
            </span>

          </div>

          {loading ? (

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-gray-400">
              Loading expenses...
            </div>

          ) : expenses.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-12 text-center">

              <div className="text-4xl">
                💸
              </div>

              <h3 className="mt-4 font-semibold">
                No expenses yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add your first expense above.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-3">

              {expenses.map((expense) => (

                <div
                  key={expense.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] md:flex-row md:items-center"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                      {expense.category === "Food"
                        ? "🍴"
                        : expense.category === "Accommodation"
                        ? "🏨"
                        : expense.category === "Transport"
                        ? "🚕"
                        : expense.category === "Activities"
                        ? "🎟️"
                        : expense.category === "Shopping"
                        ? "🛍️"
                        : "💰"}
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {expense.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {expense.category}
                        {" • "}
                        {expense.expense_date}

                        {expense.paid_by
                          ? ` • Paid by ${expense.paid_by}`
                          : ""}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <span className="text-xl font-bold">
                      ₹
                      {Number(
                        expense.amount
                      ).toFixed(2)}
                    </span>

                    <button
                      onClick={() =>
                        deleteExpense(expense.id)
                      }
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}