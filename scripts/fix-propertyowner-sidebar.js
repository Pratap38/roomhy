const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FOLDER = path.join(ROOT, 'propertyowner');

const targets = [
  { icon: 'mail', href: 'enquiry.html', label: 'Enquiry' },
  { icon: 'file-text', href: 'documents.html', label: 'Document' },
  { icon: 'star', href: 'review.html', label: 'Reviews' },
  { icon: 'alert-circle', href: 'complaints.html', label: 'Complaints' }
];

const files = fs.readdirSync(FOLDER).filter((f) => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(FOLDER, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    let handled = false;
    for (const target of targets) {
      if (trimmed.includes(`data-lucide=\"${target.icon}\"`)) {
        // find previous non-empty line
        let j = out.length - 1;
        while (j >= 0 && out[j].trim() === '') j -= 1;
        const prev = j >= 0 ? out[j] : '';
        if (!prev.includes('<a ')) {
          const indent = line.match(/^\s*/)?.[0] || '';
          out.push(`${indent}<a href=\"${target.href}\" class=\"sidebar-link flex items-center px-6 py-3\">`);
        }
        out.push(line);
        handled = true;
        break;
      }
    }
    if (handled) continue;
    out.push(line);
  }

  const updated = out.join('\n');
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

console.log('Patched propertyowner sidebar anchors.');
