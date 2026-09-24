from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.db.database import Base


class TripInvitation(Base):
    __tablename__ = "trip_invitations"

    id = Column(Integer, primary_key=True, index=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )

    email = Column(
        String(255),
        nullable=False,
        index=True
    )

    role = Column(
        String(20),
        nullable=False,
        default="member"
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )