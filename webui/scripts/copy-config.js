import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '../dist');
const destDir = join(__dirname, '../../momentzabuild/wwwroot');

// Recursive function to copy files and directories
function copyRecursive(src, dest) {
  if (!existsSync(src)) {
    console.warn(`⚠ Source path does not exist: ${src}`);
    return;
  }

  const stat = statSync(src);
  
  if (stat.isDirectory()) {
    // Create destination directory if it doesn't exist
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    
    // Read all items in the directory
    const items = readdirSync(src);
    
    // Copy each item
    for (const item of items) {
      const srcPath = join(src, item);
      const destPath = join(dest, item);
      copyRecursive(srcPath, destPath);
    }
  } else {
    // Copy file
    try {
      // Ensure destination directory exists
      const destParent = dirname(dest);
      if (!existsSync(destParent)) {
        mkdirSync(destParent, { recursive: true });
      }
      
      copyFileSync(src, dest);
    } catch (error) {
      console.error(`✗ Error copying ${src} to ${dest}:`, error.message);
      throw error;
    }
  }
}

// Main execution
if (!existsSync(srcDir)) {
  console.error('✗ dist/ directory not found - make sure build completed successfully');
  process.exit(1);
}

try {
  console.log('📦 Copying all files from dist/ to momentzabuild/wwwroot/...');
  copyRecursive(srcDir, destDir);
  console.log('✓ All build files copied successfully to momentzabuild/wwwroot/');
} catch (error) {
  console.error('✗ Error copying files:', error.message);
  process.exit(1);
}

