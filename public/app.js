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

    // User-customizable home view, loaded from localStorage
    let HOME_VIEW = {
        center: [9, 8],
        zoom: 2
    };

    const API_BASE = '/api';
    const modalManager = new ModalManager();

    // --- CONFIGURATION CONSTANTS ---

    const CATEGORIES = [
        'established-campground', 'informal-campsite', 'wild-camping', 'scenic-viewpoint', 'day-use-picnic',
        'hotel', 'hostel', 'restaurant', 'tourist-attraction', 'shopping', 'friendly-outpost', 'provisions-stand', 'seasonal-event',
        'mechanic', 'fuel', 'propane', 'water', 'dump-station', 'laundry', 'showers', 'wifi-spot', 'good-signal-spot',
        'medical', 'pet-services', 'financial', 'recycling-waste',
        'border-crossing', 'checkpoint', 'consulate-embassy', 'warning', 'overnight-prohibited', 'other'
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

    const CATEGORY_ICONS = {
        'established-campground': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tent" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11 14l4 6h-8l4 -6" /><path d="M12 14v-11l-3 3" /><path d="M12 3l3 3" /><path d="M11.25 20.25l-6.25 -10.25l14 0l-6.222 10.222" /></svg>`,
        'informal-campsite': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-building-community" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9l5 5v7h-5v-4l-5 4v-7l5 -5" /><path d="M6 21v-7m-2 2l8 -8l8 8m-2 -2v7h-5" /></svg>`,
        'wild-camping': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trees" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10v11" /><path d="M7 14h6" /><path d="M7 10h6" /><path d="M15.462 8.11a3 3 0 0 1 4.424 4.144" /><path d="M15 14h.01" /><path d="M11 7a3 3 0 0 1 4.242 4.242" /></svg>`,
        'hotel': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bed" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M22 17v-3h-20" /><path d="M2 8v9" /><path d="M12 14h10v-2a2 2 0 0 0 -2 -2h-8v4z" /></svg>`,
        'hostel': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-dormitory" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v11" /><path d="M4 19h16" /><path d="M8 11v-3a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v3" /><path d="M12 19v-8" /><path d="M8 15h8" /></svg>`,
        'overnight-prohibited': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bed-off" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3l18 18" /><path d="M7 7a2 2 0 1 0 2 2" /><path d="M22 17v-3h-4m-4 0h-12" /><path d="M2 8v9" /><path d="M12 14h10v-2a2 2 0 0 0 -2 -2h-2" /></svg>`,
        'friendly-outpost': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-heart-handshake" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /><path d="M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.8 1.104 2.75 .586l.75 -.414l.75 .414c.95 .518 2.06 .104 2.75 -.586l.543 -.543a1 1 0 0 0 0 -1.414l-3.293 -3.293z" /></svg>`,
        'scenic-viewpoint': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-photo" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8h.01" /><path d="M4 4m0 3a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3z" /><path d="M4 15l4 -4c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l2 2" /></svg>`,
        'day-use-picnic': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-basket" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 10l-2 -6" /><path d="M7 10l2 -6" /><path d="M12 4v16" /><path d="M10 14h4" /><path d="M17 10h-10a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" /></svg>`,
        'restaurant': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tools-kitchen-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3" /></svg>`,
        'tourist-attraction': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-camera" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>`,
        'shopping': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-shopping-cart" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17h-11v-14h-2" /><path d="M6 5l14 1l-1 7h-13" /></svg>`,
        'provisions-stand': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plant-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 9a10 10 0 1 0 20 0" /><path d="M12 19a10 10 0 0 1 10 -10" /><path d="M2 9a10 10 0 0 1 10 10" /><path d="M12 4a9.97 9.97 0 0 1 2.618 6.333" /><path d="M8.216 11.233a9.982 9.982 0 0 1 3.784 -7.233" /></svg>`,
        'seasonal-event': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-calendar-event" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M16 3l0 4" /><path d="M8 3l0 4" /><path d="M4 11l16 0" /><path d="M8 15h2v2h-2z" /></svg>`,
        'mechanic': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tool" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" /></svg>`,
        'fuel': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gas-station" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 11h1a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0v-7l-3 -3" /><path d="M4 20v-14a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v14" /><path d="M3 20l12 0" /><path d="M18 7v1a1 1 0 0 0 1 1h1" /><path d="M4 11h10" /></svg>`,
        'propane': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-flame" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12c2 -2.96 0 -7 -1 -8c-1 4 -3 6 -3 8c0 4.5 4.5 6 6 6c1.5 0 3 -2 3 -4c0 -2 -1.12 -3.54 -1.5 -4z" /><path d="M10 14c-1.12 2.5 -2 5 -2 6c0 1.5 1 3 2 3c1.12 0 2 -1.5 2 -3c0 -1 -1.5 -4 -2 -6z" /></svg>`,
        'water': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-droplet" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.8 11a6 6 0 1 0 10.396 0l-5.197 -8l-5.2 8z" /></svg>`,
        'dump-station': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-down-circle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 7v14" /><path d="M9 18l3 3l3 -3" /><path d="M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0 -18z" /></svg>`,
        'laundry': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-washing-machine" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M12 14m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M8 6h.01" /><path d="M11 6h.01" /><path d="M14 6h.01" /></svg>`,
        'showers': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-shower" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4h-10a2.99 2.99 0 0 0 -2.99 2.823l-1.01 9.177a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2l-1 -9.177a3 3 0 0 0 -3 -2.823z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M4 21v-1" /><path d="M16 21v-1" /><path d="M8 21v-1" /><path d="M12 21v-1" /></svg>`,
        'wifi-spot': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-wifi" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 18l.01 0" /><path d="M9.172 15.172a4 4 0 0 1 5.656 0" /><path d="M6.343 12.343a8 8 0 0 1 11.314 0" /><path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" /></svg>`,
        'good-signal-spot': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-antenna-bars-5" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 18v-3" /><path d="M10 18v-6" /><path d="M14 18v-9" /><path d="M18 18v-12" /></svg>`,
        'medical': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-medical-cross" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 3a1 1 0 0 1 1 1v4.535l3.93 -2.905a1 1 0 0 1 1.255 .183l.184 .243a1 1 0 0 1 -.183 1.255l-2.905 3.93h4.535a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4.535l2.905 3.93a1 1 0 0 1 -.183 1.255l-.243 .184a1 1 0 0 1 -1.255 -.183l-3.93 -2.905v4.535a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-4.535l-3.93 2.905a1 1 0 0 1 -1.255 -.183l-.184 -.243a1 1 0 0 1 .183 -1.255l2.905 -3.93h-4.535a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h4.535l-2.905 -3.93a1 1 0 0 1 .183 -1.255l.243 -.184a1 1 0 0 1 1.255 .183l3.93 2.905v-4.535a1 1 0 0 1 1 -1h4z" /></svg>`,
        'pet-services': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-dog-bowl" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12l-.235 .235a3.536 3.536 0 1 0 5.018 -4.928l-4.783 4.693" /><path d="M20 12c0 4.418 -3.582 8 -8 8s-8 -3.582 -8 -8c0 -4.32 3.46 -7.834 7.749 -7.994l.251 .004" /></svg>`,
        'financial': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-currency-dollar" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg>`,
        'recycling-waste': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-recycle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17l-2 2l-2 -2" /><path d="M10 19v-2a2 2 0 0 1 2 -2h2" /><path d="M14 13l2 -2l2 2" /><path d="M16 11v2a2 2 0 0 1 -2 2h-2" /><path d="M10 7l-2 2l2 2" /><path d="M8 9h2a2 2 0 0 1 2 2v2" /></svg>`,
        'border-crossing': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-border-style-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 18v.01" /><path d="M8 18v.01" /><path d="M12 18v.01" /><path d="M16 18v.01" /><path d="M20 18v.01" /><path d="M18 12h2" /><path d="M11 12h2" /><path d="M4 12h2" /><path d="M4 6v.01" /><path d="M8 6v.01" /><path d="M12 6v.01" /><path d="M16 6v.01" /><path d="M20 6v.01" /></svg>`,
        'checkpoint': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-hand-stop" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 13v-8a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v7" /><path d="M11 5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v7" /><path d="M14 4a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7" /><path d="M5 10a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" /></svg>`,
        'consulate-embassy': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-building-arch" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21h18" /><path d="M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15" /><path d="M9 21v-8a3 3 0 0 1 6 0v8" /></svg>`,
        'warning': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-alert-triangle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>`,
        'other': `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-question-mark" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4" /><path d="M12 19l0 .01" /></svg>`,
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
            logout_error: 'Logout failed. Please try again.',
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
            'dump-station': 'Dump Station', 'laundry': 'Laundromat', 'showers': 'Showers', 'wifi-spot': 'WiFi Spot',
            'tourist-attraction': 'Tourist Attraction', 'shopping': 'Shopping', 'medical': 'Medical', 'pet-services': 'Pet Services',
            'border-crossing': 'Customs and Immigration', 'checkpoint': 'Checkpoint', 'warning': 'Warning',
            'friendly-outpost': 'Friendly Outpost', 'provisions-stand': 'Provisions Stand', 'seasonal-event': 'Seasonal Event',
            'good-signal-spot': 'Good Signal Spot', 'recycling-waste': 'Recycling / Waste', 'consulate-embassy': 'Consulate / Embassy',
            'financial': 'Financial', 'overnight-prohibited': 'Overnight Prohibited', 'other': 'Other',
            'avatar_upload_failed': 'Avatar upload failed.',
            'please_select_files': 'Please select files to upload',
            'uploaded_for_review': 'uploaded for review.',
            'could_not_find_location': 'Could not find a location for',
            'address_lookup_failed': 'Address lookup failed.',
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
            logout_error: 'El cierre de sesión falló. Por favor, inténtelo de nuevo.',
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
            'border-crossing': 'Cruce Fronterizo', 'checkpoint': 'Punto de Control', 'warning': 'Advertencia',
            'friendly-outpost': 'Puesto Amigo', 'provisions-stand': 'Puesto de Provisiones', 'seasonal-event': 'Evento Estacional',
            'good-signal-spot': 'Lugar con Buena Señal', 'recycling-waste': 'Reciclaje / Basura', 'consulate-embassy': 'Consulado / Embajada',
            'financial': 'Financiero', 'overnight-prohibited': 'Pernoctar Prohibido', 'other': 'Otro',
            'avatar_upload_failed': 'Error al subir el avatar.',
            'please_select_files': 'Por favor selecciona archivos para subir',
            'uploaded_for_review': 'subido para revisión.',
            'could_not_find_location': 'No se pudo encontrar una ubicación para',
            'address_lookup_failed': 'Falló la búsqueda de dirección.',
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
            logout_error: 'La déconnexion a échoué. Veuillez réessayer.',
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
            'border-crossing': 'Passage Frontalier', 'checkpoint': 'Poste de Contrôle', 'warning': 'Avertissement',
            'friendly-outpost': 'Avant-poste Amical', 'provisions-stand': 'Stand de Provisions', 'seasonal-event': 'Événement Saisonnier',
            'good-signal-spot': 'Bon Signal', 'recycling-waste': 'Recyclage / Déchets', 'consulate-embassy': 'Consulat / Ambassade',
            'financial': 'Financier', 'overnight-prohibited': 'Nuitée Interdite', 'other': 'Autre',
            'avatar_upload_failed': 'Échec du téléchargement de l\'avatar.',
            'please_select_files': 'Veuillez sélectionner des fichiers à télécharger',
            'uploaded_for_review': 'téléchargé pour examen.',
            'could_not_find_location': 'Impossible de trouver un emplacement pour',
            'address_lookup_failed': 'Échec de la recherche d\'adresse.',
        }
    };

    // --- UTILITY & HELPER FUNCTIONS ---

    /**
     * Translates a given key using the current language.
     * @param {string} key The translation key.
     * @returns {string} The translated string.
     */
    const t = (key) => (translations[currentLanguage]?.[key] || translations['en']?.[key] || key.replace(/-/g, ' '));

    /**
     * Displays a toast notification.
     * @param {string} message The message to display.
     * @param {'info' | 'success' | 'error'} type The type of toast.
     */
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = DOMPurify.sanitize(message);
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    };

    /**
     * Makes a request to the application's API.
     * @param {string} endpoint The API endpoint to call.
     * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} method The HTTP method.
     * @param {object | null} body The request body for POST/PUT requests.
     * @param {boolean} isSilent If true, will not show error toasts automatically.
     * @returns {Promise<any>} The JSON response from the API.
     */
    const apiRequest = async (endpoint, method = 'GET', body = null, isSilent = false) => {
        const headers = { 'Content-Type': 'application/json' };
        const options = { method, headers, credentials: 'include' };
        if (body) options.body = JSON.stringify(body);
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            if (!response.ok) {
                // Special handling for silent auth check to avoid showing errors on page load
                if (isSilent && response.status === 401) {
                    throw new Error('Not authenticated');
                }
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            if (!isSilent) {
                showToast(error.message, 'error');
            }
            throw error;
        }
    };
    
    // --- AUTH & UI FUNCTIONS ---

    /**
     * Checks if a user is logged in and updates the UI accordingly.
     */
    const checkLoginState = async () => {
        try {
            currentUser = await apiRequest('/auth/me', 'GET', null, true);
        } catch (error) {
            currentUser = null;
        }
        updateUserUI(currentUser);
    };

    /**
     * Updates all UI elements based on the selected language.
     */
    const updateUIForLanguage = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = t(key);
            if (el.tagName === 'INPUT' && el.type === 'search') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });
        document.title = "O.D.D.Map";
        // Re-create modals to apply new translations
        modalManager.destroyAll();
        createModals();
    };

    /**
     * Toggles UI elements based on user login status.
     * @param {object|null} user The current user object or null.
     */
    const updateUserUI = (user) => {
        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');
        const userGreeting = document.getElementById('user-greeting');
        const adminNav = document.getElementById('nav-admin');
        const avatarContainer = document.getElementById('user-avatar-container');
        
        if (user) {
            authLinks.classList.add('hidden');
            userLinks.classList.remove('hidden');
            userGreeting.textContent = DOMPurify.sanitize(user.username);
            const avatarUrl = user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
            avatarContainer.innerHTML = `<img src="${DOMPurify.sanitize(avatarUrl)}" alt="${DOMPurify.sanitize(user.username)}'s avatar">`;
            adminNav.classList.toggle('hidden', user.role !== 'admin' && user.role !== 'moderator');
        } else {
            authLinks.classList.remove('hidden');
            userLinks.classList.add('hidden');
            avatarContainer.innerHTML = '';
            adminNav.classList.add('hidden');
        }
    };

    // --- MAP FUNCTIONS ---

    /**
     * Initializes the Leaflet map, layers, and controls.
     */
    const initMap = () => {
        map = L.map('map-container', { 
            zoomControl: false, 
            attributionControl: false,
            tap: true, // Enable tap for touch devices
            tapTolerance: 15 // More forgiving tap detection
        }).setView(HOME_VIEW.center, HOME_VIEW.zoom);

        // Detect if device is touch-enabled
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            // Mobile-friendly settings
            L.control.zoom({ 
                position: 'topright', 
                zoomInTitle: 'Zoom in (+)', 
                zoomOutTitle: 'Zoom out (-)',
                zoomInText: '<span style="font-size:1.2em">+</span>',
                zoomOutText: '<span style="font-size:1.2em">−</span>'
            }).addTo(map);
            
            // Make popups appear higher above markers on touch devices
            map._popup = map._popup || {};
            map._popup.options = map._popup.options || {};
            map._popup.options.autoPanPaddingTopLeft = L.point(10, 100);
        } else {
            L.control.zoom({ position: 'topright' }).addTo(map);
        }

        const baseMaps = {
            "🌙 Dark Theme": L.tileLayer.provider('CartoDB.DarkMatter'),
            "🗺️ Street": L.tileLayer.provider('OpenStreetMap.Mapnik'),
            "🛰️ Satellite": L.tileLayer.provider('Esri.WorldImagery'),
            "🗻 Topographic": L.tileLayer.provider('OpenTopoMap'),
            "✨ Clean Light": L.tileLayer.provider('CartoDB.Positron'),
        };

        const overlayMaps = {
            "🥾 Hiking Trails": L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', { attribution: '© waymarkedtrails.org', opacity: 0.7 }),
            "🚲 Cycling Trails": L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', { attribution: '© waymarkedtrails.org', opacity: 0.7 }),
            "🚆 Railways": L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', { attribution: '© OpenRailwayMap', opacity: 0.7 })
        };
        
        // Set Dark Theme as the default base layer
        baseMaps["🌙 Dark Theme"].addTo(map);

        locationsLayer = L.layerGroup().addTo(map);
        L.control.layers(baseMaps, overlayMaps, { position: 'topright', collapsed: true }).addTo(map);

        loadDestinations();
        map.on('click', onMapClick);
    };

    /**
     * Handles clicks on the map to add a new destination.
     * @param {L.LeafletMouseEvent} e The map click event.
     */
    const onMapClick = (e) => {
        if (temporaryMarker) {
            map.removeLayer(temporaryMarker);
        }
        temporaryMarker = L.marker(e.latlng).addTo(map);
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

    /**
     * Loads destinations from the API based on search and filters.
     * @param {string} searchTerm Optional search query.
     */
    const loadDestinations = async (searchTerm = '') => {
        try {
            if (temporaryMarker) {
                map.removeLayer(temporaryMarker);
                temporaryMarker = null;
            }
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (currentFilters.types.length > 0) params.append('type', currentFilters.types.join(','));
            if (currentFilters.amenities.length > 0) params.append('amenities', currentFilters.amenities.join(','));

            let destinations;
            if (favoritesViewActive) {
                destinations = await apiRequest('/favorites');
                if (destinations.length === 0) showToast(t('favorites_empty'), 'info');
            } else {
                destinations = await apiRequest(`/locations?${params.toString()}`);
            }

            locationsLayer.clearLayers();
            if (destinations.length === 0) {
                if (!favoritesViewActive && (searchTerm || currentFilters.types.length > 0 || currentFilters.amenities.length > 0)) {
                    showToast(t('search_no_results'), 'info');
                }
                return;
            }

            const markers = destinations.map(dest => {
                const iconSvg = CATEGORY_ICONS[dest.type] || CATEGORY_ICONS['other'];
                const customIcon = L.divIcon({
                    html: iconSvg,
                    className: 'custom-map-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    popupAnchor: [0, -24]
                });
                const marker = L.marker([dest.latitude, dest.longitude], { icon: customIcon });
                marker.on('click', () => fetchAndShowDestinationDetails(dest.id, dest.is_favorite));
                return marker;
            });

            const group = L.featureGroup(markers).addTo(locationsLayer);
            if (markers.length > 0 && !favoritesViewActive) {
                map.flyToBounds(group.getBounds().pad(0.2));
            }
        } catch (error) {
            console.error('Failed to load destinations', error);
        }
    };

    /**
     * Fetches details for a single destination and displays its popup.
     * @param {number} locationId The ID of the location.
     * @param {boolean} isFavorite Whether the user has favorited this location.
     */
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
                            const rawValueKey = String(value).replace(/-/g, '_');
                            displayValue = ` (${DOMPurify.sanitize(t(rawValueKey))})`;
                        }
                        amenityHTML += `<li>${label}${displayValue}</li>`;
                    }
                }
            }
            amenityHTML += '</ul>';

            const creatorAvatar = dest.creator_avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
            const popupContent = `
                <div class="popup-header">
                    <h3>${DOMPurify.sanitize(dest.name)}</h3>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-location-id="${dest.id}" aria-label="Favorite this destination">⭐</button>
                </div>
                <div class="popup-body">
                    <div class="popup-meta" data-user-id="${dest.created_by}" data-username="${dest.creator_username}">
                        <img src="${DOMPurify.sanitize(creatorAvatar)}" alt="${DOMPurify.sanitize(dest.creator_username)}'s avatar">
                        <span>Added by ${DOMPurify.sanitize(dest.creator_username)}</span>
                    </div>
                    <p>${DOMPurify.sanitize(dest.description || 'No description available.')}</p>
                    ${amenityHTML}
                </div>
                <div class="popup-footer">
                    <button class="btn btn-primary btn-sm" data-action="add-review" data-location-id="${dest.id}">${t('add_review_title')}</button>
                    <button class="btn btn-success btn-sm" data-action="upload-media" data-location-id="${dest.id}">${t('upload_media')}</button>
                    <button class="btn btn-danger btn-sm" data-action="report-destination" data-location-id="${dest.id}">${t('report_destination')}</button>
                </div>`;

            const popup = L.popup().setLatLng([dest.latitude, dest.longitude]).setContent(popupContent).openOn(map);

            popup.getElement().addEventListener('click', (e) => {
                const actionButton = e.target.closest('[data-action]');
                if (actionButton) {
                    const action = actionButton.dataset.action;
                    const locationIdFromDataset = actionButton.dataset.locationId;
                    if (action === "add-review") handleReviewClick(locationIdFromDataset);
                    if (action === "upload-media") handleMediaClick(locationIdFromDataset);
                    if (action === "report-destination") handleReportClick(locationIdFromDataset);
                    return;
                }
                if (e.target.matches('.favorite-btn')) handleFavoriteClick(e);
                const userProfile = e.target.closest('.popup-meta');
                if (userProfile) {
                    const userId = userProfile.dataset.userId;
                    const username = userProfile.dataset.username;
                    // Admins see the detailed admin view, others see the public profile.
                    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator')) {
                        showUserProfileModal(userId);
                    } else {
                        showPublicProfileModal(username);
                    }
                }
            });
        } catch (error) { 
            console.error('Failed to get destination details', error); 
        }
    };
    
    // --- POPUP & MODAL ACTION HANDLERS ---
    
    const handleFavoriteClick = async (e) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        const btn = e.target;
        const locationId = btn.dataset.locationId;
        const isFavorited = btn.classList.contains('active');
        try {
            if (isFavorited) {
                await apiRequest(`/favorites/${locationId}`, 'DELETE');
            } else {
                await apiRequest(`/favorites/${locationId}`, 'POST');
            }
            btn.classList.toggle('active');
        } catch (error) { 
            console.error('Favorite toggle failed', error); 
        }
    };

    const handleReviewClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('add-review', modal => {
            modal.querySelector('#review-location-id').value = locationId;
        });
    };

    const handleReportClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('report-destination', modal => {
            modal.querySelector('#report-location-id').value = locationId;
        });
    };

    const handleMediaClick = (locationId) => {
        if (!currentUser) return showToast(t('error_please_login'), 'error');
        modalManager.show('media-upload', modal => {
            modal.querySelector('#media-location-id').value = locationId;
        });
    };
    
    // --- MODAL CREATION ---
    
    /**
     * Creates all modal dialogs used in the application.
     */
    const createModals = () => {
        modalManager.create('login', t('login_title'), `<form id="login-form" onsubmit="return false;"><div class="form-group"><label for="login-email">${t('email')}</label><input type="email" id="login-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="login-password">${t('password')}</label><input type="password" id="login-password" class="form-control" required autocomplete="current-password"></div></form>`, [{ id: 'login-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'login-submit', class: 'btn-primary', text: t('login') }]);
        modalManager.create('register', t('register_title'), `<form id="register-form" onsubmit="return false;"><div class="form-group"><label for="register-username">${t('username')}</label><input type="text" id="register-username" class="form-control" required autocomplete="username"></div><div class="form-group"><label for="register-email">${t('email')}</label><input type="email" id="register-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="register-password">${t('password')}</label><input type="password" id="register-password" class="form-control" required minlength="8" autocomplete="new-password"></div></form>`, [{ id: 'register-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'register-submit', class: 'btn-primary', text: t('register') }]);
        const amenityFormHTML = () => Object.entries(AMENITIES_CONFIG).map(([key, config]) => `<div class="form-group"><label for="prop-${key}">${t(config.label.toLowerCase().replace(/ /g, '_'))}</label>${config.type === 'select' ? `<select id="prop-${key}" class="form-control">${config.options.map(opt => `<option value="${opt}">${t(opt)}</option>`).join('')}</select>` : `<div class="checkbox-group"><input type="checkbox" id="prop-${key}"></div>`}</div>`).join('');
        modalManager.create('add-destination', t('add_destination_title'), `<form id="add-destination-form" onsubmit="return false;"><div class="form-group"><label for="loc-name">${t('destination_name')}</label><input type="text" id="loc-name" class="form-control" required></div><div class="form-group"><label for="loc-type">${t('destination_type')}</label><select id="loc-type" class="form-control">${CATEGORIES.map(type => `<option value="${type}">${t(type)}</option>`).join('')}</select></div><div class="form-group"><label for="loc-desc">${t('description')}</label><textarea id="loc-desc" class="form-control" rows="3"></textarea></div><input type="hidden" id="loc-lat"><input type="hidden" id="loc-lng"><hr><h6>Amenities</h6><div class="amenity-form-grid">${amenityFormHTML()}</div></form>`, [{ id: 'add-loc-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'add-loc-submit', class: 'btn-primary', text: t('submit') }]);
        const filterGridHTML = () => `<div class="filter-grid">${[...CATEGORIES, ...Object.keys(AMENITIES_CONFIG).filter(k => AMENITIES_CONFIG[k].type === 'boolean')].map(item => {
            const isAmenity = AMENITIES_CONFIG[item] && AMENITIES_CONFIG[item].type === 'boolean';
            const id = isAmenity ? `filter-amenity-${item}` : `filter-type-${item}`;
            const name = isAmenity ? 'amenity' : 'type';
            const label = isAmenity ? t(AMENITIES_CONFIG[item].label.toLowerCase().replace(/ /g, '_')) : t(item);
            let iconHtml = !isAmenity ? (CATEGORY_ICONS[item] || CATEGORY_ICONS['other']) : '';
            return `<div class="filter-item">${iconHtml}<input type="checkbox" id="${id}" name="${name}" value="${item}"><label for="${id}">${label}</label></div>`;
        }).join('')}</div>`;
        modalManager.create('filters', t('filter_title'), `<div class="filter-section">${filterGridHTML()}</div>`, [{ id: 'clear-filters', class: 'btn-secondary', text: t('clear_filters') }, { id: 'apply-filters', class: 'btn-primary', text: t('apply_filters') }]);
        modalManager.create('edit-profile', t('edit_profile_title'), `<form id="edit-profile-form" onsubmit="return false;"><div class="form-group"><label for="profile-avatar">${t('avatar')}</label><input type="file" id="profile-avatar" class="form-control" accept="image/*"></div><div class="form-group"><label for="profile-bio">${t('bio')}</label><textarea id="profile-bio" class="form-control" rows="3"></textarea></div><div class="form-group"><label for="profile-website">${t('website')}</label><input type="url" id="profile-website" class="form-control" placeholder="https://..."></div><div class="form-group"><label for="profile-contact">${t('contact_info')}</label><input type="text" id="profile-contact" class="form-control"></div></form>`, [{ id: 'profile-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'save-profile-btn', class: 'btn-primary', text: t('save_changes') }]);
        modalManager.create('add-review', t('add_review_title'), `<form id="add-review-form" onsubmit="return false;"><input type="hidden" id="review-location-id"><div class="form-group"><label for="review-rating">${t('rating')}</label><input type="number" id="review-rating" class="form-control" min="1" max="5" required></div><div class="form-group"><label for="review-comment">${t('comment')}</label><textarea id="review-comment" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'review-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'review-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('report-destination', t('report_destination'), `<form id="report-destination-form" onsubmit="return false;"><input type="hidden" id="report-location-id"><div class="form-group"><label for="report-reason">${t('report_reason')}</label><input type="text" id="report-reason" class="form-control" required></div><div class="form-group"><label for="report-notes">${t('report_notes')}</label><textarea id="report-notes" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'report-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'report-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('media-upload', t('media_upload_title'), `<form id="media-upload-form" onsubmit="return false;"><input type="hidden" id="media-location-id"><div class="form-group"><label for="media-files">${t('select_files')}</label><input type="file" id="media-files" class="form-control" multiple accept="image/*,video/*"></div></form>`, [{ id: 'media-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'media-submit', class: 'btn-primary', text: t('submit') }]);
        modalManager.create('admin-panel', t('admin_panel_title'), `<div class="admin-tabs"><button class="admin-tab active" data-tab="users">Users</button><button class="admin-tab" data-tab="submissions">Submissions</button><button class="admin-tab" data-tab="reports">Reports</button></div><div id="admin-panel-content"></div>`, [{ id: 'admin-close', class: 'btn-secondary', text: t('close') }]);
        
        modalManager.create('info', t('info_title'), `
            <div class="info-tabs">
                <button class="info-tab active" data-tab="about">About</button>
                <button class="info-tab" data-tab="contribute">How to Contribute</button>
                <button class="info-tab" data-tab="conduct">Community Philosophy</button>
            </div>
            <div class="info-tab-content active" id="info-tab-about">
                <p>This is the Overland Destinations Database, an open-source project for travelers to share great places.</p>
                <p>We have included layers for hiking and cycling trails, railways, and camping sites to help you find the best routes and spots.</p>
                <p>Please note that this project is in beta. We are still working on features like user profiles, reviews, and media uploads. Let us know how they're working!</p>
                <div class="info-modal-mascot">
                    <img src="oddyu.png" alt="Oddyseus the Otter" class="mascot-image" onerror="this.style.display='none'">
                </div>
                <p>Entries by the "system" user are a.i. generated for beta testing only! Please help us by adding your own entries and sharing the site with other travelers. :)</p>
            </div>
            <div class="info-tab-content" id="info-tab-contribute">
                <h1>A Guide to Great Contributions</h1>
                <p>Thank you for helping our community grow! This map is built by travelers like you. Here are a few quick tips to make your contributions awesome.</p>
                <h3>What We Love to See</h3>
                <ul>
                    <li><strong>Honest, detailed descriptions.</strong> The best tips come from personal experience. Tell us <em>why</em> a place was special. Was the view incredible? Did the mechanic have the right part? Was it just a peaceful spot to have lunch? Your story is what makes a location useful.</li>
                    <li><strong>Helpful photos.</strong> A picture of the campsite, the storefront, or the view is perfect. A picture of your smiling face is also great, but maybe not as the primary photo for the location!</li>
                    <li><strong>Unique and useful spots.</strong> We especially love those hard-to-find places—a remote water source, a great wild camping spot, or a shop with rare supplies.</li>
                    <li><strong>Spontaneous joys!</strong> Feel free to add that <strong>Scenic Viewpoint</strong> you stopped at for five minutes or that perfect <strong>Day Use / Picnic Area</strong>. Not every great spot is an overnight stay.</li>
                </ul>
                <h3> Travel mindfully: </h3>
                <p>Make your mark <em>on the map</em>, not on the land, and please, follow the community philosophy and conduct guidelines when you are here.</p>
            </div>
            <div class="info-tab-content" id="info-tab-conduct">
                <h1>O.D.D.Map Community Philosophy</h1>
                <p>This project is built by and for a global community of travelers. We have three guiding principles that we ask everyone to share.</p>
                <h3>1. Be Kind</h3>
                <p>This is first for a reason. Treat fellow users, contributors, and the people you meet on your travels with respect, patience, and empathy. We are all here to share knowledge and help each other explore the world. There is a zero-tolerance policy for harassment, hate speech, or personal attacks.</p>
                <h3>2. Respect the Place</h3>
                <p>Every point on this map is someone's home. Be considerate of local communities, their customs, and their way of life. Ask for permission before camping, especially if the land appears to be actively used by locals. Leave places better than you found them.</p>
                <h3>Consider the Common Good</h3>
                <p>We have a shared responsibility to protect the natural environments we travel through. This means packing out all waste, respecting wildlife, and only using designated fire pits when and where it's safe. Do not add places to this map that would encourage environmental damage.</p>
                <p>This is a community-moderated project. We trust you to contribute responsibly and help us by reporting any content that does not align with these principles. Thank you for being a positive part of our community.</p>
            </div>
        `, [{ id: 'info-close', class: 'btn-secondary', text: t('close') }]);
    };
    
    // --- EVENT LISTENERS ---

    // Define validation functions before they are used
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 8;
    const validateName = (name) => name.length >= 2 && name.length <= 50;

    /**
     * Sets up event listeners for all modal actions using event delegation.
     */
    const setupModalEventListeners = () => {
        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            const action = target.dataset.action;
            const modal = target.closest('.modal');

            // Handle modal close buttons
            if (target.matches('.modal-close') || target.id.endsWith('-cancel') || target.id.endsWith('-close')) {
                modalManager.hide();
                return;
            }

            // Handle popup action buttons
            if(action) {
                const locationId = target.dataset.locationId;
                switch(action) {
                    case 'add-review': handleReviewClick(locationId); break;
                    case 'upload-media': handleMediaClick(locationId); break;
                    case 'report-destination': handleReportClick(locationId); break;
                    case 'add-here': 
                        if (!currentUser) return showToast(t('error_please_login'), 'error');
                        map.closePopup();
                        if (temporaryMarker) map.removeLayer(temporaryMarker);
                        modalManager.show('add-destination', (modal) => {
                            modal.querySelector('#loc-lat').value = target.dataset.lat;
                            modal.querySelector('#loc-lng').value = target.dataset.lng;
                        });
                        break;
                }
            }
            
            // Handle modal form submissions
            if (target.id === 'login-submit') {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                if (!email || !password) return;
                try {
                    await apiRequest('/auth/login', 'POST', { email, password });
                    await checkLoginState();
                    modalManager.hide();
                    showToast(t('login_success'), 'success');
                } catch (error) { /* Toast is shown by apiRequest */ }
            } else if (target.id === 'register-submit') {
                const username = document.getElementById('register-username').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value;

                if (!validateName(username)) return showToast('Username must be between 2-50 characters.', 'error');
                if (!validateEmail(email)) return showToast('Please enter a valid email address.', 'error');
                if (!validatePassword(password)) return showToast('Password must be at least 8 characters.', 'error');

                try {
                    await apiRequest('/auth/register', 'POST', { username, email, password });
                    modalManager.hide();
                    showToast('Registration successful! Please log in.', 'success');
                    modalManager.show('login');
                } catch (error) { /* Toast is shown by apiRequest */ }
            } else if (target.id === 'add-loc-submit') {
                const properties = {};
                for (const [key, config] of Object.entries(AMENITIES_CONFIG)) { const el = document.getElementById(`prop-${key}`); properties[key] = config.type === 'boolean' ? el.checked : el.value; }
                const payload = { name: document.getElementById('loc-name').value, type: document.getElementById('loc-type').value, description: document.getElementById('loc-desc').value, latitude: parseFloat(document.getElementById('loc-lat').value), longitude: parseFloat(document.getElementById('loc-lng').value), properties };
                try { await apiRequest('/locations', 'POST', payload); modalManager.hide(); showToast(t('destination_added_success'), 'success'); } catch (error) { /* Toast shown by apiRequest */ }
            } else if (target.id === 'apply-filters') {
                currentFilters.types = Array.from(document.querySelectorAll('#modal-filters input[name="type"]:checked')).map(el => el.value);
                currentFilters.amenities = Array.from(document.querySelectorAll('#modal-filters input[name="amenity"]:checked')).map(el => el.value);
                favoritesViewActive = false; loadDestinations(document.getElementById('search-input').value.trim()); modalManager.hide();
            } else if (target.id === 'clear-filters') {
                document.querySelectorAll('#modal-filters input[type="checkbox"]').forEach(el => el.checked = false);
                currentFilters = { types: [], amenities: [] };
            } else if (target.id === 'save-profile-btn') {
                const avatarFile = document.getElementById('profile-avatar').files[0];
                const profileData = {
                    bio: document.getElementById('profile-bio').value,
                    website: document.getElementById('profile-website').value,
                    contact: document.getElementById('profile-contact').value,
                    avatar_url: currentUser.avatar_url
                };

                if (avatarFile) {
                    try {
                        const { signedUrl, avatar_url } = await apiRequest('/users/me/avatar-upload-url', 'POST', { contentType: avatarFile.type });
                        await fetch(signedUrl, { method: 'PUT', body: avatarFile, headers: { 'Content-Type': avatarFile.type } });
                        profileData.avatar_url = avatar_url;
                    } catch (error) {
                        showToast(t('avatar_upload_failed'), 'error');
                        return;
                    }
                }

                try {
                    await apiRequest('/users/me', 'PUT', profileData);
                    await checkLoginState();
                    modalManager.hide();
                    showToast(t('profile_updated'), 'success');
                } catch (error) { /* Toast shown by apiRequest */ }
            } else if (target.id === 'review-submit') {
                const payload = { value: parseInt(document.getElementById('review-rating').value, 10), comment: document.getElementById('review-comment').value };
                const locationId = document.getElementById('review-location-id').value;
                try { await apiRequest(`/votes/${locationId}`, 'POST', payload); modalManager.hide(); showToast(t('review_sent'), 'success'); map.closePopup(); } catch (error) { /* ... */ }
            } else if (target.id === 'report-submit') {
                const payload = { location_id: document.getElementById('report-location-id').value, reason: document.getElementById('report-reason').value, notes: document.getElementById('report-notes').value };
                try { await apiRequest('/reports', 'POST', payload); modalManager.hide(); showToast(t('report_sent'), 'success'); } catch (error) { /* ... */ }
            } else if (target.id === 'media-submit') {
                const files = document.getElementById('media-files').files;
                const locationId = document.getElementById('media-location-id').value;
                if (files.length === 0) return showToast(t('please_select_files'), 'error');
                for (const file of files) {
                    try {
                        const { signedUrl } = await apiRequest('/media/upload-url', 'POST', { filename: file.name, contentType: file.type, locationId: locationId });
                        await fetch(signedUrl, { method: 'PUT', body: file });
                        showToast(`${DOMPurify.sanitize(file.name)} ${t('uploaded_for_review')}`, 'success');
                    } catch (error) { showToast(`Failed to upload ${DOMPurify.sanitize(file.name)}`, 'error'); }
                }
                modalManager.hide();
            }
            
            // Handle admin and info tabs
            if(modal && (modal.id === 'modal-admin-panel' || modal.id === 'modal-info')) {
                const tabClass = modal.id === 'modal-info' ? '.info-tab' : '.admin-tab';
                if (target.matches(tabClass)) {
                    modal.querySelectorAll(`${tabClass}, .admin-tab-content, .info-tab-content`).forEach(el => el.classList.remove('active'));
                    target.classList.add('active');
                    const tabContentId = target.dataset.tab;
                    const contentEl = modal.querySelector(`#info-tab-${tabContentId}`);
                    if(contentEl) contentEl.classList.add('active');
                }
            }
        });
    };
    
    /**
     * Sets up event listeners for non-modal UI elements.
     */
    const setupAppEventListeners = () => {
        // Add navbar logo
        const navBrandContainer = document.querySelector('.nav-brand-container');
        if (navBrandContainer) {
            const logoImg = document.createElement('img');
            logoImg.src = 'oddysseus_maximus.png';
            logoImg.alt = 'O.D.D. Map Logo';
            logoImg.id = 'nav-logo';
            logoImg.onerror = () => { logoImg.style.display = 'none'; };
            navBrandContainer.prepend(logoImg);
        }

        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        if (searchInput && searchButton) {
            // Define search function
            const performSearch = () => {
                const searchTerm = searchInput.value.trim();
                if (!searchTerm) return; // Don't search empty strings
                
                favoritesViewActive = false;
                
                // Show loading state
                searchButton.disabled = true;
                searchButton.classList.add('loading');
                
                // Basic check: if it has numbers and spaces, it's likely an address
                if (/\d/.test(searchTerm) && / /.test(searchTerm)) {
                    geocodeAndPan(searchTerm)
                        .finally(() => {
                            searchButton.disabled = false;
                            searchButton.classList.remove('loading');
                        });
                } else {
                    loadDestinations(searchTerm)
                        .finally(() => {
                            searchButton.disabled = false;
                            searchButton.classList.remove('loading');
                        });
                }
            };
            
            // Attach event listeners
            searchButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any form submission
                performSearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent any form submission
                    performSearch();
                }
            });
            
            // Remove any existing search-form listeners
            const oldForm = document.getElementById('search-form');
            if (oldForm) {
                const newForm = oldForm.cloneNode(true);
                oldForm.parentNode.replaceChild(newForm, oldForm);
            }
        }

        // Map controls
        safeAddEventListener('map-home-btn', 'click', () => goToHome());
        safeAddEventListener('map-location-btn', 'click', () => goToCurrentLocation());
        safeAddEventListener('map-set-home-btn', 'click', () => setCurrentViewAsHome());

        // Language selector
        safeAddEventListener('language-select', 'change', (e) => {
            currentLanguage = e.target.value;
            updateUIForLanguage();
        });

        // Main navigation buttons
        safeAddEventListener('nav-login', 'click', (e) => { e.preventDefault(); modalManager.show('login'); });
        safeAddEventListener('nav-register', 'click', (e) => { e.preventDefault(); modalManager.show('register'); });
        safeAddEventListener('nav-info-btn', 'click', (e) => { e.preventDefault(); modalManager.show('info'); });
        safeAddEventListener('filters-button', 'click', (e) => { e.preventDefault(); modalManager.show('filters'); });

        // User-specific navigation
        safeAddEventListener('nav-logout', 'click', (e) => {
            e.preventDefault();
            apiRequest('/auth/logout', 'POST').then(() => {
                currentUser = null;
                updateUserUI(null);
                showToast(t('logout_success'), 'success');
            }).catch(error => showToast(t('logout_error'), 'error'));
        });

        safeAddEventListener('nav-add-destination', 'click', (e) => {
            e.preventDefault();
            if (!currentUser) return showToast(t('error_please_login'), 'error');
            modalManager.show('add-destination', (modal) => {
                const center = map.getCenter();
                modal.querySelector('#loc-lat').value = center.lat;
                modal.querySelector('#loc-lng').value = center.lng;
            });
        });

        safeAddEventListener('nav-my-favorites', 'click', (e) => {
            e.preventDefault();
            if (!currentUser) return showToast(t('error_please_login'), 'error');
            favoritesViewActive = true;
            loadDestinations();
        });

        safeAddEventListener('nav-my-profile', 'click', (e) => {
            e.preventDefault();
            if (!currentUser) return showToast(t('error_please_login'), 'error');
            modalManager.show('edit-profile', (modal) => {
                modal.querySelector('#profile-bio').value = currentUser.bio || '';
                modal.querySelector('#profile-website').value = currentUser.website || '';
                modal.querySelector('#profile-contact').value = currentUser.contact || '';
            });
        });

        safeAddEventListener('nav-admin', 'click', (e) => { 
            e.preventDefault(); 
            showAdminPanel(); 
        });
    };
    
    // --- HOME VIEW & GEOLOCATION ---
    
    const loadHomeView = () => {
        const savedHome = localStorage.getItem('oddmap_home_view');
        if (savedHome) {
            try { HOME_VIEW = JSON.parse(savedHome); } catch (e) { /* Use default */ }
        }
    };

    const saveHomeView = (center, zoom) => {
        HOME_VIEW = { center: [center.lat, center.lng], zoom };
        localStorage.setItem('oddmap_home_view', JSON.stringify(HOME_VIEW));
    };

    const goToHome = () => {
        map.flyTo(HOME_VIEW.center, HOME_VIEW.zoom);
        showToast('Returning to home view', 'info');
    };

    const goToCurrentLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by this browser.', 'error');
            return;
        }

        const locationBtn = document.getElementById('map-location-btn');
        if (locationBtn) {
            locationBtn.classList.add('loading');
        }

        showToast('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 15);
                
                // Add a temporary marker for current location
                const currentLocationMarker = L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        html: `<div class="current-location-marker">📍</div>`,
                        className: 'current-location-icon',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    })
                }).addTo(map);

                // Remove the marker after 5 seconds
                setTimeout(() => {
                    map.removeLayer(currentLocationMarker);
                }, 5000);

                showToast('Showing your current location', 'success');
                
                if (locationBtn) {
                    locationBtn.classList.remove('loading');
                }
            },
            (error) => {
                let message = 'Could not get your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                showToast(message, 'error');
                
                if (locationBtn) {
                    locationBtn.classList.remove('loading');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    const setCurrentViewAsHome = () => {
        saveHomeView(map.getCenter(), map.getZoom());
        showToast('Current view set as home! 🏠', 'success');
    };

    const geocodeAndPan = async (address) => {
        if (!address) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            if (!response.ok) throw new Error('Geocoding service failed.');
            const data = await response.json();
            if (data && data.length > 0) {
                map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
            } else {
                showToast(`Could not find a location for "${DOMPurify.sanitize(address)}"`, 'info');
            }
        } catch (error) {
            showToast(t('address_lookup_failed'), 'error');
        }
    };

    // --- ADMIN PANEL ---

    /**
     * Shows the admin panel with users, submissions, and reports tabs.
     */
    const showAdminPanel = async () => {
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
            return showToast(t('error_please_login'), 'error');
        }

        try {
            showToast('Loading admin data...', 'info');
            
            // Fetch all required data in parallel
            const [users, submissions, reports] = await Promise.all([
                apiRequest('/admin/users'),
                apiRequest('/admin/locations/pending'),
                apiRequest('/admin/reports')
            ]);

            modalManager.show('admin-panel', modal => {
                // Set up click handlers for tabs if they don't exist yet
                const tabsContainer = modal.querySelector('.admin-tabs');
                if (!tabsContainer.dataset.initialized) {
                    tabsContainer.dataset.initialized = 'true';
                    
                    tabsContainer.addEventListener('click', e => {
                        if (e.target.classList.contains('admin-tab')) {
                            // Update active tab
                            modal.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
                            e.target.classList.add('active');
                            
                            // Show corresponding content
                            const tab = e.target.dataset.tab;
                            if (tab === 'users') {
                                renderUsersList(users);
                            } else if (tab === 'submissions') {
                                renderSubmissionsList(submissions);
                            } else if (tab === 'reports') {
                                renderReportsList(reports);
                            }
                        }
                    });
                }
                
                // Show users tab by default
                renderUsersList(users);
                
                // Set up filters for each data set
                setupAdminFilters(users, submissions, reports);
            });
        } catch (error) {
            console.error('Failed to load admin data', error);
            showToast('Failed to load admin data', 'error');
        }
    };

    /**
     * Renders the list of users in the admin panel.
     * @param {Array} users The list of users.
     */
    const renderUsersList = (users) => {
        const content = document.getElementById('admin-panel-content');
        if (!content) return;
        
        let html = `
            <div class="admin-filter-bar">
                <input type="text" id="admin-user-search" placeholder="Search users..." class="form-control">
                <select id="admin-user-role-filter" class="form-control">
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="admin-data-table">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (users.length === 0) {
            html += '<tr><td colspan="5" class="no-data">No users found</td></tr>';
        } else {
            users.forEach(user => {
                const avatarUrl = user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
                const created = new Date(user.created_at).toLocaleDateString();
                
                html += `
                    <tr data-user-id="${user.id}" data-user-role="${user.role}">
                        <td class="user-cell">
                            <img src="${DOMPurify.sanitize(avatarUrl)}" alt="${DOMPurify.sanitize(user.username)}'s avatar" class="admin-user-avatar">
                            <span>${DOMPurify.sanitize(user.username)}</span>
                        </td>
                        <td>${DOMPurify.sanitize(user.email)}</td>
                        <td>
                            <select class="role-select form-control" data-user-id="${user.id}">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </td>
                        <td>${created}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-user" data-user-id="${user.id}">View</button>
                            <button class="btn btn-sm btn-danger ban-user" data-user-id="${user.id}">
                                ${user.is_banned ? 'Unban' : 'Ban'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Add event listeners for user table
        content.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const userId = e.target.dataset.userId;
                const newRole = e.target.value;
                
                try {
                    await apiRequest(`/admin/users/${userId}/role`, 'PUT', { role: newRole });
                    showToast('User role updated', 'success');
                } catch (error) {
                    // Revert selection on error
                    const originalRole = e.target.closest('tr').dataset.userRole;
                    e.target.value = originalRole;
                }
            });
        });
        
        content.querySelectorAll('.ban-user').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userId;
                const isBanned = e.target.textContent.trim() === 'Unban';
                
                if (confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) {
                    try {
                        await apiRequest(`/admin/users/${userId}/ban`, 'PUT', { 
                            is_banned: !isBanned 
                        });
                        
                        // Update button text without re-fetching all data
                        e.target.textContent = isBanned ? 'Ban' : 'Unban';
                        showToast(`User ${isBanned ? 'unbanned' : 'banned'} successfully`, 'success');
                    } catch (error) {
                        // Error toast is shown by apiRequest
                    }
                }
            });
        });
        
        content.querySelectorAll('.view-user').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                showUserProfileModal(userId);
            });
        });
        
        // Add search and filter functionality
        const searchInput = document.getElementById('admin-user-search');
        const roleFilter = document.getElementById('admin-user-role-filter');
        
        const filterUsers = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const roleValue = roleFilter.value;
            
            content.querySelectorAll('tbody tr').forEach(row => {
                const username = row.querySelector('.user-cell span').textContent.toLowerCase();
                const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const role = row.dataset.userRole;
                
                const matchesSearch = username.includes(searchTerm) || email.includes(searchTerm);
                const matchesRole = !roleValue || role === roleValue;
                
                row.style.display = matchesSearch && matchesRole ? '' : 'none';
            });
        };
        
        searchInput.addEventListener('input', filterUsers);
        roleFilter.addEventListener('change', filterUsers);
    };

    /**
     * Renders the list of pending submissions in the admin panel.
     * @param {Array} submissions The list of pending submissions.
     */
    const renderSubmissionsList = (submissions) => {
        const content = document.getElementById('admin-panel-content');
        if (!content) return;
        
        let html = `
            <div class="admin-filter-bar">
                <input type="text" id="admin-submission-search" placeholder="Search submissions..." class="form-control">
                <select id="admin-submission-type-filter" class="form-control">
                    <option value="">All Types</option>
                    ${CATEGORIES.map(cat => `<option value="${cat}">${t(cat)}</option>`).join('')}
                </select>
            </div>
            <div class="admin-data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Submitted By</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (submissions.length === 0) {
            html += '<tr><td colspan="5" class="no-data">No pending submissions</td></tr>';
        } else {
            submissions.forEach(sub => {
                const submittedDate = new Date(sub.created_at).toLocaleDateString();
                
                html += `
                    <tr data-submission-id="${sub.id}" data-submission-type="${sub.type}">
                        <td>${DOMPurify.sanitize(sub.name)}</td>
                        <td>${DOMPurify.sanitize(t(sub.type))}</td>
                        <td>${DOMPurify.sanitize(sub.creator_username || 'Anonymous')}</td>
                        <td>${submittedDate}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-submission" 
                                    data-submission-id="${sub.id}" 
                                    data-lat="${sub.latitude}" 
                                    data-lng="${sub.longitude}">
                                View
                            </button>
                            <button class="btn btn-sm btn-success approve-submission" data-submission-id="${sub.id}">
                                Approve
                            </button>
                            <button class="btn btn-sm btn-danger reject-submission" data-submission-id="${sub.id}">
                                Reject
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Add event listeners for submission actions
        content.querySelectorAll('.view-submission').forEach(button => {
            button.addEventListener('click', (e) => {
                const submissionId = e.target.dataset.submissionId;
                const lat = parseFloat(e.target.dataset.lat);
                const lng = parseFloat(e.target.dataset.lng);
                
                // Close the admin panel to show the map
                modalManager.hide();
                
                // Pan to the submission location
                map.flyTo([lat, lng], 15);
                
                // Create a temporary marker to highlight the location
                if (temporaryMarker) {
                    map.removeLayer(temporaryMarker);
                }
                
                temporaryMarker = L.marker([lat, lng]).addTo(map);
                
                // Fetch and show destination details in a popup
                fetchAndShowDestinationDetails(submissionId, false);
            });
        });
        
        content.querySelectorAll('.approve-submission').forEach(button => {
            button.addEventListener('click', async (e) => {
                const submissionId = e.target.dataset.submissionId;
                const row = e.target.closest('tr');
                
                if (confirm('Are you sure you want to approve this submission?')) {
                    try {
                        await apiRequest(`/admin/locations/${submissionId}/approve`, 'PUT');
                        
                        // Remove row from table
                        row.style.animation = 'fadeOut 0.5s';
                        setTimeout(() => row.remove(), 500);
                        
                        showToast('Submission approved', 'success');
                    } catch (error) {
                        // Error toast is shown by apiRequest
                    }
                }
            });
        });
        
        content.querySelectorAll('.reject-submission').forEach(button => {
            button.addEventListener('click', async (e) => {
                const submissionId = e.target.dataset.submissionId;
                const row = e.target.closest('tr');
                
                const reason = prompt('Please provide a reason for rejection (optional):');
                
                try {
                    await apiRequest(`/admin/locations/${submissionId}/reject`, 'PUT', { reason });
                    
                    // Remove row from table
                    row.style.animation = 'fadeOut 0.5s';
                    setTimeout(() => row.remove(), 500);
                    
                    showToast('Submission rejected', 'success');
                } catch (error) {
                    // Error toast is shown by apiRequest
                }
            });
        });
        
        // Add search and filter functionality
        const searchInput = document.getElementById('admin-submission-search');
        const typeFilter = document.getElementById('admin-submission-type-filter');
        
        const filterSubmissions = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const typeValue = typeFilter.value;
            
            content.querySelectorAll('tbody tr').forEach(row => {
                const name = row.querySelector('td:first-child').textContent.toLowerCase();
                const type = row.dataset.submissionType;
                
                const matchesSearch = name.includes(searchTerm);
                const matchesType = !typeValue || type === typeValue;
                
                row.style.display = matchesSearch && matchesType ? '' : 'none';
            });
        };
        
        searchInput.addEventListener('input', filterSubmissions);
        typeFilter.addEventListener('change', filterSubmissions);
    };

    /**
     * Renders the list of reports in the admin panel.
     * @param {Array} reports The list of reports.
     */
    const renderReportsList = (reports) => {
        const content = document.getElementById('admin-panel-content');
        if (!content) return;
        
        let html = `
            <div class="admin-filter-bar">
                <input type="text" id="admin-report-search" placeholder="Search reports..." class="form-control">
                <select id="admin-report-status-filter" class="form-control">
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                </select>
            </div>
            <div class="admin-data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Reported By</th>
                            <th>Reason</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (reports.length === 0) {
            html += '<tr><td colspan="5" class="no-data">No reports found</td></tr>';
        } else {
            reports.forEach(report => {
                const reportDate = new Date(report.created_at).toLocaleDateString();
                
                html += `
                    <tr data-report-id="${report.id}" data-status="${report.status || 'open'}">
                        <td>${DOMPurify.sanitize(report.reporter_username || 'Anonymous')}</td>
                        <td class="report-reason">${DOMPurify.sanitize(report.reason)}</td>
                        <td>${reportDate}</td>
                        <td>${report.status === 'closed' ? 'Closed' : 'Open'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-reported-location" 
                                    data-location-id="${report.location_id}">
                                View Location
                            </button>
                            ${report.status !== 'closed' ? `
                                <button class="btn btn-sm btn-success resolve-report" data-report-id="${report.id}">
                                    Resolve
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Add event listeners for report actions
        content.querySelectorAll('.view-reported-location').forEach(button => {
            button.addEventListener('click', async (e) => {
                const locationId = e.target.dataset.locationId;
                
                try {
                    const location = await apiRequest(`/locations/${locationId}`);
                    
                    // Close the admin panel to show the map
                    modalManager.hide();
                    
                    // Pan to the reported location
                    map.flyTo([location.latitude, location.longitude], 15);
                    
                    // Create a temporary marker to highlight the location
                    if (temporaryMarker) {
                        map.removeLayer(temporaryMarker);
                    }
                    
                    temporaryMarker = L.marker([location.latitude, location.longitude]).addTo(map);
                    
                    // Show destination details in a popup
                    fetchAndShowDestinationDetails(locationId, false);
                } catch (error) {
                    showToast('Could not find the reported location', 'error');
                }
            });
        });
        
        content.querySelectorAll('.resolve-report').forEach(button => {
            button.addEventListener('click', async (e) => {
                const reportId = e.target.dataset.reportId;
                const row = e.target.closest('tr');
                
                if (confirm('Are you sure you want to mark this report as resolved?')) {
                    try {
                        await apiRequest(`/admin/reports/${reportId}/resolve`, 'PUT');
                        
                        // Update row to show closed status
                        row.dataset.status = 'closed';
                        row.querySelector('td:nth-child(4)').textContent = 'Closed';
                        e.target.remove();
                        
                        showToast('Report marked as resolved', 'success');
                    } catch (error) {
                        // Error toast is shown by apiRequest
                    }
                }
            });
        });
        
        // Add search and filter functionality
        const searchInput = document.getElementById('admin-report-search');
        const statusFilter = document.getElementById('admin-report-status-filter');
        
        const filterReports = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const statusValue = statusFilter.value;
            
            content.querySelectorAll('tbody tr').forEach(row => {
                const reason = row.querySelector('.report-reason').textContent.toLowerCase();
                const status = row.dataset.status;
                
                const matchesSearch = reason.includes(searchTerm);
                const matchesStatus = !statusValue || status === statusValue;
                
                row.style.display = matchesSearch && matchesStatus ? '' : 'none';
            });
        };
        
        searchInput.addEventListener('input', filterReports);
        statusFilter.addEventListener('change', filterReports);
    };

    /**
     * Sets up admin panel filters for users, submissions, and reports.
     */
    const setupAdminFilters = (users, submissions, reports) => {
        const adminPanel = document.getElementById('modal-admin-panel');
        if (adminPanel) {
            const userTab = adminPanel.querySelector('.admin-tab[data-tab="users"]');
            const submissionsTab = adminPanel.querySelector('.admin-tab[data-tab="submissions"]');
            const reportsTab = adminPanel.querySelector('.admin-tab[data-tab="reports"]');
            
            userTab.textContent = `Users (${users.length})`;
            submissionsTab.textContent = `Submissions (${submissions.length})`;
            
            // Highlight reports tab if there are open reports
            const openReports = reports.filter(r => r.status !== 'closed').length;
            reportsTab.textContent = `Reports (${openReports})`;
            
            reportsTab.classList.toggle('has-alerts', openReports > 0);
        }
    };

    /**
     * Shows a modal with detailed user profile information.
     * @param {string|number} userId The ID of the user to show.
     */
    const showUserProfileModal = async (userId) => {
        try {
            const user = await apiRequest(`/admin/users/${userId}`);
            
            const modalId = `user-profile-${user.id}`;
            const modalTitle = `User Profile: ${user.username}`;
            
            // Format dates
            const createdDate = new Date(user.created_at).toLocaleDateString();
            const lastLoginDate = user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never';
            
            // Calculate account age
            const accountAge = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
            
            // Fetch user's contributions
            let contributions = { locations: [], reviews: [], media: [], reports: [] };
            try {
                contributions = await apiRequest(`/admin/users/${userId}/contributions`);
            } catch (error) {
                console.error('Failed to load user contributions', error);
            }
            
            const modalContent = `
                <div class="user-profile-header">
                    <img src="${DOMPurify.sanitize(user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp')}" 
                         alt="${DOMPurify.sanitize(user.username)}'s avatar" 
                         class="user-profile-avatar">
                    <div class="user-profile-info">
                        <h2>${DOMPurify.sanitize(user.username)}</h2>
                        <div class="user-profile-meta">
                            <span class="user-role ${user.role}">${user.role}</span>
                            ${user.is_banned ? '<span class="user-banned">Banned</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="user-profile-details">
                    <div class="user-profile-section">
                        <h3>Account Details</h3>
                        <table class="user-details-table">
                            <tr><td>Email:</td><td>${DOMPurify.sanitize(user.email)}</td></tr>
                            <tr><td>Registered:</td><td>${createdDate} (${accountAge} days ago)</td></tr>
                            <tr><td>Last Login:</td><td>${lastLoginDate}</td></tr>
                            <tr><td>Bio:</td><td>${DOMPurify.sanitize(user.bio || 'No bio provided')}</td></tr>
                            <tr><td>Website:</td><td>${user.website ? `<a href="${DOMPurify.sanitize(user.website)}" target="_blank">${DOMPurify.sanitize(user.website)}</a>` : 'None'}</td></tr>
                            <tr><td>Contact:</td><td>${DOMPurify.sanitize(user.contact || 'None provided')}</td></tr>
                        </table>
                    </div>
                    
                    <div class="user-profile-section">
                        <h3>Activity</h3>
                        <div class="user-stats">
                            <div class="stat-box">
                                <div class="stat-value">${contributions.locations?.length || 0}</div>
                                <div class="stat-label">Locations</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${contributions.reviews?.length || 0}</div>
                                <div class="stat-label">Reviews</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${contributions.media?.length || 0}</div>
                                <div class="stat-label">Media</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${contributions.reports?.length || 0}</div>
                                <div class="stat-label">Reports</div>
                            </div>
                        </div>
                    </div>
                    
                    ${contributions.locations?.length > 0 ? `
                    <div class="user-profile-section">
                        <h3>Recent Contributions</h3>
                        <ul class="user-contributions-list">
                            ${contributions.locations.slice(0, 5).map(loc => `
                                <li>
                                    <div class="contribution-icon">${CATEGORY_ICONS[loc.type] || CATEGORY_ICONS['other']}</div>
                                    <div class="contribution-details">
                                        <strong>${DOMPurify.sanitize(loc.name)}</strong>
                                        <span class="contribution-type">${DOMPurify.sanitize(t(loc.type))}</span>
                                        <span class="contribution-date">${new Date(loc.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button class="btn btn-sm btn-primary view-contribution" 
                                            data-location-id="${loc.id}" 
                                            data-lat="${loc.latitude}" 
                                            data-lng="${loc.longitude}">
                                        View
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const footerButtons = [
                { id: `close-user-profile-${user.id}`, class: 'btn-secondary', text: 'Close' },
                { id: `toggle-ban-${user.id}`, class: 'btn-danger', text: user.is_banned ? 'Remove Ban' : 'Ban User' }
            ];

            modalManager.create(modalId, modalTitle, modalContent, footerButtons);
            modalManager.show(modalId, (modal) => {
                // Add event listeners for this specific modal instance
                modal.querySelector(`#close-user-profile-${user.id}`).addEventListener('click', () => {
                    modalManager.hide();
                    showAdminPanel(); // Re-open admin panel
                });

                modal.querySelector(`#toggle-ban-${user.id}`).addEventListener('click', async (e) => {
                    const isBanned = e.target.textContent.trim() === 'Remove Ban';
                    if (confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) {
                        try {
                            await apiRequest(`/admin/users/${userId}/ban`, 'PUT', { is_banned: !isBanned });
                            showToast(`User ${isBanned ? 'unbanned' : 'banned'} successfully`, 'success');
                            modalManager.hide();
                            showAdminPanel(); // Refresh admin panel
                        } catch (error) {
                            // Error toast is shown by apiRequest
                        }
                    }
                });

                modal.querySelectorAll('.view-contribution').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const locationId = e.currentTarget.dataset.locationId;
                        const lat = parseFloat(e.currentTarget.dataset.lat);
                        const lng = parseFloat(e.currentTarget.dataset.lng);
                        
                        modalManager.hide();
                        
                        map.flyTo([lat, lng], 15);
                        
                        if (temporaryMarker) {
                            map.removeLayer(temporaryMarker);
                        }
                        
                        temporaryMarker = L.marker([lat, lng]).addTo(map);
                        
                        fetchAndShowDestinationDetails(locationId, false);
                    });
                });
            });
        } catch (error) {
            console.error('Failed to load user profile', error);
            showToast('Failed to load user profile', 'error');
        }
    };

    const showPublicProfileModal = async (username) => {
        try {
            const { user, locations } = await apiRequest(`/profiles/${username}`);
            const modalId = `public-profile-${user.username}`;
            const modalTitle = `Profile: ${user.username}`;

            const modalContent = `
                <div class="user-profile-header">
                    <img src="${DOMPurify.sanitize(user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp')}"
                         alt="${DOMPurify.sanitize(user.username)}'s avatar"
                         class="user-profile-avatar">
                    <div class="user-profile-info">
                        <h2>${DOMPurify.sanitize(user.username)}</h2>
                        <p>Member since: ${new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="user-profile-details">
                    <div class="user-profile-section">
                        <h3>Bio</h3>
                        <p>${DOMPurify.sanitize(user.bio || 'No bio provided.')}</p>
                    </div>
                    ${user.website ? `
                    <div class="user-profile-section">
                        <h3>Website</h3>
                        <p><a href="${DOMPurify.sanitize(user.website)}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(user.website)}</a></p>
                    </div>
                    ` : ''}
                    <div class="user-profile-section">
                        <h3>Contributions (${locations.length})</h3>
                        <ul class="user-contributions-list">
                            ${locations.length > 0 ? locations.map(loc => `
                                <li>
                                    <div class="contribution-icon">${CATEGORY_ICONS[loc.type] || CATEGORY_ICONS['other']}</div>
                                    <div class="contribution-details">
                                        <strong>${DOMPurify.sanitize(loc.name)}</strong>
                                        <span class="contribution-type">${DOMPurify.sanitize(t(loc.type))}</span>
                                    </div>
                                </li>
                            `).join('') : '<li>No public contributions yet.</li>'}
                        </ul>
                    </div>
                </div>
            `;

            modalManager.create(modalId, modalTitle, modalContent, [{ id: `close-public-profile-${user.id}`, class: 'btn-secondary', text: 'Close' }]);
            modalManager.show(modalId);

        } catch (error) {
            showToast('Could not load user profile.', 'error');
            console.error("Failed to load public profile:", error);
        }
    };

    /**
     * Prevents click events on map controls from propagating to the map.
     */
    const setupMapControlPropagation = () => {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;

        const controls = mapContainer.querySelectorAll('.leaflet-control-container, .map-controls-container');

        controls.forEach(controlContainer => {
            // Stop propagation for mouse and touch events to prevent map interaction
            controlContainer.addEventListener('mousedown', (e) => e.stopPropagation());
            controlContainer.addEventListener('dblclick', (e) => e.stopPropagation());
            controlContainer.addEventListener('click', (e) => e.stopPropagation());
            controlContainer.addEventListener('wheel', (e) => e.stopPropagation());
            controlContainer.addEventListener('touchstart', (e) => e.stopPropagation());
            controlContainer.addEventListener('touchend', (e) => e.stopPropagation());
        });
    };

    /**
     * Initializes the entire application.
     */
    const init = async () => {
        loadHomeView();
        await checkLoginState();
        createModals();
        updateUIForLanguage();
        setupAppEventListeners();
        setupModalEventListeners();
        setupMapControlPropagation(); // Prevents clicks on controls from affecting the map
        initMap();
    };

    init();
});