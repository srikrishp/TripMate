from datetime import date

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey

from app.db.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, default="Other")
    expense_date = Column(Date, nullable=False, default=date.today)
    paid_by = Column(String(200), nullable=True)
