# SemVer for Contracts

Contract semver follows three rules.

## Rule 1

MAJOR changes break a dependent capability or remove a declared guarantee.

## Rule 2

MINOR changes add backward-compatible fields, capabilities, or clarifications.

## Rule 3

PATCH changes correct the contract text without changing the declared behavior.

## Example

Adding a new optional dependency with rationale is usually MINOR. Tightening a guarantee that makes a previous caller invalid is MAJOR. Fixing an ambiguous description is PATCH.
