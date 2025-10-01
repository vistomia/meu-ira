let semesters = [];
let lockedCourses = [];
let courseStats = { media: null, desvio: null };
// --- ADDED START ---
// State to track which subject is currently being edited
let editingSubject = { semesterId: null, subjectId: null };
// --- ADDED END ---

// Light mode functionality
function toggleLightMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeToggleButton(newTheme);
}

function updateThemeToggleButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        button.textContent = '☀️';
    } else {
        button.textContent = '🌙';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleButton(savedTheme);
}

function addSemester() {
    const semesterNumber = semesters.length + 1;
    const semester = {
        id: Date.now(),
        name: `${semesterNumber}º Semestre`,
        number: semesterNumber,
        subjects: []
    };
    semesters.push(semester);
    renderAll();
}

function removeSemester(semesterId) {
    semesters = semesters.filter(s => s.id !== semesterId);
    updateSemesterNames();
    renderAll();
}

function updateSemesterNames() {
    semesters.forEach((semester, index) => {
        semester.name = `${index + 1}º Semestre`;
        semester.number = index + 1;
    });
}

function addSubject(semesterId) {
    const semester = semesters.find(s => s.id === semesterId);
    const nameInput = document.getElementById(`subject-name-${semesterId}`);
    const hoursInput = document.getElementById(`subject-hours-${semesterId}`);
    const gradeInput = document.getElementById(`subject-grade-${semesterId}`);
    const statusInput = document.getElementById(`subject-status-${semesterId}`);

    const name = nameInput.value.trim();
    const hours = parseInt(hoursInput.value);
    const grade = parseFloat(gradeInput.value);
    const status = statusInput.value.trim();

    if (name && hours > 0 && grade >= 0 && grade <= 10) {
        semester.subjects.push({
            id: Date.now(),
            name,
            hours,
            grade,
            status
        });

        nameInput.value = '';
        hoursInput.value = '';
        gradeInput.value = '';
        statusInput.value = '';

        renderAll();
    } else {
        alert('Por favor, preencha todos os campos corretamente!\nNota deve ser entre 0 e 10.');
    }
}

function removeSubject(semesterId, subjectId) {
    const semester = semesters.find(s => s.id === semesterId);
    semester.subjects = semester.subjects.filter(sub => sub.id !== subjectId);
    renderAll();
}

// --- ADDED START ---
// Toggles the edit mode for a specific subject
function toggleEdit(semesterId, subjectId) {
    editingSubject = { semesterId, subjectId };
    renderAll();
}

// Cancels the editing mode
function cancelEdit() {
    editingSubject = { semesterId: null, subjectId: null };
    renderAll();
}

// Saves the edited subject data
function saveSubject(semesterId, subjectId) {
    const semester = semesters.find(s => s.id === semesterId);
    const subject = semester.subjects.find(sub => sub.id === subjectId);

    // Get new values from the input fields in the edit row
    const newName = document.getElementById(`edit-name-${subjectId}`).value.trim();
    const newHours = document.getElementById(`edit-hours-${subjectId}`).value == '' ? -1 : parseInt(document.getElementById(`edit-hours-${subjectId}`).value);
    const newGrade = parseFloat(document.getElementById(`edit-grade-${subjectId}`).value);
    const newStatus = document.getElementById(`edit-status-${subjectId}`).value;

    
    subject.name = newName ? newName : subject.name;
    subject.hours = Math.max(newHours, 0);
    if (newStatus.toLowerCase() === 'trancado' || newStatus.toLowerCase() === 'matriculado') {
        subject.grade = -1; // For locked or enrolled subjects, set grade to -1
    } else if (!isNaN(newGrade)) {
        subject.grade = Math.min(Math.max(newGrade, -1), 10);
    } else {
        subject.grade = -1; // Default to -1 if input is empty or invalid
    }
    subject.status = newStatus;
        
    cancelEdit(); // This will reset the editing state and call renderAll()
}
// --- ADDED END ---


