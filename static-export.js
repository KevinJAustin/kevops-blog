const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM } = require('jsdom');

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
  
  // Generate search index
  console.log('Generating search index...');
  generateSearchIndex();
  
  console.log('Static site export completed successfully!');
  console.log(`Files exported to: ${OUTPUT_DIR}`);
  console.log('Ready for GitHub Pages deployment.');
}

// Function to generate search index
function generateSearchIndex() {
  const searchData = [];
  
  // Find all HTML files
  function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'public' && item !== 'assets') {
        files.push(...findHtmlFiles(fullPath));
      } else if (stat.isFile() && item.endsWith('.html') && item !== '404.html') {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const htmlFiles = findHtmlFiles(OUTPUT_DIR);
  
  for (const filePath of htmlFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(content);
      const document = dom.window.document;
      
      // Extract metadata
      const title = document.querySelector('title')?.textContent?.trim() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const excerpt = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || description;
      
      // Get relative URL
      let url = path.relative(OUTPUT_DIR, filePath);
      if (url === 'index.html') {
        url = '/';
      } else if (url.endsWith('/index.html')) {
        url = '/' + url.replace('/index.html', '/');
      } else if (url.endsWith('.html')) {
        url = '/' + url;
      }
      
      // Extract tags from meta keywords or article tags
      const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
      const tags = keywords ? keywords.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      // Extract date
      const dateElement = document.querySelector('time[datetime]');
      const date = dateElement ? dateElement.getAttribute('datetime') : new Date().toISOString();
      
      // Extract main content text (excluding navigation, footer, etc.)
      const mainContent = document.querySelector('main, article, .post-content, .content');
      let textContent = '';
      if (mainContent) {
        // Remove script and style elements
        const scripts = mainContent.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        textContent = mainContent.textContent || '';
      } else {
        // Fallback to body content
        const body = document.querySelector('body');
        if (body) {
          const scripts = body.querySelectorAll('script, style, nav, footer, .nav, .footer');
          scripts.forEach(el => el.remove());
          textContent = body.textContent || '';
        }
      }
      
      // Clean up text content
      textContent = textContent.replace(/\s+/g, ' ').trim();
      
      // Skip if no meaningful content
      if (!title && !textContent) continue;
      
      searchData.push({
        title: title || 'Untitled',
        url: url,
        excerpt: excerpt || textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''),
        content: textContent,
        tags: tags,
        date: date
      });
      
    } catch (error) {
      console.warn(`Error processing ${filePath}:`, error.message);
    }
  }
  
  // Write search index
  const searchIndexPath = path.join(OUTPUT_DIR, 'search.json');
  fs.writeFileSync(searchIndexPath, JSON.stringify(searchData, null, 2));
  console.log(`Generated search index with ${searchData.length} entries`);
}

// Run the export
main().catch(error => {
  console.error('Export failed:', error.message);
  process.exit(1);
});

module.exports = { exportStaticSite: main };