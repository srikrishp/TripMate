"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function NewTripPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      await api.post(
        "/api/trips/",
        {
          title,
          description: description || null,
          destination,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/");
    } catch (error: any) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Failed to create trip."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Dashboard
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-3xl font-bold">
            Create New Trip
          </h1>

          <p className="mt-2 text-slate-400">
            Plan your next adventure with TripMate.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div>
              <label className="text-sm text-slate-300">
                Trip Name
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Vacation"
                required
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">
                Destination
              </label>

              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Hyderabad"
                required
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-300">
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your trip..."
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Trip..." : "Create Trip"}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}