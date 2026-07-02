import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = __dirname;
let hasErrors = false;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.js')) {
      checkImports(fullPath);
    }
  }
}

function getActualCaseSensitivePath(p) {
  const dir = path.dirname(p);
  const base = path.basename(p);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const match = files.find(f => f === base);
  if (match) return path.join(dir, match);
  const caseInsensitiveMatch = files.find(f => f.toLowerCase() === base.toLowerCase());
  if (caseInsensitiveMatch) return path.join(dir, caseInsensitiveMatch);
  return null;
}

function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Match import/export statements
  const importRegex = /(?:import|export)\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Only check local imports
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
        console.error(`❌ [Missing Extension] In ${path.relative(backendDir, filePath)}: ${importPath}`);
        hasErrors = true;
      }

      let resolvedPath;
      if (importPath.startsWith('/')) {
        // Absolute paths might be tricky, usually bad in ES modules unless mapped
        console.warn(`⚠️ [Absolute Import] In ${path.relative(backendDir, filePath)}: ${importPath}`);
        continue;
      } else {
        resolvedPath = path.resolve(path.dirname(filePath), importPath);
      }

      const caseSensitivePath = getActualCaseSensitivePath(resolvedPath);
      if (!caseSensitivePath) {
        console.error(`❌ [File Not Found] In ${path.relative(backendDir, filePath)}: ${importPath}`);
        hasErrors = true;
      } else {
        const expectedBasename = path.basename(resolvedPath);
        const actualBasename = path.basename(caseSensitivePath);
        if (expectedBasename !== actualBasename) {
          console.error(`❌ [Case Mismatch] In ${path.relative(backendDir, filePath)}: Expected '${expectedBasename}', but found '${actualBasename}'`);
          hasErrors = true;
        }
      }
    }
  }
}

console.log("Scanning for broken imports...");
scanDir(backendDir);
if (!hasErrors) {
  console.log("✅ No broken imports found.");
} else {
  console.log("⚠️ Broken imports detected!");
  process.exit(1);
}
