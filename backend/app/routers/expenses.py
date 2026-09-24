from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.models.expense import Expense
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.user import User

from app.schemas.expense import ExpenseCreate, ExpenseResponse


router = APIRouter(
    prefix="/api/trips",
    tags=["Expenses"]
)


def check_trip_access(
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
        return trip

    member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this trip"
        )

    return trip


# ============================================================
# GET EXPENSES
# ============================================================

@router.get(
    "/{trip_id}/expenses",
    response_model=list[ExpenseResponse]
)
def get_expenses(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_trip_access(
        trip_id,
        current_user,
        db
    )

    return db.query(
        Expense
    ).filter(
        Expense.trip_id == trip_id
    ).order_by(
        Expense.expense_date.desc()
    ).all()


# ============================================================
# ADD EXPENSE
# ============================================================

@router.post(
    "/{trip_id}/expenses",
    response_model=ExpenseResponse
)
def create_expense(
    trip_id: int,
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_trip_access(
        trip_id,
        current_user,
        db
    )

    if expense_data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than 0"
        )

    expense = Expense(
        trip_id=trip_id,
        name=expense_data.name,
        amount=expense_data.amount,
        category=expense_data.category,
        expense_date=expense_data.expense_date,
        paid_by=expense_data.paid_by
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


# ============================================================
# DELETE EXPENSE
# ============================================================

@router.delete(
    "/{trip_id}/expenses/{expense_id}"
)
def delete_expense(
    trip_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_trip_access(
        trip_id,
        current_user,
        db
    )

    expense = db.query(
        Expense
    ).filter(
        Expense.id == expense_id,
        Expense.trip_id == trip_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully"
    }
