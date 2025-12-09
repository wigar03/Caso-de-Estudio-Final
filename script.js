// Variables globales
let currentUser = null;
let currentRole = null;
let tasks = [];
let uploadedFiles = [];
let notifications = [];
let chatMessages = [];
let currentTaskModal = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let documentVersions = [];
let badges = [];
let documentContent = '';
let autoSaveTimer = null;
let votes = [];
let meetings = [];
let auditLogs = [];
let backups = [];
let templates = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('currentRole');
    
    if (savedUser && savedRole) {
        currentUser = savedUser;
        currentRole = savedRole;
        showUserBar();
    } else {
        showLoginModal();
    }

    initializeNavigation();
    initializeLogin();
    initializeTasks();
    initializeFiles();
    initializeChat();
    initializeCalendar();
    initializeNotifications();
    initializeThemeToggle();
    initializeKanban();
    initializeEditor();
    initializeTimeline();
    initializeGlobalSearch();
    initializeBadges();
    initializeVotes();
    initializeMeetings();
    initializeAnalytics();
    initializeAudit();
    initializeTemplates();
    loadData();
});

// Navegación
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                if (targetId === 'dashboard') {
                    updateDashboard();
                }
            }
        });
    });
}

// Sistema de Login
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('show');
}

function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.querySelector('.close-modal');
    const logoutBtn = document.getElementById('logoutBtn');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;

        if (!username || !password || !role) {
            alert('Por favor completa todos los campos');
            return;
        }

        currentUser = username;
        currentRole = role;
        
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('currentRole', currentRole);
        
        loginModal.classList.remove('show');
        showUserBar();
        addNotification('Bienvenido', `Has iniciado sesión como ${getRoleName(role)}`, 'success');
        updateDashboard();
    });

    closeModal.addEventListener('click', function() {
        loginModal.classList.remove('show');
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                currentUser = null;
                currentRole = null;
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentRole');
                document.getElementById('userBar').style.display = 'none';
                showLoginModal();
            }
        });
    }
}

function showUserBar() {
    const userBar = document.getElementById('userBar');
    const currentUserSpan = document.getElementById('currentUser');
    const currentRoleSpan = document.getElementById('currentRole');
    
    if (userBar && currentUser && currentRole) {
        userBar.style.display = 'block';
        currentUserSpan.textContent = currentUser;
        currentRoleSpan.textContent = getRoleName(currentRole);
    }
}

function getRoleName(role) {
    const roles = {
        'coordinador': 'Coordinador',
        'diseñador': 'Diseñador Instruccional',
        'editor': 'Editor de Contenido',
        'programador': 'Programador Web',
        'multimedia': 'Especialista Multimedia',
        'revisor': 'Revisor'
    };
    return roles[role] || role;
}

// Gestión de Tareas Mejorada
function initializeTasks() {
    const taskForm = document.getElementById('taskForm');
    const taskSearch = document.getElementById('taskSearch');
    const filterPriority = document.getElementById('filterPriority');
    const filterAssignee = document.getElementById('filterAssignee');
    const filterStatus = document.getElementById('filterStatus');

    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const assignee = document.getElementById('taskAssignee').value;
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const tags = document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t);

        if (!title || !assignee) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        const newTask = {
            id: Date.now(),
            title,
            description,
            assignee,
            priority,
            dueDate,
            tags,
            completed: false,
            createdAt: new Date().toLocaleDateString('es-ES'),
            createdBy: currentUser,
            comments: []
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateDashboard();
        addNotification('Nueva Tarea', `Tarea "${title}" creada y asignada a ${getRoleName(assignee)}`, 'info');
        
        taskForm.reset();
    });

    // Filtros y búsqueda
    [taskSearch, filterPriority, filterAssignee, filterStatus].forEach(element => {
        if (element) {
            element.addEventListener('input', renderTasks);
            element.addEventListener('change', renderTasks);
        }
    });
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const tasksContainer = document.getElementById('tasksContainer');
    if (!tasksContainer) return;

    const searchTerm = document.getElementById('taskSearch')?.value.toLowerCase() || '';
    const filterPriorityValue = document.getElementById('filterPriority')?.value || '';
    const filterAssigneeValue = document.getElementById('filterAssignee')?.value || '';
    const filterStatusValue = document.getElementById('filterStatus')?.value || '';

    let filteredTasks = tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = !filterPriorityValue || task.priority === filterPriorityValue;
        const matchesAssignee = !filterAssigneeValue || task.assignee === filterAssigneeValue;
        const matchesStatus = !filterStatusValue || 
            (filterStatusValue === 'completed' && task.completed) ||
            (filterStatusValue === 'pending' && !task.completed);
        
        return matchesSearch && matchesPriority && matchesAssignee && matchesStatus;
    });

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-tasks">No se encontraron tareas con los filtros seleccionados.</p>';
        return;
    }

    tasksContainer.innerHTML = filteredTasks.map((task, index) => {
        const actualIndex = tasks.findIndex(t => t.id === task.id);
        const priorityClass = `priority-${task.priority}`;
        const dueDateClass = getDueDateClass(task.dueDate);
        const dueDateText = task.dueDate ? formatDueDate(task.dueDate) : '';

        return `
            <div class="task-item ${priorityClass}" onclick="openTaskModal(${actualIndex})">
                <div class="task-content">
                    <div class="task-title">${task.completed ? '✓ ' : ''}${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-meta">
                        Asignado a: ${getRoleName(task.assignee)} | Prioridad: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        ${dueDateText ? ` | Vence: ${dueDateText}` : ''}
                    </div>
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${dueDateText ? `<div class="task-due-date ${dueDateClass}">${dueDateText}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="complete-btn" onclick="event.stopPropagation(); completeTask(${actualIndex})">${task.completed ? 'Reabrir' : 'Completar'}</button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteTask(${actualIndex})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function getDueDateClass(dueDate) {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return '';
}

function formatDueDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

window.completeTask = function(index) {
    tasks[index].completed = !tasks[index].completed;
    tasks[index].completedAt = tasks[index].completed ? new Date().toLocaleDateString('es-ES') : null;
    saveTasks();
    renderTasks();
    updateDashboard();
    addNotification('Tarea Actualizada', `Tarea "${tasks[index].title}" ${tasks[index].completed ? 'completada' : 'reabierta'}`, 'success');
};

window.deleteTask = function(index) {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
        const taskTitle = tasks[index].title;
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
        updateDashboard();
        addNotification('Tarea Eliminada', `Tarea "${taskTitle}" eliminada`, 'warning');
    }
};

window.openTaskModal = function(index) {
    const task = tasks[index];
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTaskTitle');
    const modalContent = document.getElementById('modalTaskContent');
    const commentsContainer = document.getElementById('taskComments');
    
    currentTaskModal = index;
    
    modalTitle.textContent = task.title;
    modalContent.innerHTML = `
        <div class="task-details">
            <p><strong>Descripción:</strong> ${task.description || 'Sin descripción'}</p>
            <p><strong>Asignado a:</strong> ${getRoleName(task.assignee)}</p>
            <p><strong>Prioridad:</strong> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>
            <p><strong>Estado:</strong> ${task.completed ? 'Completada' : 'Pendiente'}</p>
            ${task.dueDate ? `<p><strong>Fecha de vencimiento:</strong> ${formatDueDate(task.dueDate)}</p>` : ''}
            ${task.tags && task.tags.length > 0 ? `<p><strong>Etiquetas:</strong> ${task.tags.join(', ')}</p>` : ''}
            <p><strong>Creada por:</strong> ${task.createdBy || 'Sistema'}</p>
            <p><strong>Fecha de creación:</strong> ${task.createdAt}</p>
        </div>
    `;
    
    // Renderizar comentarios
    if (task.comments && task.comments.length > 0) {
        commentsContainer.innerHTML = task.comments.map(comment => `
            <div class="comment-item">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-time">${comment.time}</span>
                <p class="comment-text">${comment.text}</p>
            </div>
        `).join('');
    } else {
        commentsContainer.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No hay comentarios aún.</p>';
    }
    
    modal.classList.add('show');
    
    // Manejar formulario de comentarios
    const commentForm = document.getElementById('commentForm');
    commentForm.onsubmit = function(e) {
        e.preventDefault();
        const commentText = document.getElementById('commentText').value;
        if (!commentText.trim()) return;
        
        if (!task.comments) task.comments = [];
        task.comments.push({
            author: currentUser,
            text: commentText,
            time: new Date().toLocaleString('es-ES')
        });
        
        saveTasks();
        openTaskModal(index); // Recargar modal
        document.getElementById('commentText').value = '';
    };
};

// Cerrar modales
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
    }
});

