# Legibility Audit

**Team:** _______________
**Date:** _______________
**Facilitator:** _______________
**Session length:** 60 minutes recommended

---

## The Diagnostic Question

For each capability you assess, start with this question:

> Could you hand this capability to a capable engineer who has never spoken
> to anyone on your team, and have them make a safe change to it using only
> what the system makes available?

If the answer is yes without hesitation: score this capability 4/4. Move on.
If the answer is anything other than yes without hesitation: proceed to the
four follow-up questions.

---

## Scoring Table

| Capability | Business Rules (1) | Constraint History (2) | Dependency Rationale (3) | Exception Logic (4) | Total (0–4) |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

**Scoring key:** Yes = 1 | Partially = 0.5 | No = 0

---

## The Four Follow-Up Questions

**Question 1 — Business Rules**
Can someone understand WHY this capability works this way — not just what
it does — using only what the system makes available?

**Question 2 — Constraint History**
Can someone identify what was tried before, what failed, and why — without
asking anyone who was there?

**Question 3 — Dependency Rationale**
Can someone understand why this capability calls what it calls, in the way
it does, rather than the more obvious alternative?

**Question 4 — Exception Logic**
Can someone identify every code path that exists because of a specific
customer, regulatory, or historical condition — without tribal knowledge?

---

## Output

When the table is complete, sort capabilities by total score ascending.
The lowest scores are your highest-priority extraction candidates.
Transfer this ranked list to the Extraction Priority Matrix
(`extraction-priority-matrix.md`) as the tribal knowledge density input.

---

*Tool from: The Day After — github.com/enricopiovesan/the-day-after-toolkit*
*Implements: Appendix B of The Day After by Enrico Piovesan*
