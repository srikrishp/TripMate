from datetime import datetime

from pydantic import BaseModel, EmailStr


class TripMemberCreate(BaseModel):
    email: EmailStr
    role: str = "member"


class TripMemberRoleUpdate(BaseModel):
    role: str


class TripMemberResponse(BaseModel):
    id: int
    trip_id: int
    user_id: int
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True