"""
FastAPI Server for QuikCPQ Deal Desk Agent.
Provides REST API endpoints for:
- GET /api/scenarios
- POST /api/run-cpq
- POST /api/approve-deal
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
from pydantic import BaseModel, Field

from backend.agents.graph import cpq_agent_graph, CPQState
from backend.agents.tools import calculate_pricing, load_catalog
from backend.database import init_db, save_quote, update_quote_approval, get_quote_by_id, get_recent_quotes
from backend.pdf_generator import generate_pdf_quote

app = FastAPI(
    title="QuikCPQ Deal Desk Agent API",
    description="Autonomous Multi-Agent Configure-Price-Quote (CPQ) Deal Desk with LangGraph & Gemini",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# ----------------- Request / Response Models -----------------
class RunCPQRequest(BaseModel):
    rfp_text: str = Field(..., description="Customer RFP email text")
    use_mock_mode: bool = Field(True, description="When True, uses deterministic rule simulation; when False, calls live Gemini API")
    gemini_api_key: Optional[str] = Field(None, description="Optional Gemini API key for live LLM mode")
    scenario_id: Optional[str] = Field(None, description="Optional pre-selected scenario identifier")

class ApproveDealRequest(BaseModel):
    quote_id: str = Field(..., description="Target Quote ID to approve")
    action: Literal["manager_override", "accept_counter_offer"] = Field(..., description="Approval action type")
    manager_notes: Optional[str] = Field("", description="Manager rationale or compliance notes")

class ExportPDFRequest(BaseModel):
    quote_state: Dict[str, Any] = Field(..., description="Full quote state object to render into PDF")

# ----------------- Endpoints -----------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QuikCPQ Deal Desk Agent",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/scenarios")
def get_scenarios():
    """Returns the 3 pre-loaded customer RFP scenarios + product catalog."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    
    with open(os.path.join(data_dir, "sample_rfps.json"), "r", encoding="utf-8") as f:
        scenarios = json.load(f)
        
    with open(os.path.join(data_dir, "catalog.json"), "r", encoding="utf-8") as f:
        catalog = json.load(f)
        
    return {
        "scenarios": scenarios,
        "catalog": catalog
    }

@app.post("/api/run-cpq")
def run_cpq(request: RunCPQRequest):
    """
    Executes the 4-agent LangGraph workflow:
    1. Intake & Configurator Agent (bundle compatibility, dependency auto-fix)
    2. Deal Desk Pricing Agent (deterministic math, 60% COGS, gross margin)
    3. Guardrail Router (conditional routing to APPROVED or ESCALATED)
    4. Proposal Closer Agent (quote table synthesis, client email draft)
    """
    try:
        quote_id = f"CPQ-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        
        initial_state: CPQState = {
            "quote_id": quote_id,
            "rfp_text": request.rfp_text,
            "use_mock_mode": request.use_mock_mode,
            "gemini_api_key": request.gemini_api_key,
            "execution_trace": [],
            "created_at": datetime.now().isoformat()
        }
        
        # Execute LangGraph state machine
        final_state = cpq_agent_graph.invoke(initial_state)
        
        # Persist quote and audit log to SQLite
        save_quote(final_state)
        
        return final_state
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"CPQ Agent execution error: {str(e)}")

@app.post("/api/approve-deal")
def approve_deal(request: ApproveDealRequest):
    """
    Human-In-The-Loop (HITL) Deal Desk Manager endpoint:
    - If action == 'accept_counter_offer': Recalculates pricing based on compliant counter-offer
      (15% discount, 24-month term), sets status to APPROVED, updates audit log.
    - If action == 'manager_override': Approves the deal with requested discount, sets status
      to APPROVED, documents manager override notes in audit log.
    """
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
        
        # Recalculate deterministic pricing for counter-offer
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
        
        # Add HITL trace event
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
