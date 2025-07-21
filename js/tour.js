class VirtualTour {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.panoramaSphere = null;
        this.currentRoom = null;
        this.isLoading = false;
        this.hotspots = [];
        this.controls = {
            mouseDown: false,
            mouseX: 0,
            mouseY: 0,
            lon: 0,
            lat: 0,
            phi: 0,
            theta: 0,
            target: { lon: 0, lat: 0 }
        };
        this.tourData = null;
        
        this.init();
    }

    async init() {
        try {
            // Cargar datos del tour
            await this.loadTourData();
            
            // Configurar Three.js
            this.setupThreeJS();
            
            // Configurar controles
            this.setupControls();
            
            // Cargar primera habitación
            await this.loadRoom('sala');
            
            // Iniciar bucle de renderizado
            this.animate();
            
            // Ocultar pantalla de carga
            this.hideLoading();
            
        } catch (error) {
            console.error('Error inicializando tour virtual:', error);
        }
    }

    async loadTourData() {
        try {
            const response = await fetch('data/tours.json');
            const data = await response.json();
            this.tourData = data.properties[0]; // Por ahora solo una propiedad
        } catch (error) {
            console.error('Error cargando datos del tour:', error);
            throw error;
        }
    }

    setupThreeJS() {
        // Crear escena
        this.scene = new THREE.Scene();

        // Configurar cámara
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near
            1000 // Far
        );

        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Añadir al DOM
        const container = document.getElementById('panorama-viewer');
        container.appendChild(this.renderer.domElement);

        // Crear esfera para panorama
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invertir para ver desde dentro

        const material = new THREE.MeshBasicMaterial();
        this.panoramaSphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.panoramaSphere);

        // Manejar redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupControls() {
        const canvas = this.renderer.domElement;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch events para móviles
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', () => this.onTouchEnd());

        // Prevenir menú contextual
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    async loadRoom(roomId) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const room = this.tourData.rooms.find(r => r.id === roomId);
            if (!room) {
                throw new Error(`Habitación ${roomId} no encontrada`);
            }

            // Cargar textura panorámica
            const loader = new THREE.TextureLoader();
            const texture = await this.loadTexture(loader, room.panorama);
            
            // Aplicar textura
            this.panoramaSphere.material.map = texture;
            this.panoramaSphere.material.needsUpdate = true;

            // Actualizar habitación actual
            this.currentRoom = room;

            // Limpiar hotspots anteriores
            this.clearHotspots();

            // Crear nuevos hotspots
            this.createHotspots(room.hotspots);

            // Actualizar UI
            this.updateUI(room);

            // Resetear vista
            this.resetView();

        } catch (error) {
            console.error('Error cargando habitación:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    loadTexture(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (texture) => resolve(texture),
                (progress) => {
                    // Opcional: mostrar progreso de carga
                },
                (error) => reject(error)
            );
        });
    }

    createHotspots(hotspotsData) {
        hotspotsData.forEach(hotspotData => {
            const hotspot = this.createHotspot(hotspotData);
            this.hotspots.push(hotspot);
        });
    }

    createHotspot(data) {
        const hotspotElement = document.createElement('div');
        hotspotElement.className = 'hotspot';
        hotspotElement.title = data.label;
        
        // Posicionar hotspot
        this.updateHotspotPosition(hotspotElement, data.position);

        // Evento click
        hotspotElement.addEventListener('click', () => {
            this.loadRoom(data.target);
        });

        document.getElementById('hotspots').appendChild(hotspotElement);
        
        return {
            element: hotspotElement,
            data: data
        };
    }

    updateHotspotPosition(element, position) {
        // Convertir coordenadas esféricas a posición 2D en pantalla
        const vector = new THREE.Vector3();
        vector.setFromSphericalCoords(
            1,
            (position.y * Math.PI) + (Math.PI / 2),
            position.x * Math.PI
        );

        vector.project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }

    clearHotspots() {
        this.hotspots.forEach(hotspot => {
            hotspot.element.remove();
        });
        this.hotspots = [];
    }

    updateUI(room) {
        // Actualizar título
        document.getElementById('room-title').textContent = room.name;

        // Actualizar miniaturas activas
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
            if (thumb.dataset.room === room.id) {
                thumb.classList.add('active');
            }
        });
    }

    resetView() {
        this.controls.lon = 0;
        this.controls.lat = 0;
        this.controls.target.lon = 0;
        this.controls.target.lat = 0;
        this.camera.fov = 85;
        this.camera.updateProjectionMatrix();
    }

    // Eventos de mouse
    onMouseDown(event) {
        event.preventDefault();
        this.controls.mouseDown = true;
        this.controls.mouseX = event.clientX;
        this.controls.mouseY = event.clientY;
    }

    onMouseMove(event) {
        if (!this.controls.mouseDown) return;

        const deltaX = event.clientX - this.controls.mouseX;
        const deltaY = event.clientY - this.controls.mouseY;

        this.controls.target.lon += deltaX * 0.2; // ← signo cambiado
        this.controls.target.lat += deltaY * 0.2;
        this.controls.target.lat = Math.max(-85, Math.min(85, this.controls.target.lat));

        this.controls.mouseX = event.clientX;
        this.controls.mouseY = event.clientY;
    }

    onMouseUp() {
        this.controls.mouseDown = false;
    }

    onWheel(event) {
        event.preventDefault();
        const fov = this.camera.fov + event.deltaY * 0.05;
        this.camera.fov = Math.max(10, Math.min(100, fov));
        this.camera.updateProjectionMatrix();
    }

    // Eventos touch para móviles
    onTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.controls.mouseDown = true;
        this.controls.mouseX = touch.clientX;
        this.controls.mouseY = touch.clientY;
    }

    onTouchMove(event) {
        if (!this.controls.mouseDown) return;
        event.preventDefault();
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.controls.mouseX;
        const deltaY = touch.clientY - this.controls.mouseY;

        this.controls.target.lon += deltaX * 0.2; // ← signo cambiado
        this.controls.target.lat += deltaY * 0.2;
        this.controls.target.lat = Math.max(-85, Math.min(85, this.controls.target.lat));

        this.controls.mouseX = touch.clientX;
        this.controls.mouseY = touch.clientY;
    }

    onTouchEnd() {
        this.controls.mouseDown = false;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Actualizar posiciones de hotspots
        this.hotspots.forEach(hotspot => {
            this.updateHotspotPosition(hotspot.element, hotspot.data.position);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Suavizar movimiento de cámara
        this.controls.lon += (this.controls.target.lon - this.controls.lon) * 0.1;
        this.controls.lat += (this.controls.target.lat - this.controls.lat) * 0.1;

        // Convertir a coordenadas esféricas
        this.controls.phi = THREE.MathUtils.degToRad(90 - this.controls.lat);
        this.controls.theta = THREE.MathUtils.degToRad(this.controls.lon);

        // Actualizar posición de cámara
        const target = new THREE.Vector3();
        target.setFromSphericalCoords(1, this.controls.phi, this.controls.theta);
        this.camera.lookAt(target);

        // Actualizar posiciones de hotspots
        this.hotspots.forEach(hotspot => {
            this.updateHotspotPosition(hotspot.element, hotspot.data.position);
        });

        this.renderer.render(this.scene, this.camera);
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 500);
    }

    // Método público para cambiar habitación
    changeRoom(roomId) {
        this.loadRoom(roomId);
    }

    // Método público para pantalla completa
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    // Método público para ajustar zoom
    setZoom(value) {
        this.camera.fov = 75 / value;
        this.camera.updateProjectionMatrix();
    }
}