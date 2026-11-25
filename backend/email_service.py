"""
Real-world Inbound (IMAP) & Outbound (SMTP) Email Service for QuikCPQ Deal Desk.
"""
import os
import imaplib
import smtplib
import email
from email.header import decode_header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Dict, Any, Optional

from backend.config import load_env_file

def _decode_str(val: Optional[str]) -> str:
    if not val:
        return ""
    parts = decode_header(val)
    decoded = []
    for part, enc in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            decoded.append(part)
    return "".join(decoded)

def _extract_body(msg: email.message.Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition", ""))
            if ctype == "text/plain" and "attachment" not in disp:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
        # Fallback to first text/html if no text/plain
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    return ""

def fetch_unread_rfp_emails(max_emails: int = 10) -> Dict[str, Any]:
    """
    Connects to configured IMAP inbox and fetches unread client RFP emails.
    """
    load_env_file()
    host = os.environ.get("IMAP_HOST", "").strip()
    port = int(os.environ.get("IMAP_PORT", "993"))
    user = os.environ.get("IMAP_USER", "").strip()
    password = os.environ.get("IMAP_PASSWORD", "").strip()
    folder = os.environ.get("IMAP_FOLDER", "INBOX").strip()

    if not (host and user and password):
        return {
            "configured": False,
            "emails": [],
            "message": "IMAP credentials not configured in backend/.env. Set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD to sync a real inbox."
        }

    emails_found: List[Dict[str, Any]] = []
    mail = imaplib.IMAP4_SSL(host, port)
    try:
        mail.login(user, password)
        mail.select(folder)
        status, data = mail.search(None, "ALL")
        if status != "OK" or not data[0]:
            return {"configured": True, "emails": [], "message": "No emails found in inbox."}

        # Check the most recent max_emails (newest first); deduplication is handled via Message-ID in audit.db
        email_ids = list(reversed(data[0].split()))[:max_emails]
        for eid in email_ids:
            res, msg_data = mail.fetch(eid, "(RFC822)")
            if res != "OK":
                continue
            raw_bytes = msg_data[0][1]
            msg = email.message_from_bytes(raw_bytes)
            from_header = _decode_str(msg.get("From", ""))
            from_name, from_email = email.utils.parseaddr(from_header)
            subject = _decode_str(msg.get("Subject", "(No Subject)"))
            message_id = msg.get("Message-ID", "").strip()
            auto_submitted = (msg.get("Auto-Submitted", "") or "").lower()

            # Skip system bounces, mailer-daemon notifications, no-reply, and security alerts
            sender_lower = (from_email or "").lower()
            subj_lower = (subject or "").lower()
            if (
                auto_submitted in ("auto-replied", "auto-generated")
                or any(s in sender_lower for s in ("mailer-daemon", "postmaster@", "noreply@", "no-reply@", "accounts.google.com"))
                or any(k in subj_lower for k in ("delivery status notification", "mail delivery subsystem", "undeliverable", "returned mail", "security alert"))
            ):
                continue

            body_text = _extract_body(msg).strip()

            if body_text:
                emails_found.append({
                    "from_name": from_name or from_email.split("@")[0],
                    "from_email": from_email,
                    "subject": subject,
                    "message_id": message_id,
                    "body_text": body_text
                })
        return {
            "configured": True,
            "emails": emails_found,
            "message": f"Fetched {len(emails_found)} unread email(s) from {user}."
        }
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def send_quote_email(
    to_email: str,
    subject: str,
    body_text: str,
    pdf_bytes: bytes,
    pdf_filename: str,
    in_reply_to: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an approved quote reply with the official PDF attached via SMTP.
    Falls back gracefully with clear feedback if SMTP is not configured.
    """
    load_env_file()
    host = os.environ.get("SMTP_HOST", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    from_name = os.environ.get("SMTP_FROM_NAME", "QuikCPQ Deal Desk").strip()

    if not (host and user and password):
        return {
            "delivered": False,
            "mode": "simulated",
            "message": f"SMTP not configured in backend/.env — quote marked as SENT (simulated) to {to_email}."
        }

    msg = MIMEMultipart()
    msg["From"] = f"{from_name} <{user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
        msg["References"] = in_reply_to

    msg.attach(MIMEText(body_text, "plain", "utf-8"))

    pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
    pdf_part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
    msg.attach(pdf_part)

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(msg)

    return {
        "delivered": True,
        "mode": "smtp",
        "message": f"Official quote email & PDF delivered via SMTP to {to_email}."
    }
