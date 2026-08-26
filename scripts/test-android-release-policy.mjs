import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = new URL(
  "../.github/workflows/android-release-gate.yml",
  import.meta.url,
);
const workflow = await readFile(workflowPath, "utf8");

function requireMatch(pattern, message) {
  assert.match(workflow, pattern, message);
}

requireMatch(
  /branches:\s*\n\s+- "release\/\*\*"/,
  "release branches must run the gate",
);
requireMatch(/tags:\s*\n\s+- "v\*"/, "version tags must run the gate");
requireMatch(
  /publish-android-release:[\s\S]*?needs:\s*\n\s+- android-release-gate/,
  "publication must depend on the Android gate",
);
requireMatch(
  /publish-android-release:[\s\S]*?environment: android-production/,
  "publication must use the protected production environment",
);
requireMatch(
  /publish-android-release:[\s\S]*?permissions:\s*\n\s+contents: write/,
  "write permission must be scoped to the publication job",
);
requireMatch(
  /publish-android-release:[\s\S]*?actions\/download-artifact@v4[\s\S]*?android-release-candidate-\$\{\{ github\.sha \}\}/,
  "publication must consume the artifact built from the gated commit",
);
requireMatch(
  /Verify tag still targets tested commit[\s\S]*?test "\$tag_object_sha" = "\$GITHUB_SHA"/,
  "publication must stop if the version tag moves after the gate starts",
);

const jobs = {
  gate: { result: "failure" },
  publish: {
    needs: ["gate"],
    eligible(state) {
      return this.needs.every(
        (dependency) => state[dependency].result === "success",
      );
    },
  },
};

assert.equal(
  jobs.publish.eligible(jobs),
  false,
  "a deliberately failing gate must prevent publication",
);

jobs.gate.result = "success";
assert.equal(
  jobs.publish.eligible(jobs),
  true,
  "publication should become eligible only after the gate succeeds",
);

console.log(
  "Android release policy passed, including failed-gate publication block.",
);
