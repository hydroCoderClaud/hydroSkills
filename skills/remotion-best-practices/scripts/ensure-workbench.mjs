#!/usr/bin/env node
import {existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {homedir, platform} from "node:os";
import {spawnSync} from "node:child_process";

const WORKBENCH_NAME = "hydroskills-remotion-workbench";
const ENV_NAME = "REMOTION_WORKBENCH_HOME";
const REMOTION_VERSION = "4.0.486";
const ZOD_VERSION = "4.3.6";
const REACT_VERSION = "19.2.7";
const THREE_VERSION = "0.185.1";
const TYPESCRIPT_VERSION = "6.0.3";

function parseArgs(argv) {
  const flags = {_: []};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      flags._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (["json", "install", "no-install", "persist", "no-persist", "force"].includes(key)) {
      flags[key] = true;
      continue;
    }
    if (i + 1 >= argv.length) {
      throw new Error(`Missing value for --${key}`);
    }
    flags[key] = argv[i + 1];
    i += 1;
  }
  return flags;
}

function defaultHome() {
  if (platform() === "win32") {
    return join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "HydroSkills", "remotion-workbench");
  }
  return join(homedir(), ".hydroskills", "remotion-workbench");
}

function resolveHome(flags) {
  return resolve(flags.home || process.env[ENV_NAME] || defaultHome());
}

function ensureDir(path) {
  mkdirSync(path, {recursive: true});
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function commandExists(command) {
  const result = platform() === "win32"
    ? spawnSync("where.exe", [command], {encoding: "utf8"})
    : spawnSync("sh", ["-lc", `command -v ${command}`], {encoding: "utf8"});
  return result.status === 0;
}

function packageDir(home, name) {
  if (name.startsWith("@")) {
    const [scope, pkg] = name.split("/");
    return join(home, "node_modules", scope, pkg || "");
  }
  return join(home, "node_modules", name);
}

function validate(home) {
  const checks = {
    pathExists: existsSync(home),
    packageJson: existsSync(join(home, "package.json")),
    entrypoint: existsSync(join(home, "src", "index.ts")),
    root: existsSync(join(home, "src", "Root.tsx")),
    currentComposition: existsSync(join(home, "src", "jobs", "current", "Composition.tsx")),
    currentAssets: existsSync(join(home, "public", "jobs", "current")),
    nodeModules: existsSync(join(home, "node_modules")),
    node: commandExists("node"),
    npm: commandExists("npm"),
  };
  const issues = [];
  const warnings = [];
  let pkg = null;

  if (checks.packageJson) {
    try {
      pkg = readJson(join(home, "package.json"));
      checks.packageName = pkg.name === WORKBENCH_NAME;
    } catch (error) {
      checks.packageName = false;
      issues.push(`package.json is invalid: ${error.message}`);
    }
  } else {
    checks.packageName = false;
  }

  for (const marker of ["pathExists", "packageJson", "packageName", "entrypoint", "root", "currentComposition", "currentAssets"]) {
    if (!checks[marker]) issues.push(`Missing workbench marker: ${marker}`);
  }
  if (!checks.node) issues.push("Node.js was not found on PATH.");
  if (!checks.npm) issues.push("npm was not found on PATH.");

  const deps = pkg ? Object.keys({...pkg.dependencies, ...pkg.devDependencies}) : [];
  const missingDependencies = deps.filter((dep) => !existsSync(packageDir(home, dep)));
  if (!checks.nodeModules) {
    warnings.push("node_modules is missing; run init with --install.");
  } else if (missingDependencies.length > 0) {
    warnings.push(`Missing installed dependencies: ${missingDependencies.slice(0, 8).join(", ")}${missingDependencies.length > 8 ? "..." : ""}`);
  }

  return {
    ok: issues.length === 0,
    ready: issues.length === 0 && checks.nodeModules && missingDependencies.length === 0,
    home,
    envSet: Boolean(process.env[ENV_NAME]),
    issues,
    warnings,
    checks,
    missingDependencies,
  };
}

function packageJson() {
  const remotion = REMOTION_VERSION;
  return {
    name: WORKBENCH_NAME,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      studio: "remotion studio src/index.ts",
      render: "remotion render src/index.ts CurrentVideo",
      still: "remotion still src/index.ts CurrentVideo",
    },
    dependencies: {
      "@react-three/fiber": "9.6.1",
      "@remotion/captions": remotion,
      "@remotion/cli": remotion,
      "@remotion/effects": remotion,
      "@remotion/gif": remotion,
      "@remotion/google-fonts": remotion,
      "@remotion/layout-utils": remotion,
      "@remotion/light-leaks": remotion,
      "@remotion/media": remotion,
      "@remotion/media-utils": remotion,
      "@remotion/sfx": remotion,
      "@remotion/three": remotion,
      "@remotion/transitions": remotion,
      "@remotion/zod-types": remotion,
      "react": REACT_VERSION,
      "react-dom": REACT_VERSION,
      "remotion": remotion,
      "three": THREE_VERSION,
      "zod": ZOD_VERSION,
    },
    devDependencies: {
      "typescript": TYPESCRIPT_VERSION,
    },
  };
}

