"use client";

import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

type Trip = {
  id: number;
  title: string;
  destination: string;
};

type GlobeBackgroundProps = {
  trips?: Trip[];
};

const defaultLocations = [
  {
    name: "New York",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    name: "London",
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    name: "Tokyo",
    lat: 35.6762,
    lng: 139.6503,
  },
  {
    name: "Bali",
    lat: -8.4095,
    lng: 115.1889,
  },
  {
    name: "Paris",
    lat: 48.8566,
    lng: 2.3522,
  },
];

export default function GlobeBackground({
  trips = [],
}: GlobeBackgroundProps) {
  const globeRef = useRef<any>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();

    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    globeRef.current.pointOfView(
      {
        lat: 20,
        lng: 20,
        altitude: 2.2,
      },
      1000
    );
  }, []);

  const points =
    trips.length > 0
      ? trips.map((trip, index) => {
          const fallback = defaultLocations[index % defaultLocations.length];

          return {
            name: trip.destination,
            lat: fallback.lat,
            lng: fallback.lng,
            size: 0.7,
            color: "#38bdf8",
          };
        })
      : defaultLocations.map((location) => ({
          ...location,
          size: 0.7,
          color: "#38bdf8",
        }));

  const arcs = [
    {
      startLat: 40.7128,
      startLng: -74.006,
      endLat: 51.5074,
      endLng: -0.1278,
    },
    {
      startLat: 51.5074,
      startLng: -0.1278,
      endLat: 35.6762,
      endLng: 139.6503,
    },
    {
      startLat: 40.7128,
      startLng: -74.006,
      endLat: -8.4095,
      endLng: 115.1889,
    },
    {
      startLat: 48.8566,
      startLng: 2.3522,
      endLat: 35.6762,
      endLng: 139.6503,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Space background */}
      <div className="absolute inset-0 bg-[#020817]" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[8%] top-[14%] h-1 w-1 rounded-full bg-white shadow-[0_0_12px_4px_rgba(96,165,250,0.7)]" />
        <div className="absolute left-[22%] top-[32%] h-1 w-1 rounded-full bg-white shadow-[0_0_10px_3px_rgba(56,189,248,0.6)]" />
        <div className="absolute left-[42%] top-[12%] h-1 w-1 rounded-full bg-white shadow-[0_0_12px_4px_rgba(96,165,250,0.7)]" />
        <div className="absolute left-[68%] top-[18%] h-1 w-1 rounded-full bg-white shadow-[0_0_12px_4px_rgba(56,189,248,0.7)]" />
        <div className="absolute left-[86%] top-[32%] h-1 w-1 rounded-full bg-white shadow-[0_0_10px_3px_rgba(96,165,250,0.6)]" />
        <div className="absolute left-[74%] top-[62%] h-1 w-1 rounded-full bg-white shadow-[0_0_12px_4px_rgba(56,189,248,0.6)]" />
        <div className="absolute left-[94%] top-[80%] h-1 w-1 rounded-full bg-white shadow-[0_0_10px_3px_rgba(96,165,250,0.6)]" />
      </div>

      {/* Blue ambient glow */}
      <div className="absolute right-[-15%] top-[-5%] h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute left-[-15%] top-[30%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />

      {/* Globe */}
      <div className="absolute -right-[15%] top-[2%] h-[700px] w-[700px] opacity-95 md:h-[850px] md:w-[850px] lg:-right-[8%] lg:top-[-8%] lg:h-[950px] lg:w-[950px]">
        <Globe
          ref={globeRef}
          width={950}
          height={950}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere={true}
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.16}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointAltitude={0.015}
          arcsData={arcs}
          arcColor={() => "#38bdf8"}
          arcAltitude={0.18}
          arcStroke={0.7}
          arcDashLength={0.35}
          arcDashGap={0.2}
          arcDashAnimateTime={2500}
          enablePointerInteraction={false}
        />
      </div>

      {/* Left-side readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/90 via-45% to-transparent" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#020817] to-transparent" />
    </div>
  );
}