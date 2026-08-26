---
name: Android release publication boundary
description: The release publication path must consume the exact APK tested by the Android gate.
---

Publish only the APK artifact created by the successful Android gate, and
confirm the live version tag still resolves to the tested commit immediately
before publication.

**Why:** A tag can be moved after testing; without both the immutable-tag
policy and the runtime commit check, a tested artifact can be attached to a
release pointing at an untested commit.

**How to apply:** Keep publishing as a downstream job that needs the native
gate, uses a protected production environment, downloads the commit-specific
artifact, and verifies the tag's current target before creating the release.