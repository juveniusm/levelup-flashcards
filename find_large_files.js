const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
const largeFiles = [];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        if (lines > 250) {
            largeFiles.push({ file: path.relative(process.cwd(), file), lines });
        }
    } catch (err) {
        console.error("Error reading file:", file);
    }
});

console.log(JSON.stringify(largeFiles, null, 2));
