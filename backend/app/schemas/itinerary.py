from datetime import date as date_type, time as time_type

from pydantic import BaseModel


class DayCreate(BaseModel):
    day_number: int
    date: date_type


class DayUpdate(BaseModel):
    day_number: int | None = None
    date: date_type | None = None


class DayResponse(BaseModel):
    id: int
    trip_id: int
    day_number: int
    date: date_type

    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    start_time: time_type | None = None
    end_time: time_type | None = None
    latitude: float | None = None
    longitude: float | None = None


class ActivityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    start_time: time_type | None = None
    end_time: time_type | None = None
    latitude: float | None = None
    longitude: float | None = None


class ActivityResponse(BaseModel):
    id: int
    day_id: int
    title: str
    description: str | None
    location: str | None
    start_time: time_type | None
    end_time: time_type | None
    latitude: float | None
    longitude: float | None
    position: int

    class Config:
        from_attributes = True


class ActivityReorder(BaseModel):
    activity_id: int
    position: int