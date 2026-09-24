import os

import requests
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/places",
    tags=["Places"]
)

MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")


@router.get("/geocode")
def geocode_place(q: str = Query(..., min_length=2)):
    if not MAPBOX_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="MAPBOX_TOKEN is not configured"
        )

    url = "https://api.mapbox.com/search/geocode/v6/forward"

    response = requests.get(
        url,
        params={
            "q": q,
            "access_token": MAPBOX_TOKEN,
            "limit": 1,
        },
        timeout=10,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Mapbox geocoding failed"
        )

    data = response.json()

    if not data.get("features"):
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    feature = data["features"][0]

    longitude, latitude = feature["geometry"]["coordinates"]

    return {
        "name": feature["properties"].get("name", q),
        "latitude": latitude,
        "longitude": longitude,
    }