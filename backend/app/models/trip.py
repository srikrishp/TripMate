from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from app.db.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    destination = Column(String(200), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )