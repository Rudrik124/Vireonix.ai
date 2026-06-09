const fs = require('fs');
let data = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
data.compilerOptions.ignoreDeprecations = "5.0"; // fallback
data.compilerOptions.ignoreDeprecations = "6.0"; 
fs.writeFileSync('tsconfig.json', JSON.stringify(data, null, 2));
