require("dotenv").config();

const fs = require("fs");
const path = require("path");
const net = require("net");
const { execSync, spawn, spawnSync } = require("child_process");

const DEFAULT_LOCAL_DATA_DIR = path.resolve(__dirname, "..", ".pg-local", "data");
const DEFAULT_LOG_FILE = path.resolve(__dirname, "..", ".pg-local", "postgres.log");
const DEFAULT_WINDOWS_BINS = [
  "C:\\Program Files\\PostgreSQL\\18\\bin\\postgres.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\postgres.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\postgres.exe",
];

const DB_HOST = String(process.env.DB_HOST || "127.0.0.1");
const DB_PORT = Number.parseInt(String(process.env.DB_PORT || "5432"), 10);
const PG_LOCAL_DATA_DIR = path.resolve(process.env.PG_LOCAL_DATA_DIR || DEFAULT_LOCAL_DATA_DIR);
const PG_LOG_FILE = path.resolve(process.env.PG_LOG_FILE || DEFAULT_LOG_FILE);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isLocalHost = (host) => {
  const normalized = String(host || "").trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
};

const canConnect = (host, port, timeoutMs = 600) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });

const findPostgresFromPath = () => {
  try {
    if (process.platform === "win32") {
      const output = execSync("where postgres", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const candidate = String(output || "")
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .find(Boolean);
      return candidate && fs.existsSync(candidate) ? candidate : "";
    }

    const output = execSync("which postgres", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const candidate = String(output || "").trim();
    return candidate && fs.existsSync(candidate) ? candidate : "";
  } catch {
    return "";
  }
};

const resolvePostgresBin = () => {
  const envBin = String(process.env.PG_BIN || "").trim();
  if (envBin && fs.existsSync(envBin)) return envBin;

  const fromPath = findPostgresFromPath();
  if (fromPath) return fromPath;

  if (process.platform === "win32") {
    const fromDefaults = DEFAULT_WINDOWS_BINS.find((candidate) => fs.existsSync(candidate));
    if (fromDefaults) return fromDefaults;
  }

  return "";
};

const waitForPortOpen = async (host, port, maxAttempts = 30, delayMs = 500) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const ok = await canConnect(host, port, 500);
    if (ok) return true;
    await sleep(delayMs);
  }
  return false;
};

const resolveInitdbBin = (postgresBin) => {
  if (!postgresBin) return "";
  const binDir = path.dirname(postgresBin);
  const initdbName = process.platform === "win32" ? "initdb.exe" : "initdb";
  const candidate = path.resolve(binDir, initdbName);
  return fs.existsSync(candidate) ? candidate : "";
};

const initLocalClusterIfMissing = (postgresBin, dataDir) => {
  const versionFile = path.resolve(dataDir, "PG_VERSION");
  if (fs.existsSync(versionFile)) return;

  fs.mkdirSync(dataDir, { recursive: true });

  const initdbBin = resolveInitdbBin(postgresBin);
  if (!initdbBin) {
    throw new Error("Khong tim thay initdb executable de tao local cluster.");
  }

  const args = ["-D", dataDir, "-U", "postgres", "-A", "trust", "-E", "UTF8"];
  if (process.platform !== "win32") {
    args.push("--no-locale");
  }

  const result = spawnSync(initdbBin, args, {
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`initdb failed with code ${result.status}.`);
  }

  console.log(`Initialized local PostgreSQL cluster at ${dataDir}.`);
};

const escapePsString = (value) => String(value || "").replace(/'/g, "''");

const startPostgresHiddenOnWindows = (postgresBin, dataDir, port) => {
  const command = [
    `$bin='${escapePsString(postgresBin)}'`,
    `$args=@('-D','${escapePsString(dataDir)}','-p','${escapePsString(String(port))}')`,
    "Start-Process -FilePath $bin -ArgumentList $args -WindowStyle Hidden",
  ].join("; ");

  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    command,
  ], {
    stdio: "ignore",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error("Khong the start postgres.exe o che do hidden.");
  }
};

async function main() {
  if (!Number.isFinite(DB_PORT) || DB_PORT <= 0) {
    throw new Error(`DB_PORT khong hop le: ${process.env.DB_PORT}`);
  }

  const alreadyUp = await canConnect(DB_HOST, DB_PORT, 700);
  if (alreadyUp) {
    console.log(`PostgreSQL already running at ${DB_HOST}:${DB_PORT}.`);
    return;
  }

  if (!isLocalHost(DB_HOST)) {
    throw new Error(`DB_HOST=${DB_HOST} khong phai local host, khong the auto-start local PostgreSQL.`);
  }

  const postgresBin = resolvePostgresBin();
  if (!postgresBin) {
    throw new Error("Khong tim thay postgres executable. Set PG_BIN de chi dinh duong dan postgres.exe.");
  }
  initLocalClusterIfMissing(postgresBin, PG_LOCAL_DATA_DIR);

  const logDir = path.dirname(PG_LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (process.platform === "win32") {
    startPostgresHiddenOnWindows(postgresBin, PG_LOCAL_DATA_DIR, DB_PORT);
  } else {
    const args = ["-D", PG_LOCAL_DATA_DIR, "-p", String(DB_PORT)];
    const child = spawn(postgresBin, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
  }

  const isUpAfterStart = await waitForPortOpen(DB_HOST, DB_PORT, 30, 500);
  if (!isUpAfterStart) {
    throw new Error(
      `Da thu auto-start PostgreSQL nhung ${DB_HOST}:${DB_PORT} van chua san sang. Kiem tra log: ${PG_LOG_FILE}`
    );
  }

  console.log(`PostgreSQL auto-started at ${DB_HOST}:${DB_PORT}.`);
}

main().catch((error) => {
  console.error(`ensureLocalPostgres failed: ${error.message}`);
  process.exitCode = 1;
});
