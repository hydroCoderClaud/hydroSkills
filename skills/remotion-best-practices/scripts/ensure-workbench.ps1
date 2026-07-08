param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "ensure-workbench.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required for the Remotion workbench."
  exit 1
}

& node $script @Args
exit $LASTEXITCODE
