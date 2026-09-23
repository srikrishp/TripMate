"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import TripMap from "@/components/TripMap";
import WeatherCard from "@/components/WeatherCard";

type Trip = {
  id: number;
  title: string;
  description: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  owner_id: number;
};

type Day = {
  id: number;
  trip_id: number;
  day_number: number;
  date: string;
};

type Activity = {
  id: number;
  day_id: number;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Coordinates = {
  name: string;
  latitude: number;
  longitude: number;
};

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(true);
  const [addingDay, setAddingDay] = useState(false);

  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");

  async function loadTrip() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [tripResponse, daysResponse] =
        await Promise.all([
          api.get(`/api/trips/${tripId}`, {
            headers,
          }),
          api.get(`/api/trips/${tripId}/days`, {
            headers,
          }),
        ]);

      const tripData = tripResponse.data;
      const daysData = daysResponse.data;

      setTrip(tripData);
      setDays(daysData);

      const activityResponses = await Promise.all(
        daysData.map((day: Day) =>
          api.get(
            `/api/days/${day.id}/activities`,
            {
              headers,
            }
          )
        )
      );

      const allActivities =
        activityResponses.flatMap(
          (response) => response.data
        );

      setActivities(allActivities);

      // =====================================================
      // AUTOMATIC DESTINATION GEOCODING
      // =====================================================

      try {
        setGeocoding(true);
        setMapError("");

        const geoResponse = await api.get(
          "/api/places/geocode",
          {
            params: {
              q: tripData.destination.trim(),
            },
            headers,
          }
        );

        if (
          geoResponse.data?.latitude === undefined ||
          geoResponse.data?.longitude === undefined
        ) {
          throw new Error(
            "Coordinates were not returned."
          );
        }

        setCoordinates({
          name:
            geoResponse.data.name ||
            tripData.destination,
          latitude: Number(
            geoResponse.data.latitude
          ),
          longitude: Number(
            geoResponse.data.longitude
          ),
        });
      } catch (geoError: any) {
        console.error(
          "Destination geocoding failed:",
          geoError
        );

        setCoordinates(null);

        setMapError(
          geoError.response?.data?.detail ||
            `Could not locate "${tripData.destination}".`
        );
      } finally {
        setGeocoding(false);
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load trip."
      );

      setGeocoding(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  async function handleAddDay() {
    if (!trip) return;

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAddingDay(true);
      setError("");

      const nextDayNumber =
        days.length + 1;

      const startDate =
        new Date(trip.start_date);

      startDate.setDate(
        startDate.getDate() + days.length
      );

      const date =
        startDate
          .toISOString()
          .split("T")[0];

      await api.post(
        `/api/trips/${tripId}/days`,
        {
          day_number: nextDayNumber,
          date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadTrip();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to add day."
      );
    } finally {
      setAddingDay(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">
          Loading trip...
        </p>
      </main>
    );
  }

  if (error && !trip) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-red-400">
          {error}
        </p>
      </main>
    );
  }

  if (!trip) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        {/* BACK BUTTON */}

        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Dashboard
        </button>

        {/* =====================================================
            TRIP INFO
        ====================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

            <div>

              <h1 className="text-4xl font-bold">
                {trip.title}
              </h1>

              <p className="mt-3 text-lg text-slate-400">
                📍 {trip.destination}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                {trip.start_date} → {trip.end_date}
              </p>

              {trip.description && (
                <p className="mt-5 text-slate-300">
                  {trip.description}
                </p>
              )}

            </div>

            {/* =================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="flex flex-wrap gap-3">

              {/* AI ASSISTANT */}

              <button
                onClick={() =>
                  router.push(
                    `/trips/${tripId}/ai`
                  )
                }
                className="shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-semibold text-purple-300 transition hover:border-purple-400/50 hover:bg-purple-500/20 hover:text-purple-200"
              >
                🤖 AI Assistant
              </button>

              {/* BUDGET */}

              <button
                onClick={() =>
                  router.push(
                    `/trips/${tripId}/expenses`
                  )
                }
                className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-200"
              >
                💰 Budget
              </button>

              {/* ANALYTICS */}

              <button
                onClick={() =>
                  router.push(
                    `/trips/${tripId}/analytics`
                  )
                }
                className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:text-cyan-200"
              >
                📊 Analytics
              </button>

              {/* COLLABORATE */}

              <button
                onClick={() =>
                  router.push(
                    `/trips/${tripId}/members`
                  )
                }
                className="shrink-0 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 font-semibold text-blue-300 transition hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-blue-200"
              >
                👥 Collaborate
              </button>

            </div>
          </div>
        </div>

        {/* =====================================================
            AUTOMATIC MAP
        ====================================================== */}

        <div className="mt-8">

          {geocoding ? (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
              <div className="text-center">

                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="text-sm text-slate-400">
                  Locating{" "}
                  <span className="font-semibold text-white">
                    {trip.destination}
                  </span>
                  ...
                </p>

              </div>
            </div>
          ) : coordinates ? (
            <TripMap
              latitude={coordinates.latitude}
              longitude={coordinates.longitude}
              location={coordinates.name}
              activities={activities}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-2xl border border-red-500/20 bg-slate-900">

              <div className="text-center">

                <div className="text-4xl">
                  📍
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">
                  Location unavailable
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {mapError ||
                    `We couldn't locate ${trip.destination}.`}
                </p>

              </div>

            </div>
          )}

        </div>

        {/* =====================================================
            WEATHER
        ====================================================== */}

        <WeatherCard
          destination={trip.destination}
        />

        {/* =====================================================
            ITINERARY
        ====================================================== */}

        <div className="mt-10">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-semibold">
              Itinerary
            </h2>

            <button
              onClick={handleAddDay}
              disabled={addingDay}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {addingDay
                ? "Adding..."
                : "+ Add Day"}
            </button>

          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          {days.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-10 text-center">

              <p className="text-slate-400">
                No itinerary days yet.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {days.map((day) => (

                <div
                  key={day.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                >

                  <h3 className="text-xl font-semibold">
                    Day {day.day_number}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {day.date}
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/days/${day.id}`
                      )
                    }
                    className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View activities →
                  </button>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}