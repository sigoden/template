const fs = require("fs");
const { parse } = require("jsona-openapi-js");
const [jsonaFile, prefix, format, operationSuffix = ""] = process.argv.slice(2);
if (!jsonaFile || !prefix || !format) {
  console.log("Usage: node ./list-routes.js <jsona-file> <prefix> <simple|json|yaml> [operationSuffix]");
  process.exit();
}
const METHODS = ["get", "put", "delete", "post", "options"];
const content = fs.readFileSync(jsonaFile, "utf8");
const openapi = parse(content);
const operations = getOperations(openapi);

if (format === "json") {
  const result = operations.reduce((acc, cur) => {
    Object.assign(acc, { [`${cur.operationId}${operationSuffix}`]: { req: { url: withPrefix(cur.path), method: cur.method } } });
    return acc;
  }, {});
  console.log(JSON.stringify(result, null, 2));
} else if (format === "yaml") {
  operations.forEach(o => {
    console.log(`  ${o.operationId}${operationSuffix}:
    req:
      url: ${withPrefix(o.path)}
      method: ${o.method}`);
  });
} else {
  operations.forEach(o => {
    console.log(`${o.operationId}${operationSuffix}: "${o.method.toUpperCase()} ${withPrefix(o.path)}",`);
  });
}

function withPrefix(path) {
  return prefix.endsWith("/") ? prefix.slice(0, -1) + path : prefix + path;
}

function getOperations(spec) {
  const result = [];
  for (const path in spec.paths) {
    const pathItem = spec.paths[path];
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (operation) {
        result.push({ operationId: operation.operationId, method, path });
      }
    }
  }
  return result;
}
