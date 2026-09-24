from datetime import date

from pydantic import BaseModel


class TripCreate(BaseModel):
    title: str
    description: str | None = None
    destination: str
    start_date: date
    end_date: date


class TripUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    destination: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class TripResponse(BaseModel):
    id: int
    title: str
    description: str | None
    destination: str
    start_date: date
    end_date: date
    owner_id: int

    class Config:
        from_attributes = True