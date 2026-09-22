"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/login",
        null,
        {
          params: {
            email: email.trim(),
            password,
          },
        }
      );

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      router.push("/");
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8"
      >
        <h1 className="text-3xl font-bold">
          Welcome to TripMate
        </h1>

        <p className="mt-2 text-slate-400">
          Login to manage your trips.
        </p>

        <div className="mt-8">
          <label className="text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div className="mt-5">
          <label className="text-sm text-slate-300">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}