# Persistent Remotion Workbench

Read this file only for generated-video workbench setup, binding, repair, preview, rendering, or export.

## Purpose

Use one reusable Remotion project for repeated jobs:

- install dependencies once
- keep generated source under `REMOTION_WORKBENCH_HOME`
- keep per-job assets under `public/jobs/current/`
- run Remotion from the workbench directory
- export final artifacts to the target path requested by the user
- keep the current task directory free of `node_modules` and temporary project files

## Source Of Truth

`REMOTION_WORKBENCH_HOME` is the durable workbench path.

Valid workbench markers:

- `package.json` with `name: "hydroskills-remotion-workbench"`
- `src/index.ts` calling `registerRoot()`
- `src/Root.tsx`
- `src/jobs/current/Composition.tsx`
- `public/jobs/current/`

The active generated job uses:

- composition id: `CurrentVideo`
- source: `<workbench>/src/jobs/current/Composition.tsx`
- assets: `<workbench>/public/jobs/current/`
- job metadata: `<workbench>/public/jobs/current/job.json`

## Decision Tree

1. Run `check`.
2. If `ready: true`, use the returned `home`.
3. If `REMOTION_WORKBENCH_HOME` is missing, ask for a workbench directory or use a clear default under the user's home directory after confirming install work.
4. If the user already has a workbench, run `bind --home <dir> --persist`.
5. If markers exist but dependencies are missing, run `init --home <dir> --install --persist` after confirming dependency installation.
6. Before each new generated video, run `prepare-job`.
7. Edit `src/jobs/current/Composition.tsx` and copy any assets into `public/jobs/current/`.
8. Render or still to the user's target output path.
9. Verify the output file exists and report it.

## Commands

Direct cross-platform entrypoint:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" check --json
node "<skill_dir>/scripts/ensure-workbench.mjs" init --home "<workbench-dir>" --install --persist --json
node "<skill_dir>/scripts/ensure-workbench.mjs" bind --home "<existing-workbench-dir>" --persist --json
node "<skill_dir>/scripts/ensure-workbench.mjs" prepare-job --job-id "<job-id>" --output "<target-output.mp4>" --json
node "<skill_dir>/scripts/ensure-workbench.mjs" render --output "<target-output.mp4>" --json
node "<skill_dir>/scripts/ensure-workbench.mjs" still --output "<target-frame.png>" --frame 30 --json
```

Windows wrapper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\ensure-workbench.ps1" check --json
```

macOS/Linux wrapper:

```bash
bash "<skill_dir>/scripts/ensure-workbench.sh" check --json
```

## Install And Binding

Use `init` for first install or repair:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" init --home "<workbench-dir>" --install --persist --json
```

Use `bind` for an existing user-managed workbench:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" bind --home "<existing-workbench-dir>" --persist --json
```

Rules:

- Ask before running `--install`, because it uses network and disk.
- Refuse to modify a non-workbench directory that has a different `package.json` name.
- `--persist` writes `REMOTION_WORKBENCH_HOME` to user environment/profile.
- On macOS/Linux, a child process cannot update the parent shell; use the returned `home` immediately or source/open a new shell.

## Writing A Job

Prepare a job:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" prepare-job \
  --job-id "<stable-kebab-id>" \
  --output "<target-output.mp4>" \
  --width 1920 \
  --height 1080 \
  --fps 30 \
  --duration-in-frames 180 \
  --json
```

Then edit:

```text
<workbench>/src/jobs/current/Composition.tsx
```

Composition contract:

- Export `compositionConfig`.
- Export `MainComposition`.
- Keep `compositionConfig.id` as `CurrentVideo`.
- Use `staticFile("jobs/current/<asset>")` for copied assets.
- Load `rules/video-layout.md` before designing visual scenes, layouts, or text-heavy videos.
- Load other rule files only as needed by the task.

## Rendering

Render final video:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" render --output "<target-output.mp4>" --json
```

Render a representative still:

```bash
node "<skill_dir>/scripts/ensure-workbench.mjs" still --output "<target-frame.png>" --frame 30 --json
```

Never leave the deliverable only inside the workbench. The output path passed to `render` or `still` is the deliverable.

## Dependency Policy

The workbench template pins known-compatible Remotion package versions and the required `zod` version to avoid Remotion CLI version mismatch failures. Install additional packages only into the workbench, never into the current task directory.

If a rule says `npx remotion add ...`, first check whether the package is already in the workbench `package.json` and `node_modules`. Install only when missing.

## Failure Modes

- Missing Node/npm: stop and tell the user Node.js is required.
- Missing `REMOTION_WORKBENCH_HOME`: ask for a workbench location or initialize the default after confirmation.
- Existing non-workbench directory: do not overwrite unrelated files; ask for another directory.
- Missing `node_modules`: run `init --install` after confirmation.
- Render failure: report the command, stderr summary, and workbench source path.