function calculateSemesterIRA(subjects) {
    if (subjects.length === 0) return 0;
    
    let totalPoints = 0;
    let totalHours = 0;

    subjects.forEach(subject => {
        totalPoints += subject.grade * subject.hours;
        totalHours += subject.hours;
    });

    return totalHours > 0 ? (totalPoints / totalHours) : 0;
}

// --- BUG FIX START ---
function calculateTotalIRA() {
    let numerator = 0;
    let denominatorGrades = 0;
    let totalGradedHours = 0; // Horas de disciplinas com nota
    let lockedHours = 0;      // Horas de disciplinas trancadas

    semesters.forEach(semester => {
        semester.subjects.forEach(subject => {
            // Verifica se a disciplina está trancada e soma as horas
            if (subject.status.toLowerCase() === 'trancado') {
                lockedHours += subject.hours;
            } 
            // Se não estiver trancada e tiver uma nota válida, processa para a média
            else if (subject.grade !== -1) { 
                const semesterWeight = Math.min(semester.number, 6);
                numerator += semesterWeight * subject.hours * subject.grade;
                denominatorGrades += semesterWeight * subject.hours;
                totalGradedHours += subject.hours;
            }
        });
    });

    // O total de horas para o cálculo da penalidade é a soma de todas as horas cursadas (com nota ou trancadas)
    const totalHours = totalGradedHours + lockedHours;

    // Evita divisão por zero se não houver disciplinas
    if (denominatorGrades === 0) return 0;
    if (totalHours === 0) {
        // Se houver notas mas o total de horas for 0 (caso raro), retorna a média simples
        return numerator / denominatorGrades;
    }

    // 1. Calcula a penalidade corretamente. Se lockedHours for 0, o resultado é 1 (sem penalidade).
    const lockedPenalty = 1 - (0.5 * lockedHours) / totalHours;
    
    // 2. Calcula a média ponderada das notas.
    const gradeAverage = numerator / denominatorGrades;

    // 3. Aplica a penalidade à média.
    return lockedPenalty * gradeAverage;
}
// --- BUG FIX END ---


function calculateIRAGeral() {
        document.getElementById('ira-geral-value').textContent = iraGeral.toFixed(3);
}

