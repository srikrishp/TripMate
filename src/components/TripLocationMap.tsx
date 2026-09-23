"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";

import api from "@/lib/api";

type TripLocationMapProps = {
  destination: string;
};

type Coordinates = {
  name: string;
  latitude: number;
  longitude: number;
};

export default function TripLocationMap({
  destination,
}: TripLocationMapProps) {
  const [location, setLocation] =
    useState<Coordinates | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function geocodeDestination() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }

    if (!destination?.trim()) {
      setError("No destination provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/places/geocode",
        {
          params: {
            q: destination.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLocation(response.data);
    } catch (err: any) {
      console.error(
        "Destination geocoding failed:",
        err
      );

      setLocation(null);

      setError(
        err.response?.data?.detail ||
          `Couldn't find "${destination}".`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    geocodeDestination();
  }, [destination]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex h-[420px] items-center justify-center bg-[#07111f]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2
              size={28}
              className="animate-spin text-blue-400"
            />

            <p className="text-sm">
              Locating {destination}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="overflow-hidden rounded-3xl border border-red-400/10 bg-white/[0.03]">
        <div className="flex h-[420px] items-center justify-center bg-[#07111f] px-6 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <MapPin
                size={26}
                className="text-red-400"
              />
            </div>

            <p className="mt-4 font-semibold text-white">
              Location unavailable
            </p>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {error ||
                `We couldn't locate ${destination}.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Small bounding box around the destination.
   * This keeps the map focused on the actual city.
   */

  const padding = 0.12;

  const left =
    location.longitude - padding;

  const right =
    location.longitude + padding;

  const top =
    location.latitude + padding;

  const bottom =
    location.latitude - padding;

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
    `&layer=mapnik` +
    `&marker=${location.latitude}%2C${location.longitude}`;

  const openMapUrl =
    `https://www.openstreetmap.org/?mlat=${location.latitude}` +
    `&mlon=${location.longitude}` +
    `#map=12/${location.latitude}/${location.longitude}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-white/[0.03] shadow-2xl shadow-blue-950/20">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-white/10 bg-[#07111f]/90 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <MapPin
              size={20}
              className="text-blue-400"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Trip destination
            </p>

            <p className="text-xs text-slate-500">
              {location.name}
            </p>
          </div>

        </div>

        <a
          href={openMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Navigation size={14} />
          Open Map
        </a>

      </div>

      {/* Map */}

      <div className="relative h-[420px] bg-[#07111f]">

        <iframe
          title={`Map of ${location.name}`}
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
        />

        {/* Location badge */}

        <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020817]/90 px-4 py-3 shadow-xl backdrop-blur-xl">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
            <MapPin
              size={17}
              className="text-blue-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Destination
            </p>

            <p className="text-sm font-semibold text-white">
              {location.name}
            </p>
          </div>

        </div>

      </div>

      {/* Coordinates */}

      <div className="flex items-center justify-between border-t border-white/10 bg-[#07111f] px-5 py-3">

        <span className="text-xs text-slate-500">
          Latitude
        </span>

        <span className="font-mono text-xs text-slate-300">
          {location.latitude.toFixed(6)}
        </span>

        <span className="mx-3 h-4 w-px bg-white/10" />

        <span className="text-xs text-slate-500">
          Longitude
        </span>

        <span className="font-mono text-xs text-slate-300">
          {location.longitude.toFixed(6)}
        </span>

      </div>

    </div>
  );
}