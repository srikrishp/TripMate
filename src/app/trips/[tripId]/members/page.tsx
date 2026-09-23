"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type Member = {
  id: number;
  trip_id: number;
  user_id: number;
  role: string;
  joined_at: string;
};

const roleStyles: Record<string, string> = {
  owner:
    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  admin:
    "bg-purple-500/15 text-purple-300 border-purple-500/30",
  member:
    "bg-slate-700/50 text-slate-300 border-slate-600",
};

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.tripId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getToken() {
    return localStorage.getItem("access_token");
  }

  async function loadMembers() {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/api/trips/${tripId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMembers(response.data);
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load trip members."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [tripId]);

  async function handleAddMember(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!email.trim()) return;

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      await api.post(
        `/api/trips/${tripId}/members`,
        {
          email: email.trim(),
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmail("");
      setRole("member");
      setSuccess("Member added successfully.");

      await loadMembers();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to add member."
      );
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(
    userId: number,
    newRole: string
  ) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.put(
        `/api/trips/${tripId}/members/${userId}`,
        {
          role: newRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Member role updated.");

      await loadMembers();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update member role."
      );
    }
  }

  async function removeMember(userId: number) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm(
      "Remove this member from the trip?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/api/trips/${tripId}/members/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Member removed.");

      await loadMembers();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to remove member."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <button
              onClick={() => router.back()}
              className="mb-5 text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to Trip
            </button>

            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-400">
              Collaboration
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Trip Members
            </h1>

            <p className="mt-2 text-slate-400">
              Invite people and manage their access.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <div className="text-2xl font-bold">
              {members.length}
            </div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Members
            </div>
          </div>

        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* ADD MEMBER */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">

          <div>
            <h2 className="text-xl font-semibold">
              Invite a member
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add someone using their TripMate account email.
            </p>
          </div>

          <form
            onSubmit={handleAddMember}
            className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]"
          >

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="friend@example.com"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="member">
                Member
              </option>
              <option value="admin">
                Admin
              </option>
            </select>

            <button
              type="submit"
              disabled={adding}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding..." : "＋ Add Member"}
            </button>

          </form>
        </section>

        {/* MEMBERS */}
        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              People on this trip
            </h2>

            <span className="text-sm text-slate-500">
              {members.length} people
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
              <div className="text-4xl">👥</div>

              <h3 className="mt-3 text-lg font-semibold">
                No members yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add someone to start collaborating.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 text-lg font-bold text-blue-300">
                      {member.role
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold">
                        User #{member.user_id}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Joined{" "}
                        {new Date(
                          member.joined_at
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        roleStyles[
                          member.role
                        ] ||
                        roleStyles.member
                      }`}
                    >
                      {member.role}
                    </span>

                  </div>

                  {/* CONTROLS */}
                  <div className="flex items-center gap-2">

                    {member.role !== "owner" && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            changeRole(
                              member.user_id,
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        >
                          <option value="member">
                            Member
                          </option>
                          <option value="admin">
                            Admin
                          </option>
                        </select>

                        <button
                          onClick={() =>
                            removeMember(
                              member.user_id
                            )
                          }
                          className="rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
                        >
                          Remove
                        </button>
                      </>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* ROLE INFO */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-blue-300">👑 Owner</div>
            <p className="mt-2 text-sm text-slate-400">
              Full control over the trip and members.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-purple-300">⚡ Admin</div>
            <p className="mt-2 text-sm text-slate-400">
              Can collaborate and manage trip content.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-slate-300">👤 Member</div>
            <p className="mt-2 text-sm text-slate-400">
              Can participate in the shared itinerary.
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}