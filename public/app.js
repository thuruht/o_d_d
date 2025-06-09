document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let map = null;
    let locationsLayer = null;
    let temporaryMarker = null;
    let currentLanguage = 'en';
    let currentFilters = {
        types: [],
        amenities: []
    };
    let favoritesViewActive = false;
    const HOME_VIEW = {
        center: [9, 8],
        zoom: 2
    };

    const API_BASE = '/api';
    const modalManager = new ModalManager();
    const CATEGORIES = [
        'established-campground', 'informal-campsite', 'wild-camping',
        'scenic-viewpoint', 'day-use-picnic',
        'hotel', 'hostel', 'restaurant',
        'mechanic', 'fuel', 'propane', 'water', 'dump-station', 'laundry', 'showers',
        'wifi-spot', 'tourist-attraction', 'shopping', 'medical', 'pet-services',
        'border-crossing', 'checkpoint', 'warning', 'other'
    ];
    const AMENITIES_CONFIG = {
        toilets: { label: 'Toilets', type: 'select', options: ['none', 'flush', 'vault', 'pit', 'portable'] },
        showers: { label: 'Showers', type: 'select', options: ['none', 'hot', 'cold', 'paid'] },
        water: { label: 'Water Source', type: 'select', options: ['none', 'tap-potable', 'tap-non-potable', 'fountain', 'natural-source'] },
        power: { label: 'Power', type: 'select', options: ['none', '110v', '220v', 'usb'] },
        wifi: { label: 'WiFi', type: 'select', options: ['none', 'yes', 'paid'] },
        cellular: { label: 'Cell Signal', type: 'select', options: ['none', '1g/2g', '3g', '4g/lte', '5g'] },
        pet_friendly: { label: 'Pet Friendly', type: 'boolean' },
        tent_friendly: { label: 'Tent Friendly', type: 'boolean' },
        opens_24_7: { label: 'Open 24/7', type: 'boolean' },
    };