// --- MODIFIED ---
function renderSemesters() {
    const container = document.getElementById('semesters-container');
    container.innerHTML = '';

    semesters.forEach(semester => {
        const semesterIRA = calculateSemesterIRA(semester.subjects);
        
        const semesterDiv = document.createElement('div');
        semesterDiv.className = 'semester-section';
        semesterDiv.innerHTML = `
            <div class="semester-header">
                <span class="semester-title">${semester.number}º Semestre</span>
                <div>
                    <span class="semester-ira">IRA: ${semesterIRA.toFixed(3) == -1 ? 'N/A' : semesterIRA.toFixed(3)}</span>
                    <button class="btn btn-remove" onclick="removeSemester(${semester.id})"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-group">
                    <input type="text" id="subject-name-${semester.id}" placeholder="Nome da disciplina" />
                    <select id="subject-hours-${semester.id}">
                        <option value="32">32h</option>
                        <option value="64" selected>64h</option>
                        <option value="96">96h</option>
                        </select>
                        <input type="number" id="subject-grade-${semester.id}" placeholder="Nota" min="0" max="10" step="0.1" />
                    <select id="subject-status-${semester.id}">
                        <option value="Aprovado">Aprovado</option>
                        <option value="Aprovado Média" selected>Aprovado Média</option>
                        <option value="Aproveitado">Aproveitado</option>
                        <option value="Reprovado">Reprovado</option>
                        <option value="Trancado">Trancado</option>
                        <option value="Matriculado">Matriculado</option>
                        </select>
                    <button class="btn btn-add" onclick="addSubject(${semester.id})">Adicionar</button>
                </div>
            </div>

            <div class="subjects-list">
                ${semester.subjects.map(subject => {
                    // Check if the current subject is the one being edited
                    if (editingSubject.subjectId === subject.id && editingSubject.semesterId === semester.id) {
                        return `
                        <div class="subject-item editing">
                            <input type="text" id="edit-name-${subject.id}" value="${subject.name}" class="edit-input"/>
                            
                            <select id="edit-hours-${subject.id}" class="edit-input">
                                <option value="32" ${subject.hours === 32 ? 'selected' : ''}>32h</option>
                                <option value="64" ${subject.hours === 64 ? 'selected' : ''}>64h</option>
                                <option value="96" ${subject.hours === 96 ? 'selected' : ''}>96h</option>
                            </select>
                            
                            <input type="number" id="edit-grade-${subject.id}" value="${subject.grade.toFixed(1) == -1.0 ? '' : subject.grade.toFixed(1)}" min="0" max="10" step="0.1" class="edit-input"/>
                            
                            <select id="edit-status-${subject.id}" class="edit-input">
                                <option value="Aprovado" ${subject.status === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
                                <option value="Aprovado Média" ${subject.status === 'Aprovado Média' ? 'selected' : ''}>Aprovado Média</option>
                                <option value="Aproveitado" ${subject.status === 'Aproveitado' ? 'selected' : ''}>Aproveitado</option>
                                <option value="Reprovado" ${subject.status === 'Reprovado' ? 'selected' : ''}>Reprovado</option>
                                <option value="Trancado" ${subject.status === 'Trancado' ? 'selected' : ''}>Trancado</option>
                                <option value="Matriculado" ${subject.status === 'Matriculado' ? 'selected' : ''}>Matriculado</option>
                            </select>
                            
                            <div class="subject-actions">
                                <button class="btn btn-save" onclick="saveSubject(${semester.id}, ${subject.id})"><i class="fas fa-check"></i></button>
                                <button class="btn btn-cancel" onclick="cancelEdit()"><i class="fas fa-times"></i></button>
                            </div>
                        </div>`;
                    } else {
                        // --- RENDER DISPLAY MODE ---
                        return `
                        <div class="subject-item">
                            <div class="subject-name">${parseTitle(subject.name)}</div>
                            <div class="subject-hours">${subject.hours != -1 ? subject.hours + "h" : '~'}</div>
                            <div class="subject-grade">${String(subject.grade.toFixed(1) == -1.0 ? 'N/A' : subject.grade.toFixed(1))}</div>
                            <div class="subject-status">${subject.status}</div>
                            <div class="subject-actions">
                                <button class="btn btn-edit" onclick="toggleEdit(${semester.id}, ${subject.id})"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn btn-remove" onclick="removeSubject(${semester.id}, ${subject.id})"><i class="fas fa-times"></i></button>
                            </div>
                        </div>`;
                    }
                }).join('')}
            </div>
        `;
        container.appendChild(semesterDiv);
    });
}
// --- END MODIFIED SECTION ---

function saveData() {
    localStorage.setItem('meuIRA', JSON.stringify({
        semesters,
        courseStats
    }));
}

function loadData() {
    const saved = localStorage.getItem('meuIRA');
    if (saved) {
        const data = JSON.parse(saved);
        semesters = data.semesters || [];
        courseStats = data.courseStats || { media: null, desvio: null };
        renderAll();
        
        // Restore IRA Geral form values
        if (courseStats.media !== null) {
            document.getElementById('curso-media').value = courseStats.media;
        }
        if (courseStats.desvio !== null) {
            document.getElementById('curso-desvio').value = courseStats.desvio;
        }
    }
}

function exportBackup() {
    const data = {
        semesters,
        version: '1.0'
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-ira-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importBackup(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (data.semesters && Array.isArray(data.semesters) && 
                data.lockedCourses && Array.isArray(data.lockedCourses)) {
                
                if (confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                    semesters = data.semesters;
                    lockedCourses = data.lockedCourses;
                    
                    // Update semester numbers to ensure consistency
                    updateSemesterNames();
                    
                    renderAll();
                    alert('Backup importado com sucesso!');
                }
            } else {
                alert('Arquivo de backup inválido!');
            }
        } catch (error) {
            alert('Erro ao ler o arquivo de backup. Verifique se o arquivo é válido.');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Isso irá apagar todos os dados permanentemente. Deseja continuar?')) {
        semesters = [];
        lockedCourses = [];
        localStorage.removeItem('meuIRA');
        renderAll();
        addSemester(); // Add first semester
        alert('Todos os dados foram removidos!');
    }
}

function renderBackupControls() {
    const container = document.getElementById('backup-controls');
    if (!container) return;
    
    container.innerHTML = `
        <div class="backup-section">
            <div class="backup-buttons">
                <button class="btn btn-backup" onclick="exportBackup()"><i class="fas fa-upload"></i> Exportar Backup</button>
                <label class="btn btn-import" for="import-file"><i class="fas fa-download"></i> Importar Backup</label>
                <input type="file" id="import-file" accept=".json" style="display: none;" onchange="importBackup(this.files[0])">
                <button class="btn btn-clear" onclick="clearAllData()"><i class="fas fa-times"></i> Limpar Tudo</button>
                <button class="btn btn-star" onclick="window.open('https://github.com/vistomia/meu-ira', '_blank')"><i class="fas fa-star"></i> Dê uma estrela no GitHub</button>
            </div>
        </div>
    `;
}

// Course data with average and standard deviation
const courseData = {
    'CC': { media: 7.06818247, desvio: 1.6854862, name: 'Ciência da Computação' },
    'SI': { media: 7.22044086, desvio: 1.78380585, name: 'Sistemas de Informação' },
    'ES': { media: 7.76488256, desvio: 1.56872928, name: 'Engenharia de Software' },
    'EC': { media: 6.2446, desvio: 2.0459, name: 'Engenharia da Computação' },
    'RC': { media: 6.31597328, desvio: 2.03052092, name: 'Redes de Computadores' },
    'DD': { media: 8.37783527, desvio: 1.23697138, name: 'Design Digital' },
    'OUTRO': { media: null, desvio: null, name: 'Outro / Não sei' }
};

// Handle course selection change
document.getElementById('curso-select').addEventListener('change', function() {
    const selectedCourse = this.value;
    if (selectedCourse && courseData[selectedCourse]) {
        courseStats.media = courseData[selectedCourse].media;
        courseStats.desvio = courseData[selectedCourse].desvio;
        
        // Update the input fields to show the selected values
        document.getElementById('curso-media').value = courseStats.media;
        document.getElementById('curso-desvio').value = courseStats.desvio;
        
        if (selectedCourse === 'OUTRO') {
            document.getElementById('curso-media').disabled = false;
            document.getElementById('curso-desvio').disabled = false;
        } else {
            document.getElementById('curso-media').disabled = true;
            document.getElementById('curso-desvio').disabled = true;
        }
        
        document.getElementById('curso-media').value = courseData[selectedCourse].media;
        document.getElementById('curso-desvio').value = courseData[selectedCourse].desvio;

        renderAll();
    }
});

// Keep the manual input listeners for custom values
document.getElementById('curso-media').addEventListener('input', renderAll);
document.getElementById('curso-desvio').addEventListener('input', renderAll);

function renderAll() {
    renderSemesters();
    renderBackupControls();
    
    // Update total IRA
    const totalIRA = calculateTotalIRA();
    document.getElementById('total-ira').textContent = totalIRA.toFixed(4);
    
    courseStats.desvio = parseFloat(document.getElementById('curso-desvio').value) || null;
    courseStats.media = parseFloat(document.getElementById('curso-media').value) || null;
    // Update IRA Geral if course stats are available
    if (courseStats.media !== null && courseStats.desvio !== null && totalIRA > 0) {
        const iraGeral = 6 + 2 * ((totalIRA - courseStats.media) / courseStats.desvio);
        document.getElementById('ira-geral-value').textContent = iraGeral.toFixed(3);
    }
    
    // Save to localStorage
    saveData();
}

// Allow adding subjects with Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        if (e.target.id === 'locked-name' || e.target.id === 'locked-hours') {
            addLockedCourse();
        } else {
            const semesterId = e.target.id.split('-').pop();
            if (semesterId && !isNaN(semesterId)) {
                addSubject(parseInt(semesterId));
            }
        }
    }
});

// Load theme and data on startup
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    loadData();
    
    // Add first semester if none exist
    if (semesters.length === 0) {
        addSemester();
    }
});