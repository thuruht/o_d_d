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

    // Declare these variables in the outer scope so both functions can access them
    let hikingTrails = null;
    let cyclingTrails = null;
    let railwayStandard = null;
    let railwayMaxspeed = null;
    let railwayElectrification = null;
    let campingLayer = null;
    let breweryLayer = null;
    let familyLayer = null;

    const HOME_VIEW = {

        center: [9, 8],

        zoom: 2

    };



    const API_BASE = '/api';

    const modalManager = new ModalManager();



    // --- UPDATED: New categories from your legend have been added ---

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



    // --- NEW: Inline SVG Icon Configuration ---

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

            // --- NEW TRANSLATIONS ---

            'friendly-outpost': 'Friendly Outpost', 'provisions-stand': 'Provisions Stand', 'seasonal-event': 'Seasonal Event',

            'good-signal-spot': 'Good Signal Spot', 'recycling-waste': 'Recycling / Waste', 'consulate-embassy': 'Consulate / Embassy',

            'financial': 'Financial', 'overnight-prohibited': 'Overnight Prohibited', 'other': 'Other'

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

            'border-crossing': 'Cruce Fronterizo', 'checkpoint': 'Punto de Control', 'warning': 'Advertencia',

            // --- NEW TRANSLATIONS ---

            'friendly-outpost': 'Puesto Amigo', 'provisions-stand': 'Puesto de Provisiones', 'seasonal-event': 'Evento Estacional',

            'good-signal-spot': 'Lugar con Buena Señal', 'recycling-waste': 'Reciclaje / Basura', 'consulate-embassy': 'Consulado / Embajada',

            'financial': 'Financiero', 'overnight-prohibited': 'Pernoctar Prohibido', 'other': 'Otro',

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

            'border-crossing': 'Passage Frontalier', 'checkpoint': 'Poste de Contrôle', 'warning': 'Avertissement',

            // --- NEW TRANSLATIONS ---

            'friendly-outpost': 'Avant-poste Amical', 'provisions-stand': 'Stand de Provisions', 'seasonal-event': 'Événement Saisonnier',

            'good-signal-spot': 'Bon Signal', 'recycling-waste': 'Recyclage / Déchets', 'consulate-embassy': 'Consulat / Ambassade',

            'financial': 'Financier', 'overnight-prohibited': 'Nuitée Interdite', 'other': 'Autre',

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

    // New function that doesn't show error toasts
    const apiRequestSilent = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        const options = {
            method,
            headers,
            credentials: 'include'
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            // Don't show toast for auth errors during session check
            if (response.status === 401 && endpoint === '/auth/me') {
                throw new Error('Not authenticated');
            }
            
            const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    };


    const checkLoginState = async () => {
        try {
            // Use apiRequestSilent instead of apiRequest to avoid showing error toast
            currentUser = await apiRequestSilent('/auth/me');
        } catch (error) {
            currentUser = null;
        }
        updateUserUI(currentUser);
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
        map = L.map('map-container', { zoomControl: false, attributionControl: false })
            .setView(HOME_VIEW.center, HOME_VIEW.zoom);
        L.control.zoom({ position: 'topright' }).addTo(map);

        // --- Base Layers using Leaflet Providers (FIXED PROVIDERS) ---
        const street = L.tileLayer.provider('OpenStreetMap.Mapnik');
        const satellite = L.tileLayer.provider('Esri.WorldImagery');
        const topo = L.tileLayer.provider('OpenTopoMap');
        const cartoPositron = L.tileLayer.provider('CartoDB.Positron');
        const cartoVoyager = L.tileLayer.provider('CartoDB.Voyager'); 
        const cartoDark = L.tileLayer.provider('CartoDB.DarkMatter');
        
        // REPLACE STAMEN PROVIDERS WITH DIRECT TILE LAYERS
        const terrainMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
            maxZoom: 17
        });

        const cleanLines = L.tileLayer.provider('CartoDB.Positron');

        const artisticMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, © OpenStreetMap contributors',
            maxZoom: 16
        });
        
        // REPLACE OpenPtMap with working public transport layer
        const publicTransport = L.tileLayer('https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://memomaps.de/">MeMoMaps</a>, © OpenStreetMap contributors',
            maxZoom: 18
        });
        
        const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
        const osmDE = L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        });
        const osmFR = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 20
        });
        const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team',
            maxZoom: 17
        });
        
        const baseMaps = { 
            "🗺️ Street": street,
            "🛰️ Satellite": satellite, 
            "🗻 Topographic": topo,
            "✨ Clean Light": cartoPositron,
            "🧭 Voyager": cartoVoyager,
            "🌙 Dark Theme": cartoDark,
            "🏔️ Terrain": terrainMap,        // Fixed
            "📐 Clean Lines": cleanLines,     // Fixed  
            "🎨 Artistic": artisticMap,       // Fixed
            "🚌 Public Transport": publicTransport,
            "📍 OSM Standard": osmStandard,
            "🇩🇪 OSM German": osmDE,
            "🇫🇷 OSM France": osmFR,
            "🆘 OSM Humanitarian": osmHOT
        };

        // --- Initialize overlay layers ---
        hikingTrails = L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://waymarkedtrails.org">Waymarked Trails</a>',
            opacity: 0.7
        });
        
        cyclingTrails = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://waymarkedtrails.org">Waymarked Trails</a>',
            opacity: 0.7
        });

        railwayStandard = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
            minZoom: 2,
            maxZoom: 19,
            opacity: 0.7
        });

        // Initialize POI layer groups
        campingLayer = L.layerGroup();
        breweryLayer = L.layerGroup();
        familyLayer = L.layerGroup();

        // --- ALL OVERLAYS IN ONE ORGANIZED MENU ---
        const overlayMaps = {
            // Trails & Routes
            "🥾 Hiking Trails": hikingTrails,
            "🚲 Cycling Trails": cyclingTrails,
            "🚆 Railways": railwayStandard,
            
            // Points of Interest  
            "⛺ Camping Sites": campingLayer,
            "🍺 Breweries": breweryLayer,
            "👶 Family-Friendly Sites": familyLayer
        };

        // --- Initialize with satellite ---
        satellite.addTo(map);

        // --- Locations and Layer Control ---
        locationsLayer = L.layerGroup().addTo(map);
        L.control.layers(baseMaps, overlayMaps, { 
            position: 'topright', 
            collapsed: false  // Keep it open so users can easily see all options
        }).addTo(map);

        loadDestinations();
        map.on('click', onMapClick);

        // Load POI data when layers are added to map
        map.on('layeradd', (e) => {
            if (e.layer === breweryLayer) {
                loadPOILayer('node[amenity=pub];node[amenity=bar];node[craft=brewery]', breweryLayer, '🍺');
            } else if (e.layer === campingLayer) {
                loadPOILayer('node[tourism=camp_site];node[tourism=caravan_site]', campingLayer, '⛺');
            } else if (e.layer === familyLayer) {
                loadPOILayer('node[tourism=attraction][family=yes];node[amenity=playground]', familyLayer, '👶');
            }
        });
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


                <br><br>

                <button class="btn btn-primary btn-sm" data-action="add-here" data-lat="${e.latlng.lat}" data-lng="${e.latlng.lng}">Add Destination Here</button>

            </div>

        `;

        temporaryMarker.bindPopup(content, { className: 'temporary-marker-popup' }).openPopup();

    };



    // --- UPDATED to use L.divIcon with inline SVG ---

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

                            const rawValueKey = String(value).replace(/-/g, '_');

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
                if (userProfile) showUserProfileModal(userProfile.dataset.userId);
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

        modalManager.create('login', t('login_title'), `<form id="login-form" onsubmit="return false;"><div class="form-group"><label for="login-email">${t('email')}</label><input type="email" id="login-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="login-password">${t('password')}</label><input type="password" id="login-password" class="form-control" required autocomplete="current-password"></div></form>`, [{ id: 'login-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'login-submit', class: 'btn-primary', text: t('login') }]);

        modalManager.create('register', t('register_title'), `<form id="register-form" onsubmit="return false;"><div class="form-group"><label for="register-username">${t('username')}</label><input type="text" id="register-username" class="form-control" required autocomplete="username"></div><div class="form-group"><label for="register-email">${t('email')}</label><input type="email" id="register-email" class="form-control" required autocomplete="email"></div><div class="form-group"><label for="register-password">${t('password')}</label><input type="password" id="register-password" class="form-control" required minlength="8" autocomplete="new-password"></div></form>`, [{ id: 'register-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'register-submit', class: 'btn-primary', text: t('register') }]);

        const amenityFormHTML = () => Object.entries(AMENITIES_CONFIG).map(([key, config]) => `<div class="form-group"><label for="prop-${key}">${t(config.label.toLowerCase().replace(/ /g, '_'))}</label>${config.type === 'select' ? `<select id="prop-${key}" class="form-control">${config.options.map(opt => `<option value="${opt}">${t(opt)}</option>`).join('')}</select>` : `<div class="checkbox-group"><input type="checkbox" id="prop-${key}"></div>`}</div>`).join('');

        modalManager.create('add-destination', t('add_destination_title'), `<form id="add-destination-form" onsubmit="return false;"><div class="form-group"><label for="loc-name">${t('destination_name')}</label><input type="text" id="loc-name" class="form-control" required></div><div class="form-group"><label for="loc-type">${t('destination_type')}</label><select id="loc-type" class="form-control">${CATEGORIES.map(type => `<option value="${type}">${t(type)}</option>`).join('')}</select></div><div class="form-group"><label for="loc-desc">${t('description')}</label><textarea id="loc-desc" class="form-control" rows="3"></textarea></div><input type="hidden" id="loc-lat"><input type="hidden" id="loc-lng"><hr><h6>Amenities</h6><div class="amenity-form-grid">${amenityFormHTML()}</div></form>`, [{ id: 'add-loc-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'add-loc-submit', class: 'btn-primary', text: t('submit') }]);



        // --- UPDATED to show SVG icons in the filter modal ---

        const filterGridHTML = () => `<div class="filter-grid">${[...CATEGORIES, ...Object.keys(AMENITIES_CONFIG).filter(k => AMENITIES_CONFIG[k].type === 'boolean')].map(item => {

            const isAmenity = AMENITIES_CONFIG[item] && AMENITIES_CONFIG[item].type === 'boolean';

            const id = isAmenity ? `filter-amenity-${item}` : `filter-type-${item}`;

            const name = isAmenity ? 'amenity' : 'type';

            const label = isAmenity ? t(AMENITIES_CONFIG[item].label.toLowerCase().replace(/ /g, '_')) : t(item);



            let iconHtml = '';

            if (!isAmenity) {

                iconHtml = CATEGORY_ICONS[item] || CATEGORY_ICONS['other'];

            }



            return `<div class="filter-item">${iconHtml}<input type="checkbox" id="${id}" name="${name}" value="${item}"><label for="${id}">${label}</label></div>`;

        }).join('')}</div>`;



        modalManager.create('filters', t('filter_title'), `<div class="filter-section">${filterGridHTML()}</div>`, [{ id: 'clear-filters', class: 'btn-secondary', text: t('clear_filters') }, { id: 'apply-filters', class: 'btn-primary', text: t('apply_filters') }]);

        modalManager.create('edit-profile', t('edit_profile_title'), `<form id="edit-profile-form" onsubmit="return false;"><div class="form-group"><label for="profile-avatar">${t('avatar')}</label><input type="file" id="profile-avatar" class="form-control" accept="image/*"></div><div class="form-group"><label for="profile-bio">${t('bio')}</label><textarea id="profile-bio" class="form-control" rows="3"></textarea></div><div class="form-group"><label for="profile-website">${t('website')}</label><input type="url" id="profile-website" class="form-control" placeholder="https://..."></div><div class="form-group"><label for="profile-contact">${t('contact_info')}</label><input type="text" id="profile-contact" class="form-control"></div></form>`, [{ id: 'profile-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'save-profile-btn', class: 'btn-primary', text: t('save_changes') }]);

        modalManager.create('add-review', t('add_review_title'), `<form id="add-review-form" onsubmit="return false;"><input type="hidden" id="review-location-id"><div class="form-group"><label for="review-rating">${t('rating')}</label><input type="number" id="review-rating" class="form-control" min="1" max="5" required></div><div class="form-group"><label for="review-comment">${t('comment')}</label><textarea id="review-comment" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'review-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'review-submit', class: 'btn-primary', text: t('submit') }]);

        modalManager.create('report-destination', t('report_destination'), `<form id="report-destination-form" onsubmit="return false;"><input type="hidden" id="report-location-id"><div class="form-group"><label for="report-reason">${t('report_reason')}</label><input type="text" id="report-reason" class="form-control" required></div><div class="form-group"><label for="report-notes">${t('report_notes')}</label><textarea id="report-notes" class="form-control" rows="3"></textarea></div></form>`, [{ id: 'report-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'report-submit', class: 'btn-primary', text: t('submit') }]);

        modalManager.create('media-upload', t('media_upload_title'), `<form id="media-upload-form" onsubmit="return false;"><input type="hidden" id="media-location-id"><div class="form-group"><label for="media-files">${t('select_files')}</label><input type="file" id="media-files" class="form-control" multiple accept="image/*,video/*"></div></form>`, [{ id: 'media-cancel', class: 'btn-secondary', text: t('cancel') }, { id: 'media-submit', class: 'btn-primary', text: t('submit') }]);

        modalManager.create('admin-panel', t('admin_panel_title'), `<div class="admin-tabs"><button class="admin-tab active" data-tab="users">Users</button><button class="admin-tab" data-tab="submissions">Submissions</button><button class="admin-tab" data-tab="reports">Reports</button></div><div id="admin-panel-content"></div>`, [{ id: 'admin-close', class: 'btn-secondary', text: t('close') }]);





        // --- UPDATED: New tabbed info modal ---
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
                <div class="oddyseus"><img src="oddyu.png" alt="Oddyseus the Otter"></div>
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
                <h3>Our Core Principle: Be a Good Traveler</h3>
                <p>The most important rule is to be respectful. That means respecting the <strong>environment</strong> (leave no trace!), <strong>local communities</strong> (be a good guest!), and <strong>each other</strong> (be kind!).</p>
                <p>Please don't add any places that are illegal, on private property without permission, or would encourage others to do harm.</p>
                <p>That's it! Thank you for sharing your journey with us.</p>
            </div>
            <div class="info-tab-content" id="info-tab-conduct">
                <h1>O.D.D.Map Community Philosophy</h1>
                <p>This project is built by and for a global community of travelers. We have three guiding principles that we ask everyone to share.</p>
                <h3>1. Be Kind</h3>
                <p>This is the most important rule. Treat fellow users, contributors, and the people you meet on your travels with respect, patience, and empathy. We are all here to share knowledge and help each other explore the world. There is a zero-tolerance policy for harassment, hate speech, or personal attacks.</p>
                <h3>2. Respect the Place</h3>
                <p>Every point on this map is someone's home. Be considerate of local communities, their customs, and their way of life. Ask for permission before camping on private land, support local businesses, and always be a good ambassador for the overlanding community. The data we collect should never facilitate disrespect or violating the wishes of local people.</p>
                <h3>3. Leave It Better</h3>
                <p>We have a shared responsibility to protect the natural environments we travel through. This means packing out all waste, respecting wildlife, and only using designated fire pits when and where it's safe. Do not add places to this map that would encourage environmental damage.</p>
                <p>This is a community-moderated project. We trust you to contribute responsibly and help us by reporting any content that does not align with these principles. Thank you for being a positive part of our community.</p>
            </div>
        `, [{ id: 'info-close', class: 'btn-secondary', text: t('close') }]);

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

            modalManager.create('user-profile', DOMPurify.sanitize(user.username), content, [{ id: 'close-profile', class: 'btn-secondary', text: t('close') }]);

            modalManager.show('user-profile');

        } catch (error) { console.error("Could not show user profile"); }

    };



    const setupModalEventListeners = () => {
        document.body.addEventListener('click', async (e) => {
            const target = e.target;

            // FIX: Add the missing modal close handlers
            if (target.matches('.modal-close') || 
                target.id.endsWith('-cancel') || 
                target.id === 'info-close' || 
                target.id === 'admin-close' || 
                target.id === 'close-profile' ||
                target.id === 'login-cancel' ||
                target.id === 'register-cancel' ||
                target.id === 'add-loc-cancel' ||
                target.id === 'profile-cancel' ||
                target.id === 'review-cancel' ||
                target.id === 'report-cancel' ||
                target.id === 'media-cancel') {
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

                try { await apiRequest('/reports', 'POST', payload); modalManager.hide(); showToast(t('report_sent'), 'success'); } catch (error) { console.error('Failed to submit report', error); }

            } else if (target.id === 'media-submit') {

                const files = document.getElementById('media-files').files;
                const locationId = document.getElementById('media-location-id').value;

                if (files.length === 0) {
                    return showToast(t('Please select files to upload'), 'error');
                }

                for (const file of files) {
                    try {
                        const { signedUrl } = await apiRequest('/media/upload-url', 'POST', { 
                            filename: file.name, 
                            contentType: file.type, 
                            locationId: locationId 
                        });

                        await fetch(signedUrl, { method: 'PUT', body: file });
                        showToast(`${DOMPurify.sanitize(file.name)} ${t('uploaded for review.')}`, 'success');
                    } catch (error) {
                        console.error(`Upload failed for ${file.name}`, error);
                        showToast(`Failed to upload ${DOMPurify.sanitize(file.name)}`, 'error');
                    }
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

                } catch (e) {

                    target.value = oldRole; // Reset on error

                    showToast('Failed to update role.', 'error');

                }

            } else if (target.matches('.admin-submission-approve')) {
                const subId = target.dataset.id;
                if (!confirm('Are you sure you want to approve this submission?')) {
                    return;
                }
                
                try {
                    await apiRequest(`/admin/submissions/${subId}/approve`, 'POST');
                    showToast('Submission approved.', 'success');
                    showAdminPanel(); // Refresh the admin panel
                } catch (e) {
                    showToast('Failed to approve submission.', 'error');
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
    // De-activate all admin tabs and content first
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));

    // Activate the clicked tab
    target.classList.add('active');

    // Activate the corresponding content pane
    const tabContentId = `admin-tab-${target.dataset.tab}`;
    const tabContentElement = document.getElementById(tabContentId);
    if (tabContentElement) {
        tabContentElement.classList.add('active');
    }
} else if (target.matches('.info-tab')) {
                // Keep the existing info tab handler separate
                document.querySelectorAll('.info-tab, .info-tab-content').forEach(el => el.classList.remove('active'));
                target.classList.add('active');
                const tabContentId = `info-tab-${target.dataset.tab}`;
                const tabContentElement = document.getElementById(tabContentId);
                if (tabContentElement) tabContentElement.classList.add('active');
            } else if (target.matches('[data-action="add-here"]')) {

                if (!currentUser) return showToast(t('error_please_login'), 'error');

                map.closePopup();

                if (temporaryMarker) map.removeLayer(temporaryMarker);

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



        } catch (e) {

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
            try {
                const data = JSON.parse(sub.data || '{}');
                return `
            <li data-type="${sub.submission_type}" data-status="${sub.status}">
                <span>${DOMPurify.sanitize(sub.submission_type.toUpperCase())}: ${DOMPurify.sanitize(data.name || '')}</span>
                <span>By: ${DOMPurify.sanitize(sub.submitter_username)}</span>
                <div class="actions">
                    <button class="btn btn-success btn-sm admin-submission-approve" data-id="${sub.id}">✓</button>
                    <button class="btn btn-danger btn-sm admin-submission-reject" data-id="${sub.id}">✗</button>
                </div>
            </li>`;
            } catch (err) {
                console.error('Error rendering submission:', err);
                return '';
            }
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

            // Fix the submission filter structure
            const filteredSubmissions = submissions.filter(sub => {
                try {
                    if (!sub) return false;

                    // Parse the data safely
                    const data = sub.data ? JSON.parse(sub.data) : {};

                    // Safely access properties with optional chaining
                    const typeMatch = sub.submission_type?.toLowerCase?.()?.includes(query) || false;
                    const nameMatch = data?.name?.toLowerCase?.()?.includes(query) || false;

                    return typeMatch || nameMatch;
                } catch (err) {
                    console.error('Error filtering submission:', err);
                    return false;
                }
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
        // Add logo with proper sizing using CSS clamp
        const navBrandContainer = document.querySelector('.nav-brand-container');
        if (navBrandContainer) {
            const logoImg = document.createElement('img');
            logoImg.src = 'oddyseus2.png';
            logoImg.alt = 'O.D.D. Map Logo';
            logoImg.id = 'nav-logo';
            
            const textGroup = navBrandContainer.querySelector('.nav-brand-text-group');
            if (textGroup) {
                navBrandContainer.insertBefore(logoImg, textGroup);
            } else {
                navBrandContainer.prepend(logoImg);
            }
        }

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
                })
                .catch(error => {
                    console.error('Logout failed:', error);
                    showToast(t('logout_error'), 'error');
                });
        });

        document.getElementById('nav-add-destination').addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (!currentUser) return showToast(t('error_please_login'), 'error');
            modalManager.show('add-destination', (modal) => {
                const center = map.getCenter(); 
                modal.querySelector('#loc-lat').value = center.lat; 
                modal.querySelector('#loc-lng').value = center.lng; 
            });
        });

        document.getElementById('nav-my-favorites').addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (!currentUser) return showToast(t('error_please_login'), 'error');
            favoritesViewActive = true; 
            loadDestinations(); 
        });

        document.getElementById('nav-info-btn').addEventListener('click', (e) => { e.preventDefault(); modalManager.show('info'); });
    };

    const init = async () => {
        await checkLoginState();
        createModals();
        updateUIForLanguage();
        setupAppEventListeners(); // ← ADD THIS LINE - it's missing!
        initMap();
    };

    init();

    // Add this function after your other function definitions
    async function loadPOILayer(query, layerGroup, icon) {
        // Prevent re-fetching if data is already loaded
        if (layerGroup.getLayers().length > 0) {
            return;
        }

        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const bbox = map.getBounds();
        const south = bbox.getSouth();
        const west = bbox.getWest();
        const north = bbox.getNorth();
        const east = bbox.getEast();
        
        const overpassQuery = `
        [out:json][timeout:25];
        (
          ${query}(${south},${west},${north},${east});
        );
        out geom;
    `;
    
        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: overpassQuery
            });
            const data = await response.json();
            
            layerGroup.clearLayers();
            
            data.elements.forEach(element => {
                if (element.lat && element.lon) {
                    const marker = L.marker([element.lat, element.lon], {
                        icon: L.divIcon({
                            html: icon,
                            className: 'poi-icon',
                            iconSize: [20, 20]
                        })
                    });
                    
                    const name = element.tags.name || 'Unknown';
                    marker.bindPopup(`<b>${DOMPurify.sanitize(name)}</b>`);
                    layerGroup.addLayer(marker);
                }
            });
        } catch (error) {
            console.error('Error loading POI data:', error);
            showToast('Could not load POI data.', 'error');
        }
    }
}); // End of main DOMContentLoaded listener