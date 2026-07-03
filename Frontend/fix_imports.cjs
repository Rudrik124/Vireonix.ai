const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js') || dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const frontendDir = path.join(__dirname, 'src');
const files = walkSync(frontendDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /from\s+["'](\.\.\/)+Backend\/supabase(\.js)?["']/g;
  
  // Do not use .test() with global regex before .replace()
  if (content.match(regex)) {
    const newContent = content.replace(regex, 'from "@/lib/supabase"');
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Total files updated: ${changedFiles}`);
