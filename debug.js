#!/usr/bin/env node

/**
 * Debug Helper Script
 * 
 * Este script facilita o debug da aplicação com diferentes configurações
 * 
 * Uso:
 *   node debug.js [opções]
 * 
 * Opções:
 *   --mode, -m     Modo de debug (dev, prod, test)
 *   --port, -p     Porta do debugger (default: 9229)
 *   --break, -b    Pausar na primeira linha
 *   --verbose, -v  Logs verbosos
 *   --help, -h     Mostrar ajuda
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let mode = 'dev';
let port = '9229';
let shouldBreak = false;
let verbose = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--mode':
    case '-m':
      mode = args[++i];
      break;
    case '--port':
    case '-p':
      port = args[++i];
      break;
    case '--break':
    case '-b':
      shouldBreak = true;
      break;
    case '--verbose':
    case '-v':
      verbose = true;
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;
  }
}

function showHelp() {
  console.log(`
🐛 Crafty Discord Bot - Debug Helper

Usage: node debug.js [options]

Options:
  --mode, -m <mode>    Debug mode (dev, prod, test) [default: dev]
  --port, -p <port>    Debugger port [default: 9229]
  --break, -b          Break on first line
  --verbose, -v        Verbose logging
  --help, -h           Show this help

Examples:
  node debug.js                    # Debug in dev mode
  node debug.js -m prod -p 9230    # Debug compiled version on port 9230
  node debug.js -b -v              # Debug with break and verbose logs
  node debug.js -m test            # Debug in test mode

Modes:
  dev     - Debug TypeScript source with ts-node
  prod    - Debug compiled JavaScript (runs build first)  
  test    - Debug in test environment
  
After starting, attach your debugger to localhost:${port}
Or use VS Code's "Attach to Process" debug configuration.
  `);
}

function startDebug() {
  console.log(`🚀 Starting debug session...`);
  console.log(`📍 Mode: ${mode}`);
  console.log(`🔌 Port: ${port}`);
  console.log(`⏸️  Break on start: ${shouldBreak ? 'Yes' : 'No'}`);
  console.log(`📝 Verbose: ${verbose ? 'Yes' : 'No'}`);
  console.log('');

  let command;
  let nodeArgs = [];
  let scriptArgs = [];

  // Configure inspector
  const inspectFlag = shouldBreak ? `--inspect-brk=0.0.0.0:${port}` : `--inspect=0.0.0.0:${port}`;
  nodeArgs.push(inspectFlag);

  // Configure based on mode
  switch (mode) {
    case 'dev':
      nodeArgs.push('-r', 'ts-node/register');
      scriptArgs.push('src/index.ts');
      break;
      
    case 'prod':
      console.log('🔨 Building project first...');
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          scriptArgs.push('dist/index.js');
          launchNode();
        } else {
          console.error('❌ Build failed!');
          process.exit(1);
        }
      });
      return;
      
    case 'test':
      nodeArgs.push('-r', 'ts-node/register');
      scriptArgs.push('src/index.ts');
      break;
      
    default:
      console.error(`❌ Unknown mode: ${mode}`);
      process.exit(1);
  }

  launchNode();

  function launchNode() {
    const env = {
      ...process.env,
      NODE_ENV: mode === 'prod' ? 'production' : 'development',
      LOG_LEVEL: verbose ? 'debug' : (mode === 'test' ? 'error' : 'info')
    };

    console.log(`🎯 Launching: node ${nodeArgs.join(' ')} ${scriptArgs.join(' ')}`);
    console.log(`🌍 Environment: NODE_ENV=${env.NODE_ENV}, LOG_LEVEL=${env.LOG_LEVEL}`);
    console.log('');
    console.log('🔗 Debugger waiting for connection...');
    console.log(`   Chrome DevTools: chrome://inspect`);
    console.log(`   VS Code: Use "Attach to Process" debug config`);
    console.log('');

    const nodeProcess = spawn('node', [...nodeArgs, ...scriptArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      env
    });

    nodeProcess.on('close', (code) => {
      console.log(`\n👋 Debug session ended with code ${code}`);
    });

    nodeProcess.on('error', (error) => {
      console.error('❌ Failed to start debug session:', error);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping debug session...');
      nodeProcess.kill('SIGTERM');
    });
  }
}

// Start the debug session
startDebug();
