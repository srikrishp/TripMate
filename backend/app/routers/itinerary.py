from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.models.user import User
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.itinerary_day import ItineraryDay
from app.models.activity import Activity

from app.schemas.itinerary import (
    DayCreate,
    DayUpdate,
    DayResponse,
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    ActivityReorder
)


router = APIRouter(
    prefix="/api",
    tags=["Itinerary"]
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_trip_access(
    trip_id: int,
    current_user: User,
    db: Session
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )

    # Trip owner
    if trip.owner_id == current_user.id:
        return trip, "owner"

    # Trip member
    membership = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this trip"
        )

    return trip, membership.role


def require_edit_permission(role: str):
    if role not in ["owner", "admin", "member"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to edit this itinerary"
        )


def get_day_with_access(
    day_id: int,
    current_user: User,
    db: Session
):
    day = db.query(ItineraryDay).filter(
        ItineraryDay.id == day_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=404,
            detail="Itinerary day not found"
        )

    trip, role = get_trip_access(
        day.trip_id,
        current_user,
        db
    )

    return day, trip, role


def get_activity_with_access(
    activity_id: int,
    current_user: User,
    db: Session
):
    activity = db.query(Activity).filter(
        Activity.id == activity_id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found"
        )

    day = db.query(ItineraryDay).filter(
        ItineraryDay.id == activity.day_id
    ).first()

    if not day:
        raise HTTPException(
            status_code=404,
            detail="Itinerary day not found"
        )

    trip, role = get_trip_access(
        day.trip_id,
        current_user,
        db
    )

    return activity, day, trip, role


# ============================================================
# DAY ENDPOINTS
# ============================================================

@router.post(
    "/trips/{trip_id}/days",
    response_model=DayResponse
)
def create_day(
    trip_id: int,
    day_data: DayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    require_edit_permission(role)

    # Prevent duplicate day numbers
    existing_day = db.query(ItineraryDay).filter(
        ItineraryDay.trip_id == trip_id,
        ItineraryDay.day_number == day_data.day_number
    ).first()

    if existing_day:
        raise HTTPException(
            status_code=400,
            detail="This day number already exists for the trip"
        )

    new_day = ItineraryDay(
        trip_id=trip_id,
        day_number=day_data.day_number,
        date=day_data.date
    )

    db.add(new_day)
    db.commit()
    db.refresh(new_day)

    return new_day


@router.get(
    "/trips/{trip_id}/days",
    response_model=list[DayResponse]
)
def get_days(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_trip_access(
        trip_id,
        current_user,
        db
    )

    days = db.query(ItineraryDay).filter(
        ItineraryDay.trip_id == trip_id
    ).order_by(
        ItineraryDay.day_number
    ).all()

    return days


@router.put(
    "/days/{day_id}",
    response_model=DayResponse
)
def update_day(
    day_id: int,
    day_data: DayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day, trip, role = get_day_with_access(
        day_id,
        current_user,
        db
    )

    require_edit_permission(role)

    update_data = day_data.model_dump(
        exclude_unset=True
    )

    # Prevent duplicate day numbers
    if "day_number" in update_data:
        existing_day = db.query(ItineraryDay).filter(
            ItineraryDay.trip_id == day.trip_id,
            ItineraryDay.day_number == update_data["day_number"],
            ItineraryDay.id != day.id
        ).first()

        if existing_day:
            raise HTTPException(
                status_code=400,
                detail="This day number already exists"
            )

    for field, value in update_data.items():
        setattr(day, field, value)

    db.commit()
    db.refresh(day)

    return day


@router.delete(
    "/days/{day_id}"
)
def delete_day(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day, trip, role = get_day_with_access(
        day_id,
        current_user,
        db
    )

    require_edit_permission(role)

    db.delete(day)
    db.commit()

    return {
        "message": "Itinerary day deleted successfully"
    }


# ============================================================
# ACTIVITY ENDPOINTS
# ============================================================

@router.post(
    "/days/{day_id}/activities",
    response_model=ActivityResponse
)
def create_activity(
    day_id: int,
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day, trip, role = get_day_with_access(
        day_id,
        current_user,
        db
    )

    require_edit_permission(role)

    # Add activity at the end
    last_activity = db.query(Activity).filter(
        Activity.day_id == day_id
    ).order_by(
        Activity.position.desc()
    ).first()

    if last_activity:
        next_position = last_activity.position + 1
    else:
        next_position = 0

    new_activity = Activity(
        day_id=day_id,
        title=activity_data.title,
        description=activity_data.description,
        location=activity_data.location,
        start_time=activity_data.start_time,
        end_time=activity_data.end_time,
        latitude=activity_data.latitude,
        longitude=activity_data.longitude,
        position=next_position
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    return new_activity


@router.get(
    "/days/{day_id}/activities",
    response_model=list[ActivityResponse]
)
def get_activities(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    get_day_with_access(
        day_id,
        current_user,
        db
    )

    activities = db.query(Activity).filter(
        Activity.day_id == day_id
    ).order_by(
        Activity.position
    ).all()

    return activities


@router.get(
    "/activities/{activity_id}",
    response_model=ActivityResponse
)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activity, day, trip, role = get_activity_with_access(
        activity_id,
        current_user,
        db
    )

    return activity


@router.put(
    "/activities/{activity_id}",
    response_model=ActivityResponse
)
def update_activity(
    activity_id: int,
    activity_data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activity, day, trip, role = get_activity_with_access(
        activity_id,
        current_user,
        db
    )

    require_edit_permission(role)

    update_data = activity_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)

    return activity


@router.delete(
    "/activities/{activity_id}"
)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activity, day, trip, role = get_activity_with_access(
        activity_id,
        current_user,
        db
    )

    require_edit_permission(role)

    db.delete(activity)
    db.commit()

    return {
        "message": "Activity deleted successfully"
    }


# ============================================================
# DRAG & DROP REORDER
# ============================================================

@router.put(
    "/days/{day_id}/activities/reorder"
)
def reorder_activities(
    day_id: int,
    reorder_data: list[ActivityReorder],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day, trip, role = get_day_with_access(
        day_id,
        current_user,
        db
    )

    require_edit_permission(role)

    activities = db.query(Activity).filter(
        Activity.day_id == day_id
    ).all()

    activity_map = {
        activity.id: activity
        for activity in activities
    }

    # Make sure every activity belongs to this day
    for item in reorder_data:
        if item.activity_id not in activity_map:
            raise HTTPException(
                status_code=400,
                detail=f"Activity {item.activity_id} does not belong to this day"
            )

    # Prevent duplicate positions
    positions = [
        item.position
        for item in reorder_data
    ]

    if len(positions) != len(set(positions)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate positions are not allowed"
        )

    # Update positions
    for item in reorder_data:
        activity_map[
            item.activity_id
        ].position = item.position

    db.commit()

    return {
        "message": "Activities reordered successfully"
    }