"use client";

import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";

type Activity = {
  id: number;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

type TripMapProps = {
  latitude: number;
  longitude: number;
  location: string;
  activities?: Activity[];
};

export default function TripMap({
  latitude,
  longitude,
  location,
  activities = [],
}: TripMapProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
      <div className="h-[500px]">
        <Map
          initialViewState={{
            longitude,
            latitude,
            zoom: 11,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          }
        >
          <NavigationControl position="top-right" />

          {/* TRIP DESTINATION */}
          <Marker
            longitude={longitude}
            latitude={latitude}
          >
            <div className="cursor-pointer text-3xl">
              📍
            </div>
          </Marker>

          {/* ACTIVITIES */}
          {activities.map((activity) => {
            if (
              activity.latitude === null ||
              activity.longitude === null
            ) {
              return null;
            }

            return (
              <Marker
                key={activity.id}
                longitude={activity.longitude}
                latitude={activity.latitude}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  setSelectedActivity(activity);
                }}
              >
                <div className="cursor-pointer text-2xl">
                  📌
                </div>
              </Marker>
            );
          })}

          {/* ACTIVITY POPUP */}
          {selectedActivity &&
            selectedActivity.latitude !== null &&
            selectedActivity.longitude !== null && (
              <Popup
                longitude={selectedActivity.longitude}
                latitude={selectedActivity.latitude}
                anchor="top"
                onClose={() => setSelectedActivity(null)}
              >
                <div className="text-black">
                  <h3 className="font-bold">
                    {selectedActivity.title}
                  </h3>

                  {selectedActivity.location && (
                    <p className="mt-1 text-sm">
                      {selectedActivity.location}
                    </p>
                  )}
                </div>
              </Popup>
            )}
        </Map>
      </div>

      <div className="bg-slate-900 px-5 py-3 text-sm text-slate-300">
        📍 {location}
        {activities.length > 0 && (
          <span className="ml-3 text-blue-400">
            • {activities.length} activities
          </span>
        )}
      </div>
    </div>
  );
}