function tsconfigJson() {
  return {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["DOM", "DOM.Iterable", "ES2020"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
    },
    include: ["src"],
  };
}

function indexTs() {
  return `import {registerRoot} from 'remotion';\nimport {RemotionRoot} from './Root';\n\nregisterRoot(RemotionRoot);\n`;
}

function rootTsx() {
  return `import {Composition} from 'remotion';\nimport {MainComposition, compositionConfig} from './jobs/current/Composition';\n\nexport const RemotionRoot = () => {\n  return (\n    <Composition\n      id={compositionConfig.id}\n      component={MainComposition}\n      durationInFrames={compositionConfig.durationInFrames}\n      fps={compositionConfig.fps}\n      width={compositionConfig.width}\n      height={compositionConfig.height}\n      defaultProps={compositionConfig.defaultProps ?? {}}\n    />\n  );\n};\n`;
}

function compositionTsx(config = {}) {
  const width = Number(config.width || 1920);
  const height = Number(config.height || 1080);
  const fps = Number(config.fps || 30);
  const duration = Number(config.durationInFrames || 180);
  return `import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';\n\nexport const compositionConfig = {\n  id: 'CurrentVideo',\n  width: ${width},\n  height: ${height},\n  fps: ${fps},\n  durationInFrames: ${duration},\n  defaultProps: {},\n};\n\nexport const MainComposition = () => {\n  const frame = useCurrentFrame();\n  const {fps: videoFps} = useVideoConfig();\n  const opacity = interpolate(frame, [0, videoFps], [0, 1], {\n    extrapolateLeft: 'clamp',\n    extrapolateRight: 'clamp',\n  });\n\n  return (\n    <AbsoluteFill\n      style={{\n        background: '#0f172a',\n        color: 'white',\n        fontFamily: 'Inter, Arial, sans-serif',\n        alignItems: 'center',\n        justifyContent: 'center',\n        padding: 96,\n      }}\n    >\n      <div style={{fontSize: 72, fontWeight: 700, opacity, textAlign: 'center'}}>\n        Remotion workbench ready\n      </div>\n      <div style={{fontSize: 24, marginTop: 24, opacity: 0.72}}>\n        Assets live under {staticFile('jobs/current/')}\n      </div>\n    </AbsoluteFill>\n  );\n};\n`;
}

function refuseNonWorkbench(home) {
  const packagePath = join(home, "package.json");
  if (!existsSync(packagePath)) return;
  const pkg = readJson(packagePath);
  if (pkg.name && pkg.name !== WORKBENCH_NAME) {
    throw new Error(`Refusing to modify non-workbench package.json at ${home}`);
  }
}

