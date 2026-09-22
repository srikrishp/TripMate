"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Trip = {
  id: number;
  title: string;
  description: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  owner_id: number;
};

export default function HomePage() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTrips() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await api.get("/api/trips/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTrips(response.data);
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to load your trips."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold tracking-tight"
          >
            Trip<span className="text-blue-500">Mate</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/trips/new")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              + New Trip
            </button>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800">
          <img
            src="/travel-hero.jpg"
            alt="Travel"
            className="h-[300px] w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />

          <div className="absolute inset-0 flex items-center px-8 md:px-12">
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">
                Plan • Collaborate • Explore
              </p>

              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Plan your next adventure
              </h1>

              <p className="mt-4 text-slate-300">
                Create trips, build itineraries, and plan unforgettable
                journeys with your travel companions.
              </p>

              <button
                onClick={() => router.push("/trips/new")}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
              >
                Create a Trip
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRIPS */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Your Trips
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Your upcoming and planned adventures
            </p>
          </div>

          <button
            onClick={() => router.push("/trips/new")}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            + Create Trip
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-slate-400">
              Loading your trips...
            </p>
          </div>
        ) : trips.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
            <div className="text-5xl">✈️</div>

            <h3 className="mt-4 text-xl font-semibold">
              No trips yet
            </h3>

            <p className="mt-2 text-slate-400">
              Start planning your next adventure.
            </p>

            <button
              onClick={() => router.push("/trips/new")}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() =>
                  router.push(`/trips/${trip.id}`)
                }
                className="group text-left"
              >
                <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-700 hover:bg-slate-900/80">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold group-hover:text-blue-400">
                        {trip.title}
                      </h3>

                      <p className="mt-2 text-sm text-blue-400">
                        📍 {trip.destination}
                      </p>
                    </div>

                    <span className="text-2xl">
                      🌍
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <p className="text-sm text-slate-400">
                      {trip.start_date} → {trip.end_date}
                    </p>

                    {trip.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  <p className="mt-5 text-sm font-semibold text-blue-400">
                    View trip →
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}