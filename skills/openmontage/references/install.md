# OpenMontage Install And Setup

Read this file only for installation, binding, setup repair, or environment diagnosis.

## Contract

`OPENMONTAGE_HOME` is the only durable state. Installation and production both use this variable.

Valid root markers:

- `AGENT_GUIDE.md`
- `pipeline_defs/`
- `tools/tool_registry.py`

Useful setup markers:

- `.venv/Scripts/Activate.ps1` or `.venv/bin/activate`
- `requirements.txt`
- `remotion-composer/package.json`
- `config.yaml`
- `.env` or `.env.example`

## Setup Decision Tree

1. Run the platform check script:
   - Windows: `scripts/detect-install.ps1 -Mode Check -Json`
   - macOS/Linux: `scripts/detect-install.sh --mode Check --json`
2. If `ok: true`, setup is bound. Continue to production if requested.
3. If `OPENMONTAGE_HOME` is unset and the user has an existing OpenMontage clone, bind it with the platform script.
4. If no clone exists, ask for an install directory or use a clear default under the user's home directory.
5. Install only after the user agrees to network and setup work.
6. After install or bind, run `-Mode Check -Json` again.

## Existing Clone Binding

Use this branch when the user installed OpenMontage themselves, cloned it before installing this skill, or wants to keep OpenMontage in a custom directory. Do not reinstall in this case. Validate the directory and bind it to `OPENMONTAGE_HOME`.

Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\detect-install.ps1" -Mode Bind -Path "C:\path\to\OpenMontage" -Json
```

Manual equivalent:

```powershell
[Environment]::SetEnvironmentVariable("OPENMONTAGE_HOME", "C:\path\to\OpenMontage", "User")
$env:OPENMONTAGE_HOME = "C:\path\to\OpenMontage"
```

bash/zsh:

```bash
bash "<skill_dir>/scripts/detect-install.sh" --mode Bind --path "/path/to/OpenMontage" --json
```

Manual equivalent:

```bash
export OPENMONTAGE_HOME="/path/to/OpenMontage"
```

For persistence, add the export to the user's shell profile. The bundled macOS/Linux script updates `~/.zshrc`, `~/.bash_profile`, or `~/.profile` using a managed block. A child shell cannot update its parent process, so use the returned `home` for immediate follow-up commands or source the updated profile.

## Fresh Install

The script supports a parameterized fresh install:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\detect-install.ps1" `
  -Mode Install `
  -InstallDir "$env:USERPROFILE\OpenMontage" `
  -RepoUrl "https://github.com/calesthio/OpenMontage.git" `
  -RunSetup `
  -Json
```

macOS/Linux:

```bash
bash "<skill_dir>/scripts/detect-install.sh" \
  --mode Install \
  --install-dir "$HOME/OpenMontage" \
  --repo-url "https://github.com/calesthio/OpenMontage.git" \
  --run-setup \
  --json
```

Rules:

- Ask before cloning or running setup because it may use network, disk, and time.
- If `RepoUrl` is omitted, the script uses the OpenMontage public repository URL above.
- If `InstallDir` exists and is empty, cloning into it is allowed.
- If `InstallDir` exists and is non-empty but is not a valid OpenMontage root, stop and ask for another directory.
- The platform script sets `OPENMONTAGE_HOME` after a valid clone/bind. On macOS/Linux it persists the export in the user's shell profile.

## Setup Commands

OpenMontage's normal setup path is:

```bash
make setup
```

If `make` is unavailable, use the platform fallback.

Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Set-Location remotion-composer
npm install
Set-Location ..
python -m pip install piper-tts
Copy-Item .env.example .env
```

If `npm install` fails with `ERR_INVALID_ARG_TYPE`, retry with:

```powershell
npx --yes npm install
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cd remotion-composer && npm install && cd ..
python -m pip install piper-tts
cp .env.example .env
```

## Reporting Setup Results

Report setup in three buckets:

- **Ready**: valid `OPENMONTAGE_HOME`, virtual environment present, core tools available.
- **Degraded**: root is valid but optional tools or provider keys are missing.
- **Blocked**: root is missing/invalid, setup failed, or required runtime is missing.

For degraded provider capabilities, do not hardcode provider names, API key names, prices, or setup URLs. Read them from OpenMontage's registry and `AGENT_GUIDE.md` during production preflight.
