from db import get_connection
from datetime import date

def save_habit_log(user_id, habit_id, completed):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO habit_log_24BAI1357_P
        (habit_id, user_id, log_date, completed)
        VALUES (:hid, :uid, :ld, :comp)
    """, {
        "hid": habit_id,
        "uid": user_id,
        "ld": date.today(),
        "comp": completed
    })

    conn.commit()
    cur.close()
    conn.close()