function initWorkbench(home, flags) {
  refuseNonWorkbench(home);
  ensureDir(join(home, "src", "jobs", "current"));
  ensureDir(join(home, "public", "jobs", "current"));
  writeJson(join(home, "package.json"), packageJson());
  writeJson(join(home, "tsconfig.json"), tsconfigJson());
  writeFileSync(join(home, "src", "index.ts"), indexTs(), "utf8");
  writeFileSync(join(home, "src", "Root.tsx"), rootTsx(), "utf8");
  const compPath = join(home, "src", "jobs", "current", "Composition.tsx");
  if (!existsSync(compPath) || flags.force) {
    writeFileSync(compPath, compositionTsx(), "utf8");
  }
  writeFileSync(join(home, ".gitignore"), "node_modules/\nout/\n.remotion/\n", "utf8");
  if (flags.persist) persistEnv(home);
  if (flags.install) run("npm", ["install"], home);
  return validate(home);
}

function bindWorkbench(home, flags) {
  const status = validate(home);
  if (status.ok && flags.persist) persistEnv(home);
  return validate(home);
}

function prepareJob(home, flags) {
  const status = validate(home);
  if (!status.ok) return {...status, prepared: false};
  const jobId = flags["job-id"] || `job-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const output = resolve(flags.output || join(process.cwd(), `${jobId}.mp4`));
  const currentSrc = join(home, "src", "jobs", "current");
  const currentAssets = join(home, "public", "jobs", "current");
  rmSync(currentSrc, {recursive: true, force: true});
  rmSync(currentAssets, {recursive: true, force: true});
  ensureDir(currentSrc);
  ensureDir(currentAssets);
  writeFileSync(currentSrc + "/Composition.tsx", compositionTsx({
    width: flags.width,
    height: flags.height,
    fps: flags.fps,
    durationInFrames: flags["duration-in-frames"] || flags.duration,
  }), "utf8");
  writeJson(join(currentAssets, "job.json"), {
    jobId,
    output,
    width: Number(flags.width || 1920),
    height: Number(flags.height || 1080),
    fps: Number(flags.fps || 30),
    durationInFrames: Number(flags["duration-in-frames"] || flags.duration || 180),
    createdAt: new Date().toISOString(),
  });
  return {
    ...validate(home),
    prepared: true,
    jobId,
    output,
    compositionPath: join(currentSrc, "Composition.tsx"),
    assetsDir: currentAssets,
  };
}

function render(home, flags, still = false) {
  const status = validate(home);
  if (!status.ready) {
    return {...status, rendered: false, issues: [...status.issues, "Workbench is not ready for rendering."]};
  }
  const output = resolve(flags.output || join(home, "out", still ? "frame.png" : "video.mp4"));
  ensureDir(dirname(output));
  if (existsSync(output)) unlinkSync(output);
  const args = still
    ? ["still", "src/index.ts", "CurrentVideo", output, "--frame", String(flags.frame || 30)]
    : ["render", "src/index.ts", "CurrentVideo", output];
  const result = runRemotion(home, args);
  const rendered = result.status === 0 && existsSync(output);
  return {
    ...validate(home),
    rendered,
    output,
    command: `remotion ${args.join(" ")}`,
    exitCode: result.status,
    error: result.error ? result.error.message : null,
    stdout: rendered ? "" : (result.stdout || "").slice(-4000),
    stderr: rendered ? "" : (result.stderr || "").slice(-4000),
  };
}

function remotionBin(home) {
  return platform() === "win32"
    ? join(home, "node_modules", ".bin", "remotion.cmd")
    : join(home, "node_modules", ".bin", "remotion");
}

function runRemotion(home, args) {
  if (platform() !== "win32") {
    return run(remotionBin(home), args, home, false);
  }
  const logDir = join(home, "out", ".logs");
  ensureDir(logDir);
  const stdoutPath = join(logDir, "remotion-stdout.log");
  const stderrPath = join(logDir, "remotion-stderr.log");
  writeFileSync(stdoutPath, "", "utf8");
  writeFileSync(stderrPath, "", "utf8");
  const commandLine = `${quoteWindowsCommand([remotionBin(home), ...args])} > ${quoteWindowsCommand([stdoutPath])} 2> ${quoteWindowsCommand([stderrPath])}`;
  const result = spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", commandLine], {
    cwd: home,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
    },
  });
  return {
    ...result,
    stdout: readFileSync(stdoutPath, "utf8"),
    stderr: readFileSync(stderrPath, "utf8"),
  };
}

function run(command, args, cwd, throwOnFail = true) {
  const isWindows = platform() === "win32";
  const executable = isWindows && ["npm", "npx"].includes(command) ? `${command}.cmd` : command;
  const spawnCommand = isWindows && executable.endsWith(".cmd") ? (process.env.ComSpec || "cmd.exe") : executable;
  const spawnArgs = isWindows && executable.endsWith(".cmd")
    ? ["/d", "/s", "/c", quoteWindowsCommand([executable, ...args])]
    : args;
  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
    },
  });
  if (throwOnFail && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}\n${result.stderr}`);
  }
  return result;
}

