from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.models.user import User
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.expense import Expense
from app.models.itinerary_day import ItineraryDay
from app.models.activity import Activity


router = APIRouter(
    prefix="/api/trips",
    tags=["Analytics"],
)


def check_trip_access(
    trip_id: int,
    current_user: User,
    db: Session,
):
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    # Owner
    if trip.owner_id == current_user.id:
        return trip

    # Member
    membership = (
        db.query(TripMember)
        .filter(
            TripMember.trip_id == trip_id,
            TripMember.user_id == current_user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this trip",
        )

    return trip


@router.get("/{trip_id}/analytics")
def get_trip_analytics(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = check_trip_access(
        trip_id,
        current_user,
        db,
    )

    expenses = (
        db.query(Expense)
        .filter(Expense.trip_id == trip_id)
        .order_by(Expense.expense_date.asc())
        .all()
    )

    # -----------------------------
    # Expense calculations
    # -----------------------------

    total_spent = sum(
        float(expense.amount)
        for expense in expenses
    )

    expense_count = len(expenses)

    average_expense = (
        total_spent / expense_count
        if expense_count > 0
        else 0
    )

    # Category totals
    category_totals = defaultdict(float)

    for expense in expenses:
        category = expense.category or "Other"
        category_totals[category] += float(
            expense.amount
        )

    category_data = [
        {
            "category": category,
            "amount": round(amount, 2),
        }
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    # Daily spending
    daily_totals = defaultdict(float)

    for expense in expenses:
        date_key = expense.expense_date.isoformat()

        daily_totals[date_key] += float(
            expense.amount
        )

    daily_data = [
        {
            "date": date,
            "amount": round(amount, 2),
        }
        for date, amount in sorted(
            daily_totals.items()
        )
    ]

    # -----------------------------
    # Itinerary statistics
    # -----------------------------

    itinerary_days = (
        db.query(ItineraryDay)
        .filter(
            ItineraryDay.trip_id == trip_id
        )
        .all()
    )

    activities_count = (
        db.query(Activity)
        .join(
            ItineraryDay,
            Activity.day_id == ItineraryDay.id,
        )
        .filter(
            ItineraryDay.trip_id == trip_id
        )
        .count()
    )

    # -----------------------------
    # Trip duration
    # -----------------------------

    trip_duration = (
        trip.end_date - trip.start_date
    ).days + 1

    return {
        "trip": {
            "id": trip.id,
            "title": trip.title,
            "destination": trip.destination,
            "start_date": trip.start_date.isoformat(),
            "end_date": trip.end_date.isoformat(),
        },
        "summary": {
            "total_spent": round(total_spent, 2),
            "expense_count": expense_count,
            "average_expense": round(
                average_expense,
                2,
            ),
            "trip_duration": trip_duration,
            "itinerary_days": len(
                itinerary_days
            ),
            "activities_count": activities_count,
        },
        "category_totals": category_data,
        "daily_spending": daily_data,
    }