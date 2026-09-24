from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.models.user import User
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.notification import Notification
from app.models.itinerary_day import ItineraryDay
from app.models.expense import Expense


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    trip_id: int | None = None,
):
    notification = Notification(
        user_id=user_id,
        trip_id=trip_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )

    db.add(notification)

    return notification


def ensure_reminders(
    current_user: User,
    db: Session,
):
    """
    Create useful reminders for the current user.

    Duplicate reminders are avoided using trip_id + title.
    """

    today = date.today()

    owned_trips = db.query(Trip).filter(
        Trip.owner_id == current_user.id
    ).all()

    member_trip_ids = db.query(
        TripMember.trip_id
    ).filter(
        TripMember.user_id == current_user.id
    ).all()

    member_trip_ids = [
        item[0]
        for item in member_trip_ids
    ]

    member_trips = []

    if member_trip_ids:
        member_trips = db.query(Trip).filter(
            Trip.id.in_(member_trip_ids)
        ).all()

    trips = {
        trip.id: trip
        for trip in owned_trips + member_trips
    }.values()

    for trip in trips:

        # --------------------------------------------------
        # UPCOMING TRIP
        # --------------------------------------------------

        days_until_trip = (
            trip.start_date - today
        ).days

        if days_until_trip >= 0 and days_until_trip <= 7:

            title = "Upcoming trip"

            existing = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.trip_id == trip.id,
                Notification.title == title,
            ).first()

            if not existing:

                if days_until_trip == 0:
                    message = (
                        f"Your trip to {trip.destination} "
                        f"starts today."
                    )
                elif days_until_trip == 1:
                    message = (
                        f"Your trip to {trip.destination} "
                        f"starts tomorrow."
                    )
                else:
                    message = (
                        f"Your trip to {trip.destination} "
                        f"starts in {days_until_trip} days."
                    )

                create_notification(
                    db=db,
                    user_id=current_user.id,
                    title=title,
                    message=message,
                    notification_type="trip",
                    trip_id=trip.id,
                )

        # --------------------------------------------------
        # UPCOMING ITINERARY DAY
        # --------------------------------------------------

        upcoming_days = db.query(ItineraryDay).filter(
            ItineraryDay.trip_id == trip.id,
            ItineraryDay.date >= today,
            ItineraryDay.date <= today + timedelta(days=3),
        ).order_by(
            ItineraryDay.date.asc()
        ).all()

        for itinerary_day in upcoming_days:

            title = (
                f"Day {itinerary_day.day_number} coming up"
            )

            existing = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.trip_id == trip.id,
                Notification.title == title,
            ).first()

            if not existing:

                create_notification(
                    db=db,
                    user_id=current_user.id,
                    title=title,
                    message=(
                        f"Day {itinerary_day.day_number} of "
                        f"{trip.title} is scheduled for "
                        f"{itinerary_day.date.strftime('%b %d, %Y')}."
                    ),
                    notification_type="itinerary",
                    trip_id=trip.id,
                )

        # --------------------------------------------------
        # BUDGET ALERT
        # --------------------------------------------------

        expenses = db.query(Expense).filter(
            Expense.trip_id == trip.id
        ).all()

        total_spent = sum(
            float(expense.amount)
            for expense in expenses
        )

        # Alert once when spending reaches ₹10,000.
        # This is a generic portfolio-project threshold.
        if total_spent >= 10000:

            title = "Budget alert"

            existing = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.trip_id == trip.id,
                Notification.title == title,
            ).first()

            if not existing:

                create_notification(
                    db=db,
                    user_id=current_user.id,
                    title=title,
                    message=(
                        f"You have recorded "
                        f"₹{total_spent:,.2f} in expenses "
                        f"for {trip.title}."
                    ),
                    notification_type="budget",
                    trip_id=trip.id,
                )

    db.commit()


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get("/")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_reminders(current_user, db)

    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).all()

    unread_count = sum(
        1
        for notification in notifications
        if not notification.is_read
    )

    return {
        "notifications": [
            {
                "id": notification.id,
                "trip_id": notification.trip_id,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            }
            for notification in notifications
        ],
        "unread_count": unread_count,
    }


# ============================================================
# MARK ONE AS READ
# ============================================================

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read"
    }


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update(
        {
            Notification.is_read: True
        },
        synchronize_session=False,
    )

    db.commit()

    return {
        "message": "All notifications marked as read"
    }


# ============================================================
# DELETE NOTIFICATION
# ============================================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted"
    }