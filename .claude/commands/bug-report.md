---
description: Handle a reported bug end-to-end — reproduce with evidence, find the real root cause, fix, and verify safely
argument-hint: <describe the bug as reported>
---

You are running the bug-intake workflow for this repo. The bug being reported is:

$ARGUMENTS

This workflow exists because of concrete mistakes made on this project: declaring something
"already works" from reading code alone (it didn't — a library default was wrong), missing a
second call site when a shared DTO's shape changed (a stale incremental build hid the break),
and — most seriously — running automated add/delete test cycles against the live shared dev
database by DOM position, which silently deleted real user data (a topic, a note with real
content, and most of the board's edges) with no backup to recover from. Follow these steps in
order.

1. **Don't trust a code read alone — reproduce first.** Reading the source and concluding
   "this already works" is not verification. If a live dev server is available, drive the actual
   feature (browser interaction, API call, CLI run — whatever fits) to see the reported symptom
   happen, or fail to happen, before forming a theory.

2. **Match the exact real-world gesture, not an idealized one.** A bug report like "resizing
   doesn't work" can pass if you test it as two deliberate steps (click to select, then drag a
   handle) and fail if you test it as one natural motion (drag straight from an unselected
   element). Reconstruct the literal sequence a user would do, including the naive first attempt,
   not just a sequence you know succeeds.

3. **Check framework/library defaults explicitly — don't assume.** "Delete doesn't work" turned
   out to be `@xyflow/react`'s default `deleteKeyCode` being `'Backspace'` only; the actual Delete
   key was never bound. When behavior seems wrong, grep the dependency's own source/type
   definitions for the default instead of assuming the obvious key/flag/config is already covered.

4. **When a shared type/DTO/record's shape changes, grep the whole codebase for every
   construction site.** `NodeMapper` wasn't the only place building a `NodeResponse` —
   `BoardService.toNodeResponse` did too, and a stale incremental Maven build ("Nothing to
   compile — all classes are up to date") masked the break until the app was actually hit at
   runtime. After changing a constructor/record signature, search for every call site by type
   name, not just the one place you remember, and prefer a clean rebuild over trusting incremental
   compilation when a shape changed.

5. **Verify against the running app when you can, not just compile/type-check.** A green
   `tsc --noEmit` or `mvn compile` proves the code is well-typed, not that the feature behaves
   correctly. Start the dev servers (see `README.md`) and exercise the real flow — a headless
   browser (e.g. Playwright, installed on demand into a scratch dir, never added to the project's
   own `package.json` for a one-off check) can drive clicks/drags/keys and inspect the DOM and
   network requests for hard evidence.

6. **Never run mutating automated tests against live/shared data by fragile selectors.** Do not
   script add-then-delete cycles that pick "the last element in the DOM" or similar positional
   heuristics — a query invalidation or refetch can reorder elements between your create and your
   delete, and you can end up deleting real data instead of your test fixture. Before running any
   test that creates or deletes data against a dev environment:
   - Prefer a disposable/seeded board or record created solely for the test, or target elements
     by the exact ID your test just created — never by position.
   - Check whether someone (the user, another process) is already using that environment (a port
     already bound, a database already populated with real-looking content) before assuming
     exclusive control.
   - If you can't make the test non-destructive, stop and ask before running it.

7. **Don't touch processes or servers you didn't start without asking first.** If a port is
   already occupied by something you didn't launch this session, surface it and ask before killing
   it — it may be the user's own active work.

8. **Fix the root cause, not the symptom.** Trace "doesn't work" to the actual mechanism (a state
   gate, an event-timing conflict, a library default, a missed call site) before writing a patch.
   A fix that only makes your specific repro pass without understanding why it failed for the user
   is likely to leave the real bug in place.

9. **If you discover you caused an unintended side effect — especially data loss — stop, disclose
   it immediately and specifically, and ask how to proceed.** State exactly what was affected and
   why, before reporting on anything else in that turn. Do not bury it under unrelated status
   updates, and do not attempt to silently work around it.

10. **After fixing, verify the fix with the same rigor as step 1–5** (real repro, real gesture,
    running app), then report back concisely: what was actually broken (root cause), what changed,
    and how it was verified.
