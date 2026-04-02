# Anti-Patterns

These anti-patterns come straight out of the payment/retry example.

## Implementation Language in Description

Bad: "retries using exponential backoff when the processor times out."

Good: "retries only after confirming the original request is safe to repeat."

## Empty Non-Goals

Bad: `non_goals: []`

Good: list what the capability explicitly does not do so the boundary is clear.

## Missing Constraint History

Bad: a contract that mentions a risky behavior but never records why the behavior exists.

Good: record what happened, what was learned, and what future maintainers must not forget.
