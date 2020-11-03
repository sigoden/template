const fs = require("fs");
const path = require("path");
const { parseOpenApi } = require("jsona-openapi-js");
const { generate } = require("typegen-openapi");
const [jsonaFile] = process.argv.slice(2);
if (!jsonaFile) {
  console.log(`Usage: node ./handlers-typegen.js <jsona-file>`);
  process.exit();
}

const content = fs.readFileSync(jsonaFile, "utf8");
const openapi = parseOpenApi(content);
const data = generate(openapi);
fs.writeFileSync(path.resolve(__dirname, "../src/openapi.ts"), data, "utf8");

