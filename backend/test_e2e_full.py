"""
Comprehensive End-to-End Test Suite for QuikCPQ Deal Desk Agent.
Validates all endpoints, multi-agent workflows, guardrail triggers, HITL approvals,
database persistence, and PDF generation against the live running server.
"""
import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

def make_request(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req_data = json.dumps(data).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        content_type = resp.headers.get("Content-Type", "")
        if "application/pdf" in content_type:
            return resp.read()
        return json.loads(resp.read().decode("utf-8"))

def test_frontend_server():
    print("\n--- [1] Checking Vite Frontend Server ---")
    try:
        req = urllib.request.Request(FRONTEND_URL)
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode("utf-8")
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            assert "<div id=\"root\"></div>" in html, "HTML root missing"
            print("✓ Frontend Vite server responding at http://127.0.0.1:5173 with status 200 OK.")
    except Exception as e:
        print(f"✗ Frontend check error: {e}")
        raise

def test_health():
    print("\n--- [2] Checking Backend Health Endpoint ---")
    data = make_request("/api/health")
    assert data["status"] == "healthy", "Server not healthy"
    print(f"✓ Health check passed: {data}")

def test_scenarios():
    print("\n--- [3] Checking Scenarios and Catalog Data ---")
    data = make_request("/api/scenarios")
    scenarios = data["scenarios"]
    catalog = data["catalog"]
    assert len(scenarios) == 3, f"Expected 3 scenarios, got {len(scenarios)}"
    assert len(catalog["base_tiers"]) == 3, "Expected 3 base tiers"
    assert len(catalog["add_ons"]) == 3, "Expected 3 add-ons"
    print(f"✓ Scenarios loaded successfully: {[s['title'] for s in scenarios]}")
    return scenarios

def test_scenario_1_standard(scenarios):
    print("\n--- [4] Testing Scenario 1: Standard Deal (Auto-Approve) ---")
    sc1 = scenarios[0]
    payload = {
        "rfp_text": sc1["rfp_text"],
        "use_mock_mode": True,
        "scenario_id": sc1["id"]
    }
    result = make_request("/api/run-cpq", method="POST", data=payload)
    
    assert result["guardrail_status"] == "APPROVED", f"Expected APPROVED, got {result['guardrail_status']}"
    assert result["seats"] == 60, f"Expected 60 seats, got {result['seats']}"
    assert result["base_tier"] == "pro", f"Expected pro tier, got {result['base_tier']}"
    assert result["applied_discount_pct"] == 10.0, f"Expected 10% volume discount, got {result['applied_discount_pct']}"
    assert result["net_price_monthly"] == 7830.0, f"Expected $7,830.00/mo, got {result['net_price_monthly']}"
    assert abs(result["gross_margin_pct"] - 33.33) < 0.1, f"Expected ~33.33% margin, got {result['gross_margin_pct']}"
    assert len(result["execution_trace"]) == 4, f"Expected 4 agent steps, got {len(result['execution_trace'])}"
    print("✓ Scenario 1 passed with 100% policy compliance.")
    print(f"  Monthly Net: ${result['net_price_monthly']:,.2f} | Margin: {result['gross_margin_pct']}% | Status: {result['guardrail_status']}")
    return result

def test_scenario_2_autofix(scenarios):
    print("\n--- [5] Testing Scenario 2: Invalid Bundle (Auto-Fix Dependency) ---")
    sc2 = scenarios[1]
    payload = {
        "rfp_text": sc2["rfp_text"],
        "use_mock_mode": True,
        "scenario_id": sc2["id"]
    }
    result = make_request("/api/run-cpq", method="POST", data=payload)
    
    assert result["guardrail_status"] == "APPROVED", f"Expected APPROVED, got {result['guardrail_status']}"
    assert result["base_tier"] == "pro", f"Expected auto-upgrade to pro, got {result['base_tier']}"
    assert len(result["dependency_fixes"]) > 0, "Expected at least 1 dependency fix"
    fix = result["dependency_fixes"][0]
    print(f"✓ Dependency Auto-Fix verified: {fix['action']}")
    print(f"  Base Tier promoted to: {result['base_tier_name']} | Seats: {result['seats']} | Net Monthly: ${result['net_price_monthly']:,.2f}")
    return result

def test_scenario_3_escalation_and_hitl(scenarios):
    print("\n--- [6] Testing Scenario 3: Margin Escalation & HITL Workflow ---")
    sc3 = scenarios[2]
    payload = {
        "rfp_text": sc3["rfp_text"],
        "use_mock_mode": True,
        "scenario_id": sc3["id"]
    }
    result = make_request("/api/run-cpq", method="POST", data=payload)
    
    # 1. Verify Escalation
    assert result["guardrail_status"] == "ESCALATED", f"Expected ESCALATED, got {result['guardrail_status']}"
    assert result["is_escalated"] is True, "is_escalated should be True"
    assert result["applied_discount_pct"] == 35.0, f"Expected 35% requested discount, got {result['applied_discount_pct']}"
    assert result["gross_margin_pct"] < 25.0, f"Margin should breach floor (< 25%), got {result['gross_margin_pct']}%"
    assert result["counter_offer"] is not None, "Compliant counter-offer should be generated"
    
    co = result["counter_offer"]
    print(f"✓ Escalation triggered correctly: Margin breach ({result['gross_margin_pct']}%) & Discount breach (35%)")
    print(f"✓ Autonomous Counter-Offer generated: {co['proposed_discount_pct']}% discount, ${co['proposed_net_monthly']:,.2f}/mo, {co['required_commitment_months']}-month term.")
    
    # 2. Test HITL Manager Acceptance of Counter-Offer
    print("\n--- [7] Testing Manager Acceptance of Compliant Counter-Offer ---")
    appr_payload = {
        "quote_id": result["quote_id"],
        "action": "accept_counter_offer",
        "manager_notes": "Accepted compliant multi-year counter-offer."
    }
    appr_result = make_request("/api/approve-deal", method="POST", data=appr_payload)
    assert appr_result["guardrail_status"] == "APPROVED", "Status should update to APPROVED"
    assert appr_result["applied_discount_pct"] == 15.0, f"Expected 15% discount, got {appr_result['applied_discount_pct']}"
    assert appr_result["net_price_monthly"] == 42075.0, f"Expected $42,075.00/mo, got {appr_result['net_price_monthly']}"
    assert appr_result["gross_margin_pct"] >= 25.0, f"Margin should be restored >= 25%, got {appr_result['gross_margin_pct']}%"
    assert len(appr_result["execution_trace"]) == 5, f"Expected 5 trace steps (including HITL decision), got {len(appr_result['execution_trace'])}"
    print(f"✓ Counter-offer accepted: Status={appr_result['guardrail_status']} | Restored Margin={appr_result['gross_margin_pct']}%")
    return appr_result

def test_pdf_export(quote_data):
    print("\n--- [8] Testing Corporate PDF Quote Export ---")
    pdf_bytes = make_request("/api/export-pdf", method="POST", data={"quote_state": quote_data})
    assert isinstance(pdf_bytes, bytes), "Expected raw PDF bytes"
    assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF header signature"
    assert len(pdf_bytes) > 2000, f"PDF file size too small ({len(pdf_bytes)} bytes)"
    print(f"✓ PDF successfully generated: {len(pdf_bytes):,} bytes with valid %PDF- specification header.")

def test_audit_history():
    print("\n--- [9] Testing SQLite Audit History Trail ---")
    history = make_request("/api/audit-history?limit=10")
    quotes = history.get("quotes", [])
    assert len(quotes) >= 3, f"Expected at least 3 quotes in audit database, got {len(quotes)}"
    print(f"✓ SQLite audit database verified: {len(quotes)} quote records found.")
    for q in quotes[:3]:
        print(f"  Quote #{q['quote_id']}: Customer={q['customer_name']} | Net=${q['net_price_monthly']:,.2f} | Status={q['guardrail_status']}")

if __name__ == "__main__":
    print("=" * 60)
    print("QUIKCPQ DEAL DESK AGENT — LIVE VERIFICATION SUITE")
    print("=" * 60)
    
    test_frontend_server()
    test_health()
    scenarios = test_scenarios()
    test_scenario_1_standard(scenarios)
    test_scenario_2_autofix(scenarios)
    final_quote = test_scenario_3_escalation_and_hitl(scenarios)
    test_pdf_export(final_quote)
    test_audit_history()
    
    print("\n" + "=" * 60)
    print("ALL 9 TEST SUITES COMPLETED WITH 100% SUCCESS!")
    print("=" * 60)