// Dashboard
function updateDashboard() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalFiles = uploadedFiles.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const totalFilesEl = document.getElementById('totalFiles');
    const avgCompletionEl = document.getElementById('avgCompletion');

    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;
    if (pendingTasksEl) pendingTasksEl.textContent = pendingTasks;
    if (totalFilesEl) totalFilesEl.textContent = totalFiles;
    if (avgCompletionEl) avgCompletionEl.textContent = completionRate + '%';

    // Actualizar gráficos
    updateCharts();
    updateDashboardActivity();
    
    // Actualizar Kanban si está visible
    if (document.getElementById('kanbanBoard')) {
        renderKanban();
    }
}

function updateCharts() {
    // Gráfico de prioridades
    const priorityData = {
        alta: tasks.filter(t => t.priority === 'alta').length,
        media: tasks.filter(t => t.priority === 'media').length,
        baja: tasks.filter(t => t.priority === 'baja').length
    };

    const priorityCanvas = document.getElementById('priorityChart');
    if (priorityCanvas) {
        const ctx = priorityCanvas.getContext('2d');
        priorityCanvas.width = 300;
        priorityCanvas.height = 300;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, priorityCanvas.width, priorityCanvas.height);
        
        // Dibujar gráfico de pastel simple
        drawPieChart(ctx, priorityCanvas.width / 2, priorityCanvas.height / 2, 100, priorityData);
    }

    // Gráfico de miembros
    const memberData = {};
    tasks.forEach(task => {
        memberData[task.assignee] = (memberData[task.assignee] || 0) + 1;
    });

    const memberCanvas = document.getElementById('memberChart');
    if (memberCanvas) {
        const ctx = memberCanvas.getContext('2d');
        memberCanvas.width = 300;
        memberCanvas.height = 300;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, memberCanvas.width, memberCanvas.height);
        
        drawBarChart(ctx, memberCanvas.width, memberCanvas.height, memberData);
    }

    // Gráfico semanal
    const weeklyCanvas = document.getElementById('weeklyChart');
    if (weeklyCanvas) {
        const ctx = weeklyCanvas.getContext('2d');
        weeklyCanvas.width = 300;
        weeklyCanvas.height = 300;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, weeklyCanvas.width, weeklyCanvas.height);
        
        drawWeeklyChart(ctx, weeklyCanvas.width, weeklyCanvas.height);
    }
}

function drawWeeklyChart(ctx, width, height) {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayTasks = tasks.filter(t => {
            const taskDate = new Date(t.createdAt);
            return taskDate.toDateString() === date.toDateString();
        }).length;
        weekData.push(dayTasks);
    }
    
    const maxValue = Math.max(...weekData, 1);
    const barWidth = width / 8;
    const maxBarHeight = height - 40;
    
    ctx.fillStyle = '#3498db';
    weekData.forEach((value, index) => {
        const barHeight = (value / maxValue) * maxBarHeight;
        const x = (index + 1) * barWidth;
        ctx.fillRect(x - barWidth / 2, height - barHeight - 20, barWidth * 0.6, barHeight);
    });
    
    // Etiquetas
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    weekData.forEach((value, index) => {
        const x = (index + 1) * barWidth;
        ctx.fillText(dayNames[index], x - barWidth / 2, height - 5);
    });
}

function drawPieChart(ctx, x, y, radius, data) {
    const colors = {
        alta: '#e74c3c',
        media: '#f39c12',
        baja: '#27ae60'
    };
    
    let startAngle = 0;
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    Object.keys(data).forEach(key => {
        const sliceAngle = (data[key] / total) * Math.PI * 2;
        ctx.fillStyle = colors[key] || '#3498db';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        startAngle += sliceAngle;
    });
}

function drawBarChart(ctx, width, height, data) {
    const maxValue = Math.max(...Object.values(data), 1);
    const barWidth = width / (Object.keys(data).length + 1);
    const maxBarHeight = height - 40;
    let x = barWidth;

    ctx.fillStyle = '#3498db';
    Object.keys(data).forEach(key => {
        const barHeight = (data[key] / maxValue) * maxBarHeight;
        ctx.fillRect(x - barWidth / 2, height - barHeight - 20, barWidth * 0.8, barHeight);
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(getRoleName(key).substring(0, 5), x - barWidth / 2, height - 5);
        ctx.fillStyle = '#3498db';
        x += barWidth;
    });
}

function updateDashboardActivity() {
    const activityContainer = document.getElementById('dashboardActivity');
    if (!activityContainer) return;

    const recentTasks = tasks.slice(-5).reverse();
    activityContainer.innerHTML = recentTasks.map(task => `
        <div class="activity-item">
            <span class="activity-time">${task.createdAt}</span>
            <span class="activity-text">${task.completed ? '✓' : '○'} ${task.title} - ${getRoleName(task.assignee)}</span>
        </div>
    `).join('');
}

// Gestión de Archivos
function initializeFiles() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const sharedFilesContainer = document.getElementById('sharedFilesContainer');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--secondary-color)';
        uploadArea.style.backgroundColor = '#d5dbdb';
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.backgroundColor = 'var(--bg-color)';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.backgroundColor = 'var(--bg-color)';
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    // Renderizar archivos compartidos iniciales
    renderSharedFiles();
}

function loadFiles() {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
        uploadedFiles = JSON.parse(savedFiles);
        renderUploadedFiles();
        renderSharedFiles();
    }
}

function saveFiles() {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            uploadedBy: currentUser || 'Usuario',
            uploadDate: new Date().toLocaleDateString('es-ES')
        };

        uploadedFiles.push(newFile);
        addNotification('Archivo Subido', `Archivo "${file.name}" subido correctamente`, 'success');
    });

    saveFiles();
    renderUploadedFiles();
    renderSharedFiles();
    updateDashboard();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function renderUploadedFiles() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    if (uploadedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = uploadedFiles.map((file, index) => {
        const fileIcon = getFileIcon(file.name);
        return `
            <div class="file-item">
                <span class="file-icon">${fileIcon}</span>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-meta">Subido por: ${file.uploadedBy} | Fecha: ${file.uploadDate} | Tamaño: ${file.size}</span>
                </div>
                <button class="download-btn" onclick="downloadFile(${index})">Descargar</button>
            </div>
        `;
    }).join('');
}

function renderSharedFiles() {
    const sharedFilesContainer = document.getElementById('sharedFilesContainer');
    if (!sharedFilesContainer) return;

    const allFiles = [
        { name: 'Guía de Estilo del Proyecto.pdf', uploadedBy: 'Coordinador', date: '15/01/2024' },
        { name: 'Plan de Trabajo.xlsx', uploadedBy: 'Diseñador Instruccional', date: '14/01/2024' },
        ...uploadedFiles.map(f => ({ name: f.name, uploadedBy: f.uploadedBy, date: f.uploadDate }))
    ];

    sharedFilesContainer.innerHTML = allFiles.map(file => {
        const fileIcon = getFileIcon(file.name);
        return `
            <div class="file-item">
                <span class="file-icon">${fileIcon}</span>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-meta">Subido por: ${file.uploadedBy} | Fecha: ${file.date}</span>
                </div>
                <button class="download-btn">Descargar</button>
            </div>
        `;
    }).join('');
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
        'ppt': '📊', 'pptx': '📊', 'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️',
        'gif': '🖼️', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'zip': '📦', 'rar': '📦'
    };
    return iconMap[extension] || '📄';
}

