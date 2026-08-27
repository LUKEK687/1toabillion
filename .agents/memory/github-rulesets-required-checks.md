---
name: GitHub rulesets — required status checks and admin API access
description: Why a passing check on one ref doesn't satisfy a ruleset for another ref, and what it takes to manage rulesets via API.
---

A required-status-check ruleset rule appears to require the check to have run
in the context of the *specific ref* being protected, not merely to match the
target commit SHA. A `workflow_dispatch` run against `main` that passed for
commit X did **not** satisfy a `required_status_checks` rule guarding
`release/**` for that same commit X; only a run whose own trigger event (a
real `push`) landed on that exact branch satisfied it. Confirm current
behavior against GitHub's docs before relying on this, since it isn't
documented explicitly and may reflect the queried repo's particular history —
but budget for it: the SHA alone may not be enough.

**Why:** Assuming classic "checks match by SHA across any branch" behavior
(true for legacy branch protection) can burn multiple ~25+ minute CI cycles
before you realize the check needs to be re-run on the actual target ref.

**How to apply:** To validate a required check for a branch/tag ruleset,
trigger the workflow via its real `push` event on that exact ref rather than
`workflow_dispatch` on an unrelated branch, even if you already have a
passing run for the identical commit SHA elsewhere.

## `do_not_enforce_on_create` creates an asymmetry between branches and tags

A branch ruleset with `do_not_enforce_on_create: true` exempts the *first*
push that creates the branch from required-status-checks — so deleting and
recreating a branch is a legitimate way to bootstrap a first passing check on
that exact ref (the create is exempt; only later updates are gated). A tag
ruleset with `do_not_enforce_on_create: false` has no such escape: a tag can
only ever be "created" (never merely updated), so if there are no
`bypass_actors`, the very first tag matching the pattern can become
permanently unpushable — the check can never exist before creation, and
creation is never exempt. This is a real deadlock in the ruleset's own
configuration, not something fixable from the client side.

**Why:** Discovered by watching `GET /repos/{owner}/{repo}/rulesets/rule-suites`
show `do_not_enforce_on_create: true` (branch) vs `false` (tag) after several
rejected pushes with identical `GH013 ... is expected` errors on both refs.

**How to apply:** When setting up a "required check on release tags" ruleset,
either add a bypass actor (e.g. the repo owner) or set
`do_not_enforce_on_create: true` for the tag rule too — otherwise the first
matching tag can never be created without manually loosening the ruleset via
the web UI once.

## Managing rulesets via the API needs a fine-grained token with Administration permission

`PATCH`/`POST` on `/repos/{owner}/{repo}/rulesets/{id}` returns `404 Not
Found` for a classic PAT even with `repo` + `workflow` scopes, regardless of
the underlying account's own admin role on the repo. `GET` on the same
endpoint works fine with a classic PAT — only writes are rejected. A
fine-grained PAT needs the repository's **Administration: Read and write**
permission explicitly granted; without it, admin-only endpoints (ruleset
writes, `GET .../actions/permissions`) return `403`/`404` while ordinary
content/read endpoints still succeed with `200`, which can look like "the
token mostly works" and mask the missing permission.

**Why:** Wasted several round trips assuming "repo" scope or the account's
own admin role would be enough; GitHub's ruleset management API specifically
needs a fine-grained token/GitHub App with `administration` write, not just
repo-write access.

**How to apply:** When you need to manage rulesets/branch protection via API,
ask for a fine-grained PAT with Administration: Read and write from the
start, and verify it with a cheap admin-only probe (e.g.
`GET /repos/{owner}/{repo}/actions/permissions`, which needs
`administration:read`) before relying on it for a write.