function quoteWindowsCommand(parts) {
  return parts.map((part) => {
    const value = String(part);
    if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(value)) return value;
    return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, "$1$1")}"`;
  }).join(" ");
}

function persistEnv(home) {
  process.env[ENV_NAME] = home;
  if (platform() === "win32") {
    const escaped = home.replace(/'/g, "''");
    run("powershell", ["-NoProfile", "-Command", `[Environment]::SetEnvironmentVariable('${ENV_NAME}', '${escaped}', 'User')`], process.cwd());
    return;
  }
  const shell = process.env.SHELL || "";
  let profile = join(homedir(), ".profile");
  if (shell.includes("zsh")) profile = join(process.env.ZDOTDIR || homedir(), ".zshrc");
  if (shell.includes("bash")) profile = platform() === "darwin" ? join(homedir(), ".bash_profile") : join(homedir(), ".bashrc");
  const begin = "# >>> remotion workbench >>>";
  const end = "# <<< remotion workbench <<<";
  const existing = existsSync(profile) ? readFileSync(profile, "utf8") : "";
  const filtered = existing
    .split(/\r?\n/)
    .reduce((state, line) => {
      if (line === begin) return {skip: true, lines: state.lines};
      if (line === end) return {skip: false, lines: state.lines};
      if (!state.skip) state.lines.push(line);
      return state;
    }, {skip: false, lines: []}).lines
    .join("\n")
    .replace(/\n*$/, "\n");
  ensureDir(dirname(profile));
  const quoted = `'${home.replace(/'/g, "'\\''")}'`;
  writeFileSync(profile, `${filtered}\n${begin}\nexport ${ENV_NAME}=${quoted}\n${end}\n`, "utf8");
}

function printResult(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.ready) console.log(`Remotion workbench ready: ${result.home}`);
  else if (result.ok) console.log(`Remotion workbench exists but needs install/repair: ${result.home}`);
  else console.log(`Remotion workbench not ready: ${result.home}`);
  for (const issue of result.issues || []) console.log(`ISSUE: ${issue}`);
  for (const warning of result.warnings || []) console.log(`WARNING: ${warning}`);
  if (result.output) console.log(`OUTPUT: ${result.output}`);
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  const command = flags._[0] || flags.mode || "check";
  const home = resolveHome(flags);
  let result;
  if (command === "check") result = validate(home);
  else if (command === "init") result = initWorkbench(home, flags);
  else if (command === "bind") result = bindWorkbench(home, flags);
  else if (command === "prepare-job") result = prepareJob(home, flags);
  else if (command === "render") result = render(home, flags, false);
  else if (command === "still") result = render(home, flags, true);
  else throw new Error(`Unknown command: ${command}`);

  printResult({command, ...result}, flags.json);
  if (command === "render" || command === "still") {
    process.exitCode = result.rendered ? 0 : 1;
    return;
  }
  process.exitCode = result.ok || result.ready || result.prepared ? 0 : 1;
}

try {
  main();
} catch (error) {
  const json = process.argv.includes("--json");
  const payload = {ok: false, ready: false, error: error.message};
  if (json) console.log(JSON.stringify(payload, null, 2));
  else console.error(error.message);
  process.exit(1);
}
