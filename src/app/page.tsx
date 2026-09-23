"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  MapPin,
  Menu,
  Plane,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import api from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import GlobeBackground from "@/components/GlobeBackground";

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
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

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

  const filteredTrips = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return trips;

    return trips.filter(
      (trip) =>
        trip.title.toLowerCase().includes(value) ||
        trip.destination.toLowerCase().includes(value) ||
        trip.description?.toLowerCase().includes(value)
    );
  }, [trips, search]);

  function scrollToTrips() {
    document
      .getElementById("trips")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020817] text-white">

      {/* =========================================================
          GLOBE BACKGROUND
      ========================================================= */}

      <GlobeBackground trips={trips} />

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <nav className="relative z-50 border-b border-white/[0.08] bg-[#020817]/65 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-8">

          {/* Logo */}

          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
              <Plane
                size={23}
                className="-rotate-12"
              />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Trip
              <span className="text-blue-500">
                Mate
              </span>
            </span>
          </button>

          {/* Desktop Navigation */}

          <div className="hidden items-center gap-8 md:flex">

            <button
              onClick={() => router.push("/")}
              className="relative px-2 py-2 text-sm font-medium text-white"
            >
              Home

              <span className="absolute bottom-[-17px] left-0 h-[2px] w-full bg-blue-400" />
            </button>

            <button
              onClick={scrollToTrips}
              className="px-2 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Explore
            </button>

            <button
              onClick={scrollToTrips}
              className="px-2 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              My Trips
            </button>

            <button
              onClick={() =>
                router.push("/trips/new")
              }
              className="px-2 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Plan
            </button>

          </div>

          {/* Desktop Right */}

          <div className="hidden items-center gap-3 md:flex">

            {/* Search */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search destinations..."
                className="h-11 w-56 rounded-xl border border-blue-400/20 bg-white/[0.03] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50 focus:bg-white/[0.06]"
              />
            </div>

            {/* Notifications */}

            <NotificationBell />

            {/* New Trip */}

            <button
              onClick={() =>
                router.push("/trips/new")
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              <span className="text-lg">
                +
              </span>
              New Trip
            </button>

            {/* Profile */}

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 font-semibold text-slate-200">
              S
            </div>

          </div>

          {/* Mobile */}

          <div className="flex items-center gap-2 md:hidden">

            <NotificationBell />

            <button
              onClick={() =>
                setMobileMenu(!mobileMenu)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            >
              {mobileMenu ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>

          </div>
        </div>

        {/* Mobile Menu */}

        {mobileMenu && (
          <div className="border-t border-white/10 bg-[#020817]/95 px-5 py-5 md:hidden">

            <div className="flex flex-col gap-2">

              <button
                onClick={() => {
                  setMobileMenu(false);
                  router.push("/");
                }}
                className="rounded-xl px-4 py-3 text-left text-slate-200 hover:bg-white/5"
              >
                Home
              </button>

              <button
                onClick={() => {
                  setMobileMenu(false);
                  scrollToTrips();
                }}
                className="rounded-xl px-4 py-3 text-left text-slate-300 hover:bg-white/5"
              >
                My Trips
              </button>

              <button
                onClick={() => {
                  setMobileMenu(false);
                  router.push("/trips/new");
                }}
                className="rounded-xl bg-blue-600 px-4 py-3 text-left font-semibold"
              >
                + New Trip
              </button>

              <button
                onClick={logout}
                className="rounded-xl px-4 py-3 text-left text-slate-400 hover:bg-white/5"
              >
                Logout
              </button>

            </div>
          </div>
        )}
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative z-10 mx-auto min-h-[700px] max-w-[1400px] px-5 md:px-8">

        <div className="flex min-h-[700px] items-center">

          <div className="max-w-[690px] pt-10 md:pt-0">

            {/* Small Label */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-4 py-2 text-xs font-semibold tracking-[0.28em] text-blue-300 backdrop-blur-md">
              <Sparkles size={14} />
              PLAN • COLLABORATE • EXPLORE
            </div>

            {/* Main Heading */}

            <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-[82px]">

              Plan your next

              <span className="mt-2 block bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                adventure.
              </span>

            </h1>

            {/* Description */}

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Create trips, build itineraries,
              collaborate with friends, and explore
              the world together.
            </p>

            {/* CTA */}

            <div className="mt-9 flex flex-wrap gap-4">

              <button
                onClick={() =>
                  router.push("/trips/new")
                }
                className="group flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-semibold shadow-xl shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-500"
              >
                Create a Trip

                <ArrowRight
                  size={19}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <button
                onClick={scrollToTrips}
                className="rounded-xl border border-blue-300/50 bg-white/[0.02] px-7 py-4 font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                View My Trips
              </button>

            </div>

            {/* Feature Highlights */}

            <div className="mt-12 flex flex-wrap gap-8">

              <Feature
                icon={<Compass size={22} />}
                title="Plan"
                subtitle="Your journey"
              />

              <Feature
                icon={<Users size={22} />}
                title="Collaborate"
                subtitle="With friends"
              />

              <Feature
                icon={<Sparkles size={22} />}
                title="Explore"
                subtitle="The world"
              />

            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          TRIPS SECTION
      ========================================================= */}

      <section
        id="trips"
        className="relative z-20 mx-auto max-w-[1400px] px-5 pb-20 md:px-8"
      >

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Your adventures
            </p>

            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              Your Trips
            </h2>

            <p className="mt-2 text-slate-400">
              Everything you're planning, all in one place.
            </p>

          </div>

          <button
            onClick={() =>
              router.push("/trips/new")
            }
            className="flex items-center gap-2 self-start rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            <span className="text-lg">+</span>
            Create Trip
          </button>

        </div>

        {/* Error */}

        {error && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              )
            )}

          </div>

        ) : filteredTrips.length === 0 ? (

          <div className="mt-8 rounded-3xl border border-dashed border-blue-400/20 bg-white/[0.025] p-14 text-center backdrop-blur-md">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Plane size={30} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              {search
                ? "No trips found"
                : "Your next adventure starts here"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-slate-400">
              {search
                ? "Try searching for another destination or trip name."
                : "Create your first trip and start building an itinerary."}
            </p>

            {!search && (
              <button
                onClick={() =>
                  router.push("/trips/new")
                }
                className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              >
                Create Your First Trip
              </button>
            )}

          </div>

        ) : (

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {filteredTrips.map(
              (trip, index) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={index}
                  onClick={() =>
                    router.push(
                      `/trips/${trip.id}`
                    )
                  }
                />
              )
            )}

          </div>
        )}

      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="relative z-20 border-t border-white/[0.08] bg-[#020817]/80 px-5 py-10 text-center">

        <div className="mx-auto max-w-7xl">

          <div className="flex items-center justify-center gap-2 text-lg font-bold">
            <Plane
              size={19}
              className="-rotate-12 text-blue-400"
            />

            Trip
            <span className="text-blue-500">
              Mate
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Plan together. Travel further. 🌍
          </p>

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   FEATURE COMPONENT
========================================================= */

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-blue-300 shadow-lg shadow-blue-950/30">
        {icon}
      </div>

      <div>
        <p className="font-semibold text-white">
          {title}
        </p>

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   TRIP CARD
========================================================= */

