---
source: contract.yaml
generated_by: cdad
last_synced: 2024-01-15T00:00:00Z
do_not_edit: true
---

# Payment Retry

**ID:** `payment/retry`
**Version:** 1.0.0
**Owner:** payments-team
**State:** active

## What this capability does

Retries a failed payment attempt only after confirming the upstream payment processor has not yet received or is not currently processing the original request. This capability exists because the payment processor used in production does not honor idempotency keys until after a transaction has completed processing, meaning a naive retry during processing will result in a duplicate charge. The constraint is not in the processor documentation; it was discovered in a production incident in March 2022.

## What it needs

- `payment_id` (`string`, required): Must be the original payment_id from the failed attempt. Do not generate a new payment_id for a retry, because the processor uses this field to detect duplicate attempts when idempotency keys are active.
- `retry_reason` (`string`, required): Must be one of `network_timeout`, `processor_unavailable`, or `rate_limited`. This capability does not handle retries for declined payments; that is a separate capability (`payment/retry/declined`).

## What it promises

- `retry_status` (`string`): Returns `confirmed_safe_to_retry` only after receiving explicit confirmation from the processor status endpoint that the original request is not in flight. Never inferred from timeout behavior.
- `retry_id` (`string`): A new identifier for the retry attempt, distinct from `payment_id`. Used for audit trail only; do not pass this to the processor as the payment identifier.

## What it does NOT do

- This capability does not initiate new payment attempts. It assesses retry safety and returns a status. The calling capability is responsible for the retry execution.
- This capability does not handle declined payments. A payment declined by the processor is not a retry candidate; it is a new payment decision.
- This capability does not modify the original payment record.

## Business context

- As the payment processing system, I need to determine whether a failed payment attempt can be safely retried so that I can recover from transient failures without charging customers twice.

## Behavioral rules

Not declared in the minimum viable contract.

## Known constraints and history

Not declared in the minimum viable contract.

## Dependencies

Not declared in the minimum viable contract.

## Open questions

[]
