const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '../../gary the number\'s guy channel youtube transcripts for knowledge base.xlsx');
const outputPath = path.join(__dirname, '../data/transcripts.json');

function cleanTranscript(text) {
  if (!text) return '';
  // Remove timestamps like "00:00 - " or "12:34 - " at the start of lines
  return text.replace(/^\d{2}:\d{2} - /gm, '').replace(/\n\d{2}:\d{2} - /g, '\n');
}

try {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} rows. Processing...`);

  const processedDocs = data.map(row => {
    return {
      content: cleanTranscript(row['Transcript 1']),
      title: row['Title'],
      url: row['URL'],
      description: row['Description'],
      date: row['Date and Time Posted']
    };
  }).filter(doc => doc.content && doc.content.trim().length > 0); // Filter out empty transcripts

  console.log(`Processed ${processedDocs.length} valid transcripts.`);

  fs.writeFileSync(outputPath, JSON.stringify(processedDocs, null, 2));
  console.log(`Saved to ${outputPath}`);

} catch (error) {
  console.error('Error converting Excel:', error);
}

