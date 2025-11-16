import * as fs from "fs";
import * as path from "path";

const VIOLATION_PATTERNS = [
  // SSR/ISR violations
  { pattern: /getServerSideProps/g, message: "getServerSideProps is not allowed (SSR)" },
  { pattern: /getStaticProps/g, message: "getStaticProps should have revalidate disabled for static export" },
  { pattern: /getInitialProps/g, message: "getInitialProps is not allowed" },
  
  // Server-only violations
  { pattern: /['"]server-only['"]/g, message: "server-only imports are not allowed" },
  { pattern: /from\s+['"]next\/headers['"]/g, message: "next/headers is not allowed (server-only)" },
  { pattern: /cookies\(\)/g, message: "cookies() is not allowed (server-only)" },
  { pattern: /headers\(\)/g, message: "headers() is not allowed (server-only)" },
  
  // Dynamic rendering violations
  { pattern: /dynamic\s*=\s*['"]force-dynamic['"]/g, message: "dynamic='force-dynamic' is not allowed" },
  { pattern: /revalidate\s*=\s*0/g, message: "revalidate=0 is not allowed for static export" },
  
  // API routes (should not exist)
  { pattern: /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g, message: "API route handlers are not allowed" },
];

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'out', '.git', 'abi'];

let violations = [];
let filesChecked = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(process.cwd(), filePath);
  
  filesChecked++;
  
  for (const { pattern, message } of VIOLATION_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        file: relPath,
        message,
        matches: matches.length,
      });
    }
  }
}

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

function checkDynamicRoutes() {
  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) return;
  
  function checkDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      
      // Check if directory name contains [ ] (dynamic segment)
      if (entry.name.includes('[') && entry.name.includes(']')) {
        // Check for generateStaticParams
        const files = fs.readdirSync(fullPath);
        const hasPageFile = files.some(f => f === 'page.tsx' || f === 'page.ts' || f === 'page.jsx' || f === 'page.js');
        
        if (hasPageFile) {
          const pageFiles = files.filter(f => f.startsWith('page.'));
          let hasGenerateStaticParams = false;
          
          for (const pageFile of pageFiles) {
            const content = fs.readFileSync(path.join(fullPath, pageFile), 'utf-8');
            if (content.includes('generateStaticParams')) {
              hasGenerateStaticParams = true;
              break;
            }
          }
          
          if (!hasGenerateStaticParams) {
            violations.push({
              file: path.relative(process.cwd(), fullPath),
              message: `Dynamic route segment [${entry.name}] must export generateStaticParams`,
              matches: 1,
            });
          }
        }
      }
      
      checkDir(fullPath);
    }
  }
  
  checkDir(appDir);
}

// Check next.config
function checkNextConfig() {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  if (!fs.existsSync(configPath)) {
    violations.push({
      file: 'next.config.ts',
      message: 'next.config.ts not found',
      matches: 1,
    });
    return;
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  if (!content.includes("output: 'export'") && !content.includes('output:"export"')) {
    violations.push({
      file: 'next.config.ts',
      message: "next.config.ts must include output: 'export'",
      matches: 1,
    });
  }
  
  if (!content.includes('unoptimized: true') && !content.includes('unoptimized:true')) {
    violations.push({
      file: 'next.config.ts',
      message: 'next.config.ts must include images.unoptimized: true',
      matches: 1,
    });
  }
}

console.log('🔍 Checking static export compliance...\n');

// Scan app directory
const appDir = path.join(process.cwd(), 'app');
if (fs.existsSync(appDir)) {
  scanDirectory(appDir);
}

// Scan components directory
const componentsDir = path.join(process.cwd(), 'components');
if (fs.existsSync(componentsDir)) {
  scanDirectory(componentsDir);
}

// Scan lib directory
const libDir = path.join(process.cwd(), 'lib');
if (fs.existsSync(libDir)) {
  scanDirectory(libDir);
}

// Scan hooks directory
const hooksDir = path.join(process.cwd(), 'hooks');
if (fs.existsSync(hooksDir)) {
  scanDirectory(hooksDir);
}

// Check dynamic routes
checkDynamicRoutes();

// Check next.config
checkNextConfig();

console.log(`✓ Checked ${filesChecked} files\n`);

if (violations.length === 0) {
  console.log('✅ All checks passed! Static export is compliant.\n');
  process.exit(0);
} else {
  console.error(`❌ Found ${violations.length} violation(s):\n`);
  
  for (const violation of violations) {
    console.error(`  📄 ${violation.file}`);
    console.error(`     ${violation.message}`);
    if (violation.matches > 1) {
      console.error(`     (${violation.matches} occurrences)`);
    }
    console.error('');
  }
  
  process.exit(1);
}

