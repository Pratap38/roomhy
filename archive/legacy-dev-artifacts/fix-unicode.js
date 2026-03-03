const fs = require('fs');
const path = require('path');

const workspace = 'c:\\Users\\yasmi\\OneDrive\\Desktop\\roomhy final';

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

let fixedCount = 0;
let totalFiles = 0;

const htmlFiles = findHtmlFiles(workspace);

htmlFiles.forEach(filePath => {
    totalFiles++;
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;
        
        // Fix all emoji sequences that have UTF-8 double-encoding (ðŸ variations)
        // These match the pattern: UTF-8 surrogates for emoji
        content = content.replace(/ðŸ'‹/g, '👋');  // Waving hand
        content = content.replace(/ðŸ' /g, '👠');  // Shoes
        content = content.replace(/ðŸ'Ž/g, '👎');  // Thumbs down
        content = content.replace(/ðŸ'‰/g, '👉');  // Pointing right
        content = content.replace(/ðŸ"„/g, '📄');  // Document
        content = content.replace(/ðŸ"—/g, '📗');  // Green book
        content = content.replace(/ðŸ"¡/g, '📡');  // Satellite
        content = content.replace(/ðŸ"¦/g, '📦');  // Package
        content = content.replace(/ðŸ"Š/g, '📊');  // Chart
        content = content.replace(/ðŸ"Š/g, '📊');  // Chart (variant)
        content = content.replace(/ðŸ"‹/g, '📋');  // Clipboard
        content = content.replace(/ðŸ"—/g, '📗');  // Notebook
        content = content.replace(/ðŸ"± /g, '📱');  // Mobile phone
        content = content.replace(/ðŸ"§/g, '📧');  // Email
        content = content.replace(/ðŸ"ž/g, '📞');  // Phone
        content = content.replace(/ðŸ'¾/g, '💾');  // Floppy disk
        content = content.replace(/ðŸ"¸/g, '📸');  // Camera
        content = content.replace(/ðŸŎ/g, '🌶');  // Chili pepper
        content = content.replace(/ðŸŽ‰/g, '🎉');  // Party popper
        content = content.replace(/ðŸ'„/g, '💄');  // Lipstick
        content = content.replace(/ðŸ'¬/g, '💬');  // Speech bubble
        content = content.replace(/ðŸ'‡/g, '👇');  // Pointing down
        content = content.replace(/ðŸ'¡/g, '💡');  // Light bulb
        content = content.replace(/ðŸ'¡/g, '💡');  // Lightbulb (variant)
        content = content.replace(/ðŸ›–/g, '🛎');  // Bellhop
        content = content.replace(/ðŸ'˜/g, '👘');  // Kimono
        
        // Fix checkmark and cross symbols
        content = content.replace(/âœ…/g, '✅');
        content = content.replace(/âœ"/g, '✔');
        content = content.replace(/âœ•/g, '✕');
        content = content.replace(/âŒ/g, '❌');
        
        // Fix star symbols
        content = content.replace(/â˜…/g, '★');
        content = content.replace(/â˜†/g, '☆');
        
        // Fix dash and quotes
        content = content.replace(/â€"/g, '–');
        content = content.replace(/â€™/g, '\'');
        content = content.replace(/â€œ/g, '"');
        content = content.replace(/â€/g, '"');
        
        // Fix other symbols
        content = content.replace(/â„¹ï¸/g, 'ℹ️');
        content = content.replace(/âš ï¸/g, '⚠️');
        content = content.replace(/âš /g, '⚠');
        content = content.replace(/â€¢/g, '•');
        content = content.replace(/âž–/g, '➖');
        content = content.replace(/â†'/g, '→');
        content = content.replace(/â†—/g, '↑');
        content = content.replace(/â¤ï¸/g, '❤️');
        content = content.replace(/Â©/g, '©');
        content = content.replace(/Â /g, '');
        content = content.replace(/â³/g, '⏳');
        content = content.replace(/â­ï¸/g, '⭐');
        content = content.replace(/â­/g, '⭐');
        
        // Fix checkmark symbols
        content = content.replace(/âœ…/g, '✅');
        content = content.replace(/âœ"/g, '✔');
        content = content.replace(/âœ•/g, '✕');
        content = content.replace(/âŒ/g, '❌');
        
        // Fix star symbols
        content = content.replace(/â˜…/g, '★');
        content = content.replace(/â˜†/g, '☆');
        
        // Fix dash and quotes
        content = content.replace(/â€"/g, '–');
        content = content.replace(/â€™/g, '\'');
        content = content.replace(/â€œ/g, '"');
        content = content.replace(/â€/g, '"');
        
        // Fix other symbols
        content = content.replace(/â„¹ï¸/g, 'ℹ️');
        content = content.replace(/âš ï¸/g, '⚠️');
        content = content.replace(/âš /g, '⚠');
        content = content.replace(/â€¢/g, '•');
        content = content.replace(/âž–/g, '➖');
        content = content.replace(/â†'/g, '→');
        content = content.replace(/â†—/g, '↑');
        
        // Write back if changed
        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            const relPath = path.relative(workspace, filePath);
            console.log('Fixed: ' + relPath);
            fixedCount++;
        }
    } catch (err) {
        console.error('Error: ' + err.message);
    }
});

console.log('\nProcessed ' + totalFiles + ' files');
console.log('Fixed ' + fixedCount + ' files');
