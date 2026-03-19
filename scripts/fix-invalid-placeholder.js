const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FOLDERS = ['website','superadmin','tenant','propertyowner','digital-checkin'];

const badPlaceholderRegex = /placeholder\s*[^=]*=\s*([^\s>]*)([^\r\n>]*¢[^\r\n>]*)/gi;

for (const folder of FOLDERS) {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const before = content;

    // Fix invalid placeholder sequences (contains ¢)
    content = content.replace(/placeholder\s*([^=]*)=\s*[^\r\n>]*¢[^\r\n>]*/gi, (m) => {
      return 'placeholder=""';
    });

    // Also fix stray ¢ characters in attributes generally by removing
    content = content.replace(/¢/g, '');

    if (content !== before) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

console.log('Fixed invalid placeholder characters in HTML files.');
