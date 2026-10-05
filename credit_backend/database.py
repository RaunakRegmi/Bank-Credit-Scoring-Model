from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# UPDATE WITH YOUR PASSWORD
DATABASE_URL = "postgresql+psycopg2://postgres:samael@localhost:5433/credit_scoring"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to inject database sessions into our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()