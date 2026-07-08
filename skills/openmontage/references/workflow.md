# OpenMontage Production Workflow

Read this file only after `OPENMONTAGE_HOME` has passed validation and the user wants OpenMontage to create, edit, analyze, localize, or reproduce a video.

## Entry Sequence

1. Set the working directory to `OPENMONTAGE_HOME`.
2. Activate `.venv` if present.
3. Read `AGENT_GUIDE.md` completely before replying with a production plan.
4. Follow the latest instructions in `AGENT_GUIDE.md`; it is the source of truth.

Windows PowerShell:

```powershell
Set-Location -LiteralPath $env:OPENMONTAGE_HOME
if (Test-Path .\.venv\Scripts\Activate.ps1) {
  . .\.venv\Scripts\Activate.ps1
}
```

bash/zsh:

```bash
cd "$OPENMONTAGE_HOME"
if [ -f ".venv/bin/activate" ]; then
  source ".venv/bin/activate"
elif [ -f ".venv/Scripts/activate" ]; then
  source ".venv/Scripts/activate"
fi
```

## Request Routing

- Vague or exploratory requests: read `skills/meta/onboarding.md`.
- Reference-video requests: read `skills/meta/video-reference-analyst.md`.
- Specific production requests: select the best matching manifest from `pipeline_defs/`.
- Unclear pipeline: ask a focused clarification before starting production.

## Pipeline Rules

Every production goes through OpenMontage pipelines:

1. Identify the pipeline.
2. Read `pipeline_defs/<pipeline>.yaml`.
3. Run mandatory preflight through the OpenMontage registry.
4. Present the capability envelope before production.
5. Execute stage by stage.
6. Before each stage, read the stage director skill named by the manifest.
7. Before using any tool with `agent_skills`, read the referenced Layer 3 skill under `.agents/skills/`.
8. Use checkpoints as required by OpenMontage.
9. Run reviewer/self-review before final delivery.

Do not call tools directly with ad hoc scripts. Do not skip preflight, stage directors, Layer 3 skills, checkpoints, or review.

## Capability Menu

During preflight, report what is available now and what is degraded or blocked.

- Read provider/tool status from OpenMontage's registry.
- Group unavailable setup offers by capability and effort.
- If setup is optional, let the user decide whether to configure now or proceed with the best available path.
- Do not hardcode provider names, API key names, prices, setup URLs, or availability. These drift; read live metadata.

## Final Delivery

End with:

- final video path
- important generated assets or project directory
- any degraded capabilities that affected the result
- review status and remaining caveats

If production is blocked, state the exact blocker and the smallest next action.
