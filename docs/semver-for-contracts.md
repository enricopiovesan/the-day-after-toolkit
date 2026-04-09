# SemVer for Contracts

Contract semver follows three rules, but the decision should be based on downstream compatibility rather than how large the text diff looks.

## Rule 1

MAJOR changes break a dependent capability or remove a declared guarantee.

## Rule 2

MINOR changes add backward-compatible fields, capabilities, or clarifications.

## Rule 3

PATCH changes correct the contract text without changing the declared behavior.

## Examples

Adding a new optional dependency with rationale is usually MINOR. Tightening a guarantee that makes a previous caller invalid is MAJOR. Fixing an ambiguous description is PATCH.

## Practical Checks

Before bumping a version, ask:

1. Would a dependent capability need to change behavior or assumptions to stay correct?
2. Did we add expressive power without invalidating existing consumers?
3. Did we only clarify wording, examples, or metadata without changing the behavioral contract?

If the first answer is yes, bump MAJOR. If only the second is yes, bump MINOR. If only the third is yes, bump PATCH.
