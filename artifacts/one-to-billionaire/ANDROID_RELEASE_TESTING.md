# Android pre-release gesture gate

The repository's **Android release gate** workflow runs automatically for every
`v*` tag and every push to a `release/**` branch. It can also be started
manually with `workflow_dispatch`.

The workflow is intentionally ordered so that a release cannot pass unless it:

1. runs the deterministic release suite;
2. generates and builds the release-candidate Android APK;
3. boots an Android emulator and installs that exact APK;
4. runs the native Maestro smoke flow against the installed app.

The workflow is the publication boundary. For a `v*` tag, the
`publish-android-release` job depends on `android-release-gate`, downloads the
APK artifact named for the same commit, and publishes that tested APK to the
GitHub release. A failure in either test stage prevents the publishing job from
starting. Immediately before publication, the job also resolves the live tag
through the GitHub API and refuses to publish if it no longer targets the tested
commit.

The publishing job is the only job with `contents: write`, and it is attached
to the protected `android-production` GitHub environment. Configure that
environment so release credentials and approvals are unavailable to every
other job. Do not store publishing credentials as repository-level secrets.

Repository rules must apply the required check
`Android release gate / Deterministic suite and native gesture smoke` to
`release/**`. Version tags are protected by the same workflow's job dependency:
the tag triggers the gate, but no GitHub release is created unless it succeeds.
Restrict creation and update of `v*` tags to release maintainers so an
alternative publishing path cannot be introduced from an unchecked ref. Remove
direct GitHub release creation rights from those maintainers; publication must
use the protected `android-production` environment's approved workflow.

The fast deterministic suite remains the first release check:

```sh
pnpm --filter @workspace/one-to-billionaire run test:release
```

For local investigation, build the same release-candidate APK:

```sh
pnpm --filter @workspace/one-to-billionaire run build:android:release-candidate
```

Then install
`artifacts/one-to-billionaire/android/app/build/outputs/apk/release/app-release.apk`
on an Android emulator or physical device and run:

```sh
pnpm --filter @workspace/one-to-billionaire run test:android-smoke
```

To run both gates in order:

```sh
pnpm --filter @workspace/one-to-billionaire run test:prerelease
```

The native flow opens `one-to-billionaire:///android-smoke` and verifies:

- a real Android tap launches the mystery reveal and its animation finishes after the expected delay;
- a below-threshold horizontal swipe resets, while an above-threshold swipe completes after its animation delay;
- a below-threshold vertical swipe resets, while an above-threshold swipe completes after its animation delay;
- a timer-driven mini-game completes no earlier than its configured deadline.

The harness reports `ANDROID SMOKE PASSED` only when all delayed callbacks meet
their minimum native-runtime timing. Any premature completion leaves a visible
`failed-delay-*` status and causes Maestro to time out.

The CI workflow preserves the Maestro JUnit result, Maestro console output,
Maestro debug files, Android logcat, and activity state for 14 days even when
the gate fails. On success it also stores the tested APK as a workflow artifact;
for a `v*` tag, the downstream protected job attaches that exact APK to the
GitHub release.

The repository policy regression check deliberately evaluates publication with
a failed gate and confirms that it is blocked:

```sh
pnpm test:android-release-policy
```

The device gate complements, rather than replaces, `test:release`, which should
continue to run on every change.
