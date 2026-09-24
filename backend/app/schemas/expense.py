from datetime import date

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    name: str
    amount: float
    category: str = "Other"
    expense_date: date
    paid_by: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    trip_id: int
    name: str
    amount: float
    category: str
    expense_date: date
    paid_by: str | None = None

    class Config:
        from_attributes = True
