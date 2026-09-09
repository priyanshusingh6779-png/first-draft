
from datetime import date, timedelta
from db import get_connection

def update_streak(habit_id):
    conn = get_connection()
    cur = conn.cursor()

    today = date.today()
    yesterday = today - timedelta(days=1)

    cur.execute("""
        SELECT current_streak, last_completed_date
        FROM streak_24BAI1357_P
        WHERE habit_id = :hid
    """, {"hid": habit_id})

    row = cur.fetchone()

    # FIRST TIME
    if row is None:
        cur.execute("""
            INSERT INTO streak_24BAI1357_P
            (habit_id, current_streak, last_completed_date)
            VALUES (:hid, 1, :ld)
        """, {"hid": habit_id, "ld": today})

    else:
        current_streak, last_date = row

        if last_date == yesterday:
            new_streak = current_streak + 1
        elif last_date == today:
            new_streak = current_streak
        else:
            new_streak = 1

        cur.execute("""
            UPDATE streak_24BAI1357_P
            SET current_streak = :cs,
                last_completed_date = :ld
            WHERE habit_id = :hid
        """, {
            "cs": new_streak,
            "ld": today,
            "hid": habit_id
        })

    conn.commit()
    cur.close()
    conn.close()
