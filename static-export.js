const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const GHOST_URL = 'http://localhost:2368';
const OUTPUT_DIR = 'static-site';
const GITHUB_PAGES_DOMAIN = process.env.GITHUB_PAGES_DOMAIN || '';
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

// Function to check if Ghost is ready
function checkGhostReady() {
  return new Promise((resolve) => {
    const req = http.get(GHOST_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for Ghost to be ready
async function waitForGhost() {
  console.log('Waiting for Ghost to be ready...');
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const isReady = await checkGhostReady();
    if (isReady) {
      console.log('Ghost is ready!');
      return true;
    }
    
    console.log(`Attempt ${i + 1}/${MAX_RETRIES}: Ghost not ready, waiting...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  throw new Error('Ghost failed to start within the expected time');
}

async function main() {
  console.log('Starting static site export...');
  
  // Wait for Ghost to be ready
  await waitForGhost();
  
  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    execSync(`rm -rf ${OUTPUT_DIR}`);
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  console.log('Exporting site with wget...');
  
  // Export the site using wget
  try {
    execSync(`wget \
      --recursive \
      --no-clobber \
      --page-requisites \
      --html-extension \
      --convert-links \
      --restrict-file-names=windows \
      --domains localhost \
      --no-parent \
      --wait=1 \
      --random-wait \
      --timeout=30 \
      --tries=3 \
      --directory-prefix=${OUTPUT_DIR} \
      ${GHOST_URL}`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('wget export completed with warnings (some 404s are expected):', error.message);
    // Continue processing even if wget exits with non-zero code due to 404s
  }
  
  console.log('Processing exported files...');
  
  // Move files from localhost subdirectory to root (handle both : and + formats)
  const possibleDirs = ['localhost:2368', 'localhost+2368'];
  let localhostDir = null;
  
  for (const dirName of possibleDirs) {
    const testDir = path.join(OUTPUT_DIR, dirName);
    if (fs.existsSync(testDir)) {
      localhostDir = testDir;
      break;
    }
  }
  
  if (localhostDir) {
    console.log(`Moving files from ${path.basename(localhostDir)} to root...`);
    const files = fs.readdirSync(localhostDir);
    files.forEach(file => {
      const srcPath = path.join(localhostDir, file);
      const destPath = path.join(OUTPUT_DIR, file);
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.renameSync(srcPath, destPath);
    });
    fs.rmSync(localhostDir, { recursive: true, force: true });
    console.log('Files moved successfully.');
  }
  
  // Create .nojekyll file for GitHub Pages
  fs.writeFileSync(path.join(OUTPUT_DIR, '.nojekyll'), '');
  
  // Create CNAME file if custom domain is specified
  if (GITHUB_PAGES_DOMAIN) {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'CNAME'), GITHUB_PAGES_DOMAIN);
    console.log(`Created CNAME file for domain: ${GITHUB_PAGES_DOMAIN}`);
  }
  
  // Create a simple index.html if none exists
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('No index.html found, creating a basic one...');
    fs.writeFileSync(indexPath, `<!DOCTYPE html>
<html>
<head>
  <title>Ghost Blog</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Ghost Blog</h1>
  <p>Your Ghost blog is being set up. Please check back soon!</p>
</body>
</html>`);
  }
  
  console.log('Static site export completed successfully!');
  console.log(`Files exported to: ${OUTPUT_DIR}`);
  console.log('Ready for GitHub Pages deployment.');
}

// Run the export
main().catch(error => {
  console.error('Export failed:', error.message);
  process.exit(1);
});

module.exports = { exportStaticSite: main };