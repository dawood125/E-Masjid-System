const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const outPath = path.join(__dirname, 'logs', 'backend.out.log');
const errPath = path.join(__dirname, 'logs', 'backend.err.log');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const child = spawn('cmd.exe', ['/c', 'node', 'server.js', '>', outPath, '2>', errPath], {
  cwd: __dirname,
  detached: true,
  windowsHide: true,
  shell: false,
});
child.unref();

console.log(`Started backend shell PID ${child.pid}`);
process.exit(0);