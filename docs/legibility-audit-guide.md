# Legibility Audit Guide

Use the legibility audit when you want to find the highest-risk capabilities for extraction.

## Diagnostic Question

Ask whether you could hand a capability to a capable engineer who has never spoken to anyone on your team and have them make a safe change using only what the system makes available.

## Follow-Up Questions

1. Can someone understand why this capability works this way, not just what it does?
2. Can someone identify what was tried before, what failed, and why?
3. Can someone understand why this capability calls what it calls in the way it does?
4. Can someone identify every code path that exists because of a specific customer, regulatory, or historical condition?

## Scoring

Score each question `Yes = 1`, `Partially = 0.5`, `No = 0`. Sort capabilities by total score ascending. The lowest scores are the highest-priority extraction candidates.

## Output

Transfer the ranked list into the extraction priority matrix so you can capture business criticality and touchpoint frequency next.
