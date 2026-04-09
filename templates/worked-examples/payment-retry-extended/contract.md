---
source: contract.yaml
generated_by: cdad
last_synced: 2024-01-15T00:00:00.000Z
do_not_edit: true
---

# Payment Retry

**ID:** `payment/retry`
**Version:** 1.0.0
**Owner:** payments-team
**State:** active

## What this capability does

Retries a failed payment attempt only after confirming the upstream payment
processor has not yet received or is not currently processing the original
request. This capability exists because the payment processor used in production
does not honor idempotency keys until after a transaction has completed
processing — meaning a naive retry during processing will result in a duplicate
charge. The constraint is not in the processor documentation; it was discovered
in a production incident in March 2022.


## What it needs

- `payment_id` (`string`, required): Must be the original payment_id from the failed attempt. Do not generate a new payment_id for a retry — the processor uses this field to detect duplicate attempts when idempotency keys are active.
- `retry_reason` (`string`, required): Must be one of: network_timeout, processor_unavailable, rate_limited. This capability does not handle retries for declined payments — that is a separate capability (payment/retry/declined).

## What it promises

- `retry_status` (`string`): Returns confirmed_safe_to_retry only after receiving explicit confirmation from the processor status endpoint that the original request is not in flight. Never inferred from timeout behavior.
- `retry_id` (`string`): A new identifier for the retry attempt, distinct from payment_id. Used for audit trail only — do not pass this to the processor as the payment identifier.

## What it does NOT do

- This capability does not initiate new payment attempts. It assesses retry safety and returns a status. The calling capability is responsible for the retry execution.
- This capability does not handle declined payments. A payment declined by the processor is not a retry candidate — it is a new payment decision.
- This capability does not modify the original payment record.

## Business context

- As the payment processing system, I need to determine whether a failed payment attempt can be safely retried so that I can recover from transient failures without charging customers twice.

## Behavioral rules

- Performance target: p99 500 ms, throughput 50 rps. Response time is bounded by the processor status endpoint latency. The 500ms threshold assumes the processor status call completes in under 400ms. If processor latency increases, this threshold must be renegotiated with the SRE team before any change is made to the retry timeout.
- Trust zone: internal.
- Rate limits: 30 requests per minute with burst allowance 5. Inherited from the payment processing standard. The processor status endpoint enforces its own rate limit at 60/min — our limit is set at half that to ensure headroom for other callers.
- Error PROCESSOR_STATUS_UNAVAILABLE: Return retry_status: unsafe. Do not attempt a retry when processor status cannot be confirmed. A false negative (blocking a safe retry) is acceptable. A false positive (allowing an unsafe retry) is not.

## Known constraints and history

- 2022-03-14: Production incident: duplicate charges on retry. The retry logic called the processor directly without checking in-flight status. The processor was still processing the original request when the retry arrived. Outcome: 47 customers charged twice. Refunds issued same day. $23K revenue impact. SLA breach with two enterprise customers. Lesson: The processor does not honor idempotency keys until processing is complete. Any retry implementation must check in-flight status explicitly before retrying. This constraint is not in the processor's public documentation. It was confirmed by the processor's support team in ticket #PRO-8821.

## Dependencies

- `payment/processor/status` (>=2.1.0): This capability depends on the processor status endpoint introduced in v2.1.0 of payment/processor/status. Earlier versions did not expose in-flight transaction state — making safe retry assessment impossible. Do not relax this version constraint without confirming the alternative detection method with the payments team.

## Open questions

[]
