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

## Backend Layout

The backend is organised into layers, so HTTP routing, business logic, and
persistence stay separate:

```
credit_backend/
├── .env.example            # copy to .env to override any setting
├── requirements.txt
└── app/
    ├── main.py             # app factory, CORS, lifespan startup
    ├── core/
    │   ├── config.py       # settings resolved from the environment
    │   └── security.py     # bcrypt hashing, JWT encode/decode
    ├── db/
    │   ├── base.py         # declarative Base
    │   ├── session.py      # engine + SessionLocal
    │   ├── models.py       # CBSCustomer, ScoringConfig, CreditAssessment, User
    │   └── init_db.py      # create tables, seed bootstrap users
    ├── api/
    │   ├── deps.py         # get_db, get_current_user, require_admin
    │   ├── router.py       # aggregates every route module
    │   └── routes/         # auth, evaluate, dashboard, settings
    ├── schemas/            # Pydantic request/response models
    └── services/
        ├── scoring.py      # the rule engine (pure computation)
        ├── assessment_service.py
        └── config_service.py
```

### API Surface

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Open |
| `POST` | `/evaluate` | Open (called by the CBS) |
| `GET` | `/api/dashboard/main` | Any signed-in user |
| `GET` | `/api/dashboard/details/{assessment_id}` | Any signed-in user |
| `GET` | `/api/settings/config` | Any signed-in user |
| `PUT` | `/api/settings/config` | Admin only |

---

## Local Development Setup

### 1. Database

Ensure PostgreSQL is running locally and create a database named `credit_scoring`.
Tables and the bootstrap `admin` / `officer` accounts are created automatically on
first startup.

### 2. Backend

```bash
cd credit_backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Optional: override the connection string, JWT secret, or seeded passwords.
# Without a .env file the defaults in app/core/config.py are used.
cp .env.example .env

uvicorn app.main:app --reload
```

Interactive API docs are then served at <http://localhost:8000/docs>.

### 3. Frontend

```bash
cd credit_frontend

npm install
npm run dev
```

The dashboard expects the API at `http://localhost:8000`.
