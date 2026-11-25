"""
SQLite database management for QuikCPQ quote audit trails, inbound emails, and approval history.
"""
import os
import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DB_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "audit.db")

def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quotes (
            quote_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            customer_name TEXT,
            customer_company TEXT,
            customer_email TEXT,
            seats INTEGER,
            base_tier TEXT,
            guardrail_status TEXT,
            list_price_monthly REAL,
            discount_pct REAL,
            net_price_monthly REAL,
            gross_margin_pct REAL,
            is_escalated INTEGER,
            is_approved INTEGER,
            approval_type TEXT,
            manager_notes TEXT,
            source TEXT DEFAULT 'manual_intake',
            email_subject TEXT,
            email_message_id TEXT,
            delivery_status TEXT DEFAULT 'DRAFT',
            sent_at TEXT,
            sent_to TEXT,
            state_json TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id TEXT,
            timestamp TEXT,
            action TEXT,
            actor TEXT,
            details TEXT,
            FOREIGN KEY (quote_id) REFERENCES quotes (quote_id)
        )
    """)

    # Safe column migrations for existing audit.db files
    cursor.execute("PRAGMA table_info(quotes)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    migrations = {
        "customer_company": "TEXT",
        "source": "TEXT DEFAULT 'manual_intake'",
        "email_subject": "TEXT",
        "email_message_id": "TEXT",
        "delivery_status": "TEXT DEFAULT 'DRAFT'",
        "sent_at": "TEXT",
        "sent_to": "TEXT",
    }
    for col, col_def in migrations.items():
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE quotes ADD COLUMN {col} {col_def}")

    conn.commit()
    conn.close()

def save_quote(quote_data: Dict[str, Any]) -> str:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    quote_id = quote_data.get("quote_id") or f"CPQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = quote_data.get("created_at") or datetime.now().isoformat()
    discount_val = quote_data.get("applied_discount_pct", quote_data.get("discount_pct", 0.0))

    cursor.execute("""
        INSERT OR REPLACE INTO quotes (
            quote_id, created_at, customer_name, customer_company, customer_email, seats, base_tier,
            guardrail_status, list_price_monthly, discount_pct, net_price_monthly,
            gross_margin_pct, is_escalated, is_approved, approval_type, manager_notes,
            source, email_subject, email_message_id, delivery_status, sent_at, sent_to, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quote_id,
        created_at,
        quote_data.get("customer_name", "Unknown"),
        quote_data.get("customer_company", quote_data.get("customer_name", "Unknown")),
        quote_data.get("customer_email", ""),
        quote_data.get("seats", 0),
        quote_data.get("base_tier", ""),
        quote_data.get("guardrail_status", "PENDING"),
        quote_data.get("list_price_monthly", 0.0),
        discount_val,
        quote_data.get("net_price_monthly", 0.0),
        quote_data.get("gross_margin_pct", 0.0),
        1 if quote_data.get("guardrail_status") == "ESCALATED" else 0,
        1 if quote_data.get("guardrail_status") == "APPROVED" else 0,
        quote_data.get("approval_type", "auto"),
        quote_data.get("manager_notes", ""),
        quote_data.get("source", "manual_intake"),
        quote_data.get("email_subject", ""),
        quote_data.get("email_message_id", ""),
        quote_data.get("delivery_status", "DRAFT"),
        quote_data.get("sent_at"),
        quote_data.get("sent_to"),
        json.dumps(quote_data)
    ))

    source_label = quote_data.get("source", "manual_intake")
    cursor.execute("""
        INSERT INTO audit_logs (quote_id, timestamp, action, actor, details)
        VALUES (?, ?, ?, ?, ?)
    """, (
        quote_id,
        datetime.now().isoformat(),
        f"Quote Generated ({quote_data.get('guardrail_status', 'UNKNOWN')}) via {source_label}",
        "Autonomous Deal Desk",
        f"Monthly net: ${quote_data.get('net_price_monthly', 0):,.2f}, Margin: {quote_data.get('gross_margin_pct', 0):.1f}%"
    ))

    conn.commit()
    conn.close()
    return quote_id

