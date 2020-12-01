require("ts-node").register();
require("../src/bootstrap");

const repl = require("repl");

const { init } = require("../src/services");

async function main() {
  const srvs = {};
  await init(srvs);
  const myRepl = repl.start({
    prompt: "> ",
    useColors: true,
  });
  myRepl.context.srvs = srvs;
}

main();
