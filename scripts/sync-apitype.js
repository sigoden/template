const fs = require("fs");
const path = require("path");
const { pascalCase } = require("change-case");
const { parse } = require("jsona-openapi-js");
const { generate } = require("typegen-openapi");
const [jsonaFile] = process.argv.slice(2);
if (!jsonaFile) {
  console.log("Usage: node ./sync-apitype.js <jsona-file>");
  process.exit();
}

const basename = path.basename(jsonaFile, ".jsona");
const content = fs.readFileSync(jsonaFile, "utf8");
const openapi = parse(content);
const data = generate(openapi);
fs.writeFileSync(path.resolve(__dirname, `../src/type${pascalCase(basename)}.ts`), data, "utf8");
