function parseAcademicData(data) {
    const matches = data.match(/202\d\.\d/g);

    if (matches) {
        // If you want to extract text between first and last occurrence
        const firstIndex = data.indexOf(matches[0]);
        const lastIndex = data.lastIndexOf(matches[matches.length - 1]) + 6; // +6 to include "202X.X"

        const extractedData = data.substring(firstIndex, lastIndex);
        data = extractedData.split(/(202\d\.\d)/gi).filter(item => item.trim() !== '').reduce((acc, item, index, arr) => {
            if (item.match(/202\d\.\d/gi) && index + 1 < arr.length) {
                acc.push(item + ' ' + arr[index + 1]);
                return acc;
            }
            if (index === 0 || !arr[index - 1].match(/202\d\.\d/gi)) {
                acc.push(item);
            }
            return acc;
        }, []);

        // Remove items that don't start with \d\d\d\d.\d pattern
        data = data.filter(item => /^\d{4}\.\d/.test(item.trim()));
    }

    // Extract only the academic records (components curriculares)
    const academicRecords = data.filter(item => {
        const trimmed = item.trim();
        // Only keep items that start with year pattern, contain course codes, and have valid academic status
        return /^\d{4}\.\d/.test(trimmed) && 
               /QXD\d+|EXT\d+|SIQXD\d+/.test(trimmed) &&
               /\s+(APROVADO|REPROVADO|MATRICULADO|TRANCADO|APROVEITADO)\s/.test(trimmed) &&
               !/MATRÍCULA|INGRESSO|ENTRADA/.test(trimmed.toUpperCase());
    });

    const parsedRecords = academicRecords.map(record => {
        const trimmed = record.trim().replace(/[&§*#@]/g, '');

        console.log(trimmed);

        // Extract semester (year.period)
        const semestreMatch = trimmed.match(/^\d{4}\.\d/);
        const semestre = semestreMatch ? semestreMatch[0] : '';

        // Extract course name (after semester, before code)
        const nomeMatch = trimmed.match(/^\d{4}\.\d\s+(.+?)\s+\d+A?\s+/);
        const nome = nomeMatch ? nomeMatch[1].trim() : '';

        // Extract situation (APROVADO, REPROVADO, MATRICULADO, TRANCADO, APROVEITADO, etc.)
        const situacaoMatch = trimmed.match(/\s+(APROVADO|REPROVADO|MATRICULADO|TRANCADO|APROVEITADO)(\s+MÉDIA)?/);
        const situacao = situacaoMatch ? situacaoMatch[1] + (situacaoMatch[2] || '') : '';

        // Extract hours (last number before "Docente(s)")
        const horasMatch = trimmed.match(/(\d+\.?\d*)\s+Docente\(s\)/);
        const horas = horasMatch ? parseFloat(horasMatch[1]) : -1;

        // Extract grade (number before hours, ignoring 'e' characters)
        const cleanedForGrade = trimmed.replace(/\s+e\s+/g, ' ');
        const notaMatch = cleanedForGrade.match(/(\d+\.?\d+)\s+\d+\.?\d*\s+Docente\(s\)/);
        const nota = notaMatch ? parseFloat(notaMatch[1]) : -1;
        console.log(notaMatch)
        
        return {
            semestre,
            nome: nome.toLowerCase(),
            situacao: situacao.toLowerCase(),
            horas,
            nota
        };
    });

    // Filter out invalid records (missing required fields)
    const validRecords = parsedRecords.filter(record => 
        record.semestre && 
        record.nome && 
        record.situacao &&
        record.nome !== 'matrícula' &&
        record.nome !== 'ingresso'
    );

    // Group records by semester
    const groupedBySemester = {};

    validRecords.forEach(record => {
        if (!groupedBySemester[record.semestre]) {
            groupedBySemester[record.semestre] = [];
        }
        groupedBySemester[record.semestre].push(record);
    });

    // Convert to the desired format
    const semestersNew = Object.keys(groupedBySemester)
        .sort()
        .map((semester, index) => ({
            id: Date.now() + index,
            name: `${index + 1}º Semestre`,
            number: index + 1,
            subjects: groupedBySemester[semester].map(record => ({
                id: Date.now() + Math.random() * 100000,
                name: record.nome,
                hours: record.horas,
                grade: record.nota,
                status: record.situacao // Added status field
            }))
        }));

    const result = {
        semestersNew,
        version: "1.0"
    };

    let ado = result;
    semesters = ado.semestersNew || [];
    courseStats = ado || { media: null, desvio: null };
    renderAll();
    
    // Restore IRA Geral form values
    if (courseStats.media !== null) {
        document.getElementById('curso-media').value = courseStats.media;
    }
    if (courseStats.desvio !== null) {
        document.getElementById('curso-desvio').value = courseStats.desvio;
    }
}
