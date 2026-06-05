from __future__ import annotations

from backend.database.connection import Base, engine


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")