window.downloadFile = function(index) {
    const file = uploadedFiles[index];
    addNotification('Descarga', `Iniciando descarga de "${file.name}"`, 'info');
};

// Chat
function initializeChat() {
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');

    loadChatMessages();

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        const chatMessage = {
            author: currentUser || 'Usuario',
            text: message,
            time: new Date().toLocaleTimeString('es-ES'),
            timestamp: Date.now()
        };

        chatMessages.push(chatMessage);
        saveChatMessages();
        renderChatMessages();
        input.value = '';
        
        // Auto-scroll
        const chatContainer = document.querySelector('.chat-messages');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}

function loadChatMessages() {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
        chatMessages = JSON.parse(saved);
        renderChatMessages();
    }
}

function saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = chatMessages.map(msg => `
        <div class="message ${msg.author === currentUser ? 'own-message' : ''}">
            <span class="message-author">${msg.author}</span>
            <span class="message-time">${msg.time}</span>
            <p class="message-text">${msg.text}</p>
        </div>
    `).join('');
}

// Calendario
function initializeCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    renderCalendar();
}

function renderCalendar() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let html = dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('');
    
    // Días del mes anterior
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = date.toDateString() === today.toDateString();
        const hasEvent = tasks.some(t => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            return taskDate.getDate() === day && 
                   taskDate.getMonth() === currentMonth && 
                   taskDate.getFullYear() === currentYear;
        });
        
        const eventCount = tasks.filter(t => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            return taskDate.getDate() === day && 
                   taskDate.getMonth() === currentMonth && 
                   taskDate.getFullYear() === currentYear;
        }).length;
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" 
                 onclick="showDayEvents(${day})">
                <div class="day-number">${day}</div>
                ${eventCount > 0 ? `<div class="day-events">${eventCount} evento(s)</div>` : ''}
            </div>
        `;
    }
    
    // Completar la semana
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
    
    // Renderizar eventos del mes
    renderMonthEvents();
}

function renderMonthEvents() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    const monthEvents = tasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = new Date(t.dueDate);
        return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (monthEvents.length === 0) {
        eventsList.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No hay eventos este mes.</p>';
        return;
    }

    eventsList.innerHTML = monthEvents.map(task => `
        <div class="event-item">
            <div class="event-title">${task.title}</div>
            <div class="event-date">${formatDueDate(task.dueDate)} - ${getRoleName(task.assignee)}</div>
        </div>
    `).join('');
}

window.showDayEvents = function(day) {
    const dayEvents = tasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = new Date(t.dueDate);
        return taskDate.getDate() === day && 
               taskDate.getMonth() === currentMonth && 
               taskDate.getFullYear() === currentYear;
    });
    
    if (dayEvents.length > 0) {
        alert(`Eventos del día ${day}:\n\n${dayEvents.map(t => `• ${t.title} (${getRoleName(t.assignee)})`).join('\n')}`);
    }
};

// Notificaciones
function initializeNotifications() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const clearBtn = document.getElementById('clearNotifications');

    loadNotifications();

    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');
            updateNotificationBadge();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            notifications = notifications.filter(n => !n.read);
            saveNotifications();
            renderNotifications();
            updateNotificationBadge();
        });
    }

    document.addEventListener('click', function(e) {
        if (!notificationsPanel.contains(e.target) && !notificationsBtn.contains(e.target)) {
            notificationsPanel.classList.remove('show');
        }
    });
}

function addNotification(title, text, type = 'info') {
    const notification = {
        id: Date.now(),
        title,
        text,
        type,
        time: new Date().toLocaleString('es-ES'),
        read: false
    };

    notifications.unshift(notification);
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
}

function loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
        notifications = JSON.parse(saved);
        renderNotifications();
        updateNotificationBadge();
    }
}

function saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = '<p style="padding: 1rem; color: var(--text-light); text-align: center;">No hay notificaciones</p>';
        return;
    }

    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
            <div class="notification-title">${notif.title}</div>
            <div class="notification-text">${notif.text}</div>
            <div class="notification-time">${notif.time}</div>
        </div>
    `).join('');
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

window.markNotificationRead = function(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications();
        renderNotifications();
        updateNotificationBadge();
    }
};

// Modo Oscuro
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

// Búsqueda Global
function initializeGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim().toLowerCase();
        
        if (query.length < 2) {
            searchResults.classList.remove('show');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performGlobalSearch(query);
        }, 300);
    });
    
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

function performGlobalSearch(query) {
    const results = [];
    const searchResults = document.getElementById('searchResults');
    
    // Buscar en tareas
    tasks.forEach(task => {
        if (task.title.toLowerCase().includes(query) || 
            task.description.toLowerCase().includes(query)) {
            results.push({
                type: 'Tarea',
                title: task.title,
                preview: task.description.substring(0, 50),
                id: task.id,
                action: () => {
                    const index = tasks.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                        document.querySelector('a[href="#tareas"]').classList.add('active');
                        document.getElementById('tareas').classList.add('active');
                        setTimeout(() => openTaskModal(index), 300);
                    }
                }
            });
        }
    });
    
    // Buscar en archivos
    uploadedFiles.forEach(file => {
        if (file.name.toLowerCase().includes(query)) {
            results.push({
                type: 'Archivo',
                title: file.name,
                preview: `Subido por ${file.uploadedBy}`,
                id: file.id,
                action: () => {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    document.querySelector('a[href="#archivos"]').classList.add('active');
                    document.getElementById('archivos').classList.add('active');
                }
            });
        }
    });
    
    // Buscar en chat
    chatMessages.forEach(msg => {
        if (msg.text.toLowerCase().includes(query)) {
            results.push({
                type: 'Mensaje',
                title: `Mensaje de ${msg.author}`,
                preview: msg.text.substring(0, 50),
                id: msg.timestamp,
                action: () => {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    document.querySelector('a[href="#chat"]').classList.add('active');
                    document.getElementById('chat').classList.add('active');
                }
            });
        }
    });
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><p style="text-align: center; color: var(--text-light);">No se encontraron resultados</p></div>';
    } else {
        searchResults.innerHTML = results.slice(0, 10).map(result => `
            <div class="search-result-item" onclick="result.action(); document.getElementById('searchResults').classList.remove('show');">
                <div class="search-result-type">${result.type}</div>
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-preview">${result.preview}...</div>
            </div>
        `).join('');
    }
    
    searchResults.classList.add('show');
}

// Sistema de Badges
function initializeBadges() {
    const badgesBtn = document.getElementById('badgesBtn');
    const badgesPanel = document.getElementById('badgesPanel');
    
    loadBadges();
    updateBadgeCount();
    
    if (badgesBtn) {
        badgesBtn.addEventListener('click', function() {
            badgesPanel.classList.add('show');
            renderBadges();
        });
    }
}

function loadBadges() {
    const saved = localStorage.getItem('badges');
    if (saved) {
        badges = JSON.parse(saved);
    } else {
        // Inicializar badges
        badges = [
            { id: 'first_task', name: 'Primera Tarea', description: 'Crea tu primera tarea', icon: '🎯', earned: false },
            { id: 'task_master', name: 'Maestro de Tareas', description: 'Completa 10 tareas', icon: '⭐', earned: false },
            { id: 'team_player', name: 'Jugador de Equipo', description: 'Comenta en 5 tareas', icon: '👥', earned: false },
            { id: 'file_sharer', name: 'Compartidor', description: 'Sube 5 archivos', icon: '📁', earned: false },
            { id: 'chatty', name: 'Conversador', description: 'Envía 20 mensajes', icon: '💬', earned: false },
            { id: 'organizer', name: 'Organizador', description: 'Crea 5 tareas con fechas', icon: '📅', earned: false },
            { id: 'early_bird', name: 'Madrugador', description: 'Completa una tarea antes de las 9 AM', icon: '🌅', earned: false },
            { id: 'perfectionist', name: 'Perfeccionista', description: 'Completa todas las tareas asignadas', icon: '✨', earned: false }
        ];
        saveBadges();
    }
}

