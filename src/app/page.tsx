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
    <main className="min-h-screen bg-[#020817] text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <span className="text-3xl">✈️</span>
            <span>
              Trip<span className="text-blue-500">Mate</span>
            </span>
          </button>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => router.push("/")}
              className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white md:block"
            >
              Home
            </button>

            <button
              onClick={() => router.push("/trips/new")}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              + New Trip
            </button>

            <button
              onClick={logout}
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white md:block"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-6 md:px-8 md:pt-8">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-blue-400/20 bg-slate-950 shadow-2xl shadow-blue-950/30">
          <img
            src="/travel-hero.jpg"
            alt="World globe"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/80 via-transparent to-transparent" />

          <div className="relative flex min-h-[420px] items-center px-7 py-12 md:px-14">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-blue-300 backdrop-blur-md">
                PLAN • COLLABORATE • EXPLORE
              </div>

              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Plan your next
                <span className="block text-blue-500">
                  adventure.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
                Create trips, build itineraries, collaborate with
                friends, and explore the world together.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/trips/new")}
                  className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Create a Trip →
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("trips")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold backdrop-blur-md transition hover:bg-white/10"
                >
                  View My Trips
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRIPS */}
      <section
        id="trips"
        className="mx-auto max-w-7xl px-5 py-14 md:px-8"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Your adventures
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Your Trips
            </h2>

            <p className="mt-2 text-slate-400">
              Everything you're planning, all in one place.
            </p>
          </div>

          <button
            onClick={() => router.push("/trips/new")}
            className="self-start rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            + Create Trip
          </button>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-14 text-center">
            <div className="text-5xl">🌍</div>

            <h3 className="mt-5 text-xl font-semibold">
              Your next adventure starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-slate-400">
              Create your first trip and start building an itinerary.
            </p>

            <button
              onClick={() => router.push("/trips/new")}
              className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
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
                <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-blue-950/30">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src="/travel-hero.jpg"
                      alt=""
                      className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817] to-transparent" />

                    <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-lg backdrop-blur-md">
                      🌍
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-semibold transition group-hover:text-blue-400">
                      {trip.title}
                    </h3>

                    <p className="mt-2 text-sm text-blue-400">
                      📍 {trip.destination}
                    </p>

                    <p className="mt-4 text-sm text-slate-400">
                      {trip.start_date} → {trip.end_date}
                    </p>

                    {trip.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {trip.description}
                      </p>
                    )}

                    <div className="mt-5 border-t border-white/10 pt-4 text-sm font-semibold text-blue-400">
                      View trip →
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        <p>
          Trip<span className="text-blue-500">Mate</span> •
          Plan together. Travel further. 🌍
        </p>
      </footer>
    </main>
  );
}