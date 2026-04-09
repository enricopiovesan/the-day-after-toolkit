# Healthy Fixture Repository

This fixture models a repository that already exposes the static signals the
`cdad check` command is supposed to reward. It is intentionally small, but it
still includes the same kinds of artifacts a real brownfield codebase would
offer to a practitioner or an AI agent trying to navigate the system safely.

The README is deliberately substantive so the static scan can distinguish it
from a placeholder file. The repo also includes a `docs/` directory, a
lightweight agent context file, an API specification, an ADR, a contract under
`cdad/`, and at least one test file. Those signals together should produce the
full positive score without any missing-docs or missing-tests penalties.

Nothing in this fixture is meant to exercise private implementation details.
Its purpose is to make the repository-shape integration test deterministic and
easy to understand when it fails.