function saveBadges() {
    localStorage.setItem('badges', JSON.stringify(badges));
}

function checkBadges() {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalComments = tasks.reduce((sum, t) => sum + (t.comments ? t.comments.length : 0), 0);
    const totalMessages = chatMessages.length;
    const filesUploaded = uploadedFiles.length;
    const tasksWithDates = tasks.filter(t => t.dueDate).length;
    
    // Verificar badges
    if (tasks.length > 0 && !badges.find(b => b.id === 'first_task').earned) {
        unlockBadge('first_task');
    }
    if (completedTasks >= 10 && !badges.find(b => b.id === 'task_master').earned) {
        unlockBadge('task_master');
    }
    if (totalComments >= 5 && !badges.find(b => b.id === 'team_player').earned) {
        unlockBadge('team_player');
    }
    if (filesUploaded >= 5 && !badges.find(b => b.id === 'file_sharer').earned) {
        unlockBadge('file_sharer');
    }
    if (totalMessages >= 20 && !badges.find(b => b.id === 'chatty').earned) {
        unlockBadge('chatty');
    }
    if (tasksWithDates >= 5 && !badges.find(b => b.id === 'organizer').earned) {
        unlockBadge('organizer');
    }
    
    updateBadgeCount();
}

function unlockBadge(badgeId) {
    const badge = badges.find(b => b.id === badgeId);
    if (badge && !badge.earned) {
        badge.earned = true;
        badge.earnedDate = new Date().toLocaleString('es-ES');
        saveBadges();
        addNotification('¡Badge Desbloqueado!', `Has ganado el badge "${badge.name}"`, 'success');
        updateBadgeCount();
    }
}

function updateBadgeCount() {
    const earnedCount = badges.filter(b => b.earned).length;
    const badgeCount = document.getElementById('badgeCount');
    if (badgeCount) {
        badgeCount.textContent = earnedCount;
        badgeCount.style.display = earnedCount > 0 ? 'flex' : 'none';
    }
}

function renderBadges() {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    container.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.earned ? 'earned' : ''}">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-description">${badge.description}</div>
            ${badge.earned ? `<div style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.8;">Desbloqueado: ${badge.earnedDate || 'Hoy'}</div>` : ''}
        </div>
    `).join('');
}

// Tablero Kanban
function initializeKanban() {
    const kanbanForm = document.getElementById('kanbanTaskForm');
    
    if (kanbanForm) {
        kanbanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('kanbanTaskTitle').value;
            const description = document.getElementById('kanbanTaskDesc').value;
            const assignee = document.getElementById('kanbanTaskAssignee').value;
            const status = document.getElementById('kanbanTaskStatus').value;
            
            if (!title || !assignee) {
                alert('Completa todos los campos requeridos');
                return;
            }
            
            const newTask = {
                id: Date.now(),
                title,
                description,
                assignee,
                priority: 'media',
                status,
                completed: false,
                createdAt: new Date().toLocaleDateString('es-ES'),
                createdBy: currentUser,
                comments: []
            };
            
            tasks.push(newTask);
            saveTasks();
            renderKanban();
            document.getElementById('kanbanTaskModal').classList.remove('show');
            kanbanForm.reset();
            addNotification('Tarea Creada', `Tarea "${title}" agregada al tablero Kanban`, 'success');
        });
    }
    
    renderKanban();
}

function renderKanban() {
    const statuses = ['backlog', 'todo', 'inprogress', 'review', 'done'];
    
    statuses.forEach(status => {
        const items = tasks.filter(t => {
            if (status === 'done') return t.completed;
            if (status === 'backlog') return !t.status || t.status === 'backlog';
            return t.status === status;
        });
        
        const container = document.getElementById(`${status}Items`);
        const count = document.getElementById(`${status}Count`);
        
        if (count) count.textContent = items.length;
        
        if (container) {
            container.innerHTML = items.map(task => {
                const priorityClass = `priority-${task.priority}`;
                return `
                    <div class="kanban-item ${priorityClass}" draggable="true" 
                         ondragstart="drag(event)" data-task-id="${task.id}">
                        <div class="kanban-item-title">${task.title}</div>
                        <div class="kanban-item-meta">${getRoleName(task.assignee)}</div>
                        <div class="kanban-item-assignee">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
                    </div>
                `;
            }).join('');
        }
    });
}

window.addKanbanTask = function() {
    document.getElementById('kanbanTaskModal').classList.add('show');
};

window.allowDrop = function(ev) {
    ev.preventDefault();
};

window.drag = function(ev) {
    ev.dataTransfer.setData("text", ev.target.dataset.taskId);
};

window.drop = function(ev) {
    ev.preventDefault();
    const taskId = parseInt(ev.dataTransfer.getData("text"));
    const newStatus = ev.currentTarget.closest('.kanban-column').dataset.status;
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        if (newStatus === 'done') {
            task.completed = true;
        } else {
            task.status = newStatus;
            task.completed = false;
        }
        saveTasks();
        renderKanban();
        renderTasks();
        updateDashboard();
        checkBadges();
    }
};

// Editor Colaborativo
function initializeEditor() {
    const editorContent = document.getElementById('editorContent');
    
    if (editorContent) {
        const saved = localStorage.getItem('documentContent');
        if (saved) {
            editorContent.innerHTML = saved;
            documentContent = saved;
        }
        
        // Guardar versión inicial
        if (documentVersions.length === 0) {
            saveVersion('Versión inicial', editorContent.innerHTML);
        }
    }
}

function autoSave() {
    const editorContent = document.getElementById('editorContent');
    if (!editorContent) return;
    
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        const content = editorContent.innerHTML;
        localStorage.setItem('documentContent', content);
        documentContent = content;
        addChangeToHistory('Documento actualizado');
    }, 2000);
}

function saveDocument() {
    const editorContent = document.getElementById('editorContent');
    if (!editorContent) return;
    
    const content = editorContent.innerHTML;
    localStorage.setItem('documentContent', content);
    saveVersion('Guardado manual', content);
    addNotification('Documento Guardado', 'El documento se ha guardado correctamente', 'success');
}

function saveVersion(description, content) {
    const version = {
        id: Date.now(),
        number: documentVersions.length + 1,
        description,
        content,
        author: currentUser || 'Sistema',
        date: new Date().toLocaleString('es-ES')
    };
    
    documentVersions.push(version);
    localStorage.setItem('documentVersions', JSON.stringify(documentVersions));
}

function showVersions() {
    const modal = document.getElementById('versionsModal');
    const list = document.getElementById('versionsList');
    
    if (!modal || !list) return;
    
    loadVersions();
    
    if (documentVersions.length === 0) {
        list.innerHTML = '<p class="no-data">No hay versiones guardadas aún.</p>';
    } else {
        list.innerHTML = documentVersions.slice().reverse().map(version => `
            <div class="version-item">
                <div class="version-header">
                    <span class="version-number">Versión ${version.number}</span>
                    <span class="version-date">${version.date}</span>
                </div>
                <div class="version-author">Por: ${version.author}</div>
                <div class="version-changes">${version.description}</div>
                <div class="version-actions">
                    <button class="version-btn" onclick="restoreVersion(${version.id})">Restaurar</button>
                    <button class="version-btn" onclick="viewVersion(${version.id})">Ver</button>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.add('show');
}

