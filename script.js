// Navegación entre secciones
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los links y secciones
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Agregar clase active al link clickeado
            this.classList.add('active');
            
            // Mostrar la sección correspondiente
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Gestión de tareas
    const taskForm = document.getElementById('taskForm');
    const tasksContainer = document.getElementById('tasksContainer');
    let tasks = [];

    // Cargar tareas del localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            renderTasks();
        }
    }

    // Guardar tareas en localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Renderizar tareas
    function renderTasks() {
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks">No hay tareas asignadas aún. Agrega una nueva tarea para comenzar.</p>';
            return;
        }

        tasksContainer.innerHTML = tasks.map((task, index) => {
            const priorityClass = `priority-${task.priority}`;
            const assigneeNames = {
                'coordinador': 'Coordinador',
                'diseñador': 'Diseñador Instruccional',
                'editor': 'Editor de Contenido',
                'programador': 'Programador Web',
                'multimedia': 'Especialista Multimedia',
                'revisor': 'Revisor'
            };

            return `
                <div class="task-item ${priorityClass}">
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            Asignado a: ${assigneeNames[task.assignee]} | Prioridad: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="complete-btn" onclick="completeTask(${index})">Completar</button>
                        <button class="delete-btn" onclick="deleteTask(${index})">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Agregar nueva tarea
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const assignee = document.getElementById('taskAssignee').value;
        const priority = document.getElementById('taskPriority').value;

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
            completed: false,
            createdAt: new Date().toLocaleDateString('es-ES')
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        // Limpiar formulario
        taskForm.reset();
    });

    // Completar tarea
    window.completeTask = function(index) {
        tasks[index].completed = true;
        tasks[index].completedAt = new Date().toLocaleDateString('es-ES');
        saveTasks();
        renderTasks();
    };

    // Eliminar tarea
    window.deleteTask = function(index) {
        if (confirm('¿Estás seguro de eliminar esta tarea?')) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    };

    // Cargar tareas al iniciar
    loadTasks();

    // Gestión de archivos
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    let uploadedFiles = [];

    // Cargar archivos del localStorage
    function loadFiles() {
        const savedFiles = localStorage.getItem('uploadedFiles');
        if (savedFiles) {
            uploadedFiles = JSON.parse(savedFiles);
            renderUploadedFiles();
        }
    }

    // Guardar archivos en localStorage
    function saveFiles() {
        localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    }

    // Renderizar archivos subidos
    function renderUploadedFiles() {
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
                        <span class="file-meta">Subido por: ${file.uploadedBy} | Fecha: ${file.uploadDate}</span>
                    </div>
                    <button class="download-btn" onclick="downloadFile(${index})">Descargar</button>
                </div>
            `;
        }).join('');
    }

    // Obtener icono según tipo de archivo
    function getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'xls': '📊',
            'xlsx': '📊',
            'ppt': '📊',
            'pptx': '📊',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'mp4': '🎬',
            'avi': '🎬',
            'mov': '🎬',
            'zip': '📦',
            'rar': '📦'
        };
        return iconMap[extension] || '📄';
    }

    // Click en área de upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop
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
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Selección de archivos
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    // Manejar archivos seleccionados
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            const newFile = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedBy: 'Usuario Actual',
                uploadDate: new Date().toLocaleDateString('es-ES')
            };

            uploadedFiles.push(newFile);
        });

        saveFiles();
        renderUploadedFiles();
        fileInput.value = '';
    }

    // Descargar archivo (simulado)
    window.downloadFile = function(index) {
        const file = uploadedFiles[index];
        alert(`Descargando: ${file.name}\n\nEn una implementación real, esto descargaría el archivo desde el servidor.`);
    };

    // Cargar archivos al iniciar
    loadFiles();

    // Simular actividad reciente (actualización cada 30 segundos)
    function updateActivityLog() {
        const activities = [
            { time: 'Hace 2 horas', text: 'Editor de Contenido actualizó "Módulo 3 - Introducción"' },
            { time: 'Hace 5 horas', text: 'Especialista Multimedia subió "Video Tutorial.mp4"' },
            { time: 'Ayer', text: 'Programador Web completó "Sistema de autenticación"' },
            { time: 'Hace 1 hora', text: 'Diseñador Instruccional creó "Guía de Estilo"' },
            { time: 'Hace 3 horas', text: 'Revisor aprobó "Módulo 1 - Fundamentos"' },
            { time: 'Hace 6 horas', text: 'Coordinador asignó nueva tarea al equipo' }
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
    }

    updateActivityLog();
    setInterval(updateActivityLog, 30000); // Actualizar cada 30 segundos
});

