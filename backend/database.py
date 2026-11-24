"""
SQLite database management for QuikCPQ quote audit trails and approval history.
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
    conn.commit()
    conn.close()

def save_quote(quote_data: Dict[str, Any]) -> str:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    quote_id = quote_data.get("quote_id") or f"CPQ-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = quote_data.get("created_at") or datetime.now().isoformat()
    
    cursor.execute("""
        INSERT OR REPLACE INTO quotes (
            quote_id, created_at, customer_name, customer_email, seats, base_tier,
            guardrail_status, list_price_monthly, discount_pct, net_price_monthly,
            gross_margin_pct, is_escalated, is_approved, approval_type, manager_notes, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quote_id,
        created_at,
        quote_data.get("customer_name", "Unknown"),
        quote_data.get("customer_email", ""),
        quote_data.get("seats", 0),
        quote_data.get("base_tier", ""),
        quote_data.get("guardrail_status", "PENDING"),
        quote_data.get("list_price_monthly", 0.0),
        quote_data.get("discount_pct", 0.0),
        quote_data.get("net_price_monthly", 0.0),
        quote_data.get("gross_margin_pct", 0.0),
        1 if quote_data.get("guardrail_status") == "ESCALATED" else 0,
        1 if quote_data.get("guardrail_status") == "APPROVED" else 0,
        quote_data.get("approval_type", "auto"),
        quote_data.get("manager_notes", ""),
        json.dumps(quote_data)
    ))
    
    cursor.execute("""
        INSERT INTO audit_logs (quote_id, timestamp, action, actor, details)
        VALUES (?, ?, ?, ?, ?)
    """, (
        quote_id,
        datetime.now().isoformat(),
        f"Quote Generated ({quote_data.get('guardrail_status', 'UNKNOWN')})",
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
    approval_type = approval_action # e.g. "manager_override" or "counter_offer_accepted"
    
    if updated_state:
        state_str = json.dumps(updated_state)
        cursor.execute("""
            UPDATE quotes SET 
                guardrail_status = ?,
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
            updated_state.get("final_discount_pct", 0.0),
            updated_state.get("net_price_monthly", 0.0),
            updated_state.get("gross_margin_pct", 0.0),
            state_str,
            quote_id
        ))
    else:
        cursor.execute("""
            UPDATE quotes SET 
                guardrail_status = ?,
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

def get_recent_quotes(limit: int = 10) -> List[Dict[str, Any]]:
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT quote_id, created_at, customer_name, seats, base_tier,
               guardrail_status, list_price_monthly, discount_pct, net_price_monthly,
               gross_margin_pct, is_approved, approval_type, manager_notes
        FROM quotes ORDER BY created_at DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
