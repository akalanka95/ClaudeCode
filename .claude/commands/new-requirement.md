---
description: Turn a new requirement into an approved implementation plan (never implements directly)
argument-hint: <describe the requirement>
---

You are running the requirement-intake workflow for this repo. The requirement being requested is:

$ARGUMENTS

Follow these steps in order. Do not write, edit, or generate any implementation code at any
point during this command — the only allowed output is analysis and a plan.

1. **Read the requirement** above. If it's genuinely ambiguous about scope, UX, or data shape in
   a way that would materially change the design, ask the user a clarifying question instead of
   guessing.
2. **Read `ARCHITECTURE.md` in full** before doing anything else. It defines the backend/frontend
   rules and data model invariants this plan must respect.
3. **Find affected modules**: search the codebase and state explicitly which backend domain
   package(s) (`board/`, `node/`, `edge/`, or a new one) and which frontend feature folder(s)
   (`api/`, `hooks/`, `pages/`, `components/<feature>/`) this requirement touches.
4. **Identify API changes**: any new or changed REST endpoints, and request/response shape
   changes. For every backend DTO field added/changed/removed, name the corresponding update
   needed in `frontend/src/types/api.ts` and the relevant `frontend/src/api/*.ts` function —
   per `ARCHITECTURE.md`'s mirroring rule.
5. **Identify DB changes**: whether a new Flyway migration is needed, what entity fields change,
   and whether it interacts with the data model invariants in `ARCHITECTURE.md` (the
   Board↔Node recursive tree, the two-step node/child-board insert, cascade deletes).
6. **Check mobile compatibility**: if the requirement touches any frontend UI (a new component,
   a layout/styling change, a new page or panel), the plan must explicitly address how it behaves
   on mobile/small screens — call out the relevant breakpoint(s), touch-target sizing, and any
   layout that needs to reflow or collapse. Do not defer this to a follow-up unless the user
   explicitly says mobile support is out of scope for this requirement.
7. **Generate a concrete implementation plan**: the specific files to create or touch, in the
   order they should be done. No code — file paths and what changes in each, plus any new
   migration filename.
8. **Stop and wait for approval.** If you are in Plan Mode, call `ExitPlanMode` to request it.
   If not, present the plan in full as your response and explicitly ask the user to confirm
   before any implementation begins. Do not proceed to write code in this same turn.
