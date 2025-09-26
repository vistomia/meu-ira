let semesters = [];
let lockedCourses = [];
let courseStats = { media: null, desvio: null };

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

function calculateTotalIRA() {
    let numerator = 0;
    let denominatorGrades = 0;
    let totalHours = 0;
    let lockedHours = 0;

    // Calculate locked hours

    // Calculate total hours and weighted grades
    semesters.forEach(semester => {
        semester.subjects.forEach(subject => {
            const semesterWeight = Math.min(semester.number, 6);
            numerator += semesterWeight * subject.hours * subject.grade;
            denominatorGrades += semesterWeight * subject.hours;
            totalHours += subject.hours;
        });
    });

    totalHours += lockedHours;

    if (denominatorGrades === 0 || totalHours === 0) return 0;

    const lockedPenalty = 1 - (0.5 * lockedHours) / totalHours;
    const gradeAverage = numerator / denominatorGrades;

    return lockedPenalty * gradeAverage;
}

function calculateIRAGeral() {
        document.getElementById('ira-geral-value').textContent = iraGeral.toFixed(3);
}

function renderSemesters() {
    const container = document.getElementById('semesters-container');
    container.innerHTML = '';

    semesters.forEach(semester => {
        const semesterIRA = calculateSemesterIRA(semester.subjects);
        
        const semesterDiv = document.createElement('div');
        semesterDiv.className = 'semester-section';
        semesterDiv.innerHTML = `
            <div class="semester-header">
                <span class="semester-title">${semester.name}</span>
                <div>
                    <span class="semester-ira">IRA: ${semesterIRA.toFixed(3)}</span>
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
                        <option value="Aprovada" selected>Aprovada</option>
                        <option value="Aproveitada">Aproveitada</option>
                        <option value="Reprovada">Reprovada</option>
                        <option value="Trancada">Trancada</option>
                    </select>
                    <button class="btn btn-add" onclick="addSubject(${semester.id})">Adicionar</button>
                </div>
            </div>

            <div class="subjects-list">
                ${semester.subjects.map(subject => `
                    <div class="subject-item">
                            <div class="subject-name">${parseTitle(subject.name)}</div>
                            <div class="subject-hours">${subject.hours}h</div>
                            <div class="subject-grade">${String(subject.grade.toFixed(1))}</div>
                            <div class="subject-status">${subject.status}</div>
                            <div><button class="btn btn-remove" onclick="removeSubject(${semester.id}, ${subject.id})"><i class="fas fa-times"></i></button></div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(semesterDiv);
    });
}

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
                <button class="btn btn-backup" onclick="exportBackup()">📤 Exportar Backup</button>
                <label class="btn btn-import" for="import-file">📥 Importar Backup</label>
                <input type="file" id="import-file" accept=".json" style="display: none;" onchange="importBackup(this.files[0])">
                <button class="btn btn-clear" onclick="clearAllData()"><i class="fas fa-times"></i> Limpar Tudo</button>
                <button class="btn btn-star" onclick="window.open('https://github.com/vistomia/meu-ira', '_blank')"><i class="fas fa-star"></i>  Dê uma estrela no GitHub</button>
            </div>
        </div>
    `;
}

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
