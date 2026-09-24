import requests

from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"],
)


@router.get("/{city}")
def get_weather(
    city: str,
    current_user: User = Depends(get_current_user),
):
    try:
        # Find coordinates for destination
        geo_response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json",
            },
            timeout=10,
        )

        geo_response.raise_for_status()
        geo_data = geo_response.json()

        if not geo_data.get("results"):
            raise HTTPException(
                status_code=404,
                detail="Destination not found.",
            )

        location = geo_data["results"][0]

        latitude = location["latitude"]
        longitude = location["longitude"]

        # Get current weather
        weather_response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "precipitation,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "timezone": "auto",
            },
            timeout=10,
        )

        weather_response.raise_for_status()
        weather_data = weather_response.json()

        current = weather_data["current"]

        return {
            "city": location["name"],
            "country": location.get("country"),
            "temperature": current["temperature_2m"],
            "feels_like": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "precipitation": current["precipitation"],
            "wind_speed": current["wind_speed_10m"],
            "weather_code": current["weather_code"],
            "time": current["time"],
        }

    except HTTPException:
        raise

    except Exception as e:
        print("WEATHER ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch weather.",
        )