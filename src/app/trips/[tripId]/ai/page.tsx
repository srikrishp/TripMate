"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AIAssistantPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.tripId as string;

  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = [
    "Plan a perfect day for my trip",
    "What should I pack?",
    "Suggest activities for this destination",
    "Help me plan my travel budget",
  ];

  async function askAI(question?: string) {
    const userMessage = (question || message).trim();

    if (!userMessage || loading) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/api/ai/chat",
        {
          message: userMessage,
          destination: "My Trip",
          trip_dates: "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReply(response.data.reply);
      setMessage("");
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to connect to TripMate AI."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        {/* BACK */}
        <button
          onClick={() => router.push(`/trips/${tripId}`)}
          className="mb-8 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to Trip
        </button>

        {/* HEADER */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-500/20 bg-purple-500/10 text-4xl">
            🤖
          </div>

          <p className="mt-5 text-sm font-semibold tracking-[0.25em] text-purple-400">
            TRIPMATE AI
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Your AI Travel Assistant
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-400">
            Plan smarter, discover more and organize your journey
            with your personal TripMate AI assistant.
          </p>
        </div>

        {/* SUGGESTIONS */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => askAI(suggestion)}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-sm text-gray-300 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white disabled:opacity-50"
            >
              <span className="mr-2">✨</span>
              {suggestion}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {/* AI RESPONSE */}
        {reply && (
          <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-xl">
                🤖
              </div>

              <div>
                <p className="font-semibold">
                  TripMate AI
                </p>

                <p className="text-xs text-gray-500">
                  Travel Assistant
                </p>
              </div>
            </div>

            <div className="whitespace-pre-wrap leading-7 text-gray-300">
              {reply}
            </div>
          </div>
        )}

        {/* INPUT */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  askAI();
                }
              }}
              placeholder="Ask TripMate AI anything..."
              className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-gray-600 transition focus:border-purple-500"
            />

            <button
              onClick={() => askAI()}
              disabled={loading || !message.trim()}
              className="rounded-xl bg-purple-600 px-7 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Ask AI"}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-gray-600">
            TripMate AI can help with itineraries, activities,
            packing, food and budgets.
          </p>
        </div>

      </div>
    </main>
  );
}