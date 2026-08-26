# Android pre-release gesture gate

The repository's **Android release gate** workflow runs automatically for every
`v*` tag and every push to a `release/**` branch. It can also be started
manually with `workflow_dispatch`.

The workflow is intentionally ordered so that a release cannot pass unless it:

1. runs the deterministic release suite;
2. generates and builds the release-candidate Android APK;
3. boots an Android emulator and installs that exact APK;
4. runs the native Maestro smoke flow against the installed app.

Create the release tag only from a commit whose Android release gate is
required by the repository's release rules. A failure in either test stage
fails the workflow and therefore blocks the release.

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
the gate fails. On success it also publishes the tested APK as a workflow
artifact. The device gate complements, rather than replaces, `test:release`,
which should continue to run on every change.