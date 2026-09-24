from sqlalchemy import Column, Integer, Date, ForeignKey

from app.db.database import Base


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )

    day_number = Column(
        Integer,
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )