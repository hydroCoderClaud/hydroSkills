#!/usr/bin/env bash
set -euo pipefail

MODE="Check"
PATH_ARG=""
INSTALL_DIR=""
REPO_URL="https://github.com/calesthio/OpenMontage.git"
RUN_SETUP=0
JSON=0
PROFILE_TARGET="auto"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode|-Mode)
      MODE="${2:-}"; shift 2 ;;
    --path|-Path)
      PATH_ARG="${2:-}"; shift 2 ;;
    --install-dir|-InstallDir)
      INSTALL_DIR="${2:-}"; shift 2 ;;
    --repo-url|-RepoUrl)
      REPO_URL="${2:-}"; shift 2 ;;
    --run-setup|-RunSetup)
      RUN_SETUP=1; shift ;;
    --json|-Json)
      JSON=1; shift ;;
    --profile)
      PROFILE_TARGET="${2:-}"; shift 2 ;;
    *)
      echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

json_escape() {
  local value="$1"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  printf '%s' "$value"
}

json_array() {
  local first=1
  printf '['
  for item in "$@"; do
    if [[ $first -eq 0 ]]; then printf ','; fi
    first=0
    printf '"%s"' "$(json_escape "$item")"
  done
  printf ']'
}

bool_text() {
  if [[ "${1:-0}" -eq 1 ]]; then printf 'true'; else printf 'false'; fi
}

command_available() {
  command -v "$1" >/dev/null 2>&1
}

any_command_available() {
  local cmd
  for cmd in "$@"; do
    if command_available "$cmd"; then
      return 0
    fi
  done
  return 1
}

abs_path() {
  local value="$1"
  if [[ -z "$value" ]]; then
    return 1
  fi
  if [[ -d "$value" ]]; then
    (cd "$value" && pwd -P)
  else
    local dir base
    dir=$(dirname "$value")
    base=$(basename "$value")
    (cd "$dir" 2>/dev/null && printf '%s/%s\n' "$(pwd -P)" "$base") || printf '%s\n' "$value"
  fi
}

ISSUES=()
WARNINGS=()
CHECK_KEYS=()
CHECK_VALUES=()

add_check() {
  CHECK_KEYS+=("$1")
  CHECK_VALUES+=("$2")
}

path_is_file() {
  [[ -f "$1" ]] && echo 1 || echo 0
}

path_is_dir() {
  [[ -d "$1" ]] && echo 1 || echo 0
}

