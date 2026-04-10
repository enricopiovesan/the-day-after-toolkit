---
title: Legibility Audit Guide
permalink: /docs/legibility-audit-guide/
---

# Legibility Audit Guide

Use this guide when you want to score how safely a capability can be navigated by someone who did not live through its history.

## The Diagnostic Question

Ask whether you could hand the capability to a capable engineer who has never spoken to the team and still expect a safe change using only what the system makes available.

## The Four Questions

1. Can someone understand why the capability works this way, not just what it does?
2. Can someone identify what was tried before, what failed, and why?
3. Can someone understand why it calls what it calls instead of the obvious alternative?
4. Can someone identify every exception path driven by customer, regulatory, or historical conditions?

## Scoring

Score each question `Yes = 1`, `Partially = 0.5`, `No = 0`. Sort the capabilities ascending by total score when you want the highest extraction priority.

## Next Step

Transfer the lowest-scoring capabilities into `extraction-priority-matrix.md` and multiply the three axes there.
