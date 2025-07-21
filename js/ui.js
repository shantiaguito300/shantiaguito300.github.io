class TourUI {
    constructor(tour) {
        this.tour = tour;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navegación por miniaturas
        this.setupThumbnailNavigation();
        
        // Controles de la interfaz
        this.setupInterfaceControls();
        
        // Controles de vista
        this.setupViewControls();
        
        // Eventos de teclado
        this.setupKeyboardControls();
    }

    setupThumbnailNavigation() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', (e) => {
                const roomId = thumbnail.dataset.room;
                this.tour.changeRoom(roomId);
                
                // Actualizar estado activo
                thumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });

            // Efecto hover
            thumbnail.addEventListener('mouseenter', () => {
                if (!thumbnail.classList.contains('active')) {
                    thumbnail.style.transform = 'translateY(-8px)';
                }
            });

            thumbnail.addEventListener('mouseleave', () => {
                if (!thumbnail.classList.contains('active')) {
                    thumbnail.style.transform = 'translateY(0)';
                }
            });
        });
    }

    setupInterfaceControls() {
        // Botón de pantalla completa
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => {
            this.tour.toggleFullscreen();
        });

        // Botón de información
        const infoBtn = document.getElementById('info-btn');
        const infoPanel = document.getElementById('info-panel');
        const closeInfoBtn = document.getElementById('close-info');

        infoBtn.addEventListener('click', () => {
            infoPanel.classList.toggle('hidden');
        });

        closeInfoBtn.addEventListener('click', () => {
            infoPanel.classList.add('hidden');
        });

        // Cerrar panel con click fuera
        infoPanel.addEventListener('click', (e) => {
            if (e.target === infoPanel) {
                infoPanel.classList.add('hidden');
            }
        });

        // Actualizar información de la propiedad
        this.updatePropertyInfo();
    }

    setupViewControls() {
        // Control de zoom
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            const zoomValue = parseFloat(e.target.value);
            this.tour.setZoom(zoomValue);
        });

        // Botón resetear vista
        const resetViewBtn = document.getElementById('reset-view');
        resetViewBtn.addEventListener('click', () => {
            this.tour.resetView();
            zoomSlider.value = 1;
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.tour.toggleFullscreen();
                    }
                    break;
                
                case 'i':
                case 'I':
                    const infoPanel = document.getElementById('info-panel');
                    infoPanel.classList.toggle('hidden');
                    break;
                
                case 'r':
                case 'R':
                    this.tour.resetView();
                    document.getElementById('zoom-slider').value = 1;
                    break;
                
                case 'Escape':
                    document.getElementById('info-panel').classList.add('hidden');
                    break;
                
                case '1':
                case '2':
                case '3':
                case '4':
                    const roomIndex = parseInt(e.key) - 1;
                    const rooms = ['sala', 'cocina', 'dormitorio1', 'bano'];
                    if (rooms[roomIndex]) {
                        this.tour.changeRoom(rooms[roomIndex]);
                    }
                    break;
            }
        });
    }

    updatePropertyInfo() {
        if (!this.tour.tourData) return;

        const propertyDetails = document.getElementById('property-details');
        const property = this.tour.tourData;

        propertyDetails.innerHTML = `
            <p><strong>Tipo:</strong> ${property.description}</p>
            <p><strong>Área:</strong> ${property.area}</p>
            <p><strong>Habitaciones:</strong> ${property.rooms}</p>
            <p><strong>Baños:</strong> ${property.bathrooms}</p>
            <p><strong>Ubicación:</strong> ${property.location}</p>
            <p><strong>Precio:</strong> ${property.price}</p>
        `;
    }

    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Estilos
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            zIndex: '1000',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateLoadingProgress(progress) {
        const loadingText = document.querySelector('.loading-screen p');
        loadingText.textContent = `Cargando tour virtual... ${Math.round(progress)}%`;
    }

    // Métodos para dispositivos móviles
    setupMobileOptimizations() {
        // Detectar dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            document.body.classList.add('mobile');
            
            // Ajustar controles para móviles
            this.optimizeForMobile();
        }
    }

    optimizeForMobile() {
        // Hacer los controles más grandes para touch
        const style = document.createElement('style');
        style.textContent = `
            .mobile .thumbnail {
                min-width: 120px;
            }
            .mobile .thumbnail img {
                width: 100px;
                height: 100px;
            }
            .mobile .nav-controls button {
                padding: 15px 20px;
                font-size: 18px;
            }
            .mobile .hotspot {
                width: 40px;
                height: 40px;
            }
        `;
        document.head.appendChild(style);

        // Prevenir zoom en doble tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Método para compartir tour (si se requiere en el futuro)
    shareTour() {
        if (navigator.share) {
            navigator.share({
                title: 'Tour Virtual - Inmobiliaria',
                text: 'Mira este increíble tour virtual de este inmueble',
                url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
        } else {
            // Fallback: copiar URL al clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('¡URL copiada al portapapeles!');
            }).catch(() => {
                this.showNotification('No se pudo copiar la URL', 'error');
            });
        }
    }

    // Método para agregar marca de agua (opcional)
    addWatermark(text = 'Tu Inmobiliaria') {
        const watermark = document.createElement('div');
        watermark.textContent = text;
        
        Object.assign(watermark.style, {
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            zIndex: '90',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif'
        });

        document.body.appendChild(watermark);
    }
}