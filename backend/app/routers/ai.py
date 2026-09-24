from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os

from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"]
)

client = OpenAI(api_key=os.getenv())


class AIRequest(BaseModel):
    message: str
    destination: str | None = None
    trip_dates: str | None = None


@router.post("/chat")
def ai_chat(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured."
        )

    context = f"""
You are TripMate AI, a helpful travel planning assistant.

Destination: {request.destination or "Not specified"}
Trip dates: {request.trip_dates or "Not specified"}

Give practical, concise travel advice.
Help with itinerary planning, activities, food, packing,
transportation, budgeting and travel organization.

User question:
{request.message}
"""

    try:
        response = client.responses.create(
            model="gpt-5.6-luna",
            input=context
        )

        return {
            "reply": response.output_text
        }

    except Exception as e:
        print("AI ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="AI assistant failed to respond."
        )