test_root() {
  local root="${1:-}"
  ISSUES=()
  WARNINGS=()
  CHECK_KEYS=()
  CHECK_VALUES=()

  if [[ -z "$root" ]]; then
    ISSUES+=("OPENMONTAGE_HOME is not set and no path was provided.")
    HOME_RESULT=""
    OK_RESULT=0
    return
  fi

  local resolved
  resolved=$(abs_path "$root")
  HOME_RESULT="$resolved"

  local exists
  exists=$(path_is_dir "$resolved")
  add_check "pathExists" "$exists"
  if [[ "$exists" -ne 1 ]]; then
    ISSUES+=("OpenMontage directory does not exist: $resolved")
    OK_RESULT=0
    return
  fi

  add_check "agentGuide" "$(path_is_file "$resolved/AGENT_GUIDE.md")"
  add_check "pipelineDefs" "$(path_is_dir "$resolved/pipeline_defs")"
  add_check "toolRegistry" "$(path_is_file "$resolved/tools/tool_registry.py")"
  add_check "requirements" "$(path_is_file "$resolved/requirements.txt")"
  add_check "config" "$(path_is_file "$resolved/config.yaml")"
  add_check "envFile" "$(path_is_file "$resolved/.env")"
  add_check "envExample" "$(path_is_file "$resolved/.env.example")"
  add_check "venvWindows" "$(path_is_file "$resolved/.venv/Scripts/Activate.ps1")"
  add_check "venvPosix" "$(path_is_file "$resolved/.venv/bin/activate")"
  add_check "remotionComposer" "$(path_is_file "$resolved/remotion-composer/package.json")"
  add_check "remotionNodeModules" "$(path_is_dir "$resolved/remotion-composer/node_modules")"

  local i key value
  for i in "${!CHECK_KEYS[@]}"; do
    key="${CHECK_KEYS[$i]}"
    value="${CHECK_VALUES[$i]}"
    case "$key" in
      agentGuide|pipelineDefs|toolRegistry)
        if [[ "$value" -ne 1 ]]; then
          ISSUES+=("Missing OpenMontage root marker: $key")
        fi
        ;;
    esac
  done

  local has_venv=0
  for i in "${!CHECK_KEYS[@]}"; do
    [[ "${CHECK_KEYS[$i]}" == "venvPosix" && "${CHECK_VALUES[$i]}" -eq 1 ]] && has_venv=1
    [[ "${CHECK_KEYS[$i]}" == "venvWindows" && "${CHECK_VALUES[$i]}" -eq 1 ]] && has_venv=1
  done
  [[ "$has_venv" -ne 1 ]] && WARNINGS+=("Python virtual environment was not found under .venv.")

  local composer=0 modules=0 env_file=0 env_example=0
  for i in "${!CHECK_KEYS[@]}"; do
    [[ "${CHECK_KEYS[$i]}" == "remotionComposer" ]] && composer="${CHECK_VALUES[$i]}"
    [[ "${CHECK_KEYS[$i]}" == "remotionNodeModules" ]] && modules="${CHECK_VALUES[$i]}"
    [[ "${CHECK_KEYS[$i]}" == "envFile" ]] && env_file="${CHECK_VALUES[$i]}"
    [[ "${CHECK_KEYS[$i]}" == "envExample" ]] && env_example="${CHECK_VALUES[$i]}"
  done
  [[ "$composer" -eq 1 && "$modules" -ne 1 ]] && WARNINGS+=("remotion-composer exists but node_modules is missing; run npm install in remotion-composer.")
  [[ "$env_file" -ne 1 && "$env_example" -eq 1 ]] && WARNINGS+=(".env is missing; copy .env.example to .env and configure provider keys as needed.")

  if any_command_available python3 python py; then add_check "python" 1; else add_check "python" 0; fi
  if command_available node; then add_check "node" 1; else add_check "node" 0; fi
  if command_available npm; then add_check "npm" 1; else add_check "npm" 0; fi
  if command_available ffmpeg; then add_check "ffmpeg" 1; else add_check "ffmpeg" 0; fi
  if command_available git; then add_check "git" 1; else add_check "git" 0; fi
  if command_available make; then add_check "make" 1; else add_check "make" 0; fi

  for i in "${!CHECK_KEYS[@]}"; do
    key="${CHECK_KEYS[$i]}"
    value="${CHECK_VALUES[$i]}"
    case "$key:$value" in
      python:0) WARNINGS+=("Python command was not found on PATH.") ;;
      node:0) WARNINGS+=("Node.js command was not found on PATH.") ;;
      npm:0) WARNINGS+=("npm command was not found on PATH.") ;;
      ffmpeg:0) WARNINGS+=("FFmpeg command was not found on PATH.") ;;
    esac
  done

  [[ "${#ISSUES[@]}" -eq 0 ]] && OK_RESULT=1 || OK_RESULT=0
}

checks_json() {
  local first=1
  printf '{'
  for i in "${!CHECK_KEYS[@]}"; do
    if [[ $first -eq 0 ]]; then printf ','; fi
    first=0
    printf '"%s":%s' "${CHECK_KEYS[$i]}" "$(bool_text "${CHECK_VALUES[$i]}")"
  done
  printf '}'
}

write_result() {
  if [[ "$JSON" -eq 1 ]]; then
    printf '{"ok":%s,"mode":"%s","home":"%s","issues":' "$(bool_text "$OK_RESULT")" "$(json_escape "$MODE")" "$(json_escape "${HOME_RESULT:-}")"
    json_array "${ISSUES[@]}"
    printf ',"warnings":'
    json_array "${WARNINGS[@]}"
    printf ',"checks":'
    checks_json
    printf '}\n'
  else
    if [[ "$OK_RESULT" -eq 1 ]]; then
      echo "OpenMontage ready: $HOME_RESULT"
    else
      echo "OpenMontage not ready."
      for issue in "${ISSUES[@]}"; do echo "ISSUE: $issue"; done
    fi
    for warning in "${WARNINGS[@]}"; do echo "WARNING: $warning"; done
  fi
}

