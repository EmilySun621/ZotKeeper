#!/usr/bin/env python3
"""
One-off: set recipe image to empty for any row that used the random placeholder
picsum.photos (landscape/scenery), so the app shows the neutral "No image" placeholder instead.

Usage (from project root):
  python scripts/clear_picsum_images.py
"""
import sqlite3
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent.parent
    db_path = root / "data" / "processed" / "recipes.db"
    if not db_path.exists():
        print(f"DB not found: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.execute(
        "UPDATE recipes SET image = '' WHERE image LIKE '%picsum.photos%'"
    )
    updated = cur.rowcount
    conn.commit()
    conn.close()
    print(f"Cleared picsum placeholder images: {updated} row(s) updated.")


if __name__ == "__main__":
    main()
