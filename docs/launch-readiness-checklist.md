# Launch Readiness Checklist

This checklist captures the final manual steps required before sharing the repository publicly. It separates one-time launch work from recurring maintenance checks so the repo does not depend on memory or tribal knowledge.

## One-Time Launch Steps

| Area | Task | Owner | Verify |
|---|---|---|---|
| GitHub Topics | Set the repository topics to `ai-agents`, `software-architecture`, `contracts`, `cdad`, `legibility`, `capability-graph`, `agent-readiness`, `the-day-after`, `open-source-tools`, `developer-tools`, `typescript`, `cli`. | Maintainer | Open the repo home page and confirm the topics match exactly. |
| About Metadata | Set the GitHub About description to the final public positioning for the toolkit. | Maintainer | Confirm the description matches the final `package.json` and README headline. |
| About Links | Add the primary documentation URL and any book landing page URL used for launch. | Maintainer | Open the About section and verify both links resolve. |
| npm Distribution | Confirm the published package name, install command, and README install path are aligned. | Maintainer | Run the published install command from a clean environment or release checklist shell. |
| GitHub Release Process | Confirm the release workflow, permissions, and required secrets exist before the first public release. | Maintainer | Inspect Actions settings and verify the release workflow can access required secrets. |
| Branch Protection | Confirm `main` still requires CI, preserves linear history, and blocks force-pushes/deletions. | Maintainer | Review the branch protection settings page immediately before launch. |
| Public Repo Presentation | Review the repository home page, README first screen, and docs index for broken links or unfinished copy. | Maintainer | Manually click the first-screen links and confirm there are no placeholders or dead ends. |
| Book Cross-Linking | Confirm the book paragraph in the README points to the intended public page once that URL is final. | Maintainer | Open the README link from GitHub and confirm it resolves publicly. |

## Recurring Maintenance Checks

| Area | Task | Owner | Verify |
|---|---|---|---|
| Docs Drift | Re-check README, docs index, and launch docs whenever commands, file names, or distribution paths change. | Feature owner | Confirm every referenced command and file still exists after the change. |
| Repo Hygiene | Keep `README.md`, `SECURITY.md`, `.github/CODEOWNERS`, and `CITATION.cff` current as support and scope evolve. | Maintainer | Review these files before each tagged release. |
| Branch Protection | Re-verify branch protection after GitHub settings changes or admin overrides. | Maintainer | Confirm the `main` ruleset still matches the repo governance policy. |
| Topics and About | Review topics, description, and external links when positioning changes. | Maintainer | Compare GitHub home-page metadata against the current README/package metadata. |
| Release Path | Re-test the public install and release path when package metadata or workflows change. | Maintainer | Run the documented install command and inspect the latest release artifact set. |

## Final Share Check

Before announcing the repository:

1. Open the repo in an anonymous browser window.
2. Read only the first screen of the README and confirm the purpose and next step are obvious.
3. Open the docs index and confirm the launch checklist, adoption journey, and CLI reference are all reachable.
4. Confirm the latest default-branch CI run is green.
5. Confirm the package/install path in public docs matches the actual published artifact.
