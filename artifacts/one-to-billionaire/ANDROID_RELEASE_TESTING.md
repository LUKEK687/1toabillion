# Android pre-release gesture gate

The fast deterministic suite remains the first release check:

```sh
pnpm --filter @workspace/one-to-billionaire run test:release
```

Before an Android release, also run the native smoke flow on an Android emulator or physical device with the release-candidate app installed and Maestro available:

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

The harness reports `ANDROID SMOKE PASSED` only when all delayed callbacks meet their minimum native-runtime timing. Any premature completion leaves a visible `failed-delay-*` status and causes Maestro to time out. This device gate complements, rather than replaces, `test:release`, which should continue to run on every change.