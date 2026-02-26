const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'existing-data.xlsx'));
console.log('Sheet names:', wb.SheetNames);

wb.SheetNames.forEach(name => {
    console.log(`\n=== Sheet: "${name}" ===`);
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    data.forEach((row, i) => {
        if (row.length > 0) {
            console.log(`Row ${i + 1}: ${row.join(' | ')}`);
        }
    });
});
