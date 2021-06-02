const { spawn, execSync } = require("child_process");
const { readFileSync } = require("fs");

const cpServer = spawn("node", ["dist/index.js"], { detached: true });
const { port } = require("../dist/settings");

let retries = 10;

const exit = (code = 0, msg) => {
  if (msg) console.log(msg);
  cpServer.kill();
  process.exit(code);
}

while (retries) {
  try {
    execSync("sleep 1");
    execSync(`curl --output /dev/null --silent --head --fail http://localhost:${port}/_/health`);
    break;
  } catch (err) {
    retries--;
    if (!retries) {
      exit(0, `server isn't ready`);
    }
  }
}

const cpTest = spawn("npm", ["test"], { stdio: "inherit"});
cpTest.on("exit", () => {
  try {
    const content = readFileSync("server.log", "utf8")
    console.log(content);
  } catch {}
  exit(cpTest.exitCode);
})