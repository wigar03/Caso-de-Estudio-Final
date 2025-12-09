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

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('totalFiles').textContent = totalFiles;

    // Actualizar gráficos
    updateCharts();
    updateDashboardActivity();
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
        
        drawBarChart(ctx, memberCanvas.width, memberCanvas.height, memberData);
    }
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

// Cargar todos los datos
function loadData() {
    loadTasks();
    loadFiles();
    updateDashboard();
    
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
