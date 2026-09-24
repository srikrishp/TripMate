from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Time,
    Float,
    ForeignKey
)

from app.db.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    day_id = Column(
        Integer,
        ForeignKey("itinerary_days.id", ondelete="CASCADE"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    location = Column(
        String(300),
        nullable=True
    )

    start_time = Column(
        Time,
        nullable=True
    )

    end_time = Column(
        Time,
        nullable=True
    )

    latitude = Column(
        Float,
        nullable=True
    )

    longitude = Column(
        Float,
        nullable=True
    )

    position = Column(
        Integer,
        nullable=False,
        default=0
    )