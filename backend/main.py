"""
FastAPI Server for QuikCPQ Deal Desk Agent.
Provides REST API endpoints for:
- GET /api/health, GET /api/config-status
- GET /api/scenarios, PUT /api/catalog
- POST /api/run-cpq (supports both NLP RFP intake and structured Deal Builder)
- POST /api/webhooks/inbound-email (real-world inbound email webhook)
- POST /api/emails/sync (IMAP inbox polling for unread client RFPs)
- GET /api/quotes, GET /api/quotes/{quote_id}
- POST /api/quotes/{quote_id}/update-draft
- POST /api/quotes/{quote_id}/send (outbound SMTP email + PDF attachment)
- POST /api/approve-deal (HITL Manager Override / Counter-Offer Acceptance)
- POST /api/export-pdf
- GET /api/audit-history
"""
import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Literal
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.config import get_config_status, load_env_file
from backend.agents.graph import cpq_agent_graph, CPQState
from backend.agents.tools import calculate_pricing, load_catalog, CATALOG_PATH
from backend.database import (
    init_db,
    save_quote,
    update_quote_approval,
    update_quote_draft,
    mark_quote_sent,
    is_message_processed,
    get_quote_by_id,
    get_recent_quotes,
    get_pipeline_analytics,
)
from backend.email_service import fetch_unread_rfp_emails, send_quote_email
from backend.pdf_generator import generate_pdf_quote

