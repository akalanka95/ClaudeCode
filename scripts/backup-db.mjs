// Backs up the local Postgres database (running via docker-compose) to a timestamped file under
// backups/. Full dump (schema + data, custom format) so it can restore into a completely empty
// volume on its own, with no dependency on Flyway having run first.
//
// Usage: node scripts/backup-db.mjs
//
// Restore with: node scripts/restore-db.mjs backups/<file>.dump

import { execFileSync } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { join } from "node:path";

const DB_NAME = "interviewprep";
const DB_USER = "interviewprep";
const BACKUP_DIR = "backups";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(BACKUP_DIR, `${DB_NAME}-${timestamp}.dump`);

mkdirSync(BACKUP_DIR, { recursive: true });

const fd = openSync(outFile, "w");
try {
  execFileSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "pg_dump", "-U", DB_USER, "-d", DB_NAME, "-Fc"],
    { stdio: ["ignore", fd, "inherit"] },
  );
} finally {
  closeSync(fd);
}

console.log(`Backup written to ${outFile}`);
