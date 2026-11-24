"""
Deterministic Python tools for QuikCPQ Deal Desk Agent.
Never uses raw LLM arithmetic for financial or policy calculations.
"""
import json
import os
from typing import Dict, List, Any, Tuple

CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "catalog.json")

def load_catalog() -> Dict[str, Any]:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_and_configure_bundle(base_tier_id: str, add_on_ids: List[str]) -> Dict[str, Any]:
    """
    Validates product compatibility rules against the catalog.
    If an add-on requires a higher base tier (e.g. Enterprise SSO requires Pro or Enterprise),
    automatically upgrades the base tier and logs the correction.
    """
    catalog = load_catalog()
    tier_map = {t["id"]: t for t in catalog["base_tiers"]}
    addon_map = {a["id"]: a for a in catalog["add_ons"]}
    
    # Normalize inputs
    current_tier = base_tier_id.lower().strip()
    if current_tier not in tier_map:
        current_tier = "starter"
        
    fixes = []
    validated_addons = []
    
    for aid in add_on_ids:
        norm_aid = aid.lower().strip().replace("-", "_").replace(" ", "_")
        if norm_aid in addon_map:
            addon = addon_map[norm_aid]
            required_tiers = addon.get("required_base_tier", [])
            
            # Check dependency violation
            if required_tiers and current_tier not in required_tiers:
                suggested_tier = required_tiers[0] # e.g. "pro"
                fixes.append({
                    "addon_id": norm_aid,
                    "addon_name": addon["name"],
                    "violation": f"Add-on '{addon['name']}' requires base tier to be one of {required_tiers}, but requested was '{current_tier}'.",
                    "action": f"Auto-upgraded base tier from '{current_tier}' to '{suggested_tier}' to maintain product bundle compatibility.",
                    "previous_tier": current_tier,
                    "corrected_tier": suggested_tier
                })
                current_tier = suggested_tier
            validated_addons.append(addon["id"])
            
    return {
        "is_valid": len(fixes) == 0,
        "base_tier": current_tier,
        "base_tier_name": tier_map[current_tier]["name"],
        "add_ons": validated_addons,
        "fixes": fixes,
        "rule_checked": "Product Dependency Matrix (Catalog v2.4)"
    }

def calculate_volume_discount(seats: int) -> Dict[str, Any]:
    """
    Computes standard volume discount percentage based on seat brackets.
    """
    catalog = load_catalog()
    tiers = catalog.get("volume_discount_tiers", [])
    
    selected_tier = None
    for t in tiers:
        if t["min_seats"] <= seats <= t["max_seats"]:
            selected_tier = t
            break
            
    if not selected_tier:
        selected_tier = {"discount_pct": 0.0, "label": "No volume discount"}
        
    return {
        "seats": seats,
        "discount_pct": float(selected_tier["discount_pct"]),
        "tier_label": selected_tier["label"]
    }

def calculate_pricing(seats: int, base_tier_id: str, add_on_ids: List[str], requested_discount_pct: float = 0.0) -> Dict[str, Any]:
    """
    Deterministically computes list price, line items, discounts, net prices, COGS, and gross margin.
    """
    catalog = load_catalog()
    tier_map = {t["id"]: t for t in catalog["base_tiers"]}
    addon_map = {a["id"]: a for a in catalog["add_ons"]}
    
    base_tier = tier_map.get(base_tier_id.lower(), tier_map["starter"])
    
    line_items = []
    # 1. Base tier line item
    base_monthly = base_tier["price"] * seats
    line_items.append({
        "item_id": base_tier["id"],
        "name": f"{base_tier['name']} Tier Subscription",
        "category": "base_tier",
        "unit": "per_seat_per_month",
        "quantity": seats,
        "unit_price": base_tier["price"],
        "subtotal_monthly": base_monthly,
        "subtotal_annual": base_monthly * 12
    })
    
    # 2. Add-on line items
    addons_monthly = 0.0
    for aid in add_on_ids:
        if aid in addon_map:
            addon = addon_map[aid]
            if addon["type"] == "seat_based":
                addon_cost = addon["price"] * seats
                qty = seats
            else:
                addon_cost = addon["price"]
                qty = 1
            addons_monthly += addon_cost
            line_items.append({
                "item_id": addon["id"],
                "name": addon["name"],
                "category": "add_on",
                "unit": addon["unit"],
                "quantity": qty,
                "unit_price": addon["price"],
                "subtotal_monthly": addon_cost,
                "subtotal_annual": addon_cost * 12
            })
            
    total_list_monthly = base_monthly + addons_monthly
    total_list_annual = total_list_monthly * 12
    
    # Volume discount
    vol_rule = calculate_volume_discount(seats)
    standard_vol_pct = vol_rule["discount_pct"]
    
    # Determine discount to apply:
    # If customer explicitly requested a discount, use requested_discount_pct; otherwise apply standard volume discount
    if requested_discount_pct > 0.0:
        applied_discount_pct = requested_discount_pct
        discount_source = "Customer Requested Negotiation"
    else:
        applied_discount_pct = standard_vol_pct
        discount_source = f"Standard Volume ({vol_rule['tier_label']})"
        
    discount_amount_monthly = total_list_monthly * (applied_discount_pct / 100.0)
    net_monthly = total_list_monthly - discount_amount_monthly
    net_annual = net_monthly * 12
    
    # Financial Margin Calculations:
    # COGS is 60% of list price
    cogs_ratio = catalog["financial_guardrails"]["cogs_ratio"]
    cogs_monthly = total_list_monthly * cogs_ratio
    cogs_annual = cogs_monthly * 12
    
    gross_profit_monthly = net_monthly - cogs_monthly
    gross_profit_annual = gross_profit_monthly * 12
    
    # Gross Margin % = (Net Revenue - COGS) / Net Revenue
    if net_monthly > 0:
        gross_margin_pct = (gross_profit_monthly / net_monthly) * 100.0
    else:
        gross_margin_pct = 0.0
        
    return {
        "seats": seats,
        "base_tier_id": base_tier["id"],
        "base_tier_name": base_tier["name"],
        "line_items": line_items,
        "list_price_monthly": round(total_list_monthly, 2),
        "list_price_annual": round(total_list_annual, 2),
        "standard_volume_discount_pct": standard_vol_pct,
        "applied_discount_pct": round(applied_discount_pct, 2),
        "discount_source": discount_source,
        "discount_amount_monthly": round(discount_amount_monthly, 2),
        "discount_amount_annual": round(discount_amount_monthly * 12, 2),
        "net_price_monthly": round(net_monthly, 2),
        "net_price_annual": round(net_annual, 2),
        "cogs_monthly": round(cogs_monthly, 2),
        "cogs_annual": round(cogs_annual, 2),
        "gross_profit_monthly": round(gross_profit_monthly, 2),
        "gross_profit_annual": round(gross_profit_annual, 2),
        "gross_margin_pct": round(gross_margin_pct, 2)
    }

