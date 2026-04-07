const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
require("dotenv").config();
const net = require("net");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const mode = String(process.argv[2] || "start").trim().toLowerCase();
const backendRoot = path.resolve(__dirname, "..");
const runtimeDir = path.resolve(backendRoot, ".runtime");
const pidFile = path.resolve(runtimeDir, "backend.pid");
const outLog = path.resolve(runtimeDir, "backend.out.log");
const errLog = path.resolve(runtimeDir, "backend.err.log");
const portFile = path.resolve(runtimeDir, "backend.port");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readPid = () => {
  try {
    const raw = fs.readFileSync(pidFile, "utf8").trim();
    const pid = Number.parseInt(raw, 10);
    return Number.isFinite(pid) && pid > 0 ? pid : 0;
  } catch {
    return 0;
  }
};

const writePid = (pid) => {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(pidFile, `${pid}\n`, "utf8");
};

const clearPid = () => {
  try {
    fs.unlinkSync(pidFile);
  } catch {
    // ignore
  }
};

const isAlive = (pid) => {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const readRuntimePort = () => {
  try {
    const raw = fs.readFileSync(portFile, "utf8").trim();
    const port = Number.parseInt(raw, 10);
    return Number.isFinite(port) && port > 0 ? port : 0;
  } catch {
    return 0;
  }
};

const canConnect = (host, port, timeoutMs = 500) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });

const isBackendHealthReady = (port, timeoutMs = 1000) =>
  new Promise((resolve) => {
    if (!Number.isFinite(port) || port <= 0) {
      resolve(false);
      return;
    }

    const req = http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/api/health",
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.on("error", () => resolve(false));
  });

const detectRunningBackendPort = async () => {
  const candidates = [readRuntimePort(), 4000, 4001, 4002, 4003]
    .filter((port, index, arr) => Number.isFinite(port) && port > 0 && arr.indexOf(port) === index);

  for (const port of candidates) {
    const ok = await isBackendHealthReady(port, 900);
    if (ok) return port;
  }

  return 0;
};

const waitForBackendReady = async (timeoutMs = 30000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const runtimePort = readRuntimePort();
    if (runtimePort > 0) {
      const ok = await isBackendHealthReady(runtimePort, 900);
      if (ok) return runtimePort;
    }
    await sleep(400);
  }

  throw new Error(`Backend chua san sang sau ${Math.floor(timeoutMs / 1000)}s.`);
};

const ensureDb = () => {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, "ensureLocalPostgres.js")], {
    cwd: backendRoot,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error("Khong the khoi dong PostgreSQL local tu dong.");
  }
};

const ensurePort4000 = () => {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, "freePort.js"), "4000"], {
    cwd: backendRoot,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    console.warn("Khong the giai phong cong 4000, tiep tuc thu start backend.");
  }
};

const start = async () => {
  const currentPid = readPid();
  if (isAlive(currentPid)) {
    console.log(`Backend da chay nen (PID ${currentPid}).`);
    return;
  }

  const runningPort = await detectRunningBackendPort();
  if (runningPort > 0) {
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.writeFileSync(portFile, `${runningPort}\n`, "utf8");
    clearPid();
    console.log(`Backend API da chay san tai http://localhost:${runningPort}.`);
    return;
  }

  ensureDb();
  ensurePort4000();

  fs.mkdirSync(runtimeDir, { recursive: true });
  const outFd = fs.openSync(outLog, "a");
  const errFd = fs.openSync(errLog, "a");

  const child = spawn(process.execPath, ["server.js"], {
    cwd: backendRoot,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", outFd, errFd],
  });

  child.unref();
  await sleep(900);

  if (!isAlive(child.pid)) {
    clearPid();
    throw new Error(
      `Backend process bi thoat som sau khi start. Kiem tra log:\n- ${outLog}\n- ${errLog}`
    );
  }

  writePid(child.pid);

  let runtimePort = 0;
  try {
    runtimePort = await waitForBackendReady(30000);
  } catch (error) {
    clearPid();
    if (isAlive(child.pid)) {
      try {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true,
          });
        } else {
          process.kill(-child.pid, "SIGTERM");
        }
      } catch {
        // ignore cleanup errors
      }
    }
    throw error;
  }

  console.log(`Backend started in background (PID ${child.pid}, PORT ${runtimePort}).`);
  console.log(`Log: ${outLog}`);
};

const stop = () => {
  const currentPid = readPid();
  if (!isAlive(currentPid)) {
    clearPid();
    console.log("Backend nen da dung san.");
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(currentPid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  } else {
    try {
      process.kill(-currentPid, "SIGTERM");
    } catch {
      process.kill(currentPid, "SIGTERM");
    }
  }

  clearPid();
  console.log(`Backend stopped (PID ${currentPid}).`);
};

const status = async () => {
  const currentPid = readPid();
  if (isAlive(currentPid)) {
    console.log(`Backend dang chay nen (PID ${currentPid}).`);
    console.log(`Log: ${outLog}`);
    return;
  }

  const runningPort = await detectRunningBackendPort();
  if (runningPort > 0) {
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.writeFileSync(portFile, `${runningPort}\n`, "utf8");
    console.log(`Backend dang chay (khong quan ly PID), PORT ${runningPort}.`);
    return;
  }

  console.log("Backend dang tat.");
};

async function main() {
  if (mode === "start") {
    await start();
  } else if (mode === "stop") {
    stop();
  } else if (mode === "status") {
    await status();
  } else if (mode === "restart") {
    stop();
    await start();
  } else {
    throw new Error(`Mode khong hop le: ${mode}. Dung start|stop|status|restart.`);
  }
}

main().catch((error) => {
  console.error(`runBackendBackground failed: ${error.message}`);
  process.exitCode = 1;
});