function loadVersions() {
    const saved = localStorage.getItem('documentVersions');
    if (saved) {
        documentVersions = JSON.parse(saved);
    }
}

window.restoreVersion = function(versionId) {
    const version = documentVersions.find(v => v.id === versionId);
    if (version && confirm(`¿Restaurar la versión ${version.number}?`)) {
        const editorContent = document.getElementById('editorContent');
        if (editorContent) {
            editorContent.innerHTML = version.content;
            saveVersion(`Restaurado desde versión ${version.number}`, version.content);
            addNotification('Versión Restaurada', `Se restauró la versión ${version.number}`, 'success');
        }
    }
};

window.viewVersion = function(versionId) {
    const version = documentVersions.find(v => v.id === versionId);
    if (version) {
        alert(`Versión ${version.number}\n\n${version.description}\n\nPor: ${version.author}\nFecha: ${version.date}`);
    }
};

function addChangeToHistory(change) {
    const history = document.getElementById('changeHistory');
    if (!history) return;
    
    const changeItem = document.createElement('div');
    changeItem.className = 'change-history-item';
    changeItem.innerHTML = `
        <div>${change}</div>
        <div class="change-history-time">${new Date().toLocaleTimeString('es-ES')}</div>
    `;
    
    history.insertBefore(changeItem, history.firstChild);
    
    // Limitar a 10 cambios recientes
    while (history.children.length > 10) {
        history.removeChild(history.lastChild);
    }
}

window.formatText = function(command) {
    document.execCommand(command, false, null);
    autoSave();
};

window.insertImage = function() {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
        document.execCommand('insertImage', false, url);
        autoSave();
    }
};

window.insertTable = function() {
    const rows = prompt('Número de filas:', '3');
    const cols = prompt('Número de columnas:', '3');
    if (rows && cols) {
        let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        for (let i = 0; i < parseInt(rows); i++) {
            table += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                table += '<td>&nbsp;</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        document.execCommand('insertHTML', false, table);
        autoSave();
    }
};

function exportDocument() {
    const editorContent = document.getElementById('editorContent');
    if (!editorContent) return;
    
    const content = editorContent.innerText || editorContent.textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento-colaborativo.txt';
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Documento Exportado', 'El documento se ha descargado correctamente', 'success');
}

// Timeline
function initializeTimeline() {
    renderTimeline();
}

function renderTimeline() {
    const timelineLine = document.getElementById('timelineLine');
    if (!timelineLine) return;
    
    // Combinar todas las actividades
    const activities = [];
    
    tasks.forEach(task => {
        activities.push({
            date: new Date(task.createdAt),
            type: 'tasks',
            title: `Tarea creada: ${task.title}`,
            description: `Asignada a ${getRoleName(task.assignee)}`,
            completed: task.completed
        });
        
        if (task.completed && task.completedAt) {
            activities.push({
                date: new Date(task.completedAt),
                type: 'tasks',
                title: `Tarea completada: ${task.title}`,
                description: `Completada por ${getRoleName(task.assignee)}`,
                completed: true
            });
        }
    });
    
    uploadedFiles.forEach(file => {
        activities.push({
            date: new Date(file.uploadDate),
            type: 'files',
            title: `Archivo subido: ${file.name}`,
            description: `Por ${file.uploadedBy}`,
            completed: false
        });
    });
    
    // Ordenar por fecha
    activities.sort((a, b) => b.date - a.date);
    
    timelineLine.innerHTML = activities.slice(0, 20).map(activity => `
        <div class="timeline-item ${activity.completed ? 'completed' : ''} ${activity.type === 'tasks' && activity.completed ? 'important' : ''}">
            <div class="timeline-date">${activity.date.toLocaleDateString('es-ES')}</div>
            <div class="timeline-content">
                <div class="timeline-title">${activity.title}</div>
                <div class="timeline-description">${activity.description}</div>
            </div>
        </div>
    `).join('');
}

// Reportes
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportContent = document.getElementById('reportContent');
    
    if (!reportContent) return;
    
    let html = '';
    
    switch(reportType) {
        case 'general':
            html = generateGeneralReport();
            break;
        case 'tareas':
            html = generateTasksReport();
            break;
        case 'equipo':
            html = generateTeamReport();
            break;
        case 'productividad':
            html = generateProductivityReport();
            break;
    }
    
    reportContent.innerHTML = html;
}

function generateGeneralReport() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return `
        <div class="report-section">
            <h3>Resumen General del Proyecto</h3>
            <p><strong>Total de Tareas:</strong> ${totalTasks}</p>
            <p><strong>Tareas Completadas:</strong> ${completedTasks}</p>
            <p><strong>Tareas Pendientes:</strong> ${pendingTasks}</p>
            <p><strong>Tasa de Completación:</strong> ${completionRate}%</p>
            <p><strong>Archivos Compartidos:</strong> ${uploadedFiles.length}</p>
            <p><strong>Mensajes en Chat:</strong> ${chatMessages.length}</p>
        </div>
        <div class="report-section">
            <h3>Distribución por Prioridad</h3>
            <table class="report-table">
                <tr><th>Prioridad</th><th>Cantidad</th></tr>
                <tr><td>Alta</td><td>${tasks.filter(t => t.priority === 'alta').length}</td></tr>
                <tr><td>Media</td><td>${tasks.filter(t => t.priority === 'media').length}</td></tr>
                <tr><td>Baja</td><td>${tasks.filter(t => t.priority === 'baja').length}</td></tr>
            </table>
        </div>
    `;
}

function generateTasksReport() {
    return `
        <div class="report-section">
            <h3>Reporte de Tareas</h3>
            <table class="report-table">
                <tr>
                    <th>Título</th>
                    <th>Asignado a</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha de Creación</th>
                </tr>
                ${tasks.map(task => `
                    <tr>
                        <td>${task.title}</td>
                        <td>${getRoleName(task.assignee)}</td>
                        <td>${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</td>
                        <td>${task.completed ? 'Completada' : 'Pendiente'}</td>
                        <td>${task.createdAt}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

function generateTeamReport() {
    const teamStats = {};
    tasks.forEach(task => {
        if (!teamStats[task.assignee]) {
            teamStats[task.assignee] = { total: 0, completed: 0 };
        }
        teamStats[task.assignee].total++;
        if (task.completed) {
            teamStats[task.assignee].completed++;
        }
    });
    
    return `
        <div class="report-section">
            <h3>Reporte de Equipo</h3>
            <table class="report-table">
                <tr>
                    <th>Miembro</th>
                    <th>Total Tareas</th>
                    <th>Completadas</th>
                    <th>Tasa de Completación</th>
                </tr>
                ${Object.keys(teamStats).map(member => {
                    const stats = teamStats[member];
                    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    return `
                        <tr>
                            <td>${getRoleName(member)}</td>
                            <td>${stats.total}</td>
                            <td>${stats.completed}</td>
                            <td>${rate}%</td>
                        </tr>
                    `;
                }).join('')}
            </table>
        </div>
    `;
}

function generateProductivityReport() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= weekAgo;
    });
    
    return `
        <div class="report-section">
            <h3>Reporte de Productividad (Últimos 7 días)</h3>
            <p><strong>Tareas Creadas:</strong> ${recentTasks.length}</p>
            <p><strong>Tareas Completadas:</strong> ${recentTasks.filter(t => t.completed).length}</p>
            <p><strong>Archivos Subidos:</strong> ${uploadedFiles.filter(f => {
                const fileDate = new Date(f.uploadDate);
                return fileDate >= weekAgo;
            }).length}</p>
        </div>
    `;
}

