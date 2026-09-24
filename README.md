# 🌍 TripMate — Smart Travel Planning & Collaboration Platform

TripMate is a full-stack travel planning platform designed to help users plan, organize, track, and manage their trips from a single application.

It combines itinerary management, interactive maps, weather information, expense tracking, analytics, notifications, collaboration, and AI-powered travel assistance into one unified travel experience..

---

## ✨ Features

### 🗺️ Interactive Trip Maps
- View trip destinations on an interactive map.
- Display activity locations associated with itinerary days.
- Automatic destination geocoding support.
- Visualize trip locations directly inside the trip dashboard.

### 📅 Itinerary Management
- Create and manage trips.
- Organize trips into individual days.
- Add activities to specific itinerary days.
- View activities associated with each day.
- Track trip dates and destinations.

### 🌤️ Weather Information
- View weather information for the selected destination.
- Weather data is integrated directly into the trip experience.

### 🤖 AI Travel Assistant
- AI-powered assistance for trip-related questions.
- Provides travel planning assistance directly from the trip page.
- Designed to help users with destination and itinerary-related queries.

### 💰 Budget & Expense Tracking
- Add and manage trip expenses.
- Track spending associated with trips.
- Organize expenses for better travel budget management.

### 📊 Analytics Dashboard
- Visualize trip and expense-related information.
- Provide users with a clearer overview of their travel data.
- Designed to help users understand their trip spending and activity patterns.

### 👥 Trip Collaboration
- Add members to trips.
- Manage people participating in a trip.
- Support collaborative trip planning.

### 🔔 Notifications
- Display notifications related to trip activity.
- Keep users informed about relevant changes and events.

### 🔐 Authentication
- User registration and login.
- Secure authentication using access tokens.
- Protected trip-related API endpoints.

### 🌍 Explore Experience
- Explore destinations and travel-related information.
- Designed to automatically associate destinations with relevant visual content.

---

## 🛠️ Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios
- Next.js App Router

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT Authentication

### APIs & Integrations

- Geocoding APIs
- Weather APIs
- Map integration
- AI integration

### Development Tools

- Git
- GitHub
- VS Code
- Postman
- Uvicorn

---

## 🏗️ Project Architecture

```text
TripMate/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── trips/
│   │   │   ├── days/
│   │   │   └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── TripMap.tsx
│   │   │   ├── TripLocationMap.tsx
│   │   │   ├── WeatherCard.tsx
│   │   │   ├── GlobeBackground.tsx
│   │   │   └── NotificationBell.tsx
│   │   │
│   │   └── lib/
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── trips.py
│   │   │   ├── itinerary.py
│   │   │   ├── expenses.py
│   │   │   ├── analytics.py
│   │   │   ├── notifications.py
│   │   │   ├── places.py
│   │   │   ├── weather.py
│   │   │   └── ai.py
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── database.py
│   └── test_auth.py
│
└── README.md
