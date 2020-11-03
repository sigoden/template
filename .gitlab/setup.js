#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// config.json
let configData = fs.readFileSync(path.join(__dirname, './config.json'), 'utf8');
for (const k in process.env) {
  if (/^CI_/.test(k)) {
    configData = configData.replace(new RegExp(`__${k}__`, 'g'), process.env[k]);
  }
}
fs.writeFileSync(path.resolve(__dirname, '../config.json'), configData);

let npmrcData = `
registry=https://npm.jiasuyunkeji.com
bcrypt_lib_binary_host_mirror=https://minio.jiasuyunkeji.com/node-module-binary/bcrypt
grpc_node_binary_host_mirror=https://minio.jiasuyunkeji.com/node-module-binary/grpc
//npm.jiasuyunkeji.com/:_authToken="${process.env.CI_NPM_TOKEN}"
`
// .npmrc
fs.writeFileSync(path.resolve(__dirname, '../.npmrc'), npmrcData);