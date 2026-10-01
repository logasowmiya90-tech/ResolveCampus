from sqlalchemy import inspect, text

from app.database import Base, engine
from app.models.grievance import CaseEvent, Grievance
from app.models.user import User


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        existing_columns = {
            column["name"]
            for column in inspect(connection).get_columns("users")
        }
        if "office_name" not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN office_name VARCHAR(120)"))
        if "can_access_confidential" not in existing_columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN can_access_confidential BOOLEAN NOT NULL DEFAULT 0")
            )

        existing_columns = {
            column["name"]
            for column in inspect(connection).get_columns("case_events")
        }
        if "is_student_visible" not in existing_columns:
            connection.execute(
                text("ALTER TABLE case_events ADD COLUMN is_student_visible BOOLEAN NOT NULL DEFAULT 1")
            )
    print("Database tables initialized without removing existing data.")


if __name__ == "__main__":
    main()