function exportReport(format = 'pdf') {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;
    
    const content = reportContent.innerText || reportContent.textContent;
    let blob, filename, mimeType;
    
    switch(format) {
        case 'pdf':
            // Simulación de PDF - en producción usaría una librería como jsPDF
            blob = new Blob([content], { type: 'text/plain' });
            filename = `reporte-${new Date().toISOString().split('T')[0]}.txt`;
            break;
        case 'excel':
            // Simulación de Excel - formato CSV compatible
            const csvContent = convertToCSV(content);
            blob = new Blob([csvContent], { type: 'text/csv' });
            filename = `reporte-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'csv':
            const csv = convertToCSV(content);
            blob = new Blob([csv], { type: 'text/csv' });
            filename = `reporte-${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'json':
            const jsonData = {
                reporte: content,
                fecha: new Date().toISOString(),
                datos: {
                    tareas: tasks,
                    archivos: uploadedFiles.length,
                    mensajes: chatMessages.length
                }
            };
            blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            filename = `reporte-${new Date().toISOString().split('T')[0]}.json`;
            break;
        default:
            blob = new Blob([content], { type: 'text/plain' });
            filename = `reporte-${new Date().toISOString().split('T')[0]}.txt`;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Reporte Exportado', `El reporte se ha descargado en formato ${format.toUpperCase()}`, 'success');
    addAuditLog('Reporte exportado', `Formato: ${format}`, 'reportes');
}

function convertToCSV(text) {
    // Conversión simple a CSV
    const lines = text.split('\n').filter(line => line.trim());
    return lines.join('\n');
}

function exportDashboard() {
    const data = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        pendingTasks: tasks.filter(t => !t.completed).length,
        totalFiles: uploadedFiles.length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
    };
    
    const content = `REPORTE DEL DASHBOARD\n\n` +
                   `Total de Tareas: ${data.totalTasks}\n` +
                   `Tareas Completadas: ${data.completedTasks}\n` +
                   `Tareas Pendientes: ${data.pendingTasks}\n` +
                   `Archivos Compartidos: ${data.totalFiles}\n` +
                   `Tasa de Completación: ${data.completionRate}%\n\n` +
                   `Generado el: ${new Date().toLocaleString('es-ES')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Dashboard Exportado', 'El reporte del dashboard se ha descargado', 'success');
}

function refreshDashboard() {
    updateDashboard();
    updateCharts();
    addNotification('Dashboard Actualizado', 'Los datos se han refrescado correctamente', 'info');
}

// Actualizar funciones existentes para incluir badges
const originalCompleteTask = window.completeTask;
window.completeTask = function(index) {
    originalCompleteTask(index);
    checkBadges();
};

const originalDeleteTask = window.deleteTask;
window.deleteTask = function(index) {
    originalDeleteTask(index);
    checkBadges();
};

// Cargar todos los datos
function loadData() {
    loadTasks();
    loadFiles();
    updateDashboard();
    checkBadges();
    
    // Simular actividad reciente
    setInterval(function() {
        const activities = [
            { time: 'Hace 2 horas', text: 'Editor de Contenido actualizó "Módulo 3 - Introducción"' },
            { time: 'Hace 5 horas', text: 'Especialista Multimedia subió "Video Tutorial.mp4"' },
            { time: 'Ayer', text: 'Programador Web completó "Sistema de autenticación"' }
        ];
        
        const activityLog = document.getElementById('activityLog');
        if (activityLog) {
            const randomActivities = activities.sort(() => 0.5 - Math.random()).slice(0, 3);
            activityLog.innerHTML = randomActivities.map(activity => `
                <div class="activity-item">
                    <span class="activity-time">${activity.time}</span>
                    <span class="activity-text">${activity.text}</span>
                </div>
            `).join('');
        }
    }, 30000);
}

// Sistema de Reuniones Virtuales
function initializeMeetings() {
    loadMeetings();
    renderMeetings();
}

function loadMeetings() {
    const saved = localStorage.getItem('meetings');
    if (saved) {
        meetings = JSON.parse(saved);
    } else {
        meetings = [
            {
                id: 1,
                title: 'Reunión de Planificación',
                date: new Date().toISOString(),
                duration: 60,
                participants: 6,
                status: 'scheduled'
            },
            {
                id: 2,
                title: 'Revisión Semanal',
                date: new Date(Date.now() + 24*60*60*1000).toISOString(),
                duration: 60,
                participants: 6,
                status: 'scheduled'
            }
        ];
        saveMeetings();
    }
}

function saveMeetings() {
    localStorage.setItem('meetings', JSON.stringify(meetings));
}

function renderMeetings() {
    const grid = document.querySelector('.meetings-grid');
    if (!grid) return;
    
    grid.innerHTML = meetings.map(meeting => {
        const date = new Date(meeting.date);
        return `
            <div class="meeting-card">
                <div class="meeting-icon">📹</div>
                <h3>${meeting.title}</h3>
                <p class="meeting-date">${date.toLocaleDateString('es-ES')}, ${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</p>
                <p class="meeting-participants">${meeting.participants} participantes</p>
                <button class="join-btn" onclick="joinMeeting(${meeting.id})">Unirse</button>
            </div>
        `;
    }).join('');
}

window.createMeeting = function() {
    const title = prompt('Título de la reunión:');
    if (!title) return;
    
    const meeting = {
        id: Date.now(),
        title,
        date: new Date().toISOString(),
        duration: 60,
        participants: 1,
        status: 'scheduled',
        createdBy: currentUser
    };
    
    meetings.push(meeting);
    saveMeetings();
    renderMeetings();
    addNotification('Reunión Creada', `Reunión "${title}" creada exitosamente`, 'success');
    addAuditLog('Reunión creada', title, 'meetings');
};

window.joinMeeting = function(meetingId) {
    const meetingRoom = document.getElementById('meetingRoom');
    const videoGrid = document.getElementById('videoGrid');
    
    if (meetingRoom && videoGrid) {
        meetingRoom.style.display = 'block';
        videoGrid.innerHTML = `
            <div class="video-participant">
                <div class="video-placeholder">Tu video aparecerá aquí</div>
                <div class="participant-name">${currentUser || 'Tú'}</div>
            </div>
        `;
        
        // Simular otros participantes
        const roles = ['Coordinador', 'Diseñador Instruccional', 'Editor de Contenido', 'Programador Web', 'Especialista Multimedia', 'Revisor'];
        roles.forEach(role => {
            if (role !== currentRole) {
                const participant = document.createElement('div');
                participant.className = 'video-participant';
                participant.innerHTML = `
                    <div class="video-placeholder">${role}</div>
                    <div class="participant-name">${role}</div>
                `;
                videoGrid.appendChild(participant);
            }
        });
        
        addNotification('Reunión Iniciada', 'Te has unido a la reunión', 'success');
        addAuditLog('Unido a reunión', `Reunión ID: ${meetingId}`, 'meetings');
    }
};

window.leaveMeeting = function() {
    const meetingRoom = document.getElementById('meetingRoom');
    if (meetingRoom) {
        meetingRoom.style.display = 'none';
        addNotification('Reunión Finalizada', 'Has salido de la reunión', 'info');
    }
};

window.toggleMicrophone = function() {
    const btn = document.getElementById('micBtn');
    btn.textContent = btn.textContent === '🎤' ? '🎤🔇' : '🎤';
};

window.toggleCamera = function() {
    const btn = document.getElementById('cameraBtn');
    btn.textContent = btn.textContent === '📹' ? '📹📷' : '📹';
};

window.toggleScreenShare = function() {
    const btn = document.getElementById('screenBtn');
    btn.textContent = btn.textContent === '🖥️' ? '🖥️✓' : '🖥️';
};

window.toggleChat = function() {
    const chat = document.getElementById('meetingChat');
    if (chat) {
        chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
    }
};

// Sistema de Votaciones
function initializeVotes() {
    loadVotes();
    renderVotes();
    
    const voteForm = document.getElementById('voteForm');
    if (voteForm) {
        voteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createVoteFromForm();
        });
    }
}

function loadVotes() {
    const saved = localStorage.getItem('votes');
    if (saved) {
        votes = JSON.parse(saved);
    } else {
        votes = [
            {
                id: 1,
                title: '¿Qué herramienta de diseño prefieren?',
                description: 'Necesitamos decidir qué herramienta usar para el diseño instruccional',
                options: [
                    { text: 'Figma', votes: 2 },
                    { text: 'Adobe XD', votes: 3 }
                ],
                deadline: '2024-01-20',
                status: 'active',
                createdBy: 'Coordinador'
            }
        ];
        saveVotes();
    }
}

function saveVotes() {
    localStorage.setItem('votes', JSON.stringify(votes));
}

function renderVotes() {
    const list = document.getElementById('votacionesList');
    if (!list) return;
    
    if (votes.length === 0) {
        list.innerHTML = '<p class="no-data">No hay votaciones activas</p>';
        return;
    }
    
    list.innerHTML = votes.map(vote => {
        const totalVotes = vote.options.reduce((sum, opt) => sum + opt.votes, 0);
        const deadline = new Date(vote.deadline);
        const isActive = vote.status === 'active' && deadline > new Date();
        
        return `
            <div class="vote-card">
                <h3>${vote.title}</h3>
                <p class="vote-description">${vote.description}</p>
                <div class="vote-options">
                    ${vote.options.map(option => {
                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                        return `
                            <div class="vote-option" onclick="voteOption(${vote.id}, '${option.text}')">
                                <div class="vote-bar" style="width: ${percentage}%"></div>
                                <span>${option.text}</span>
                                <span class="vote-count">${percentage}% (${option.votes} votos)</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="vote-footer">
                    <span class="vote-status ${isActive ? '' : 'closed'}">${isActive ? 'En curso' : 'Cerrada'}</span>
                    <span class="vote-deadline">Cierra: ${deadline.toLocaleDateString('es-ES')}</span>
                </div>
            </div>
        `;
    }).join('');
}

window.createVote = function() {
    document.getElementById('voteModal').classList.add('show');
};

window.addVoteOption = function() {
    const container = document.getElementById('voteOptions');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'vote-option-input';
    input.placeholder = `Opción ${container.children.length + 1}`;
    input.required = true;
    container.appendChild(input);
};

function createVoteFromForm() {
    const title = document.getElementById('voteTitle').value;
    const description = document.getElementById('voteDescription').value;
    const deadline = document.getElementById('voteDeadline').value;
    const options = Array.from(document.querySelectorAll('.vote-option-input'))
        .map(input => ({ text: input.value, votes: 0 }))
        .filter(opt => opt.text.trim());
    
    if (!title || options.length < 2) {
        alert('Completa todos los campos y agrega al menos 2 opciones');
        return;
    }
    
    const vote = {
        id: Date.now(),
        title,
        description,
        options,
        deadline,
        status: 'active',
        createdBy: currentUser
    };
    
    votes.push(vote);
    saveVotes();
    renderVotes();
    document.getElementById('voteModal').classList.remove('show');
    document.getElementById('voteForm').reset();
    addNotification('Votación Creada', `Votación "${title}" creada exitosamente`, 'success');
    addAuditLog('Votación creada', title, 'votes');
}

window.voteOption = function(voteId, optionText) {
    const vote = votes.find(v => v.id === voteId);
    if (!vote) return;
    
    const option = vote.options.find(o => o.text === optionText);
    if (option) {
        option.votes++;
        saveVotes();
        renderVotes();
        addNotification('Voto Registrado', `Has votado por "${optionText}"`, 'success');
        addAuditLog('Voto registrado', `${vote.title} - ${optionText}`, 'votes');
    }
};

// Análisis Predictivo
function initializeAnalytics() {
    updateAnalytics();
    setInterval(updateAnalytics, 60000); // Actualizar cada minuto
}

function updateAnalytics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    // Predicción de fecha de finalización
    const avgDaysPerTask = calculateAverageDaysPerTask();
    const estimatedDays = pendingTasks * avgDaysPerTask;
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + estimatedDays);
    
    const predictedEl = document.getElementById('predictedCompletion');
    if (predictedEl) {
        predictedEl.textContent = predictedDate.toLocaleDateString('es-ES');
    }
    
    // Nivel de riesgo
    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date();
    }).length;
    
    const riskEl = document.getElementById('riskLevel');
    if (riskEl) {
        const risk = overdueTasks > 2 ? 'Alto' : overdueTasks > 0 ? 'Medio' : 'Bajo';
        riskEl.textContent = risk;
        riskEl.style.color = risk === 'Alto' ? 'var(--accent-color)' : risk === 'Medio' ? 'var(--warning-color)' : 'var(--success-color)';
    }
    
    // Productividad
    const productivityEl = document.getElementById('productivityScore');
    if (productivityEl) {
        const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        productivityEl.textContent = productivity + '%';
    }
    
    // Métricas avanzadas
    const velocityEl = document.getElementById('completionVelocity');
    if (velocityEl) {
        velocityEl.textContent = avgDaysPerTask > 0 ? (1 / avgDaysPerTask).toFixed(1) + ' tareas/día' : '0 tareas/día';
    }
    
    const avgTimeEl = document.getElementById('avgTaskTime');
    if (avgTimeEl) {
        avgTimeEl.textContent = avgDaysPerTask.toFixed(1) + ' días';
    }
    
    const efficiencyEl = document.getElementById('teamEfficiency');
    if (efficiencyEl) {
        const efficiency = calculateTeamEfficiency();
        efficiencyEl.textContent = efficiency + '%';
    }
    
    // Recomendaciones IA
    updateAIRecommendations();
}