function TripCard({
  trip,
  index,
  onClick,
}: {
  trip: Trip;
  index: number;
  onClick: () => void;
}) {
  const cardThemes = [
    {
      gradient:
        "from-cyan-500/30 via-blue-500/10 to-transparent",
      icon: "🌊",
    },
    {
      gradient:
        "from-pink-500/25 via-purple-500/10 to-transparent",
      icon: "🌸",
    },
    {
      gradient:
        "from-orange-500/25 via-yellow-500/10 to-transparent",
      icon: "🏛️",
    },
    {
      gradient:
        "from-blue-500/25 via-indigo-500/10 to-transparent",
      icon: "🌉",
    },
  ];

  const theme =
    cardThemes[index % cardThemes.length];

  return (
    <button
      onClick={onClick}
      className="group text-left"
    >

      <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-blue-400/40 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-blue-950/40">

        {/* Card Visual */}

        <div
          className={`relative h-44 overflow-hidden bg-gradient-to-br ${theme.gradient}`}
        >

          {/* Decorative globe circle */}

          <div className="absolute right-[-35px] top-[-55px] h-48 w-48 rounded-full border border-blue-300/20 bg-blue-500/5 shadow-[0_0_80px_rgba(59,130,246,0.2)]" />

          <div className="absolute bottom-[-50px] left-[-30px] h-36 w-36 rounded-full border border-white/10" />

          {/* Grid */}

          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:32px_32px]" />

          {/* Destination icon */}

          <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-2xl backdrop-blur-md">
            {theme.icon}
          </div>

          {/* Location */}

          <div className="absolute bottom-5 left-5 flex items-center gap-2 text-sm text-blue-200">
            <MapPin size={15} />
            {trip.destination}
          </div>

          {/* Glow */}

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#07111f] to-transparent" />

        </div>

        {/* Card Content */}

        <div className="p-5">

          <h3 className="truncate text-lg font-semibold text-white transition group-hover:text-blue-400">
            {trip.title}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays size={15} />
            <span>
              {trip.start_date}
            </span>

            <span className="text-slate-600">
              →
            </span>

            <span>
              {trip.end_date}
            </span>
          </div>

          {trip.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
              {trip.description}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

            <span className="text-sm font-semibold text-blue-400">
              View trip
            </span>

            <ArrowRight
              size={17}
              className="text-blue-400 transition group-hover:translate-x-1"
            />

          </div>

        </div>

      </div>
    </button>
  );
}