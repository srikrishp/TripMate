"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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

type SortableActivityProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: number) => void;
};

function SortableActivity({
  activity,
  onEdit,
  onDelete,
}: SortableActivityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-white/[0.04] p-5 backdrop-blur-md transition ${
        isDragging
          ? "z-20 border-blue-500/60 shadow-2xl shadow-blue-950/50"
          : "border-white/10"
      }`}
    >
      <div className="flex gap-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white active:cursor-grabbing"
          title="Drag activity"
        >
          ⋮⋮
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {activity.title}
              </h3>

              {activity.location && (
                <p className="mt-1 text-sm text-blue-400">
                  📍 {activity.location}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(activity)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(activity.id)}
                className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>

          {(activity.start_time || activity.end_time) && (
            <p className="mt-3 text-sm text-slate-400">
              🕐 {activity.start_time || "--"} →{" "}
              {activity.end_time || "--"}
            </p>
          )}

          {activity.description && (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {activity.description}
            </p>
          )}

          {activity.latitude !== null &&
            activity.longitude !== null && (
              <p className="mt-3 text-xs text-emerald-400">
                ● Location mapped
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const dayId = params.dayId as string;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  const [editing, setEditing] = useState<Activity | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

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
            "Geocoding failed.",
            geoError
          );
        }
      }

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

  function openEdit(activity: Activity) {
    setEditing(activity);
    setEditTitle(activity.title);
    setEditLocation(activity.location || "");
    setEditStartTime(activity.start_time || "");
    setEditEndTime(activity.end_time || "");
    setEditDescription(activity.description || "");
    setError("");
  }

  async function saveEdit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editing) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      let latitude = editing.latitude;
      let longitude = editing.longitude;

      if (
        editLocation.trim() &&
        editLocation.trim() !== editing.location
      ) {
        try {
          const geoResponse = await api.get(
            "/api/places/geocode",
            {
              params: {
                q: editLocation.trim(),
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
            "Geocoding failed during edit.",
            geoError
          );
        }
      }

      await api.put(
        `/api/activities/${editing.id}`,
        {
          title: editTitle.trim(),
          description:
            editDescription.trim() || null,
          location:
            editLocation.trim() || null,
          start_time: editStartTime || null,
          end_time: editEndTime || null,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditing(null);
      await loadActivities();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update activity."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteActivity(activityId: number) {
    if (
      !window.confirm(
        "Delete this activity?"
      )
    ) {
      return;
    }

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activities.findIndex(
      (item) => item.id === active.id
    );

    const newIndex = activities.findIndex(
      (item) => item.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(
      activities,
      oldIndex,
      newIndex
    ).map((activity, index) => ({
      ...activity,
      position: index,
    }));

    setActivities(reordered);

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingOrder(true);
      setError("");

      await api.put(
        `/api/days/${dayId}/activities/reorder`,
        reordered.map((activity, index) => ({
          activity_id: activity.id,
          position: index,
        })),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to save activity order."
      );

      await loadActivities();
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] px-5 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <button
          onClick={() => router.back()}
          className="mb-7 text-sm text-slate-400 hover:text-white"
        >
          ← Back
        </button>

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Trip itinerary
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Day Itinerary
            </h1>

            <p className="mt-2 text-slate-400">
              Add, edit and arrange your activities.
            </p>
          </div>

          {savingOrder && (
            <span className="text-sm text-blue-400">
              Saving order...
            </span>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ADD ACTIVITY */}
        <form
          onSubmit={handleAddActivity}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold">
            Add Activity
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Activity name"
              required
              className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none placeholder:text-slate-500 focus:border-blue-500"
            />

            <input
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="Location e.g. Charminar, Hyderabad"
              className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none placeholder:text-slate-500 focus:border-blue-500"
            />

            <div>
              <label className="text-xs text-slate-400">
                Start time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) =>
                  setStartTime(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">
                End time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) =>
                  setEndTime(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
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
            className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none placeholder:text-slate-500 focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={adding}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {adding ? "Adding..." : "+ Add Activity"}
          </button>
        </form>

        {/* ACTIVITIES */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Activities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Drag activities to change their order.
              </p>
            </div>

            {activities.length > 0 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                {activities.length}{" "}
                {activities.length === 1
                  ? "activity"
                  : "activities"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-slate-400">
                Loading activities...
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-12 text-center">
              <div className="text-4xl">🗺️</div>

              <p className="mt-4 font-semibold">
                No activities yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add your first activity above.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activities.map(
                  (activity) => activity.id
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => (
                    <SortableActivity
                      key={activity.id}
                      activity={activity}
                      onEdit={openEdit}
                      onDelete={deleteActivity}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">
                  Activity
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Edit Activity
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={editTitle}
                onChange={(e) =>
                  setEditTitle(e.target.value)
                }
                placeholder="Activity name"
                required
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
              />

              <input
                value={editLocation}
                onChange={(e) =>
                  setEditLocation(e.target.value)
                }
                placeholder="Location"
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
              />

              <input
                type="time"
                value={editStartTime}
                onChange={(e) =>
                  setEditStartTime(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
              />

              <input
                type="time"
                value={editEndTime}
                onChange={(e) =>
                  setEditEndTime(e.target.value)
                }
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
              />
            </div>

            <textarea
              value={editDescription}
              onChange={(e) =>
                setEditDescription(e.target.value)
              }
              placeholder="Description"
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3.5 outline-none focus:border-blue-500"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {savingEdit
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}