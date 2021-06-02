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