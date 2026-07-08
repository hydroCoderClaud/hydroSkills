---
name: openmontage
description: Use when the user wants to install, bind, check, configure, or use OpenMontage for video production, including natural-language video creation, reference-video analysis, pipeline-based editing, animated explainers, cinematic/documentary/talking-head/screen-demo videos, or troubleshooting an OpenMontage setup. This skill combines OpenMontage environment management with the OpenMontage production workflow; it uses OPENMONTAGE_HOME as the single source of truth.
---

# OpenMontage

This skill has two responsibilities:

1. Manage the user's OpenMontage installation state.
2. Run OpenMontage video production as a pipeline-driven expert.

Keep `SKILL.md` lean. Load the detailed references only when their branch is needed.

## Source Of Truth

`OPENMONTAGE_HOME` is the only persistent OpenMontage location.

- Do not hardcode personal install paths.
- Do not search many arbitrary directories during production.
- Do not begin video production until `OPENMONTAGE_HOME` points to a valid OpenMontage root.
- If the user provides a path, validate it and bind it by setting `OPENMONTAGE_HOME`.

A valid OpenMontage root must contain:

- `AGENT_GUIDE.md`
- `pipeline_defs/`
- `tools/tool_registry.py`

## Progressive Loading

Choose the smallest branch that fits the user's request:

- **Install, bind, setup, repair, or "is OpenMontage available?"**: read `references/install.md`, then use the platform script in `scripts/`.
- **Create, edit, analyze, or reproduce a video with OpenMontage**: first run the environment check. If it passes, read `references/workflow.md`, then read `$env:OPENMONTAGE_HOME/AGENT_GUIDE.md`.
- **Both setup and production in one request**: complete the setup branch first. Only enter production after the check passes.

Do not load `references/workflow.md` while the install is unresolved. Do not load provider-specific OpenMontage skills until `AGENT_GUIDE.md` or a pipeline manifest points to them.

## Environment Check

On Windows, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\detect-install.ps1" -Mode Check -Json
```

On macOS/Linux, run:

```bash
bash "<skill_dir>/scripts/detect-install.sh" --mode Check --json
```

Interpret the result:

- `ok: true`: use `home` as `OPENMONTAGE_HOME`, enter workflow mode if the user wants production.
- `ok: false`: stay in setup mode. Explain the missing items and read `references/install.md` if not already loaded.
- `warnings`: continue only if they do not block the requested production. Tell the user what may be degraded.

If the platform script cannot run, perform the same checks manually: read `OPENMONTAGE_HOME`, verify the three root markers, then check `.venv`, Python, Node/npm, and FFmpeg as needed.

## Binding A Directory

If the user provides an existing OpenMontage path, validate and bind it:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\detect-install.ps1" -Mode Bind -Path "C:\path\to\OpenMontage" -Json
```

```bash
bash "<skill_dir>/scripts/detect-install.sh" --mode Bind --path "/path/to/OpenMontage" --json
```

The platform script persists `OPENMONTAGE_HOME`. On Windows it also updates the current PowerShell process. On macOS/Linux, use the returned `home` immediately in the current command and open a new shell, or source the updated profile, for inherited environment state.

## Production Gate

Before answering any OpenMontage production request:

1. Verify `OPENMONTAGE_HOME`.
2. Activate the virtual environment if present.
3. Read `AGENT_GUIDE.md` from `OPENMONTAGE_HOME`.
4. Follow OpenMontage's pipeline, preflight, stage-director, Layer 3 skill, checkpoint, and review rules.

If any required marker file is missing, stop and repair setup. Do not improvise a video workflow outside OpenMontage.
