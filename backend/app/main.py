from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.models.user import User
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.itinerary_day import ItineraryDay
from app.models.activity import Activity
from app.models.trip_invite_link import TripInviteLink
from app.models.expense import Expense
from app.models.notification import Notification

from app.routers import (
    users,
    auth,
    trips,
    itinerary,
    places,
    expenses,
    ai,
    weather,
    analytics,
    notifications,
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="TripMate API",
    description="Backend API for the TripMate collaborative trip planner",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itinerary.router)
app.include_router(places.router)
app.include_router(expenses.router)
app.include_router(ai.router)
app.include_router(weather.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "Welcome to TripMate API"}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "message": "TripMate backend is running!"
    }
