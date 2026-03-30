const ExcelJS = require('./node_modules/exceljs');

async function createTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Flashcards');
    worksheet.columns = [
        { header: 'Front (Prompt)', key: 'front', width: 40 },
        { header: 'Back (Target Answer)', key: 'back', width: 40 },
        { header: 'Accepted Answers', key: 'accepted', width: 50 },
    ];
    worksheet.addRow({ front: 'What is the powerhouse of the cell?', back: 'Mitochondria', accepted: 'Mitochondrion' });
    worksheet.addRow({ front: 'What classification system is used for male pattern baldness?', back: 'Hamilton-Norwood', accepted: 'Norwood Scale; Norwood' });

    await workbook.xlsx.writeFile('public/Flashcards_Template.xlsx');
    console.log('Template created successfully!');
}

createTemplate();
