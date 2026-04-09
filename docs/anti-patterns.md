# Anti-Patterns

These are the common ways a contract drifts away from the toolkit's intent.

## Implementation Language in the Description

Bad: "Retries using exponential backoff until the gateway responds."

Better: "Retries only after the upstream system has confirmed the original request is safe to repeat."

Why it matters: contracts should declare behavior and guarantees, not freeze one implementation detail that may change later.

## Empty Non-Goals

Bad: Leaving `non_goals` blank because scope feels obvious.

Better: Say what the capability does not do so the next person does not expand it by accident.

Why it matters: a blank boundary invites accidental scope growth and makes review subjective.

## History Without the Lesson

Bad: Recording an incident but not the constraint it created.

Better: Capture the lesson that changed future behavior, not just the event itself.

Why it matters: incident notes are only useful when they explain what future maintainers must preserve.

## Generated Artifacts Treated as Hand-Edited Source

Bad: Editing `contract.json` or `contract.md` directly and leaving `contract.yaml` unchanged.

Better: Treat the YAML contract as the source of truth and use validation or regeneration workflows to keep derived artifacts aligned.

Why it matters: drift between source and derived artifacts makes automation and review unreliable.

## Graph Output Used as the Only Source of Dependency Truth

Bad: Updating dependency relationships in prose docs but not in the contracts that drive `cdad graph`.

Better: Update the contract first, then regenerate or re-render the graph outputs.

Why it matters: the graph is only trustworthy when it reflects current contract data instead of commentary.
