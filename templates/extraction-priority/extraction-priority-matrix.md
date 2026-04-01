# Extraction Priority Matrix

**Team:** _______________
**Date:** _______________
**Input:** Legibility Audit output (`legibility-audit.md`)

---

## How to Use This Matrix

Score each capability on three axes. Multiply the three scores.
The highest product is the highest priority for extraction.

Multiplication — not addition — ensures that a capability scoring zero
on any axis cannot appear at the top of the list.

---

## Axis Definitions

**Business Criticality (1–3)**
1 = supporting function, limited revenue impact
2 = important but not on the critical revenue or compliance path
3 = directly on the critical revenue or compliance path

**Tribal Knowledge Density (1–3)**
Derived from the Legibility Audit total score (inverted):
  Audit score 3.5–4.0 → density 1
  Audit score 2.0–3.4 → density 2
  Audit score 0.0–1.9 → density 3

**Agent Touchpoint Frequency (1–3)**
1 = agents will rarely navigate this capability
2 = agents will navigate this capability regularly
3 = agents will navigate this capability constantly

---

## Scoring Table

| Capability | Criticality (1–3) | Density (1–3) | Frequency (1–3) | Priority Score (×) | Phase |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

---

## Phase Assignment

Sort by priority score descending.

**Phase 1 (score 9):** Extract first — all three axes at maximum
**Phase 2 (score 4–8):** Extract in near-term
**Phase 3 (score 1–3):** Extract as capacity allows

Run `cdad init [capability-id]` for each Phase 1 capability to scaffold
the contract and begin the extraction.

---

*Tool from: The Day After — github.com/enricopiovesan/the-day-after-toolkit*
