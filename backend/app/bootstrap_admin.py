import argparse
from getpass import getpass

from sqlalchemy import select

from .auth import hash_pw
from .database import SessionLocal
from .models import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an administrator or reset an existing administrator password.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    args = parser.parse_args()
    email = args.email.strip().lower()
    if not email or len(email) > 255 or "@" not in email:
        parser.error("Enter a valid administrator email address.")

    password = getpass("New administrator password (at least 12 characters): ")
    confirmation = getpass("Confirm administrator password: ")
    if len(password) < 12:
        parser.error("Administrator passwords must be at least 12 characters.")
    if password != confirmation:
        parser.error("Passwords do not match.")

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None and user.role != "admin":
            parser.error("That email belongs to a non-administrator account.")
        if user is None:
            user = User(email=email, password_hash=hash_pw(password), role="admin")
            db.add(user)
        else:
            user.password_hash = hash_pw(password)
        db.commit()

    print(f"Administrator access is ready for {email}.")


if __name__ == "__main__":
    main()