def evaluate_guardrails(pricing_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates discount and margin against company financial guardrails.
    - Max Auto-Approved Discount: 15%
    - Minimum Gross Margin Floor: 25%
    """
    catalog = load_catalog()
    guardrails = catalog["financial_guardrails"]
    max_discount = guardrails["max_auto_approved_discount_pct"]
    min_margin = guardrails["min_gross_margin_pct"]
    
    applied_discount = pricing_summary["applied_discount_pct"]
    gross_margin = pricing_summary["gross_margin_pct"]
    
    violations = []
    
    if applied_discount > max_discount:
        violations.append({
            "rule": "MAX_DISCOUNT_CAP_EXCEEDED",
            "threshold": f"{max_discount}%",
            "actual": f"{applied_discount}%",
            "message": f"Requested discount of {applied_discount}% exceeds maximum autonomous approval threshold of {max_discount}%."
        })
        
    if gross_margin < min_margin:
        violations.append({
            "rule": "MIN_GROSS_MARGIN_FLOOR_BREACH",
            "threshold": f"{min_margin}%",
            "actual": f"{gross_margin}%",
            "message": f"Projected gross margin of {gross_margin}% is below company policy floor of {min_margin}%."
        })
        
    is_escalated = len(violations) > 0
    status = "ESCALATED" if is_escalated else "APPROVED"
    
    counter_offer = None
    if is_escalated:
        # Generate a compliant counter-offer:
        # Cap discount at 15%, which yields compliant ~29.4% margin,
        # and require a 24-month contract term commitment.
        compliant_discount = max_discount
        list_monthly = pricing_summary["list_price_monthly"]
        cogs_monthly = pricing_summary["cogs_monthly"]
        counter_net_monthly = list_monthly * (1.0 - compliant_discount / 100.0)
        counter_gross_profit = counter_net_monthly - cogs_monthly
        counter_margin = (counter_gross_profit / counter_net_monthly) * 100.0 if counter_net_monthly > 0 else 0.0
        
        counter_offer = {
            "proposed_discount_pct": compliant_discount,
            "proposed_net_monthly": round(counter_net_monthly, 2),
            "proposed_net_annual": round(counter_net_monthly * 12, 2),
            "proposed_gross_margin_pct": round(counter_margin, 2),
            "required_commitment_months": 24,
            "annual_prepayment_required": True,
            "executive_summary": (
                f"Autonomous Guardrail Counter-Offer: Maximum compliant discount of {compliant_discount:.0f}% "
                f"($ {counter_net_monthly:,.2f}/mo, preserving a healthy {counter_margin:.1f}% gross margin) "
                f"in exchange for a 24-month multi-year commitment with annual advance invoicing."
            ),
            "benefits": [
                "Preserves executive margin integrity above 25% floor",
                "Locks in 2-year price protection against future rate increases",
                "Includes priority onboarding and dedicated implementation manager"
            ]
        }
        
    return {
        "status": status,
        "is_escalated": is_escalated,
        "violations": violations,
        "rules_evaluated": [
            f"Discount <= {max_discount}%",
            f"Gross Margin >= {min_margin}%"
        ],
        "counter_offer": counter_offer
    }