profile_file() {
  if [[ "$PROFILE_TARGET" == "none" ]]; then
    return 1
  fi
  if [[ "$PROFILE_TARGET" != "auto" ]]; then
    printf '%s\n' "$PROFILE_TARGET"
    return 0
  fi
  if [[ -n "${ZDOTDIR:-}" && -d "$ZDOTDIR" ]]; then
    printf '%s/.zshrc\n' "$ZDOTDIR"
  elif [[ "${SHELL:-}" == *"zsh"* ]]; then
    printf '%s/.zshrc\n' "$HOME"
  elif [[ "${SHELL:-}" == *"bash"* ]]; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      printf '%s/.bash_profile\n' "$HOME"
    else
      printf '%s/.bashrc\n' "$HOME"
    fi
  else
    printf '%s/.profile\n' "$HOME"
  fi
}

shell_quote() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

persist_home() {
  local root="$1"
  export OPENMONTAGE_HOME="$root"
  local profile
  if ! profile=$(profile_file); then
    return 0
  fi
  mkdir -p "$(dirname "$profile")"
  touch "$profile"
  local begin="# >>> openmontage skill >>>"
  local end="# <<< openmontage skill <<<"
  local tmp
  tmp=$(mktemp)
  awk -v begin="$begin" -v end="$end" '
    $0 == begin { skip=1; next }
    $0 == end { skip=0; next }
    skip != 1 { print }
  ' "$profile" > "$tmp"
  {
    cat "$tmp"
    printf '\n%s\nexport OPENMONTAGE_HOME=%s\n%s\n' "$begin" "$(shell_quote "$root")" "$end"
  } > "$profile"
  rm -f "$tmp"
}

run_setup() {
  local root="$1"
  (
    cd "$root"
    if command_available make; then
      make setup
      exit 0
    fi
    if command_available python3; then
      python3 -m venv .venv
    elif command_available python; then
      python -m venv .venv
    else
      echo "Python is required for setup but was not found." >&2
      exit 1
    fi
    # shellcheck disable=SC1091
    source .venv/bin/activate
    python -m pip install -r requirements.txt
    if [[ -f remotion-composer/package.json ]]; then
      (cd remotion-composer && npm install)
    fi
    python -m pip install piper-tts
    if [[ -f .env.example && ! -f .env ]]; then
      cp .env.example .env
    fi
  )
}

case "$MODE" in
  Check)
    test_root "${PATH_ARG:-${OPENMONTAGE_HOME:-}}"
    write_result
    ;;
  Bind)
    if [[ -z "$PATH_ARG" ]]; then
      echo "--path is required for Bind mode." >&2
      exit 2
    fi
    test_root "$PATH_ARG"
    if [[ "$OK_RESULT" -eq 1 ]]; then
      persist_home "$HOME_RESULT"
      test_root "$HOME_RESULT"
    fi
    write_result
    ;;
  Install)
    if [[ -z "$INSTALL_DIR" ]]; then
      echo "--install-dir is required for Install mode." >&2
      exit 2
    fi
    if ! command_available git; then
      echo "git is required for Install mode." >&2
      exit 2
    fi
    target=$(abs_path "$INSTALL_DIR")
    if [[ -d "$target" ]]; then
      shopt -s nullglob dotglob
      entries=("$target"/*)
      shopt -u nullglob dotglob
      test_root "$target"
      if [[ "${#entries[@]}" -gt 0 && "$OK_RESULT" -ne 1 ]]; then
        write_result
        exit 1
      fi
      if [[ "${#entries[@]}" -eq 0 ]]; then
        git clone "$REPO_URL" "$target"
      fi
    else
      mkdir -p "$(dirname "$target")"
      git clone "$REPO_URL" "$target"
    fi
    persist_home "$target"
    if [[ "$RUN_SETUP" -eq 1 ]]; then
      run_setup "$target"
    fi
    test_root "$target"
    write_result
    ;;
  *)
    echo "Invalid mode: $MODE" >&2
    exit 2
    ;;
esac