function calculateAverageDaysPerTask() {
    const completed = tasks.filter(t => t.completed && t.createdAt && t.completedAt);
    if (completed.length === 0) return 3; // Default
    
    const totalDays = completed.reduce((sum, task) => {
        const start = new Date(task.createdAt);
        const end = new Date(task.completedAt);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return totalDays / completed.length || 3;
}

function calculateTeamEfficiency() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const onTimeTasks = tasks.filter(t => {
        if (!t.completed || !t.dueDate) return false;
        const completed = new Date(t.completedAt);
        const due = new Date(t.dueDate);
        return completed <= due;
    }).length;
    
    if (totalTasks === 0) return 100;
    return Math.round((onTimeTasks / totalTasks) * 100);
}

function updateAIRecommendations() {
    const container = document.getElementById('aiRecommendations');
    if (!container) return;
    
    const recommendations = [];
    
    // Verificar carga de trabajo
    const memberTasks = {};
    tasks.forEach(t => {
        if (!t.completed) {
            memberTasks[t.assignee] = (memberTasks[t.assignee] || 0) + 1;
        }
    });
    
    const maxTasks = Math.max(...Object.values(memberTasks), 0);
    const minTasks = Math.min(...Object.values(memberTasks), 0);
    
    if (maxTasks - minTasks > 3) {
        recommendations.push({
            icon: '💡',
            text: 'Considera redistribuir tareas para optimizar la carga de trabajo'
        });
    }
    
    // Tareas próximas a vencer
    const upcomingDeadlines = tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const daysUntilDue = Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3 && daysUntilDue > 0;
    }).length;
    
    if (upcomingDeadlines > 0) {
        recommendations.push({
            icon: '⚠️',
            text: `Hay ${upcomingDeadlines} tarea(s) con fecha de vencimiento próxima que requieren atención`
        });
    }
    
    // Tareas sin asignar
    const unassigned = tasks.filter(t => !t.assignee).length;
    if (unassigned > 0) {
        recommendations.push({
            icon: '📋',
            text: `${unassigned} tarea(s) sin asignar. Considera asignarlas a miembros del equipo`
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            icon: '✅',
            text: 'Todo está en orden. ¡Sigue así!'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <span class="rec-icon">${rec.icon}</span>
            <span>${rec.text}</span>
        </div>
    `).join('');
}

// Plantillas
function initializeTemplates() {
    loadTemplates();
}

function loadTemplates() {
    const saved = localStorage.getItem('templates');
    if (saved) {
        templates = JSON.parse(saved);
    } else {
        templates = [
            {
                id: 'task',
                name: 'Plantilla de Tarea',
                type: 'task',
                data: {
                    priority: 'media',
                    tags: ['estándar']
                }
            },
            {
                id: 'meeting',
                name: 'Plantilla de Reunión',
                type: 'meeting',
                data: {
                    duration: 60,
                    agenda: ['Revisión de avances', 'Próximos pasos', 'Q&A']
                }
            },
            {
                id: 'project',
                name: 'Plantilla de Proyecto',
                type: 'project',
                data: {
                    phases: ['Planificación', 'Desarrollo', 'Revisión', 'Publicación']
                }
            },
            {
                id: 'review',
                name: 'Plantilla de Revisión',
                type: 'review',
                data: {
                    checklist: ['Revisar contenido', 'Verificar formato', 'Validar links']
                }
            }
        ];
        saveTemplates();
    }
}

function saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(templates));
}

window.useTemplate = function(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    switch(template.type) {
        case 'task':
            document.querySelector('a[href="#tareas"]').click();
            setTimeout(() => {
                document.getElementById('taskTitle').value = 'Nueva tarea desde plantilla';
                document.getElementById('taskPriority').value = template.data.priority || 'media';
                if (template.data.tags) {
                    document.getElementById('taskTags').value = template.data.tags.join(', ');
                }
            }, 300);
            break;
        case 'meeting':
            createMeeting();
            break;
        case 'project':
            addNotification('Plantilla Aplicada', 'Plantilla de proyecto aplicada. Crea las tareas necesarias.', 'info');
            break;
        case 'review':
            addNotification('Plantilla Aplicada', 'Plantilla de revisión lista para usar.', 'info');
            break;
    }
    
    addAuditLog('Plantilla usada', template.name, 'templates');
};

// Auditoría
function initializeAudit() {
    loadAuditLogs();
    renderAuditLogs();
}

function loadAuditLogs() {
    const saved = localStorage.getItem('auditLogs');
    if (saved) {
        auditLogs = JSON.parse(saved);
    }
}

function saveAuditLogs() {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

function addAuditLog(action, details, type = 'general') {
    const log = {
        id: Date.now(),
        time: new Date().toLocaleString('es-ES'),
        user: currentUser || 'Sistema',
        action,
        details,
        type
    };
    
    auditLogs.unshift(log);
    
    // Limitar a 1000 logs
    if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(0, 1000);
    }
    
    saveAuditLogs();
    renderAuditLogs();
}

function renderAuditLogs() {
    const container = document.getElementById('auditLog');
    if (!container) return;
    
    if (auditLogs.length === 0) {
        container.innerHTML = '<p class="no-data">No hay registros de auditoría</p>';
        return;
    }
    
    container.innerHTML = auditLogs.slice(0, 50).map(log => `
        <div class="audit-entry">
            <span class="audit-time">${log.time}</span>
            <span class="audit-user">${log.user}</span>
            <span class="audit-action">${log.action}: ${log.details}</span>
            <span class="audit-type">${log.type}</span>
        </div>
    `).join('');
}

window.filterAuditLogs = function() {
    const type = document.getElementById('auditType').value;
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;
    
    let filtered = auditLogs;
    
    if (type !== 'all') {
        filtered = filtered.filter(log => log.type === type);
    }
    
    if (startDate) {
        filtered = filtered.filter(log => new Date(log.time) >= new Date(startDate));
    }
    
    if (endDate) {
        filtered = filtered.filter(log => new Date(log.time) <= new Date(endDate));
    }
    
    const container = document.getElementById('auditLog');
    if (container) {
        container.innerHTML = filtered.slice(0, 50).map(log => `
            <div class="audit-entry">
                <span class="audit-time">${log.time}</span>
                <span class="audit-user">${log.user}</span>
                <span class="audit-action">${log.action}: ${log.details}</span>
                <span class="audit-type">${log.type}</span>
            </div>
        `).join('');
    }
};

window.exportAuditLogs = function() {
    const csv = auditLogs.map(log => 
        `${log.time},${log.user},${log.action},${log.details},${log.type}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Auditoría Exportada', 'Los logs de auditoría se han descargado', 'success');
};

// Configuración y Backup
window.createBackup = function() {
    const backup = {
        id: Date.now(),
        date: new Date().toLocaleString('es-ES'),
        data: {
            tasks,
            uploadedFiles,
            chatMessages,
            votes,
            meetings,
            documentVersions,
            badges
        }
    };
    
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));
    renderBackups();
    addNotification('Backup Creado', 'Backup creado exitosamente', 'success');
    addAuditLog('Backup creado', `Backup ID: ${backup.id}`, 'security');
};

