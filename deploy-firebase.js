#!/usr/bin/env node

/**
 * Firebase deployment script for Sam Hébert Events App
 * This script handles the deployment to Firebase Hosting + Functions
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Sam Hébert Events App to Firebase...\n');

// Check if firebase-tools is installed
try {
  require.resolve('firebase-tools');
} catch (e) {
  console.error('❌ Firebase CLI not found. Installing...');
  console.log('Run: npm install -g firebase-tools');
  process.exit(1);
}

async function deploy() {
  try {
    // Step 1: Build the frontend
    console.log('📦 Building frontend...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Frontend built successfully\n');

    // Step 2: Create functions directory if it doesn't exist
    if (!fs.existsSync('functions/lib')) {
      fs.mkdirSync('functions/lib', { recursive: true });
    }

    // Step 3: Copy schema to functions
    if (fs.existsSync('shared/schema.ts')) {
      fs.copyFileSync('shared/schema.ts', 'functions/src/schema.ts');
      console.log('✅ Schema copied to functions\n');
    }

    // Step 4: Build functions (if TypeScript exists)
    if (fs.existsSync('functions/tsconfig.json')) {
      console.log('🔨 Building functions...');
      process.chdir('functions');
      await runCommand('npx', ['tsc']);
      process.chdir('..');
      console.log('✅ Functions built successfully\n');
    }

    // Step 5: Deploy to Firebase
    console.log('🚀 Deploying to Firebase...');
    await runCommand('firebase', ['deploy']);
    console.log('✅ Deployment successful!\n');

    console.log('🎉 Your app is now live on Firebase!');
    console.log('📱 Frontend: https://your-project-id.web.app');
    console.log('⚡ Functions: https://your-region-your-project-id.cloudfunctions.net/api');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Run deployment
deploy();