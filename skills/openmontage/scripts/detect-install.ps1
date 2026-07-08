param(
  [ValidateSet("Check", "Bind", "Install")]
  [string]$Mode = "Check",

  [string]$Path,
  [string]$InstallDir,
  [string]$RepoUrl = "https://github.com/calesthio/OpenMontage.git",

  [switch]$RunSetup,
  [switch]$Json
)

$ErrorActionPreference = "Stop"

function New-Result {
  param(
    [bool]$Ok,
    [string]$Root,
    [string[]]$Issues = @(),
    [string[]]$Warnings = @(),
    [hashtable]$Checks = @{}
  )

  [ordered]@{
    ok = $Ok
    mode = $Mode
    home = $Root
    issues = @($Issues)
    warnings = @($Warnings)
    checks = $Checks
  }
}

function Resolve-FullPath {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
  $expanded = [Environment]::ExpandEnvironmentVariables($Value)
  try {
    return (Resolve-Path -LiteralPath $expanded -ErrorAction Stop).Path
  } catch {
    return [System.IO.Path]::GetFullPath($expanded)
  }
}

function Test-CommandAvailable {
  param([string]$Command)
  return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Test-OpenMontageRoot {
  param([string]$Root)

  $issues = New-Object System.Collections.Generic.List[string]
  $warnings = New-Object System.Collections.Generic.List[string]
  $checks = [ordered]@{}

  if ([string]::IsNullOrWhiteSpace($Root)) {
    $issues.Add("OPENMONTAGE_HOME is not set and no path was provided.")
    return New-Result -Ok:$false -Root:$null -Issues $issues.ToArray() -Warnings $warnings.ToArray() -Checks $checks
  }

  $resolved = Resolve-FullPath $Root
  $checks.pathExists = Test-Path -LiteralPath $resolved -PathType Container
  if (-not $checks.pathExists) {
    $issues.Add("OpenMontage directory does not exist: $resolved")
    return New-Result -Ok:$false -Root:$resolved -Issues $issues.ToArray() -Warnings $warnings.ToArray() -Checks $checks
  }

  $checks.agentGuide = Test-Path -LiteralPath (Join-Path $resolved "AGENT_GUIDE.md") -PathType Leaf
  $checks.pipelineDefs = Test-Path -LiteralPath (Join-Path $resolved "pipeline_defs") -PathType Container
  $checks.toolRegistry = Test-Path -LiteralPath (Join-Path $resolved "tools\tool_registry.py") -PathType Leaf
  $checks.requirements = Test-Path -LiteralPath (Join-Path $resolved "requirements.txt") -PathType Leaf
  $checks.config = Test-Path -LiteralPath (Join-Path $resolved "config.yaml") -PathType Leaf
  $checks.envFile = Test-Path -LiteralPath (Join-Path $resolved ".env") -PathType Leaf
  $checks.envExample = Test-Path -LiteralPath (Join-Path $resolved ".env.example") -PathType Leaf
  $checks.venvWindows = Test-Path -LiteralPath (Join-Path $resolved ".venv\Scripts\Activate.ps1") -PathType Leaf
  $checks.venvPosix = Test-Path -LiteralPath (Join-Path $resolved ".venv\bin\activate") -PathType Leaf
  $checks.remotionComposer = Test-Path -LiteralPath (Join-Path $resolved "remotion-composer\package.json") -PathType Leaf
  $checks.remotionNodeModules = Test-Path -LiteralPath (Join-Path $resolved "remotion-composer\node_modules") -PathType Container

  foreach ($marker in @("agentGuide", "pipelineDefs", "toolRegistry")) {
    if (-not $checks[$marker]) {
      $issues.Add("Missing OpenMontage root marker: $marker")
    }
  }

  if (-not ($checks.venvWindows -or $checks.venvPosix)) {
    $warnings.Add("Python virtual environment was not found under .venv.")
  }
  if ($checks.remotionComposer -and -not $checks.remotionNodeModules) {
    $warnings.Add("remotion-composer exists but node_modules is missing; run npm install in remotion-composer.")
  }
  if (-not $checks.envFile -and $checks.envExample) {
    $warnings.Add(".env is missing; copy .env.example to .env and configure provider keys as needed.")
  }

  $checks.python = (Test-CommandAvailable "python") -or (Test-CommandAvailable "py") -or (Test-CommandAvailable "python3")
  $checks.node = Test-CommandAvailable "node"
  $checks.npm = Test-CommandAvailable "npm"
  $checks.ffmpeg = Test-CommandAvailable "ffmpeg"
  $checks.git = Test-CommandAvailable "git"
  $checks.make = Test-CommandAvailable "make"

  if (-not $checks.python) { $warnings.Add("Python command was not found on PATH.") }
  if (-not $checks.node) { $warnings.Add("Node.js command was not found on PATH.") }
  if (-not $checks.npm) { $warnings.Add("npm command was not found on PATH.") }
  if (-not $checks.ffmpeg) { $warnings.Add("FFmpeg command was not found on PATH.") }

  return New-Result -Ok:($issues.Count -eq 0) -Root:$resolved -Issues $issues.ToArray() -Warnings $warnings.ToArray() -Checks $checks
}

function Write-Result {
  param([object]$Result)
  if ($Json) {
    $Result | ConvertTo-Json -Depth 8
  } else {
    if ($Result.ok) {
      Write-Output "OpenMontage ready: $($Result.home)"
    } else {
      Write-Output "OpenMontage not ready."
      foreach ($issue in $Result.issues) { Write-Output "ISSUE: $issue" }
    }
    foreach ($warning in $Result.warnings) { Write-Output "WARNING: $warning" }
  }
}

function Set-OpenMontageHome {
  param([string]$Root)
  [Environment]::SetEnvironmentVariable("OPENMONTAGE_HOME", $Root, "User")
  $env:OPENMONTAGE_HOME = $Root
}

function Invoke-Setup {
  param([string]$Root)

  Push-Location -LiteralPath $Root
  try {
    if (Test-CommandAvailable "make") {
      & make setup
      return
    }

    if (Test-CommandAvailable "py") {
      & py -3 -m venv .venv
    } elseif (Test-CommandAvailable "python") {
      & python -m venv .venv
    } else {
      throw "Python is required for setup but was not found."
    }

    $activate = Join-Path $Root ".venv\Scripts\Activate.ps1"
    if (Test-Path -LiteralPath $activate -PathType Leaf) {
      . $activate
    }

    & python -m pip install -r requirements.txt

    $composer = Join-Path $Root "remotion-composer"
    if (Test-Path -LiteralPath (Join-Path $composer "package.json") -PathType Leaf) {
      Push-Location -LiteralPath $composer
      try {
        & npm install
      } catch {
        & npx --yes npm install
      } finally {
        Pop-Location
      }
    }

    & python -m pip install piper-tts

    $envExample = Join-Path $Root ".env.example"
    $envFile = Join-Path $Root ".env"
    if ((Test-Path -LiteralPath $envExample -PathType Leaf) -and -not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
      Copy-Item -LiteralPath $envExample -Destination $envFile
    }
  } finally {
    Pop-Location
  }
}

if ($Mode -eq "Check") {
  $candidate = if ($Path) { $Path } else { $env:OPENMONTAGE_HOME }
  Write-Result (Test-OpenMontageRoot -Root $candidate)
  exit
}

if ($Mode -eq "Bind") {
  if ([string]::IsNullOrWhiteSpace($Path)) {
    throw "-Path is required for Bind mode."
  }
  $result = Test-OpenMontageRoot -Root $Path
  if ($result.ok) {
    Set-OpenMontageHome -Root $result.home
    $result = Test-OpenMontageRoot -Root $result.home
  }
  Write-Result $result
  exit
}

if ($Mode -eq "Install") {
  if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    throw "-InstallDir is required for Install mode."
  }
  if (-not (Test-CommandAvailable "git")) {
    throw "git is required for Install mode."
  }

  $target = Resolve-FullPath $InstallDir
  if (Test-Path -LiteralPath $target -PathType Container) {
    $children = @(Get-ChildItem -LiteralPath $target -Force -ErrorAction Stop)
    $existing = Test-OpenMontageRoot -Root $target
    if ($children.Count -gt 0 -and -not $existing.ok) {
      Write-Result $existing
      exit 1
    }
    if ($children.Count -eq 0) {
      & git clone $RepoUrl $target
    }
  } else {
    $parent = Split-Path -Parent $target
    if ($parent -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
      New-Item -ItemType Directory -Path $parent | Out-Null
    }
    & git clone $RepoUrl $target
  }

  Set-OpenMontageHome -Root $target
  if ($RunSetup) {
    Invoke-Setup -Root $target
  }

  Write-Result (Test-OpenMontageRoot -Root $target)
  exit
}