window.restoreBackup = function() {
    if (backups.length === 0) {
        alert('No hay backups disponibles');
        return;
    }
    
    const backupId = prompt(`Ingresa el ID del backup a restaurar:\n${backups.map(b => `${b.id} - ${b.date}`).join('\n')}`);
    if (!backupId) return;
    
    const backup = backups.find(b => b.id == backupId);
    if (!backup) {
        alert('Backup no encontrado');
        return;
    }
    
    if (confirm('¿Estás seguro de restaurar este backup? Se perderán los datos actuales.')) {
        tasks = backup.data.tasks || [];
        uploadedFiles = backup.data.uploadedFiles || [];
        chatMessages = backup.data.chatMessages || [];
        votes = backup.data.votes || [];
        meetings = backup.data.meetings || [];
        documentVersions = backup.data.documentVersions || [];
        badges = backup.data.badges || [];
        
        saveTasks();
        saveFiles();
        saveChatMessages();
        saveVotes();
        saveMeetings();
        saveBadges();
        
        renderTasks();
        renderKanban();
        updateDashboard();
        addNotification('Backup Restaurado', 'Los datos se han restaurado correctamente', 'success');
        addAuditLog('Backup restaurado', `Backup ID: ${backupId}`, 'security');
    }
};

window.downloadBackup = function() {
    const backup = {
        date: new Date().toISOString(),
        data: {
            tasks,
            uploadedFiles,
            chatMessages,
            votes,
            meetings,
            documentVersions,
            badges
        }
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Backup Descargado', 'El backup se ha descargado correctamente', 'success');
};

function renderBackups() {
    const list = document.getElementById('backupList');
    if (!list) return;
    
    const saved = localStorage.getItem('backups');
    if (saved) {
        backups = JSON.parse(saved);
    }
    
    if (backups.length === 0) {
        list.innerHTML = '<p class="no-data">No hay backups disponibles</p>';
        return;
    }
    
    list.innerHTML = backups.slice().reverse().map(backup => `
        <div class="backup-item" style="padding: 1rem; background: var(--bg-color); border-radius: 5px; margin-bottom: 0.5rem;">
            <div><strong>ID:</strong> ${backup.id}</div>
            <div><strong>Fecha:</strong> ${backup.date}</div>
        </div>
    `).join('');
}

window.setTheme = function(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-mode');
    } else {
        // Auto - basado en preferencias del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    localStorage.setItem('theme', theme);
};

// Mejoras en funciones existentes para incluir auditoría
const originalTaskFormSubmit = document.getElementById('taskForm')?.onsubmit;
if (document.getElementById('taskForm')) {
    document.getElementById('taskForm').addEventListener('submit', function(e) {
        setTimeout(() => {
            const title = document.getElementById('taskTitle').value;
            if (title) {
                addAuditLog('Tarea creada', title, 'tasks');
            }
        }, 100);
    });
}
