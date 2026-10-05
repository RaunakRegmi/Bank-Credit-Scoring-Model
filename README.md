# Fintara Enterprise Credit Scoring Engine

A robust, full-stack credit scoring system designed to evaluate Core Banking System (CBS) data against dynamic, configurable rule matrices. The engine evaluates 11 distinct financial, professional, and behavioral metrics, capping at a strict 1000-point capacity, and routes applications into dynamic threshold bands (Approved, Declined, or Third-Party Verification).

## Key Features

- **Dynamic Rule Engine:** Real-time calculation of credit scores with a strict 1000-point global limit. Rules, maximums, and weights can be adjusted live via the dashboard.
- **Granular Metric Extraction:** The backend generates automated, compliance-ready reasoning sentences for every single data point evaluated to explain exactly why points were awarded.
- **Enterprise Dashboard:** A Next.js frontend featuring Recharts-powered Risk Geometry (Radar Charts), live threshold validation, and an institutional dark-theme UI.
- **Decoupled Architecture:** FastAPI backend handling heavy JSONB configuration payloads from PostgreSQL, fully decoupled from the React frontend.

## Tech Stack

**Backend (Microservice)**

- Python 3.13+
- FastAPI (High-performance API framework)
- SQLAlchemy (ORM) + psycopg2
- PostgreSQL (Core database)

**Frontend (Dashboard)**

- Next.js (App Router, React)
- Tailwind CSS (Styling)
- Recharts (Data Visualization)
- Lucide React (Iconography)

---

## Local Development Setup

### 1. Database Configuration

Ensure PostgreSQL is running locally. Create a database named `credit_engine_db`.
Update your `credit_backend/database.py` with your active pgAdmin credentials:

```python
DATABASE_URL = "postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/credit_engine_db"

cd credit_backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2

# Run the server
uvicorn main:app --reload


cd fintara-frontend

# Install dependencies
npm install
npm install recharts lucide-react

# Run the development server
npm run dev
```
