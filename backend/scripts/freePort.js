const { execSync } = require("child_process");
const os = require("os");

const port = Number.parseInt(process.argv[2] || process.env.PORT || "4000", 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const listWindowsPids = (targetPort) => {
  let output = "";
  try {
    output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
  } catch (error) {
    console.warn(`Cannot inspect port ${targetPort} via netstat: ${error.message}`);
    return [];
  }

  const pids = new Set();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!line.includes(`:${targetPort}`)) continue;
    if (!/\sLISTENING\s/i.test(line)) continue;

    const columns = line.split(/\s+/);
    const pid = Number.parseInt(columns[columns.length - 1], 10);
    if (Number.isFinite(pid) && pid > 0) pids.add(pid);
  }

  return [...pids];
};

const listUnixPids = (targetPort) => {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split(/\r?\n/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
};

const listListeningPids = (targetPort) =>
  os.platform() === "win32" ? listWindowsPids(targetPort) : listUnixPids(targetPort);

const killPid = (pid) => {
  if (os.platform() === "win32") {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return;
  }

  process.kill(pid, "SIGKILL");
};

async function main() {
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid port: ${process.argv[2] || process.env.PORT}`);
  }

  const initialPids = listListeningPids(port).filter((pid) => pid !== process.pid);
  if (initialPids.length === 0) {
    console.log(`Port ${port} is free.`);
    return;
  }

  console.log(`Port ${port} is in use. Stopping PID(s): ${initialPids.join(", ")}`);
  for (const pid of initialPids) {
    try {
      killPid(pid);
    } catch (error) {
      console.warn(`Cannot stop PID ${pid}: ${error.message}`);
    }
  }

  await sleep(600);
  const stillBusyPids = listListeningPids(port).filter((pid) => pid !== process.pid);
  if (stillBusyPids.length > 0) {
    throw new Error(`Port ${port} is still in use after kill attempt.`);
  }

  console.log(`Port ${port} is free.`);
}

main().catch((error) => {
  // Do not block backend startup when OS process inspection/kill is restricted.
  console.warn(`freePort skipped: ${error.message}`);
});