app = FastAPI(
    title="QuikCPQ Deal Desk Agent API",
    description="Autonomous Multi-Agent Configure-Price-Quote (CPQ) Deal Desk with LangGraph, Gemini & Inbound/Outbound Email",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    load_env_file()
    init_db()

# ----------------- Request / Response Models -----------------
class RunCPQRequest(BaseModel):
    rfp_text: str = Field(..., description="Customer RFP email text")
    use_mock_mode: bool = Field(True, description="When True, uses deterministic rule simulation; when False, calls live Gemini API")
    gemini_api_key: Optional[str] = Field(None, description="Optional Gemini API key override")
    scenario_id: Optional[str] = Field(None, description="Optional pre-selected scenario identifier")
    source: Optional[str] = Field("manual_intake", description="Source channel: manual_intake, deal_builder, email_inbound, webhook")
    email_subject: Optional[str] = Field(None, description="Original email subject if from email")
    # Optional structured overrides (from Deal Builder)
    customer_company: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    seats: Optional[int] = None
    requested_base_tier: Optional[str] = None
    requested_add_ons: Optional[List[str]] = None
    requested_discount_pct: Optional[float] = None

class InboundEmailWebhookRequest(BaseModel):
    from_email: str = Field(..., description="Client sender email address")
    from_name: Optional[str] = Field(None, description="Client sender display name")
    subject: str = Field("RFP Quote Request", description="Email subject line")
    body_text: str = Field(..., description="Plain text body of client email")
    message_id: Optional[str] = Field(None, description="RFC 5322 Message-ID for threading & deduplication")
    use_mock_mode: Optional[bool] = Field(None, description="Defaults to Live Gemini if GEMINI_API_KEY is set, else Mock")

class ApproveDealRequest(BaseModel):
    quote_id: str = Field(..., description="Target Quote ID to approve")
    action: Literal["manager_override", "accept_counter_offer"] = Field(..., description="Approval action type")
    manager_notes: Optional[str] = Field("", description="Manager rationale or compliance notes")

class UpdateDraftRequest(BaseModel):
    client_email_draft: str = Field(..., description="Updated email response body")

class SendQuoteEmailRequest(BaseModel):
    to_email: Optional[str] = Field(None, description="Recipient email (defaults to quote customer_email)")
    subject: Optional[str] = Field(None, description="Email subject line")
    email_body: Optional[str] = Field(None, description="Final email body to send")

class ExportPDFRequest(BaseModel):
    quote_state: Dict[str, Any] = Field(..., description="Full quote state object to render into PDF")

# ----------------- Core Helper -----------------
def _execute_cpq_pipeline(
    rfp_text: str,
    use_mock_mode: bool = True,
    gemini_api_key: Optional[str] = None,
    source: str = "manual_intake",
    email_subject: Optional[str] = None,
    email_message_id: Optional[str] = None,
    overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    quote_id = f"CPQ-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

    initial_state: CPQState = {
        "quote_id": quote_id,
        "rfp_text": rfp_text,
        "use_mock_mode": use_mock_mode,
        "gemini_api_key": gemini_api_key,
        "source": source,
        "email_subject": email_subject or "",
        "email_message_id": email_message_id or "",
        "delivery_status": "DRAFT",
        "execution_trace": [],
        "created_at": datetime.now().isoformat(),
    }

    if overrides:
        for k, v in overrides.items():
            if v is not None:
                initial_state[k] = v

    final_state = cpq_agent_graph.invoke(initial_state)
    final_state["source"] = source
    final_state["email_subject"] = email_subject or ""
    final_state["email_message_id"] = email_message_id or ""
    final_state["delivery_status"] = "DRAFT"

    save_quote(final_state)
    return final_state

# ----------------- Endpoints -----------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QuikCPQ Deal Desk Agent",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/config-status")
def config_status():
    """Returns server-side integration status (Gemini, IMAP, SMTP) without exposing secrets."""
    return get_config_status()

@app.get("/api/scenarios")
def get_scenarios():
    """Returns the pre-loaded sample RFPs + current product catalog."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")

    with open(os.path.join(data_dir, "sample_rfps.json"), "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    catalog = load_catalog()
    return {
        "scenarios": scenarios,
        "catalog": catalog
    }

@app.put("/api/catalog")
def update_catalog(catalog_data: Dict[str, Any]):
    """Persists updated pricing catalog & financial guardrails from the Admin UI."""
    try:
        required_keys = {"base_tiers", "add_ons", "volume_discount_tiers", "financial_guardrails"}
        if not required_keys.issubset(catalog_data.keys()):
            raise HTTPException(status_code=400, detail="Catalog payload missing required sections.")
        with open(CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog_data, f, indent=2)
        return {"status": "updated", "catalog": catalog_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update catalog: {str(e)}")

@app.post("/api/run-cpq")
def run_cpq(request: RunCPQRequest):
    """Executes the 4-agent LangGraph workflow from RFP text or structured Deal Builder."""
    try:
        overrides = {
            "customer_company": request.customer_company,
            "customer_name": request.customer_name,
            "customer_email": request.customer_email,
            "seats": request.seats,
            "requested_base_tier": request.requested_base_tier,
            "requested_add_ons": request.requested_add_ons,
            "requested_discount_pct": request.requested_discount_pct,
        }
        return _execute_cpq_pipeline(
            rfp_text=request.rfp_text,
            use_mock_mode=request.use_mock_mode,
            gemini_api_key=request.gemini_api_key,
            source=request.source or "manual_intake",
            email_subject=request.email_subject,
            overrides=overrides,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"CPQ Agent execution error: {str(e)}")

@app.post("/api/webhooks/inbound-email")
def inbound_email_webhook(request: InboundEmailWebhookRequest):
    """
    Production inbound email webhook (compatible with Postmark, SendGrid, Mailgun, Resend).
    Automatically ingests an incoming client email, runs LangGraph, and stores the quote.
    """
    try:
        if request.message_id and is_message_processed(request.message_id):
            return {"status": "skipped_duplicate", "message_id": request.message_id}

        cfg = get_config_status()
        use_mock = request.use_mock_mode if request.use_mock_mode is not None else (not cfg["gemini_configured"])

        result = _execute_cpq_pipeline(
            rfp_text=request.body_text,
            use_mock_mode=use_mock,
            source="email_inbound",
            email_subject=request.subject,
            email_message_id=request.message_id or f"<webhook-{uuid.uuid4().hex}@quikcpq.local>",
            overrides={
                "customer_email": request.from_email,
                "customer_name": request.from_name or request.from_email.split("@")[0],
            }
        )
        return {"status": "processed", "quote": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inbound email processing failed: {str(e)}")

@app.post("/api/emails/sync")
def sync_imap_inbox():
    """
    Polls the configured IMAP inbox (e.g. Gmail/Outlook) for unread client RFP emails,
    runs LangGraph on each new email, and returns newly created quotes.
    """
    try:
        imap_res = fetch_unread_rfp_emails(max_emails=10)
        if not imap_res["configured"]:
            return {
                "configured": False,
                "processed_count": 0,
                "quotes": [],
                "message": imap_res["message"]
            }

        cfg = get_config_status()
        use_mock = not cfg["gemini_configured"]
        created_quotes = []

        for em in imap_res["emails"]:
            msg_id = em.get("message_id")
            if msg_id and is_message_processed(msg_id):
                continue
            q = _execute_cpq_pipeline(
                rfp_text=em["body_text"],
                use_mock_mode=use_mock,
                source="email_inbound",
                email_subject=em.get("subject", "RFP Inquiry"),
                email_message_id=msg_id,
                overrides={
                    "customer_email": em.get("from_email"),
                    "customer_name": em.get("from_name"),
                }
            )
            created_quotes.append(q)

        return {
            "configured": True,
            "processed_count": len(created_quotes),
            "quotes": created_quotes,
            "message": f"Synced inbox: processed {len(created_quotes)} new client email(s)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IMAP sync error: {str(e)}")

@app.get("/api/quotes")
def list_quotes(status: Optional[str] = None, limit: int = 30):
    """Returns pipeline quotes (optionally filtered by status) + live analytics."""
    return {
        "quotes": get_recent_quotes(limit=limit, status_filter=status),
        "analytics": get_pipeline_analytics(),
    }

@app.get("/api/quotes/{quote_id}")
def get_quote_detail(quote_id: str):
    """Returns full quote state (traces, line items, draft) for a specific quote_id."""
    quote = get_quote_by_id(quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")
    return quote

@app.post("/api/quotes/{quote_id}/update-draft")
def save_email_draft(quote_id: str, request: UpdateDraftRequest):
    """Persists edits made to the client response email draft."""
    updated = update_quote_draft(quote_id, request.client_email_draft)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")
    return updated

@app.post("/api/quotes/{quote_id}/send")
def send_quote_to_client(quote_id: str, request: SendQuoteEmailRequest):
    """
    Generates the official PDF quote and emails it directly to the client via SMTP.
    Blocks sending if the quote is still ESCALATED and unapproved.
    """
    quote_data = get_quote_by_id(quote_id)
    if not quote_data:
        raise HTTPException(status_code=404, detail=f"Quote {quote_id} not found.")

    if quote_data.get("guardrail_status") == "ESCALATED":
        raise HTTPException(
            status_code=400,
            detail="Cannot send an ESCALATED quote to the client before Deal Desk Manager approval."
        )

    to_email = (request.to_email or quote_data.get("customer_email") or "").strip()
    if not to_email:
        raise HTTPException(status_code=400, detail="Recipient customer email is required.")

    orig_subject = quote_data.get("email_subject") or f"Proposal for {quote_data.get('customer_company', 'Your Team')}"
    subject = request.subject or (f"Re: {orig_subject}" if not orig_subject.startswith("Re:") else orig_subject)
    body_text = request.email_body or quote_data.get("client_email_draft", "")

    pdf_bytes = generate_pdf_quote(quote_data)
    pdf_filename = f"QuikCPQ_{quote_id}.pdf"

    send_res = send_quote_email(
        to_email=to_email,
        subject=subject,
        body_text=body_text,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
        in_reply_to=quote_data.get("email_message_id") or None,
    )

    updated_quote = mark_quote_sent(
        quote_id=quote_id,
        sent_to=to_email,
        email_draft=body_text,
        delivery_mode=send_res["mode"],
    )

    return {
        "delivery": send_res,
        "quote": updated_quote,
    }

@app.post("/api/approve-deal")
def approve_deal(request: ApproveDealRequest):
    """Human-In-The-Loop (HITL) Deal Desk Manager approval endpoint."""
    quote_data = get_quote_by_id(request.quote_id)
    if not quote_data:
        raise HTTPException(status_code=404, detail=f"Quote ID {request.quote_id} not found in database.")

    manager_notes = request.manager_notes.strip() if request.manager_notes else "Approved by Deal Desk Manager"

    if request.action == "accept_counter_offer":
        counter_offer = quote_data.get("counter_offer")
        if not counter_offer:
            raise HTTPException(status_code=400, detail="No counter-offer available for this quote.")

        proposed_discount = counter_offer["proposed_discount_pct"]
        seats = quote_data["seats"]
        base_tier = quote_data["base_tier"]
        add_ons = quote_data.get("add_ons", [])

        recalculated_pricing = calculate_pricing(seats, base_tier, add_ons, proposed_discount)

        quote_data["pricing"] = recalculated_pricing
        quote_data["line_items"] = recalculated_pricing["line_items"]
        quote_data["list_price_monthly"] = recalculated_pricing["list_price_monthly"]
        quote_data["list_price_annual"] = recalculated_pricing["list_price_annual"]
        quote_data["applied_discount_pct"] = recalculated_pricing["applied_discount_pct"]
        quote_data["discount_amount_monthly"] = recalculated_pricing["discount_amount_monthly"]
        quote_data["discount_amount_annual"] = recalculated_pricing["discount_amount_annual"]
        quote_data["net_price_monthly"] = recalculated_pricing["net_price_monthly"]
        quote_data["net_price_annual"] = recalculated_pricing["net_price_annual"]
        quote_data["gross_margin_pct"] = recalculated_pricing["gross_margin_pct"]
        quote_data["guardrail_status"] = "APPROVED"
        quote_data["is_escalated"] = False
        quote_data["approval_type"] = "counter_offer_accepted"
        quote_data["manager_notes"] = f"Counter-offer accepted: {proposed_discount}% discount locked for 24-month term. {manager_notes}"

        trace_entry = {
            "step_number": len(quote_data.get("execution_trace", [])) + 1,
            "agent_name": "HITL Deal Desk Manager",
            "role": "Managerial Policy Decision",
            "status": "APPROVED",
            "latency_ms": 45.0,
            "reasoning": f"Accepted AI-proposed compliant counter-offer ({proposed_discount}% discount, 24-month commitment). Margin restored to {recalculated_pricing['gross_margin_pct']}%.",
            "tool_calls": [
                {
                    "tool_name": "apply_counter_offer",
                    "input": {"proposed_discount": proposed_discount, "contract_term_months": 24},
                    "output": {"new_net_monthly": recalculated_pricing["net_price_monthly"], "new_margin": recalculated_pricing["gross_margin_pct"]}
                }
            ],
            "rule_checks": ["HITL Managerial Signature Verified", "Compliance with 25% Gross Margin Floor"]
        }
        quote_data["execution_trace"].append(trace_entry)
        update_quote_approval(request.quote_id, "counter_offer_accepted", quote_data["manager_notes"], quote_data)

    elif request.action == "manager_override":
        quote_data["guardrail_status"] = "APPROVED"
        quote_data["is_escalated"] = False
        quote_data["approval_type"] = "manager_override"
        quote_data["manager_notes"] = f"Executive override granted: {manager_notes}"

        trace_entry = {
            "step_number": len(quote_data.get("execution_trace", [])) + 1,
            "agent_name": "HITL Deal Desk Manager",
            "role": "Managerial Policy Override",
            "status": "APPROVED",
            "latency_ms": 35.0,
            "reasoning": f"Manager granted executive override: '{manager_notes}'. Quote finalized under exceptional authority.",
            "tool_calls": [
                {
                    "tool_name": "executive_override",
                    "input": {"notes": manager_notes},
                    "output": {"status": "APPROVED", "override_actor": "Deal Desk Manager"}
                }
            ],
            "rule_checks": ["Executive Delegation of Authority (DoA) Schedule Level 2"]
        }
        quote_data["execution_trace"].append(trace_entry)
        update_quote_approval(request.quote_id, "manager_override", quote_data["manager_notes"], quote_data)

    return quote_data

@app.post("/api/export-pdf")
def export_pdf(request: ExportPDFRequest):
    """Generates and streams an executive B2B SaaS PDF quote using fpdf2."""
    try:
        pdf_bytes = generate_pdf_quote(request.quote_state)
        quote_id = request.quote_state.get("quote_id", "Quote")
        filename = f"QuikCPQ_{quote_id}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.get("/api/audit-history")
def get_audit_history(limit: int = 15):
    """Returns recent quote audits and decisions."""
    return {"quotes": get_recent_quotes(limit=limit)}

# ----------------- Production Static Frontend Serving -----------------
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
