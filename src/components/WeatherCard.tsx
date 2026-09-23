"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type WeatherData = {
  city: string;
  country: string | null;
  temperature: number;
  feels_like: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_code: number;
  time: string;
};

type Props = {
  destination: string;
};

function getWeatherInfo(code: number) {
  if (code === 0) {
    return {
      icon: "☀️",
      label: "Clear sky",
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      icon: "⛅",
      label: "Partly cloudy",
    };
  }

  if ([45, 48].includes(code)) {
    return {
      icon: "🌫️",
      label: "Foggy",
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      icon: "🌦️",
      label: "Drizzle",
    };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return {
      icon: "🌧️",
      label: "Rainy",
    };
  }

  if ([71, 73, 75, 77].includes(code)) {
    return {
      icon: "❄️",
      label: "Snowy",
    };
  }

  if ([80, 81, 82].includes(code)) {
    return {
      icon: "🌧️",
      label: "Rain showers",
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      icon: "⛈️",
      label: "Thunderstorm",
    };
  }

  return {
    icon: "🌤️",
    label: "Mixed conditions",
  };
}

export default function WeatherCard({
  destination,
}: Props) {
  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWeather() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in to view weather.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/api/weather/${encodeURIComponent(destination)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setWeather(response.data);
      } catch (err) {
        console.error(err);
        setError("Weather unavailable.");
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [destination]);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="mt-4 h-10 w-24 rounded bg-white/10" />
          <div className="mt-3 h-4 w-40 rounded bg-white/10" />
        </div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-gray-500">
          🌦️ {error || "Weather unavailable."}
        </p>
      </section>
    );
  }

  const info = getWeatherInfo(weather.weather_code);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-white/[0.04] to-purple-500/10 p-6">

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold tracking-widest text-blue-400">
            DESTINATION WEATHER
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {weather.city}
            {weather.country
              ? `, ${weather.country}`
              : ""}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Current conditions
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-6xl">
            {info.icon}
          </div>

          <div>
            <p className="text-4xl font-bold">
              {Math.round(weather.temperature)}°C
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {info.label}
            </p>

            <p className="text-xs text-gray-600">
              Feels like {Math.round(weather.feels_like)}°C
            </p>
          </div>
        </div>

      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">

        <div className="rounded-xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs text-gray-500">
            Humidity
          </p>

          <p className="mt-2 text-lg font-semibold">
            {weather.humidity}%
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs text-gray-500">
            Wind
          </p>

          <p className="mt-2 text-lg font-semibold">
            {Math.round(weather.wind_speed)} km/h
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs text-gray-500">
            Rain
          </p>

          <p className="mt-2 text-lg font-semibold">
            {weather.precipitation} mm
          </p>
        </div>

      </div>

    </section>
  );
}