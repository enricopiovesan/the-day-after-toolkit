# Anti-Patterns

These are the three most common ways a contract drifts away from the book's intent.

## Implementation Language in the Description

Bad: "Retries using exponential backoff until the gateway responds."

Better: "Retries only after the upstream system has confirmed the original request is safe to repeat."

## Empty Non-Goals

Bad: Leaving `non_goals` blank because scope feels obvious.

Better: Say what the capability does not do so the next person does not expand it by accident.

## History Without the Lesson

Bad: Recording an incident but not the constraint it created.

Better: Capture the lesson that changed future behavior, not just the event itself.
