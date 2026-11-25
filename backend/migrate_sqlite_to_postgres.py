"""
One-shot migration utility: copies all existing quotes & audit logs from local
backend/data/audit.db into the cloud PostgreSQL database specified by DATABASE_URL.

Usage:
    DATABASE_URL="postgresql://..." backend/.venv/Scripts/python backend/migrate_sqlite_to_postgres.py
"""
import os
import sys
import sqlite3
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import load_env_file
from backend.database import DB_PATH, init_db, _connect, _is_postgres

def migrate():
    load_env_file()
    if not _is_postgres():
        print("ERROR: DATABASE_URL is not set to a PostgreSQL connection string.")
        print("Set DATABASE_URL in backend/.env or your shell environment first.")
        return

    if not os.path.exists(DB_PATH):
        print(f"No local SQLite database found at {DB_PATH}. Nothing to migrate.")
        return

    # Ensure Postgres tables exist
    init_db()

    # Read from local SQLite
    sq_conn = sqlite3.connect(DB_PATH)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()
    sq_cur.execute("SELECT * FROM quotes")
    quotes = [dict(r) for r in sq_cur.fetchall()]
    sq_cur.execute("SELECT * FROM audit_logs")
    logs = [dict(r) for r in sq_cur.fetchall()]
    sq_conn.close()

    # Write into PostgreSQL
    pg_conn, is_pg = _connect()
    assert is_pg
    pg_cur = pg_conn.cursor()

    for q in quotes:
        pg_cur.execute("""
            INSERT INTO quotes (
                quote_id, created_at, customer_name, customer_company, customer_email,
                seats, base_tier, guardrail_status, list_price_monthly, discount_pct,
                net_price_monthly, gross_margin_pct, is_escalated, is_approved,
                approval_type, manager_notes, source, email_subject, email_message_id,
                delivery_status, sent_at, sent_to, state_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (quote_id) DO UPDATE SET
                guardrail_status = EXCLUDED.guardrail_status,
                is_escalated = EXCLUDED.is_escalated,
                is_approved = EXCLUDED.is_approved,
                approval_type = EXCLUDED.approval_type,
                manager_notes = EXCLUDED.manager_notes,
                discount_pct = EXCLUDED.discount_pct,
                net_price_monthly = EXCLUDED.net_price_monthly,
                gross_margin_pct = EXCLUDED.gross_margin_pct,
                delivery_status = EXCLUDED.delivery_status,
                sent_at = EXCLUDED.sent_at,
                sent_to = EXCLUDED.sent_to,
                state_json = EXCLUDED.state_json
        """, (
            q.get("quote_id"),
            q.get("created_at"),
            q.get("customer_name"),
            q.get("customer_company"),
            q.get("customer_email"),
            q.get("seats"),
            q.get("base_tier"),
            q.get("guardrail_status"),
            q.get("list_price_monthly"),
            q.get("discount_pct"),
            q.get("net_price_monthly"),
            q.get("gross_margin_pct"),
            q.get("is_escalated"),
            q.get("is_approved"),
            q.get("approval_type"),
            q.get("manager_notes"),
            q.get("source"),
            q.get("email_subject"),
            q.get("email_message_id"),
            q.get("delivery_status"),
            q.get("sent_at"),
            q.get("sent_to"),
            q.get("state_json"),
        ))

    migrated_quote_ids = {q.get("quote_id") for q in quotes}
    migrated_logs = 0
    for log in logs:
        if log.get("quote_id") not in migrated_quote_ids:
            continue
        pg_cur.execute("""
            INSERT INTO audit_logs (quote_id, timestamp, action, actor, details)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            log.get("quote_id"),
            log.get("timestamp"),
            log.get("action"),
            log.get("actor"),
            log.get("details"),
        ))
        migrated_logs += 1

    pg_conn.commit()
    pg_conn.close()
    print(f"Successfully migrated {len(quotes)} quote(s) and {migrated_logs} audit log(s) to PostgreSQL!")

if __name__ == "__main__":
    migrate()
