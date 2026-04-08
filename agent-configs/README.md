# Agent Configurations

These files show how a contract-driven repository should instruct coding agents to navigate and validate their work.

## Examples

- `CLAUDE.md` shows the repo-level agent context format
- `contract-aware-coding-agent.md` shows how to code against contracts rather than implementation guesses

## How to use them

For Claude:
- place `CLAUDE.md` or a repo-specific variant in your project instructions
- adapt the example paths if your contracts live somewhere other than `cdad/`

For Cursor:
- translate the relevant sections into repository rules so edits always start from the contract, not from code search alone
- keep the rule text close to the commands engineers should actually run

For Codex:
- use these files as the baseline instruction set for coding agents working in a contract-driven repo
- keep examples grounded in toolkit commands that exist in this repository: `cdad init`, `cdad validate`, `cdad check`, and `cdad graph`

## Adapting to a repository

These files are templates, not claims about the current workspace state.
Before adopting them in another repository, update:

- the contract root path if it is not `cdad/`
- any generated artifact names such as `cdad-graph.json`
- the exact validation and reporting commands your team expects during review
