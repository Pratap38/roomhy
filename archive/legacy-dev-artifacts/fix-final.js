#!/usr/bin/env node

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

const htmlFiles = findHtmlFiles(workspace);

htmlFiles.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;
        
        // All emoji replacements with various encodings
        const replacements = [
            // Emoji/symbols with UTF-8 double encoding
            [/ðŸ'‹/g, '👋'],  // Waving hand
            [/ðŸ' /g, '👠'],  // Shoes
            [/ðŸ'Ž/g, '👎'],  // Thumbs down
            [/ðŸ'‰/g, '👉'],  // Pointing
            [/ðŸ"„/g, '📄'],  // Document
            [/ðŸ"—/g, '📗'],  // Green book
            [/ðŸ"¡/g, '📡'],  // Satellite
            [/ðŸ"¦/g, '📦'],  // Package
            [/ðŸ"Š/g, '📊'],  // Chart
            [/ðŸ"‹/g, '📋'],  // Clipboard
            [/ðŸ"§/g, '📧'],  // Email
            [/ðŸ"ž/g, '📞'],  // Phone
            [/ðŸ'¾/g, '💾'],  // Floppy
            [/ðŸ"¸/g, '📸'],  // Camera
            [/ðŸŎ/g, '🌶'],  // Chili
            [/ðŸŽ‰/g, '🎉'],  // Party
            [/ðŸ'„/g, '💄'],  // Lipstick
            [/ðŸ'¬/g, '💬'],  // Speech
            [/ðŸ'‡/g, '👇'],  // Down
            [/ðŸ'¡/g, '💡'],  // Light
        ];
        
        replacements.forEach(([pattern, replacement]) => {
            content = content.replace(pattern, replacement);
        });
        
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

console.log('\nTotal fixed: ' + fixedCount);
