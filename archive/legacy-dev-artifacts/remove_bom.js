const fs = require('fs');
const path = require('path');

function removeBOM(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        let content = buffer.toString('utf8');

        // Check for BOM (Byte Order Mark)
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1); // Remove BOM
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Removed BOM from: ${filePath}`);
            return true;
        }
    } catch (e) {
        console.error(`Error with ${filePath}: ${e.message}`);
    }
    return false;
}

function walkDirectory(dir) {
    let fixedCount = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixedCount += walkDirectory(filePath);
        } else if (file.endsWith('.html')) {
            if (removeBOM(filePath)) {
                fixedCount++;
            }
        }
    }

    return fixedCount;
}

const rootDir = '.';
const fixedCount = walkDirectory(rootDir);
console.log(`\nTotal BOMs removed: ${fixedCount}`);