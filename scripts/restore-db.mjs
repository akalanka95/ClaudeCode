// Restores a backup produced by scripts/backup-db.mjs into the local Postgres database (running
// via docker-compose). Destructive: drops and recreates every object in the local DB before
// loading the dump, so anything not in the backup file is gone afterward.
//
// Usage: node scripts/restore-db.mjs backups/<file>.dump

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const DB_NAME = "interviewprep";
const DB_USER = "interviewprep";
const CONTAINER_TMP_PATH = "/tmp/restore-db.dump";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/restore-db.mjs <path-to-dump-file>");
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`No such file: ${file}`);
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(
  `This will DROP and replace every object in the local "${DB_NAME}" database with the contents ` +
    `of "${file}". Anything not in that backup is lost. Type "yes" to continue: `,
);
rl.close();
if (answer.trim().toLowerCase() !== "yes") {
  console.log("Aborted.");
  process.exit(1);
}

execFileSync("docker", ["compose", "cp", file, `postgres:${CONTAINER_TMP_PATH}`], {
  stdio: "inherit",
});

try {
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_restore",
      "--clean",
      "--if-exists",
      "--no-owner",
      "-U",
      DB_USER,
      "-d",
      DB_NAME,
      CONTAINER_TMP_PATH,
    ],
    { stdio: "inherit" },
  );
} finally {
  execFileSync("docker", ["compose", "exec", "-T", "postgres", "rm", "-f", CONTAINER_TMP_PATH], {
    stdio: "inherit",
  });
}

console.log("Restore complete. Restart the backend if it was running during the restore.");
