"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type CategoryData = {
  category: string;
  amount: number;
};

type DailyData = {
  date: string;
  amount: number;
};

type AnalyticsData = {
  trip: {
    id: number;
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_spent: number;
    expense_count: number;
    average_expense: number;
    trip_duration: number;
    itinerary_days: number;
    activities_count: number;
  };
  category_totals: CategoryData[];
  daily_spending: DailyData[];
};

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.tripId as string;

  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/api/trips/${tripId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data);
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [tripId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading analytics...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() =>
              router.push(`/trips/${tripId}`)
            }
            className="mb-6 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Trip
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-red-400">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const {
    trip,
    summary,
    category_totals,
    daily_spending,
  } = data;

  const maxCategory =
    Math.max(
      ...category_totals.map(
        (item) => item.amount
      ),
      1
    );

  const maxDaily =
    Math.max(
      ...daily_spending.map(
        (item) => item.amount
      ),
      1
    );

  function formatCurrency(value: number) {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>
            <button
              onClick={() =>
                router.push(`/trips/${tripId}`)
              }
              className="mb-4 text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to Trip
            </button>

            <h1 className="text-4xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              {trip.title} · {trip.destination}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Trip dates
            </p>

            <p className="mt-1 font-medium text-slate-200">
              {formatDate(trip.start_date)}
              {" → "}
              {formatDate(trip.end_date)}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Spent
            </p>

            <p className="mt-3 text-3xl font-bold text-emerald-300">
              {formatCurrency(
                summary.total_spent
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Across all recorded expenses
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Expenses
            </p>

            <p className="mt-3 text-3xl font-bold text-blue-300">
              {summary.expense_count}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Recorded transactions
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Average Expense
            </p>

            <p className="mt-3 text-3xl font-bold text-purple-300">
              {formatCurrency(
                summary.average_expense
              )}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Average amount per expense
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Trip Duration
            </p>

            <p className="mt-3 text-3xl font-bold text-orange-300">
              {summary.trip_duration}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Days
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Itinerary Days
            </p>

            <p className="mt-3 text-3xl font-bold text-cyan-300">
              {summary.itinerary_days}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Planned travel days
            </p>
          </div>

          <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Activities
            </p>

            <p className="mt-3 text-3xl font-bold text-pink-300">
              {summary.activities_count}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Planned activities
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* Category spending */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Spending by Category
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Where your trip budget is going
              </p>
            </div>

            {category_totals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <p className="text-slate-500">
                  No expenses recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {category_totals.map(
                  (item) => {
                    const percentage =
                      (item.amount /
                        maxCategory) *
                      100;

                    return (
                      <div
                        key={item.category}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">
                            {item.category}
                          </span>

                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(
                              item.amount
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* Daily spending */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Daily Spending
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Expense activity throughout the trip
              </p>
            </div>

            {daily_spending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <p className="text-slate-500">
                  No daily spending data yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {daily_spending.map(
                  (item) => {
                    const percentage =
                      (item.amount /
                        maxDaily) *
                      100;

                    return (
                      <div
                        key={item.date}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            {formatDate(
                              item.date
                            )}
                          </span>

                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(
                              item.amount
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>

        {/* Insights */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            Trip Overview
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Average daily spending
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(
                  summary.trip_duration > 0
                    ? summary.total_spent /
                        summary.trip_duration
                    : 0
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Activities per day
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {(
                  summary.activities_count /
                  Math.max(
                    summary.trip_duration,
                    1
                  )
                ).toFixed(1)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Expense frequency
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {(
                  summary.expense_count /
                  Math.max(
                    summary.trip_duration,
                    1
                  )
                ).toFixed(1)}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                expenses per day
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}