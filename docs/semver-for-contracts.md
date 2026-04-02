# SemVer for Contracts

Contracts follow semantic versioning because dependents need to know when a change is safe, additive, or breaking.

## Rule 1

Increment `MAJOR` when a change breaks a dependent capability or changes declared behavior in a way that a consumer must react to.

Example: removing a required input or changing a promised output value is a major change.

## Rule 2

Increment `MINOR` when you add a backward-compatible field, clarify intent, or broaden a contract without breaking existing consumers.

Example: adding a new optional input or a new dependency rationale is a minor change.

## Rule 3

Increment `PATCH` when you correct the contract text without changing declared behavior.

Example: fixing a typo in a constraint or clarifying wording in a non-goal is a patch change.