const translations = {
        en: {
            login: 'Login', register: 'Register', add_destination: 'Add Destination', admin: 'Admin Panel', logout: 'Logout',
            info: 'Info', search_btn: 'Go', filters_btn: 'Filters', my_favorites: 'My Favorites', my_profile: 'My Profile',
            login_title: 'User Login', register_title: 'Create Account',
            username: 'Username', email: 'Email', password: 'Password',
            submit: 'Submit', cancel: 'Cancel', close: 'Close', welcome: 'Welcome', save_changes: 'Save Changes',
            destination_type: 'Destination Type', destination_name: 'Destination Name', description: 'Description',
            add_destination_title: 'Add a New Destination', edit_profile_title: 'Edit Your Profile',
            destination_added_success: 'Destination submitted for review!', login_success: 'Login successful!',
            logout_success: 'You have been logged out.', error_please_login: 'Please log in to perform this action.',
            upload_media: 'Upload Photos/Videos', search_no_results: 'No destinations match your criteria.',
            filter_title: 'Filter Destinations', admin_panel_title: 'Admin Panel', info_title: 'About This Project',
            apply_filters: 'Apply Filters', clear_filters: 'Clear Filters',
            bio: 'Bio', website: 'Website', contact_info: 'Contact Info', avatar: 'Avatar',
            profile_updated: 'Profile updated successfully', report_destination: 'Report Destination',
            add_review_title: 'Add Your Review', rating: 'Rating (1-5)', comment: 'Comment',
            report_reason: 'Reason for Report', report_notes: 'Additional Notes (optional)',
            report_sent: 'Report sent for review. Thank you.', review_sent: 'Your review has been submitted.',
            media_upload_title: 'Upload Media', select_files: 'Select photos or videos',
            favorites_empty: 'You have not saved any favorites yet. Click the star on a destination to add it!',
            'established-campground': 'Established Campground', 'informal-campsite': 'Informal Campsite', 'wild-camping': 'Wild Camping',
            'scenic-viewpoint': 'Scenic Viewpoint', 'day-use-picnic': 'Day Use / Picnic', 'hotel': 'Hotel', 'hostel': 'Hostel',
            'restaurant': 'Restaurant', 'mechanic': 'Mechanic', 'fuel': 'Fuel', 'propane': 'Propane', 'water': 'Water',
            'dump-station': 'Dump Station', 'laundry': 'Laundry', 'showers': 'Showers', 'wifi-spot': 'WiFi Spot',
            'tourist-attraction': 'Tourist Attraction', 'shopping': 'Shopping', 'medical': 'Medical', 'pet-services': 'Pet Services',
            'border-crossing': 'Border Crossing', 'checkpoint': 'Checkpoint', 'warning': 'Warning', 'other': 'Other'
        },
        es: {
            login: 'Iniciar Sesión', register: 'Registrarse', add_destination: 'Añadir Destino', admin: 'Admin', logout: 'Cerrar Sesión',
            info: 'Info', search_btn: 'Ir', filters_btn: 'Filtros', my_favorites: 'Mis Favoritos', my_profile: 'Mi Perfil',
            login_title: 'Acceso de Usuario', register_title: 'Crear Cuenta',
            username: 'Usuario', email: 'Correo Electrónico', password: 'Contraseña',
            submit: 'Enviar', cancel: 'Cancelar', close: 'Cerrar', welcome: 'Bienvenido', save_changes: 'Guardar Cambios',
            destination_type: 'Tipo de Destino', destination_name: 'Nombre del Destino', description: 'Descripción',
            add_destination_title: 'Añadir un Nuevo Destino', edit_profile_title: 'Editar Tu Perfil',
            destination_added_success: '¡Destino enviado para revisión!', login_success: '¡Inicio de sesión exitoso!',
            logout_success: 'Has cerrado la sesión.', error_please_login: 'Por favor, inicie sesión para realizar esta acción.',
            upload_media: 'Subir Fotos/Videos', search_no_results: 'No se encontraron destinos para su búsqueda.',
            filter_title: 'Filtrar Destinos', admin_panel_title: 'Panel de Admin', info_title: 'Sobre Este Proyecto',
            apply_filters: 'Aplicar Filtros', clear_filters: 'Limpiar Filtros',
            bio: 'Biografía', website: 'Sitio Web', contact_info: 'Información de Contacto', avatar: 'Avatar',
            profile_updated: 'Perfil actualizado con éxito', report_destination: 'Reportar Destino',
            add_review_title: 'Añadir Tu Opinión', rating: 'Calificación (1-5)', comment: 'Comentario',
            report_reason: 'Razón del Reporte', report_notes: 'Notas Adicionales (opcional)',
            report_sent: 'Reporte enviado para revisión. Gracias.', review_sent: 'Tu opinión ha sido enviada.',
            media_upload_title: 'Subir Archivos', select_files: 'Seleccionar fotos o videos',
            favorites_empty: 'Aún no has guardado ningún favorito. ¡Haz clic en la estrella de un destino para añadirlo!',
            'established-campground': 'Camping Establecido', 'informal-campsite': 'Camping Informal', 'wild-camping': 'Acampada Libre',
            'scenic-viewpoint': 'Mirador Escénico', 'day-use-picnic': 'Área de Día / Picnic', 'hotel': 'Hotel', 'hostel': 'Hostal',
            'restaurant': 'Restaurante', 'mechanic': 'Mecánico', 'fuel': 'Gasolina', 'propane': 'Propano', 'water': 'Agua',
            'dump-station': 'Estación de Vaciado', 'laundry': 'Lavandería', 'showers': 'Duchas', 'wifi-spot': 'Punto WiFi',
            'tourist-attraction': 'Atracción Turística', 'shopping': 'Compras', 'medical': 'Médico', 'pet-services': 'Servicios para Mascotas',
            'border-crossing': 'Cruce Fronterizo', 'checkpoint': 'Punto de Control', 'warning': 'Advertencia', 'other': 'Otro',
            'toilets': 'Baños', 'water_source': 'Fuente de Agua', 'power': 'Electricidad', 'cell_signal': 'Señal Celular', 'pet_friendly': 'Apto para Mascotas', 'tent_friendly': 'Apto para Tiendas', 'open_24/7': 'Abierto 24/7',
            'none': 'Ninguno', 'flush': 'Con Cisterna', 'vault': 'De Bóveda', 'pit': 'De Foso', 'portable': 'Portátil', 'hot': 'Caliente', 'cold': 'Fría', 'paid': 'De Pago',
            'tap-potable': 'Grifo Potable', 'tap-non-potable': 'Grifo No Potable', 'fountain': 'Fuente', 'natural-source': 'Fuente Natural',
            '110v': '110V', '220v': '220V', 'usb': 'USB', 'yes': 'Sí', '1g/2g': '1G/2G', '3g': '3G', '4g/lte': '4G/LTE', '5g': '5G'
        },
        fr: {
            login: 'Connexion', register: 'S\'inscrire', add_destination: 'Ajouter Destin', admin: 'Admin', logout: 'Déconnexion',
            info: 'Info', search_btn: 'Aller', filters_btn: 'Filtres', my_favorites: 'Mes Favoris', my_profile: 'Mon Profil',
            login_title: 'Connexion Utilisateur', register_title: 'Créer un Compte',
            username: 'Nom d\'utilisateur', email: 'E-mail', password: 'Mot de passe',
            submit: 'Soumettre', cancel: 'Annuler', close: 'Fermer', welcome: 'Bienvenue', save_changes: 'Enregistrer',
            destination_type: 'Type de Destin', destination_name: 'Nom du Destin', description: 'Description',
            add_destination_title: 'Ajouter un Nouveau Destin', edit_profile_title: 'Modifier Votre Profil',
            destination_added_success: 'Destin soumis pour examen!', login_success: 'Connexion réussie!',
            logout_success: 'Vous avez été déconnecté.', error_please_login: 'Veuillez vous connecter pour effectuer cette action.',
            upload_media: 'Télécharger Photos/Vidéos', search_no_results: 'Aucun destin ne correspond à votre recherche.',
            filter_title: 'Filtrer les Destins', admin_panel_title: 'Panel Admin', info_title: 'À Propos de ce Projet',
            apply_filters: 'Appliquer les Filtres', clear_filters: 'Effacer les Filtres',
            bio: 'Bio', website: 'Site Web', contact_info: 'Infos de Contact', avatar: 'Avatar',
            profile_updated: 'Profil mis à jour avec succès', report_destination: 'Signaler le Destin',
            add_review_title: 'Ajouter Votre Avis', rating: 'Évaluation (1-5)', comment: 'Commentaire',
            report_reason: 'Raison du Signalement', report_notes: 'Notes Supplémentaires (optionnel)',
            report_sent: 'Signalement envoyé pour examen. Merci.', review_sent: 'Votre avis a été soumis.',
            media_upload_title: 'Télécharger des Médias', select_files: 'Sélectionner des photos ou vidéos',
            favorites_empty: 'Vous n\'avez pas encore enregistré de favoris. Cliquez sur l\'étoile d\'une destination pour l\'ajouter!',
            'established-campground': 'Camping Établi', 'informal-campsite': 'Camping Informel', 'wild-camping': 'Camping Sauvage',
            'scenic-viewpoint': 'Point de Vue', 'day-use-picnic': 'Aire de Pique-nique', 'hotel': 'Hôtel', 'hostel': 'Auberge',
            'restaurant': 'Restaurant', 'mechanic': 'Mécanicien', 'fuel': 'Carburant', 'propane': 'Propane', 'water': 'Eau',
            'dump-station': 'Station de Vidange', 'laundry': 'Buanderie', 'showers': 'Douches', 'wifi-spot': 'Point WiFi',
            'tourist-attraction': 'Attraction Touristique', 'shopping': 'Magasins', 'medical': 'Médical', 'pet-services': 'Services Animaliers',
            'border-crossing': 'Passage Frontalier', 'checkpoint': 'Poste de Contrôle', 'warning': 'Avertissement', 'other': 'Autre',
            'toilets': 'Toilettes', 'water_source': 'Source d\'Eau', 'power': 'Électricité', 'cell_signal': 'Signal Cellulaire', 'pet_friendly': 'Animaux Admis', 'tent_friendly': 'Tentes Admises', 'open_24/7': 'Ouvert 24/7',
            'none': 'Aucun', 'flush': 'À Chasse d\'Eau', 'vault': 'Sèche', 'pit': 'À Fosse', 'portable': 'Portable', 'hot': 'Chaude', 'cold': 'Froide', 'paid': 'Payant',
            'tap-potable': 'Robinet Potable', 'tap-non-potable': 'Robinet Non Potable', 'fountain': 'Fontaine', 'natural-source': 'Source Naturelle',
            '110v': '110V', '220v': '220V', 'usb': 'USB', 'yes': 'Oui', '1g/2g': '1G/2G', '3g': '3G', '4g/lte': '4G/LTE', '5g': '5G'
      }
    };

    const t = (key) => (translations[currentLanguage]?.[key] || translations['en']?.[key] || key.replace(/-/g, ' '));
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = DOMPurify.sanitize(message); // Always sanitize here
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 5000); // Increased timeout for removal
        }, 5000);
    };
    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        const options = {
            method,
            headers,
            credentials: 'include' // Important for cookies
        };
        if (body) options.body = JSON.stringify(body);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        }
    };
    const updateUIForLanguage = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = t(key); // t() itself is assumed to return safe, translated strings
            if (el.tagName === 'INPUT' && el.type === 'search') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });
        document.title = "O.D.D.Map";
        modalManager.destroyAll();
        createModals();
    };
    const updateUserUI = (user) => {
        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');
        const userGreeting = document.getElementById('user-greeting');
        const adminNav = document.getElementById('nav-admin');
        const avatarContainer = document.getElementById('user-avatar-container');
        if (user) {
            authLinks.classList.add('hidden');
            userLinks.classList.remove('hidden');
            userGreeting.textContent = DOMPurify.sanitize(user.username); // Sanitize username for textContent
            const avatarUrl = user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
            avatarContainer.innerHTML = `<img src="${DOMPurify.sanitize(avatarUrl)}" alt="${DOMPurify.sanitize(user.username)}'s avatar">`;
            if (user.role === 'admin' || user.role === 'moderator') {
                adminNav.classList.remove('hidden');
            } else {
                adminNav.classList.add('hidden');
            }
        } else {
            authLinks.classList.remove('hidden');
            userLinks.classList.add('hidden');
            avatarContainer.innerHTML = '';
        }
    };

    const initMap = () => {
        map = L.map('map-container', { zoomControl: false }).setView(HOME_VIEW.center, HOME_VIEW.zoom);
        L.control.zoom({ position: 'topright' }).addTo(map);
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' });
        const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '© OpenTopoMap' });
        const baseMaps = { "Street": street, "Satellite": satellite, "Topographic": topo };
        street.addTo(map);
        L.control.layers(baseMaps, null, { position: 'topright', collapsed: true }).addTo(map);
        locationsLayer = L.layerGroup().addTo(map);
        loadDestinations();

        map.on('click', onMapClick);
    };
    const onMapClick = (e) => {
        if (temporaryMarker) {
            map.removeLayer(temporaryMarker);
        }
        temporaryMarker = L.marker(e.latlng).addTo(map);
        // Coordinates are not user content, no sanitization needed here.
        const content = `
            <div>
                <strong>New Point</strong><br>
                Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}
                <br><br>
                <button class="btn btn-primary btn-sm" data-action="add-here" data-lat="${e.latlng.lat}" data-lng="${e.latlng.lng}">Add Destination Here</button>
            </div>
        `;
        temporaryMarker.bindPopup(content, { className: 'temporary-marker-popup' }).openPopup();
    };
    const loadDestinations = async (searchTerm = '') => {
        try {
            if (temporaryMarker) {
                map.removeLayer(temporaryMarker);
                temporaryMarker = null;
            }
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm); // searchTerm is used in API query, not directly in HTML here
            if (currentFilters.types.length > 0) params.append('type', currentFilters.types.join(','));
            if (currentFilters.amenities.length > 0) params.append('amenities', currentFilters.amenities.join(','));

            let destinations;
            if (favoritesViewActive) {
                destinations = await apiRequest('/favorites');
                if (destinations.length === 0) {
                    showToast(t('favorites_empty'), 'info');
                }
            } else {
                destinations = await apiRequest(`/locations?${params.toString()}`);
            }

            locationsLayer.clearLayers();
            if (destinations.length === 0) {
                if (!favoritesViewActive && (searchTerm || currentFilters.types.length > 0 || currentFilters.amenities.length > 0)) {
                    showToast(t('search_no_results'), 'info');
                }
                return destinations;
            }
            const markers = destinations.map(dest => {
                const marker = L.marker([dest.latitude, dest.longitude]);
                marker.on('click', () => fetchAndShowDestinationDetails(dest.id, dest.is_favorite));
                return marker;
            });
            const group = L.featureGroup(markers).addTo(locationsLayer);
            if (markers.length > 0 && !favoritesViewActive) {
                map.flyToBounds(group.getBounds().pad(0.2));
            }
            return destinations;
        } catch (error) {
            console.error('Failed to load destinations');
            return [];
        }
    };
    const fetchAndShowDestinationDetails = async (locationId, isFavorite) => {
        try {
            const dest = await apiRequest(`/locations/${locationId}`);
            let amenityHTML = '<ul class="popup-amenities">';
            if (dest.properties) {
                for (const [key, value] of Object.entries(dest.properties)) {
                    if (value && value !== 'none' && value !== false) {
                        const config = AMENITIES_CONFIG[key];
                        const rawLabelKey = config ? config.label.toLowerCase().replace(/ /g, '_') : key.replace(/_/g, ' ');
                        const label = DOMPurify.sanitize(t(rawLabelKey));

                        let displayValue = '';
                        if (value !== true) {
                            const rawValueKey = String(value).replace(/-/g,'_');
                            displayValue = ` (${DOMPurify.sanitize(t(rawValueKey))})`;
                        }
                        amenityHTML += `<li>${label}${displayValue}</li>`;
                    }
                }
            }
            amenityHTML += '</ul>';

            const creatorAvatar = dest.creator_avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
            // Update the destination popup content
            const popupContent = `
                <div class="popup-header">
                    <h3>${DOMPurify.sanitize(dest.name)}</h3>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-location-id="${DOMPurify.sanitize(String(dest.id))}" aria-label="Favorite this destination">⭐</button>
                </div>
                <div class="popup-body">
                    <div class="popup-meta" data-user-id="${DOMPurify.sanitize(String(dest.created_by))}">
                        <img src="${DOMPurify.sanitize(creatorAvatar)}" alt="${DOMPurify.sanitize(dest.creator_username)}'s avatar">
                        <span>Added by ${DOMPurify.sanitize(dest.creator_username)}</span>
                    </div>
                    <p>${DOMPurify.sanitize(dest.description || 'No description available.')}</p>
                    ${amenityHTML}
                </div>
                <div class="popup-footer">
                    <button class="btn btn-primary btn-sm" data-action="add-review" data-location-id="${DOMPurify.sanitize(String(dest.id))}">${t('add_review_title')}</button>
                    <button class="btn btn-success btn-sm" data-action="upload-media" data-location-id="${DOMPurify.sanitize(String(dest.id))}">${t('upload_media')}</button>
                    <button class="btn btn-danger btn-sm" data-action="report-destination" data-location-id="${DOMPurify.sanitize(String(dest.id))}">${t('report_destination')}</button>
                </div>`;

            const popup = L.popup().setLatLng([dest.latitude, dest.longitude]).setContent(popupContent).openOn(map);

            popup.getElement().addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const locationIdFromDataset = e.target.dataset.locationId; // Already sanitized if it came from popupContent
                if (action === "add-review") handleReviewClick(locationIdFromDataset);
                if (action === "upload-media") handleMediaClick(locationIdFromDataset);
                if (action === "report-destination") handleReportClick(locationIdFromDataset);
                if (e.target.matches('.favorite-btn')) handleFavoriteClick(e);
                if (e.target.closest('.popup-meta')) showUserProfileModal(e.target.closest('.popup-meta').dataset.userId); // userId already sanitized
            });
        } catch (error) { console.error('Failed to get destination details', error); }
    };
    const handleFavoriteClick = async (e) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        const btn = e.target;
        const locationId = btn.dataset.locationId; // Already sanitized from popup
        const isFavorited = btn.classList.contains('active');
        try {
            if (isFavorited) {
                await apiRequest(`/favorites/${locationId}`, 'DELETE');
                btn.classList.remove('active');
            } else {
                await apiRequest(`/favorites/${locationId}`, 'POST');
                btn.classList.add('active');
            }
        } catch (error) { console.error('Favorite toggle failed'); }
    };
    const handleReviewClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('add-review', modal => {
            modal.querySelector('#review-location-id').value = locationId; // locationId is from dataset, considered safe for value
        });
    };
    const handleReportClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('report-destination', modal => {
            modal.querySelector('#report-location-id').value = locationId; // locationId is from dataset
        });
    };
    const handleMediaClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('media-upload', modal => {
            modal.querySelector('#media-location-id').value = locationId; // locationId is from dataset
        });
    };

    const createModals = () => {
        // Modal content is primarily using t() with static keys, or dev-defined structures.
        // User-input driven parts are handled by specific functions like showUserProfileModal or fetchAndShowDestinationDetails.
        modalManager.create('login', t('login_title'), `<form id="login-form" onsubmit="return false;"><div class="form-group"><label for="login-email">${t('email')}</label><input type="email" id="login-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="login-password">${t('password')}</label><input type="password" id="login-password" class="form-control" required autocomplete="current-password"></div></form>`, [{ id: 'login-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'login-submit', class: 'btn-primary', text: t('login') }]);
        modalManager.create('register', t('register_title'), `<form id="register-form" onsubmit="return false;"><div class="form-group"><label for="register-username">${t('username')}</label><input type="text" id="register-username" class="form-control" required autocomplete="username"></div><div class="form-group"><label for="register-email">${t('email')}</label><input type="email" id="register-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="register-password">${t('password')}</label><input type="password" id="register-password" class="form-control" required minlength="8" autocomplete="new-password"></div></form>`, [{ id: 'register-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'register-submit', class: 'btn-primary', text: t('register') }]);
        const amenityFormHTML = () => Object.entries(AMENITIES_CONFIG).map(([key, config]) => `<div class="form-group"><label for="prop-${key}">${t(config.label.toLowerCase().replace(/ /g, '_'))}</label>${config.type === 'select' ? `<select id="prop-${key}" class="form-control">${config.options.map(opt => `<option value="${opt}">${t(opt)}</option>`).join('')}</select>` : `<div class="checkbox-group"><input type="checkbox" id="prop-${key}"></div>`}</div>`).join('');
        modalManager.create('add-destination', t('add_destination_title'), `<form id="add-destination-form" onsubmit="return false;"><div class="form-group"><label for="loc-name">${t('destination_name')}</label><input type="text" id="loc-name" class="form-control" required></div><div class="form-group"><label for="loc-type">${t('destination_type')}</label><select id="loc-type" class="form-control">${CATEGORIES.map(type => `<option value="${type}">${t(type)}</option>`).join('')}</select></div><div class="form-group"><label for="loc-desc">${t('description')}</label><textarea id="loc-desc" class="form-control" rows="3"></textarea></div><input type="hidden" id="loc-lat"><input type="hidden" id="loc-lng"><hr><h6>Amenities</h6><div class="amenity-form-grid">${amenityFormHTML()}</div></form>`, [{ id: 'add-loc-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'add-loc-submit', class: 'btn-primary', text: t('submit') }]);
        const filterGridHTML = () => `<div class="filter-grid">${[...CATEGORIES, ...Object.keys(AMENITIES_CONFIG).filter(k => AMENITIES_CONFIG[k].type === 'boolean')].map(item => { const isAmenity = AMENITIES_CONFIG[item] && AMENITIES_CONFIG[item].type === 'boolean'; const id = isAmenity ? `filter-amenity-${item}` : `filter-type-${item}`; const name = isAmenity ? 'amenity' : 'type'; const label = isAmenity ? t(AMENITIES_CONFIG[item].label.toLowerCase().replace(/ /g, '_')) : t(item); return `<div class="filter-item"><input type="checkbox" id="${id}" name="${name}" value="${item}"><label for="${id}">${label}</label></div>`; }).join('')}</div>`;
        modalManager.create('filters', t('filter_title'), `<div class="filter-section">${filterGridHTML()}</div>`, [{ id: 'clear-filters', class: 'btn-secondary', text: t('clear_filters') },{ id: 'apply-filters', class: 'btn-primary', text: t('apply_filters') }]);
        modalManager.create('edit-profile', t('edit_profile_title'), `<form id="edit-profile-form" onsubmit="return false;"><div class="form-group"><label for="profile-avatar">${t('avatar')}</label><input type="file" id="profile-avatar" class="form-control" accept="image/*"></div><div class="form-group"><label for="profile-bio">${t('bio')}</label><textarea id="profile-bio" class="form-control" rows="3"></textarea></div><div class="form-group"><label for="profile-website">${t('website')}</label><input type="url" id="profile-website" class="form-control" placeholder="https://..."></div><div class="form-group"><label for="profile-contact">${t('contact_info')}</label><input type="text" id="profile-contact" class="form-control"></div></form>`, [{ id: 'profile-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'save-profile-btn', class: 'btn-primary', text: t('save_changes') }]);
        modalManager.create('add-review', t('add_review_title'), `<form id="add-review-form" onsubmit="return false;"><input type="hidden" id="review-location-id"><div class="form-group"><label for="review-rating">${t('rating')}</label><input type="number" id="review-rating" class="form-control" min="1" max="5" required></div><div class="form-group"><label for="review-comment">${t('comment')}</label><textarea id="review-comment" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'review-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'review-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('report-destination', t('report_destination'), `<form id="report-destination-form" onsubmit="return false;"><input type="hidden" id="report-location-id"><div class="form-group"><label for="report-reason">${t('report_reason')}</label><input type="text" id="report-reason" class="form-control" required></div><div class="form-group"><label for="report-notes">${t('report_notes')}</label><textarea id="report-notes" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'report-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'report-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('media-upload', t('media_upload_title'), `<form id="media-upload-form" onsubmit="return false;"><input type="hidden" id="media-location-id"><div class="form-group"><label for="media-files">${t('select_files')}</label><input type="file" id="media-files" class="form-control" multiple accept="image/*,video/*"></div></form>`, [{ id: 'media-cancel', class: 'btn-secondary', text: t('cancel')},{ id: 'media-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('admin-panel', t('admin_panel_title'), `<div class="admin-tabs"><button class="admin-tab active" data-tab="users">Users</button><button class="admin-tab" data-tab="submissions">Submissions</button><button class="admin-tab" data-tab="reports">Reports</button></div><div id="admin-panel-content"></div>`, [{ id: 'admin-close', class: 'btn-secondary', text: t('close')}]);
        modalManager.create('info', t('info_title'), `<div><p>This is the Overland Destinations Database, an open-source project for travelers to share great places.</p><p>Entries by the "system" user are a.i. generated for beta testing only! Please help us by adding your own entries and sharing the site with other travelers. :)</p></div>`, [{ id: 'info-close', class: 'btn-secondary', text: t('close')}]);
    };
    const showUserProfileModal = async (userId) => {
        try {
            const user = await apiRequest(`/users/${userId}`); // userId is from dataset, already sanitized
            const avatar = user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
            let websiteLink = '';
            if (user.website) {
                const rawWebsiteUrl = user.website.startsWith('http') ? user.website : 'https://' + user.website;
                websiteLink = `<a href="${DOMPurify.sanitize(rawWebsiteUrl)}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(user.website)}</a>`;
            }
            const content = `<div class="user-profile-modal-content"><img src="${DOMPurify.sanitize(avatar)}" alt="${DOMPurify.sanitize(user.username)}'s avatar"><h4>${DOMPurify.sanitize(user.username)}</h4><p>${DOMPurify.sanitize(user.bio || 'No bio provided.')}</p>${websiteLink}</div>`;
            modalManager.create('user-profile', DOMPurify.sanitize(user.username), content, [{ id: 'close-profile', class: 'btn-secondary', text: t('close')}]);
            modalManager.show('user-profile');
        } catch (error) { console.error("Could not show user profile"); }
    };
    const checkLoginState = async () => {
        try {
            currentUser = await apiRequest('/auth/me');
        } catch (error) {
            currentUser = null;
        }
        updateUserUI(currentUser);
    };
    const setupModalEventListeners = () => {
        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.matches('.modal-close') || target.id.endsWith('-cancel') || target.id === 'info-close' || target.id === 'admin-close' || target.id === 'close-profile') {
                modalManager.hide();
                return;
            }
            if (target.id === 'login-submit') {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                if (!email || !password) return;
                try {
                    await apiRequest('/auth/login', 'POST', { email, password });
                    // No need to save token, it's in the cookie now
                    await checkLoginState();
                    modalManager.hide();
                    showToast(t('login_success'), 'success');
                } catch (error) {
                    console.error('Login failed');
                    showToast('Login failed. Please check your credentials and try again.', 'error');
                }
            } else if (target.id === 'register-submit') {
                const username = document.getElementById('register-username').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value;

                if (!validateName(username)) {
                    return showToast('Username must be between 2-50 characters.', 'error');
                }

                if (!validateEmail(email)) {
                    return showToast('Please enter a valid email address.', 'error');
                }

                if (!validatePassword(password)) {
                    return showToast('Password must be at least 8 characters.', 'error');
                }

                try {
                    await apiRequest('/auth/register', 'POST', { username, email, password });
                    modalManager.hide();
                    showToast('Registration successful! Please log in.', 'success');
                    modalManager.show('login');
                } catch (error) { console.error('Registration failed'); }
            } else if (target.id === 'add-loc-submit') {
                const properties = {};
                for (const [key, config] of Object.entries(AMENITIES_CONFIG)) { const el = document.getElementById(`prop-${key}`); properties[key] = config.type === 'boolean' ? el.checked : el.value; }
                const payload = { name: document.getElementById('loc-name').value, type: document.getElementById('loc-type').value, description: document.getElementById('loc-desc').value, latitude: parseFloat(document.getElementById('loc-lat').value), longitude: parseFloat(document.getElementById('loc-lng').value), properties };
                try { await apiRequest('/locations', 'POST', payload); modalManager.hide(); showToast(t('destination_added_success'), 'success'); } catch (error) { console.error('Failed to add destination'); }
            } else if (target.id === 'apply-filters') {
                currentFilters.types = Array.from(document.querySelectorAll('#modal-filters input[name="type"]:checked')).map(el => el.value);
                currentFilters.amenities = Array.from(document.querySelectorAll('#modal-filters input[name="amenity"]:checked')).map(el => el.value);
                favoritesViewActive = false; loadDestinations(document.getElementById('search-input').value.trim()); modalManager.hide();
            } else if (target.id === 'clear-filters') {
                document.querySelectorAll('#modal-filters input[type="checkbox"]').forEach(el => el.checked = false);
                currentFilters = { types: [], amenities: [] };
            } else if (target.id === 'save-profile-btn') {
                const avatarFile = document.getElementById('profile-avatar').files[0];
                let avatar_url = currentUser.avatar_url;
                if (avatarFile) {
                    try {
                        const { signedUrl, avatar_url: newUrl } = await apiRequest('/users/me/avatar-upload-url', 'POST', { contentType: avatarFile.type });
                        await fetch(signedUrl, { method: 'PUT', body: avatarFile });
                        avatar_url = newUrl;
                    } catch (error) { showToast(t('Avatar upload failed.'), 'error'); return; }
                }
                const profileData = { bio: document.getElementById('profile-bio').value, website: document.getElementById('profile-website').value, contact: document.getElementById('profile-contact').value, avatar_url };
                try { await apiRequest('/users/me', 'PUT', profileData); await checkLoginState(); modalManager.hide(); showToast(t('profile_updated'), 'success'); } catch (error) { console.error('Profile update failed'); }
            } else if (target.id === 'review-submit') {
                const payload = { value: parseInt(document.getElementById('review-rating').value, 10), comment: document.getElementById('review-comment').value };
                const locationId = document.getElementById('review-location-id').value; // Value from hidden input, originally from sanitized dataset
                try { await apiRequest(`/votes/${locationId}`, 'POST', payload); modalManager.hide(); showToast(t('review_sent'), 'success'); map.closePopup(); } catch (error) { console.error('Failed to submit review'); }
            } else if (target.id === 'report-submit') {
                const payload = { location_id: document.getElementById('report-location-id').value, reason: document.getElementById('report-reason').value, notes: document.getElementById('report-notes').value };
                try { await apiRequest('/reports', 'POST', payload); modalManager.hide(); showToast(t('report_sent'), 'success'); } catch (error) { console.error('Failed to submit report'); }
            } else if (target.id === 'media-submit') {
                const files = document.getElementById('media-files').files;
                const locationId = document.getElementById('media-location-id').value;
                if (files.length === 0) return showToast(t('Please select files to upload'), 'error');
                for (const file of files) {
                    try {
                        const { signedUrl } = await apiRequest('/media/upload-url', 'POST', { filename: file.name, contentType: file.type, locationId: locationId });
                        await fetch(signedUrl, { method: 'PUT', body: file });
                        showToast(`${DOMPurify.sanitize(file.name)} ${t('uploaded for review.')}`, 'success');
                    } catch (error) { console.error(`Upload failed for ${file.name}`, error); }
                }
                modalManager.hide();
            } else if (target.matches('.admin-role-select')) {
                const userId = target.dataset.userId;
                const newRole = target.value;
                const oldRole = target.dataset.currentRole;

                if (newRole !== oldRole && !confirm(`Are you sure you want to change this user's role from ${oldRole} to ${newRole}?`)) {
                    target.value = oldRole; // Reset if canceled
                    return;
                }

                try {
                    await apiRequest(`/admin/users/${userId}`, 'PUT', { role: newRole });
                    showToast('User role updated.', 'success');
                } catch(e) {
                    target.value = oldRole; // Reset on error
                    showToast('Failed to update role.', 'error');
                }
            } else if (target.matches('.admin-submission-reject')) {
                const subId = target.dataset.id;
                const reason = prompt("Please provide a reason for rejecting this submission:");

                if (!reason) {
                    showToast('Rejection requires a reason.', 'warning');
                    return;
                }

                try {
                    await apiRequest(`/admin/submissions/${subId}/reject`, 'POST', { reason });
                    showToast('Submission rejected.', 'success');
                    showAdminPanel();
                } catch (e) {
                    showToast('Failed to reject.', 'error');
                }
            } else if (target.matches('.admin-tab')) {
                document.querySelectorAll('.admin-tab, .admin-tab-content').forEach(el => el.classList.remove('active'));
                target.classList.add('active');
                const tabContentId = `admin-tab-${target.dataset.tab}`; // target.dataset.tab is static ('users', 'submissions', 'reports')
                const tabContentElement = document.getElementById(tabContentId);
                if (tabContentElement) tabContentElement.classList.add('active');
            } else if (target.matches('[data-action="add-here"]')) {
                if (!currentUser) return showToast(t('error_please_login'), 'error');
                map.closePopup();
                if(temporaryMarker) map.removeLayer(temporaryMarker);
                modalManager.show('add-destination', (modal) => {
                    // Lat/Lng are numbers, not user strings needing sanitization for value attribute
                    modal.querySelector('#loc-lat').value = target.dataset.lat;
                    modal.querySelector('#loc-lng').value = target.dataset.lng;
                });
            } else if (target.matches('.admin-report-resolve')) {
                const reportId = target.dataset.id;
                const locationId = target.dataset.location;
                const resolution = prompt("Enter resolution notes or action taken:");

                if (!resolution) {
                    showToast('Resolution requires notes.', 'warning');
                    return;
                }

                try {
                    await apiRequest(`/admin/reports/${reportId}/resolve`, 'POST', {
                        resolution,
                        location_id: locationId
                    });
                    showToast('Report resolved.', 'success');
                    showAdminPanel();
                } catch (e) {
                    showToast('Failed to resolve report.', 'error');
                }
            }
        });
    };

    // Add validation functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    function validateName(name) {
        return name.length >= 2 && name.length <= 50;
    }

    const geocodeAndPan = async (address) => {
        if (!address) return;
        try {
            // Address is used in URL, ensure it's properly encoded. fetch does this.
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            if (!response.ok) throw new Error('Geocoding service failed.');
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                map.flyTo([parseFloat(lat), parseFloat(lon)], 13);
            } else {
                showToast(`${t('Could not find a location for')} "${DOMPurify.sanitize(address)}"`, 'info');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            showToast(t('Address lookup failed.'), 'error');
        }
    };

    // REFACTORED ADMIN PANEL LOGIC
    const showAdminPanel = async () => {
        if (!currentUser || currentUser.role === 'user') return;
        modalManager.show('admin-panel');
        const contentEl = document.getElementById('admin-panel-content');
        if (!contentEl) return;

        // Clear previous listeners and content
        const newContentEl = contentEl.cloneNode(false);
        contentEl.parentNode.replaceChild(newContentEl, contentEl);
        newContentEl.innerHTML = 'Loading...';

        try {
            const [users, submissions, reports] = await Promise.all([
                apiRequest('/admin/users'),
                apiRequest('/admin/submissions'),
                apiRequest('/admin/reports')
            ]);
            
            newContentEl.innerHTML = `
                <div class="admin-filters">
                    <select id="admin-user-filter">
                        <option value="all">All Users</option>
                        <option value="user">Users</option>
                        <option value="moderator">Moderators</option>
                        <option value="admin">Admins</option>
                    </select>

                    <select id="admin-submission-filter">
                        <option value="all">All Submissions</option>
                        <option value="pending">Pending</option>
                        <option value="location">Locations</option>
                        <option value="media">Media</option>
                    </select>

                    <select id="admin-report-filter">
                        <option value="all">All Reports</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <input type="text" id="admin-search" placeholder="Search...">
                </div>

                <div id="admin-tab-users" class="admin-tab-content active">
                    <ul class="admin-panel-list">${renderUsersList(users)}</ul>
                </div>

                <div id="admin-tab-submissions" class="admin-tab-content">
                    <ul class="admin-panel-list">${renderSubmissionsList(submissions)}</ul>
                </div>

                <div id="admin-tab-reports" class="admin-tab-content">
                    <ul class="admin-panel-list">${renderReportsList(reports)}</ul>
                </div>
            `;

            // Add filter event listeners
            setupAdminFilters(users, submissions, reports);

        } catch(e) {
            newContentEl.innerHTML = 'Could not load admin panel data.';
            showToast('Could not load admin panel data.', 'error');
        }
    };

    // Helper functions for rendering and filtering
    function renderUsersList(users) {
        return users.map(user => `
            <li>
                <span>${DOMPurify.sanitize(user.username)}</span>
                <span>${DOMPurify.sanitize(user.email)}</span>
                <select class="form-control admin-role-select"
                        data-user-id="${user.id}"
                        data-current-role="${user.role}">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </li>`).join('');
    }

    function renderSubmissionsList(submissions) {
        return submissions.map(sub => {
            const data = JSON.parse(sub.data);
            return `
            <li data-type="${sub.submission_type}" data-status="${sub.status}">
                <span>${DOMPurify.sanitize(sub.submission_type.toUpperCase())}: ${DOMPurify.sanitize(data.name || '')}</span>
                <span>By: ${DOMPurify.sanitize(sub.submitter_username)}</span>
                <div class="actions">
                    <button class="btn btn-success btn-sm admin-submission-approve" data-id="${sub.id}">✓</button>
                    <button class="btn btn-danger btn-sm admin-submission-reject" data-id="${sub.id}">✗</button>
                </div>
            </li>`;
        }).join('');
    }

    const setupAdminFilters = (users, submissions, reports) => {
        const userFilter = document.getElementById('admin-user-filter');
        const submissionFilter = document.getElementById('admin-submission-filter');
        const reportFilter = document.getElementById('admin-report-filter');
        const searchInput = document.getElementById('admin-search');

        userFilter.addEventListener('change', () => {
            const selectedRole = userFilter.value;
            const filteredUsers = users.filter(user => selectedRole === 'all' || user.role === selectedRole);
            document.getElementById('admin-tab-users').innerHTML = `<ul class="admin-panel-list">${renderUsersList(filteredUsers)}</ul>`;
        });

        submissionFilter.addEventListener('change', () => {
            const selectedStatus = submissionFilter.value;
            const filteredSubmissions = submissions.filter(sub => selectedStatus === 'all' || sub.status === selectedStatus);
            document.getElementById('admin-tab-submissions').innerHTML = `<ul class="admin-panel-list">${renderSubmissionsList(filteredSubmissions)}</ul>`;
        });

        reportFilter.addEventListener('change', () => {
            const selectedStatus = reportFilter.value;
            const filteredReports = reports.filter(rep => selectedStatus === 'all' || (selectedStatus === 'open' ? rep.resolved === false : rep.resolved === true));
            document.getElementById('admin-tab-reports').innerHTML = `<ul class="admin-panel-list">${renderReportsList(filteredReports)}</ul>`;
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const filteredUsers = users.filter(user => user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query));
            const filteredSubmissions = submissions.filter(sub => {
                const data = JSON.parse(sub.data);
                return sub.submission_type.toLowerCase().includes(query) || data.name.toLowerCase().includes(query);
            });
            const filteredReports = reports.filter(rep => rep.reason.toLowerCase().includes(query) || rep.notes.toLowerCase().includes(query));

            document.getElementById('admin-tab-users').innerHTML = `<ul class="admin-panel-list">${renderUsersList(filteredUsers)}</ul>`;
            document.getElementById('admin-tab-submissions').innerHTML = `<ul class="admin-panel-list">${renderSubmissionsList(filteredSubmissions)}</ul>`;
            document.getElementById('admin-tab-reports').innerHTML = `<ul class="admin-panel-list">${renderReportsList(filteredReports)}</ul>`;
        });
    };

    const renderReportsList = (reports) => {
        return reports.map(rep => `
            <li>
                <span>${DOMPurify.sanitize(rep.reason)}</span>
                <span>By: ${DOMPurify.sanitize(rep.reporter_username)}</span>
                <div class="actions">
                    <button class="btn btn-success btn-sm admin-report-resolve" data-id="${rep.id}" data-location="${rep.location_id}">Resolve</button>
                </div>
            </li>`).join('');
    };

    const setupAppEventListeners = () => {
        document.getElementById('language-select').addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            updateUIForLanguage();
        });
        document.getElementById('nav-login').addEventListener('click', (e) => { e.preventDefault(); modalManager.show('login'); });
        document.getElementById('nav-register').addEventListener('click', (e) => { e.preventDefault(); modalManager.show('register'); });
        document.getElementById('nav-logout').addEventListener('click', (e) => {
            e.preventDefault();
            apiRequest('/auth/logout', 'POST')
                .then(() => {
                    currentUser = null;
                    updateUserUI(null);
                    showToast(t('logout_success'), 'success');
                    loadDestinations();
                })
                .catch(error => { // Add this catch block
                    console.error('Logout failed:', error);
                    showToast(t('logout_error'), 'error');
                });
        });
        document.getElementById('nav-add-destination').addEventListener('click', (e) => { e.preventDefault(); if (!currentUser) return showToast(t('error_please_login'), 'error'); modalManager.show('add-destination', (modal) => { const center = map.getCenter(); modal.querySelector('#loc-lat').value = center.lat; modal.querySelector('#loc-lng').value = center.lng; }); });
        document.getElementById('filters-button').addEventListener('click', () => modalManager.show('filters'));
        document.getElementById('nav-my-favorites').addEventListener('click', (e) => { e.preventDefault(); if (!currentUser) return showToast(t('error_please_login'), 'error'); favoritesViewActive = true; loadDestinations(); });
        document.querySelector('.nav-brand').addEventListener('click', (e) => { e.preventDefault(); favoritesViewActive = false; currentFilters = { types: [], amenities: [] }; document.getElementById('search-input').value = ''; loadDestinations(); map.flyTo(HOME_VIEW.center, HOME_VIEW.zoom); });
        document.getElementById('nav-my-profile').addEventListener('click', (e) => { e.preventDefault(); if (!currentUser) return; modalManager.show('edit-profile', () => { document.getElementById('profile-bio').value = currentUser.bio || ''; document.getElementById('profile-website').value = currentUser.website || ''; document.getElementById('profile-contact').value = currentUser.contact || ''; }); });
        document.getElementById('nav-admin').addEventListener('click', (e) => { e.preventDefault(); showAdminPanel(); });
        document.getElementById('nav-info-btn').addEventListener('click', (e) => { e.preventDefault(); modalManager.show('info'); });

        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const performSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) {
                favoritesViewActive = false;
                loadDestinations();
                return;
            }
            favoritesViewActive = false;
            const results = await loadDestinations(query); // query is passed to API, not directly to HTML here
            if (results.length === 0) {
                geocodeAndPan(query); // geocodeAndPan handles sanitization if query is shown in a toast
            }
        };
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
        searchInput.addEventListener('search', () => { if (searchInput.value === '') { favoritesViewActive = false; loadDestinations(); }});

        document.getElementById('map-home-btn').addEventListener('click', () => map.flyTo(HOME_VIEW.center, HOME_VIEW.zoom));
        document.getElementById('map-location-btn').addEventListener('click', () => {
            map.locate({ setView: true, maxZoom: 16 });
            map.on('locationfound', (e) => {
                L.marker(e.latlng).addTo(locationsLayer).bindPopup(DOMPurify.sanitize(t("You are here!"))).openPopup();
            });
            map.on('locationerror', (e) => {
                showToast(DOMPurify.sanitize(e.message), 'error'); // Sanitize Leaflet's error message
            });
        });
    };

    const init = async () => {
        await checkLoginState();
        createModals(); // Modals are created with t() and static content mostly
        updateUIForLanguage();
        initMap();
        setupAppEventListeners();
        setupModalEventListeners();
    };

    init();
});