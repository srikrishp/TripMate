"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type Activity = {
  id: number;
  day_id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  latitude: number | null;
  longitude: number | null;
  position: number;
};

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const dayId = params.dayId as string;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  async function loadActivities() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await api.get(
        `/api/days/${dayId}/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActivities(response.data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to load activities."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, [dayId]);

  async function handleAddActivity(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAdding(true);
      setError("");

      let latitude: number | null = null;
      let longitude: number | null = null;

      // Try geocoding, but don't prevent activity creation
      // if Mapbox/geocoding fails.
      if (location.trim()) {
        try {
          const geoResponse = await api.get(
            "/api/places/geocode",
            {
              params: {
                q: location.trim(),
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          latitude = geoResponse.data.latitude;
          longitude = geoResponse.data.longitude;
        } catch (geoError) {
          console.warn(
            "Geocoding failed. Activity will still be created.",
            geoError
          );
        }
      }

      // Create activity
      await api.post(
        `/api/days/${dayId}/activities`,
        {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          start_time: startTime || null,
          end_time: endTime || null,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear form
      setTitle("");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setDescription("");

      await loadActivities();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to add activity."
      );
    } finally {
      setAdding(false);
    }
  }

  async function deleteActivity(activityId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setError("");

      await api.delete(
        `/api/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadActivities();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to delete activity."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-bold">
          Day Itinerary
        </h1>

        <p className="mt-2 text-slate-400">
          Add places and activities for this day.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ADD ACTIVITY */}
        <form
          onSubmit={handleAddActivity}
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-xl font-semibold">
            Add Activity
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Activity name"
              required
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            />

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location e.g. Charminar, Hyderabad"
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            />

            <div>
              <label className="text-sm text-slate-400">
                Start time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) =>
                  setStartTime(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                End time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) =>
                  setEndTime(e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
              />
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Description"
            rows={3}
            className="mt-4 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={adding}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? "Adding..." : "+ Add Activity"}
          </button>
        </form>

        {/* ACTIVITIES */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Activities
          </h2>

          {loading ? (
            <p className="mt-5 text-slate-400">
              Loading...
            </p>
          ) : activities.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-10 text-center">
              <p className="text-slate-400">
                No activities yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      {activity.title}
                    </h3>

                    {activity.location && (
                      <p className="mt-1 text-blue-400">
                        📍 {activity.location}
                      </p>
                    )}

                    {(activity.start_time ||
                      activity.end_time) && (
                      <p className="mt-1 text-sm text-slate-400">
                        🕐 {activity.start_time || "--"} →{" "}
                        {activity.end_time || "--"}
                      </p>
                    )}

                    {activity.description && (
                      <p className="mt-2 text-sm text-slate-400">
                        {activity.description}
                      </p>
                    )}

                    {activity.latitude !== null &&
                      activity.longitude !== null && (
                        <p className="mt-2 text-xs text-emerald-400">
                          📍 Location mapped
                        </p>
                      )}
                  </div>

                  <button
                    onClick={() =>
                      deleteActivity(activity.id)
                    }
                    className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}