def update_quote_approval(quote_id: str, approval_action: str, manager_notes: str, updated_state: Optional[Dict[str, Any]] = None) -> bool:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    status = "APPROVED"
    approval_type = approval_action

    if updated_state:
        state_str = json.dumps(updated_state)
        discount_val = updated_state.get("applied_discount_pct", updated_state.get("final_discount_pct", 0.0))
        cursor.execute("""
            UPDATE quotes SET 
                guardrail_status = ?,
                is_escalated = 0,
                is_approved = 1,
                approval_type = ?,
                manager_notes = ?,
                discount_pct = ?,
                net_price_monthly = ?,
                gross_margin_pct = ?,
                state_json = ?
            WHERE quote_id = ?
        """, (
            status,
            approval_type,
            manager_notes,
            discount_val,
            updated_state.get("net_price_monthly", 0.0),
            updated_state.get("gross_margin_pct", 0.0),
            state_str,
            quote_id
        ))
    else:
        cursor.execute("""
            UPDATE quotes SET 
                guardrail_status = ?,
                is_escalated = 0,
                is_approved = 1,
                approval_type = ?,
                manager_notes = ?
            WHERE quote_id = ?
        """, (status, approval_type, manager_notes, quote_id))

    cursor.execute("""
        INSERT INTO audit_logs (quote_id, timestamp, action, actor, details)
        VALUES (?, ?, ?, ?, ?)
    """, (
        quote_id,
        datetime.now().isoformat(),
        f"Deal Approved via {approval_action}",
        "Deal Desk Manager (HITL)",
        manager_notes
    ))

    conn.commit()
    conn.close()
    return True

def update_quote_draft(quote_id: str, email_draft: str) -> Optional[Dict[str, Any]]:
    state = get_quote_by_id(quote_id)
    if not state:
        return None
    state["client_email_draft"] = email_draft
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE quotes SET state_json = ? WHERE quote_id = ?", (json.dumps(state), quote_id))
    conn.commit()
    conn.close()
    return state

def mark_quote_sent(quote_id: str, sent_to: str, email_draft: str, delivery_mode: str) -> Optional[Dict[str, Any]]:
    state = get_quote_by_id(quote_id)
    if not state:
        return None
    now_iso = datetime.now().isoformat()
    state["client_email_draft"] = email_draft
    state["delivery_status"] = "SENT"
    state["sent_at"] = now_iso
    state["sent_to"] = sent_to
    state["delivery_mode"] = delivery_mode

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE quotes SET
            delivery_status = 'SENT',
            sent_at = ?,
            sent_to = ?,
            state_json = ?
        WHERE quote_id = ?
    """, (now_iso, sent_to, json.dumps(state), quote_id))

    cursor.execute("""
        INSERT INTO audit_logs (quote_id, timestamp, action, actor, details)
        VALUES (?, ?, ?, ?, ?)
    """, (
        quote_id,
        now_iso,
        f"Quote Email Dispatched ({delivery_mode})",
        "Sales Rep / Deal Desk",
        f"Sent official quote & PDF to {sent_to}"
    ))
    conn.commit()
    conn.close()
    return state

def is_message_processed(message_id: str) -> bool:
    if not message_id:
        return False
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM quotes WHERE email_message_id = ? LIMIT 1", (message_id,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

def get_quote_by_id(quote_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quotes WHERE quote_id = ?", (quote_id,))
    row = cursor.fetchone()
    conn.close()
    if row and row["state_json"]:
        return json.loads(row["state_json"])
    return None

def get_recent_quotes(limit: int = 25, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = """
        SELECT quote_id, created_at, customer_name, customer_company, customer_email,
               seats, base_tier, guardrail_status, list_price_monthly, discount_pct,
               net_price_monthly, gross_margin_pct, is_approved, approval_type,
               manager_notes, source, email_subject, delivery_status, sent_at, sent_to
        FROM quotes
    """
    params: List[Any] = []
    if status_filter == "ESCALATED":
        query += " WHERE guardrail_status = 'ESCALATED'"
    elif status_filter == "APPROVED":
        query += " WHERE guardrail_status = 'APPROVED' AND COALESCE(delivery_status, 'DRAFT') != 'SENT'"
    elif status_filter == "SENT":
        query += " WHERE delivery_status = 'SENT'"

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_pipeline_analytics() -> Dict[str, Any]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            COUNT(*) as total_quotes,
            COALESCE(SUM(net_price_monthly * 12), 0) as total_arr,
            COALESCE(AVG(gross_margin_pct), 0) as avg_margin,
            SUM(CASE WHEN guardrail_status = 'ESCALATED' THEN 1 ELSE 0 END) as escalated_count,
            SUM(CASE WHEN guardrail_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN delivery_status = 'SENT' THEN 1 ELSE 0 END) as sent_count
        FROM quotes
    """)
    row = cursor.fetchone()
    conn.close()
    return {
        "total_quotes": row[0] or 0,
        "total_arr": round(row[1] or 0.0, 2),
        "avg_margin": round(row[2] or 0.0, 1),
        "escalated_count": row[3] or 0,
        "approved_count": row[4] or 0,
        "sent_count": row[5] or 0,
    }
