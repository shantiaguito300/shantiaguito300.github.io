// Variables globales
let virtualTour;
let tourUI;

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Mostrar pantalla de carga
        showInitialLoading();

        // Verificar compatibilidad del navegador
        if (!checkWebGLSupport()) {
            showError('Tu navegador no soporta WebGL. Por favor, actualiza tu navegador o usa uno compatible.');
            return;
        }

        // Inicializar tour virtual
        virtualTour = new VirtualTour();
        
        // Esperar a que se inicialice completamente
        await waitForTourInitialization();

        // Inicializar interfaz de usuario
        tourUI = new TourUI(virtualTour);

        // Configurar optimizaciones móviles
        tourUI.setupMobileOptimizations();

        // Agregar marca de agua (opcional)
        tourUI.addWatermark('Mi Inmobiliaria Virtual');

        // Configurar eventos adicionales
        setupAdditionalEvents();

        console.log('Tour virtual inicializado correctamente');

    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showError('Error cargando el tour virtual. Por favor, recarga la página.');
    }
});

function showInitialLoading() {
    const loadingScreen = document.getElementById('loading');
    loadingScreen.classList.remove('hidden');
}

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

function waitForTourInitialization() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (virtualTour && virtualTour.currentRoom) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Timeout después de 10 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 10000);
    });
}

function setupAdditionalEvents() {
    // Evento para detectar cambios de orientación en móviles
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (virtualTour) {
                virtualTour.onWindowResize();
            }
        }, 100);
    });

    // Evento para manejar pérdida de foco
    window.addEventListener('blur', () => {
        // Pausar animaciones pesadas si es necesario
        if (virtualTour && virtualTour.controls) {
            virtualTour.controls.mouseDown = false;
        }
    });

    // Evento para detectar conexión lenta
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            if (tourUI) {
                tourUI.showNotification('Conexión lenta detectada. El tour puede tardar más en cargar.', 'warning');
            }
        }
    }

    // Event listener para el botón de compartir (si existe)
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn && tourUI) {
        shareBtn.addEventListener('click', () => {
            tourUI.shareTour();
        });
    }

    // Prevenir zoom con rueda en Firefox
    window.addEventListener('DOMMouseScroll', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    });

    // Prevenir zoom con gestos en Safari
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    });

    document.addEventListener('gestureend', (e) => {
        e.preventDefault();
    });
}

function showError(message) {
    const loadingScreen = document.getElementById('loading');
    const spinner = loadingScreen.querySelector('.spinner');
    const loadingText = loadingScreen.querySelector('p');

    spinner.style.display = 'none';
    loadingText.textContent = message;
    loadingText.style.color = '#f44336';
    loadingScreen.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
}

// Funciones de utilidad global
window.tourUtils = {
    // Función para cambiar habitación desde HTML
    changeRoom: (roomId) => {
        if (virtualTour) {
            virtualTour.changeRoom(roomId);
        }
    },

    // Función para obtener información de la habitación actual
    getCurrentRoom: () => {
        return virtualTour ? virtualTour.currentRoom : null;
    },

    // Función para resetear la vista
    resetView: () => {
        if (virtualTour) {
            virtualTour.resetView();
        }
    },

    // Función para pantalla completa
    toggleFullscreen: () => {
        if (virtualTour) {
            virtualTour.toggleFullscreen();
        }
    },

    // Función para mostrar información
    showInfo: () => {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.classList.remove('hidden');
    },

    // Función para ocultar información
    hideInfo: () => {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.classList.add('hidden');
    }
};

// Manejo de errores globales
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
    if (tourUI) {
        tourUI.showNotification('Ha ocurrido un error inesperado', 'error');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rechazada:', e.reason);
    if (tourUI) {
        tourUI.showNotification('Error de conexión', 'error');
    }
});

// Debug helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugTour = {
        tour: () => virtualTour,
        ui: () => tourUI,
        loadRoom: (roomId) => virtualTour?.changeRoom(roomId),
        getCamera: () => virtualTour?.camera,
        getScene: () => virtualTour?.scene,
        logRoomData: () => console.log(virtualTour?.currentRoom)
    };
    
    console.log('🏠 Tour Virtual Debug Mode Activado');
    console.log('Usa window.debugTour para acceder a las funciones de debug');
}