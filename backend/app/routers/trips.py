from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.user import User

from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse
)

from app.schemas.trip_member import (
    TripMemberCreate,
    TripMemberRoleUpdate,
    TripMemberResponse
)

router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"]
)


# ============================================================
# HELPERS
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

    if trip.owner_id == current_user.id:
        return trip, "owner"

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


def require_admin_or_owner(role: str):
    if role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only the trip owner or admin can perform this action"
        )


# ============================================================
# GET MY TRIPS
# ============================================================

@router.get(
    "/",
    response_model=list[TripResponse]
)
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    owned_trips = db.query(Trip).filter(
        Trip.owner_id == current_user.id
    ).all()

    member_trip_ids = db.query(
        TripMember.trip_id
    ).filter(
        TripMember.user_id == current_user.id
    ).all()

    member_trip_ids = [
        trip_id for (trip_id,) in member_trip_ids
    ]

    member_trips = []

    if member_trip_ids:
        member_trips = db.query(Trip).filter(
            Trip.id.in_(member_trip_ids)
        ).all()

    owned_ids = {trip.id for trip in owned_trips}

    trips = owned_trips + [
        trip for trip in member_trips
        if trip.id not in owned_ids
    ]

    return trips


# ============================================================
# CREATE TRIP
# ============================================================

@router.post(
    "/",
    response_model=TripResponse
)
def create_trip(
    trip_data: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = Trip(
        **trip_data.model_dump(),
        owner_id=current_user.id
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip


# ============================================================
# GET SINGLE TRIP
# ============================================================

@router.get(
    "/{trip_id}",
    response_model=TripResponse
)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    return trip


# ============================================================
# UPDATE TRIP
# ============================================================

@router.put(
    "/{trip_id}",
    response_model=TripResponse
)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    require_admin_or_owner(role)

    update_data = trip_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)

    return trip


# ============================================================
# DELETE TRIP
# ============================================================

@router.delete(
    "/{trip_id}"
)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    if role != "owner":
        raise HTTPException(
            status_code=403,
            detail="Only the trip owner can delete the trip"
        )

    db.delete(trip)
    db.commit()

    return {
        "message": "Trip deleted successfully"
    }


# ============================================================
# ADD MEMBER / CREATE INVITATION
# ============================================================

@router.post(
    "/{trip_id}/members"
)
def add_member(
    trip_id: int,
    member_data: TripMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    require_admin_or_owner(role)

    if member_data.role not in ["admin", "member"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either 'admin' or 'member'"
        )

    email = str(
        member_data.email
    ).lower().strip()

    user = db.query(User).filter(
        User.email == email
    ).first()

    # --------------------------------------------------------
    # USER DOES NOT EXIST -> CREATE PENDING INVITATION
    # --------------------------------------------------------

    if not user:

        existing_invitation = db.query(
            TripInvitation
        ).filter(
            TripInvitation.trip_id == trip_id,
            TripInvitation.email == email,
            TripInvitation.status == "pending"
        ).first()

        if existing_invitation:
            raise HTTPException(
                status_code=400,
                detail="An invitation is already pending for this email"
            )

        invitation = TripInvitation(
            trip_id=trip_id,
            email=email,
            role=member_data.role,
            status="pending"
        )

        db.add(invitation)
        db.commit()

        return {
            "status": "invited",
            "message": "Invitation created successfully",
            "email": email,
            "role": member_data.role
        }

    # --------------------------------------------------------
    # OWNER
    # --------------------------------------------------------

    if user.id == trip.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Trip owner is already part of the trip"
        )

    # --------------------------------------------------------
    # ALREADY MEMBER
    # --------------------------------------------------------

    existing_member = db.query(
        TripMember
    ).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user.id
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this trip"
        )

    # --------------------------------------------------------
    # ADD MEMBER
    # --------------------------------------------------------

    new_member = TripMember(
        trip_id=trip_id,
        user_id=user.id,
        role=member_data.role
    )

    db.add(new_member)

    # --------------------------------------------------------
    # ACCEPT EXISTING INVITATION
    # --------------------------------------------------------

    pending_invitation = db.query(
        TripInvitation
    ).filter(
        TripInvitation.trip_id == trip_id,
        TripInvitation.email == email,
        TripInvitation.status == "pending"
    ).first()

    if pending_invitation:
        pending_invitation.status = "accepted"

    db.commit()
    db.refresh(new_member)

    return new_member


# ============================================================
# GET MEMBERS
# ============================================================

@router.get(
    "/{trip_id}/members",
    response_model=list[TripMemberResponse]
)
def get_members(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    members = db.query(
        TripMember
    ).filter(
        TripMember.trip_id == trip_id
    ).all()

    return members


# ============================================================
# UPDATE MEMBER ROLE
# ============================================================

@router.put(
    "/{trip_id}/members/{user_id}",
    response_model=TripMemberResponse
)
def update_member_role(
    trip_id: int,
    user_id: int,
    role_data: TripMemberRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    require_admin_or_owner(role)

    if role_data.role not in ["admin", "member"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either 'admin' or 'member'"
        )

    if user_id == trip.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot change the trip owner's role"
        )

    member = db.query(
        TripMember
    ).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    member.role = role_data.role

    db.commit()
    db.refresh(member)

    return member


# ============================================================
# REMOVE MEMBER
# ============================================================

@router.delete(
    "/{trip_id}/members/{user_id}"
)
def remove_member(
    trip_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip, role = get_trip_access(
        trip_id,
        current_user,
        db
    )

    require_admin_or_owner(role)

    if user_id == trip.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove the trip owner"
        )

    member = db.query(
        TripMember
    ).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    db.delete(member)
    db.commit()

    return {
        "message": "Member removed successfully"
    }
