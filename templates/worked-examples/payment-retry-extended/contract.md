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

The capability depends on the processor status endpoint and should respond within a 500 ms p99 bound while sustaining 50 requests per second. It is internal only. If the processor status endpoint is unavailable, the required response is to return `retry_status: unsafe` and avoid retrying until the status can be confirmed.

## Known constraints and history

- On 2022-03-14, a production incident produced duplicate charges because retry logic called the processor directly without checking in-flight status. Forty-seven customers were charged twice, refunds were issued the same day, and the team took a $23K revenue hit. The lesson is that the processor does not honor idempotency keys until processing is complete, so retry logic must check in-flight status explicitly before retrying.

## Dependencies

- `payment/processor/status` `>=2.1.0`: This version exposes in-flight transaction state, which makes safe retry assessment possible. Earlier versions did not expose enough state for this capability.

## Versioning notes

This capability uses MAJOR version changes for any breaking change to retry safety, input semantics, or dependency requirements. MINOR changes add new non-breaking clarity, and PATCH changes correct the contract text without altering the declared behavior.

Version history:

- `1.0.0` on `2024-01-15`: Initial contract authored. Captures retry safety rules and the processor status dependency needed to keep the retry path safe.

## Open questions

[]
