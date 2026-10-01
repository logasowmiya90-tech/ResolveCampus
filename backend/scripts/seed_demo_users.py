import os
import sys

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.user import User, UserRole
from app.services.grievances import OFFICE_BY_CATEGORY
from app.services.security import hash_password


DEMO_USERS = (
    ("Demo Student", "student@resolvecampus.demo", UserRole.STUDENT, "RESOLVECAMPUS_DEMO_STUDENT_PASSWORD"),
    ("Demo Officer", "officer@resolvecampus.demo", UserRole.OFFICER, "RESOLVECAMPUS_DEMO_OFFICER_PASSWORD"),
    ("Demo Admin", "admin@resolvecampus.demo", UserRole.ADMIN, "RESOLVECAMPUS_DEMO_ADMIN_PASSWORD"),
)
DEMO_OFFICER_OFFICE_VARIABLE = "RESOLVECAMPUS_DEMO_OFFICER_OFFICE"
DEMO_OFFICER_CONFIDENTIAL_VARIABLE = "RESOLVECAMPUS_DEMO_OFFICER_CONFIDENTIAL_ACCESS"
DEMO_ADMIN_CONFIDENTIAL_VARIABLE = "RESOLVECAMPUS_DEMO_ADMIN_CONFIDENTIAL_ACCESS"


def main() -> None:
    if os.getenv("RESOLVECAMPUS_ENV") != "development":
        sys.exit("Demo seeding is allowed only when RESOLVECAMPUS_ENV=development.")

    missing = [variable for *_, variable in DEMO_USERS if not os.getenv(variable)]
    if missing:
        sys.exit(f"Set the demo password environment variables before seeding: {', '.join(missing)}")

    demo_office = os.getenv(DEMO_OFFICER_OFFICE_VARIABLE, "").strip() or None
    valid_offices = set(OFFICE_BY_CATEGORY.values())
    if demo_office is not None and demo_office not in valid_offices:
        sys.exit(
            f"{DEMO_OFFICER_OFFICE_VARIABLE} must match a configured routing office: "
            f"{', '.join(sorted(valid_offices))}"
        )

    confidential_access_value = os.getenv(DEMO_OFFICER_CONFIDENTIAL_VARIABLE, "false").strip().lower()
    if confidential_access_value not in {"true", "false"}:
        sys.exit(f"{DEMO_OFFICER_CONFIDENTIAL_VARIABLE} must be true or false.")
    demo_officer_can_access_confidential = confidential_access_value == "true"

    admin_confidential_access_value = os.getenv(DEMO_ADMIN_CONFIDENTIAL_VARIABLE)
    if admin_confidential_access_value is not None:
        admin_confidential_access_value = admin_confidential_access_value.strip().lower()
        if admin_confidential_access_value not in {"true", "false"}:
            sys.exit(f"{DEMO_ADMIN_CONFIDENTIAL_VARIABLE} must be true or false.")

    Base.metadata.create_all(bind=engine)
    created_count = 0
    with SessionLocal() as db:
        for name, email, role, password_variable in DEMO_USERS:
            existing_user = db.scalar(select(User).where(User.email == email))
            if existing_user is not None:
                if role == UserRole.OFFICER and existing_user.office_name is None and demo_office:
                    existing_user.office_name = demo_office
                if role == UserRole.OFFICER and demo_officer_can_access_confidential:
                    existing_user.can_access_confidential = True
                if role == UserRole.ADMIN and admin_confidential_access_value is not None:
                    existing_user.can_access_confidential = admin_confidential_access_value == "true"
                continue

            password = os.environ[password_variable]
            if len(password) < 12:
                sys.exit(f"{password_variable} must contain at least 12 characters.")

            db.add(
                User(
                    name=name,
                    email=email,
                    password_hash=hash_password(password),
                    role=role,
                    office_name=demo_office if role == UserRole.OFFICER else None,
                    can_access_confidential=(
                        (role == UserRole.OFFICER and demo_officer_can_access_confidential)
                        or (role == UserRole.ADMIN and admin_confidential_access_value == "true")
                    ),
                )
            )
            created_count += 1

        db.commit()

    print(f"Demo user seeding complete. Created {created_count} user(s); existing user records were preserved.")


if __name__ == "__main__":
    main()