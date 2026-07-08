// Aegis FIFA 2026 - Stadium Map Renderer & Controller

export const sectorsData = {
  'sector-north': {
    id: 'sector-north',
    name: 'North Stand (General Admission)',
    capacity: 65,
    risk: 'low',
    waitRestroom: 8,
    waitConcessions: 12,
    gates: 'Gates A & B',
    description: 'Active fan zone. Fluid crowd movements, low queue times.',
    coordinates: 'M 175,80 C 230,50 270,50 325,80 L 310,120 C 275,100 225,100 190,120 Z'
  },
  'sector-south': {
    id: 'sector-south',
    name: 'South Stand (Active Supporters)',
    capacity: 92,
    risk: 'high',
    waitRestroom: 25,
    waitConcessions: 30,
    gates: 'Gates D & E',
    description: 'High density supporters area. Extreme restroom queues. AI recommends dispatching safety stewards.',
    coordinates: 'M 175,320 C 230,350 270,350 325,320 L 310,280 C 275,300 225,300 190,280 Z'
  },
  'sector-east': {
    id: 'sector-east',
    name: 'East Grandstand (Family Section)',
    capacity: 78,
    risk: 'medium',
    waitRestroom: 15,
    waitConcessions: 18,
    gates: 'Gate C',
    description: 'Moderate congestion. Concession queues are steady. Family-friendly zone.',
    coordinates: 'M 325,80 C 375,120 375,280 325,320 L 290,280 C 320,250 320,150 290,120 Z'
  },
  'sector-west': {
    id: 'sector-west',
    name: 'West Grandstand (Media & Press)',
    capacity: 55,
    risk: 'low',
    waitRestroom: 5,
    waitConcessions: 8,
    gates: 'Gate F',
    description: 'Quiet sector. Low congestion, immediate services available.',
    coordinates: 'M 175,80 C 125,120 125,280 175,320 L 210,280 C 180,250 180,150 210,120 Z'
  },
  'sector-vip': {
    id: 'sector-vip',
    name: 'VIP Hospitality Suites',
    capacity: 40,
    risk: 'low',
    waitRestroom: 2,
    waitConcessions: 4,
    gates: 'VIP Entrance',
    description: 'High-end suites. Clean transit, zero wait times.',
    coordinates: 'M 215,140 L 285,140 L 285,260 L 215,260 Z'
  }
};

export function renderStadiumMap(containerId, onSelectSector) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Generate high-quality MetLife Stadium SVG
  const svgHTML = `
    <svg viewBox="0 0 500 400" class="stadium-svg" role="img" aria-label="Interactive Stadium Map">
      <defs>
        <!-- Pitch Gradient -->
        <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(145, 75%, 25%)" />
          <stop offset="100%" stop-color="hsl(145, 80%, 15%)" />
        </linearGradient>
        <!-- Outer Shadow -->
        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      
      <!-- Outer Stadium Bowl Ring -->
      <ellipse cx="250" cy="200" rx="200" ry="160" class="stadium-outer-ring" filter="url(#glow)"/>
      <ellipse cx="250" cy="200" rx="190" ry="150" class="stadium-inner-ring"/>
      
      <!-- Sectors -->
      ${Object.keys(sectorsData).map(key => {
        const sector = sectorsData[key];
        return `
          <path 
            id="${sector.id}"
            class="stadium-sector ${sector.risk}"
            d="${sector.coordinates}"
            tabindex="0"
            role="button"
            aria-label="${sector.name}, Capacity: ${sector.capacity} percent, Risk: ${sector.risk}"
            aria-pressed="false"
          />
        `;
      }).join('')}
      
      <!-- Inside Stadium Oval Border -->
      <ellipse cx="250" cy="200" rx="80" ry="55" class="pitch-oval-border"/>
      
      <!-- Football Pitch (Center Stage) -->
      <rect x="195" y="160" width="110" height="80" rx="4" class="stadium-pitch" />
      <!-- Pitch Lines -->
      <line x1="250" y1="160" x2="250" y2="240" class="pitch-line" />
      <circle cx="250" cy="200" r="18" class="pitch-circle" />
      <rect x="195" y="180" width="15" height="40" class="pitch-box" />
      <rect x="290" y="180" width="15" height="40" class="pitch-box" />
      
      <!-- Outer Entry Gates Markers -->
      <!-- Gate A (Top Left) -->
      <circle cx="120" cy="90" r="8" class="gate-marker" />
      <text x="120" y="93" class="gate-text">A</text>
      
      <!-- Gate B (Top Right) -->
      <circle cx="380" cy="90" r="8" class="gate-marker" />
      <text x="380" y="93" class="gate-text">B</text>
      
      <!-- Gate C (Right) -->
      <circle cx="430" cy="200" r="8" class="gate-marker" />
      <text x="430" y="203" class="gate-text">C</text>
      
      <!-- Gate D (Bottom Right) -->
      <circle cx="380" cy="310" r="8" class="gate-marker" />
      <text x="380" y="313" class="gate-text">D</text>
      
      <!-- Gate E (Bottom Left) -->
      <circle cx="120" cy="310" r="8" class="gate-marker" />
      <text x="120" y="313" class="gate-text">E</text>
      
      <!-- Gate F (Left) -->
      <circle cx="70" cy="200" r="8" class="gate-marker" />
      <text x="70" y="203" class="gate-text">F</text>
      
    </svg>
  `;

  container.innerHTML = svgHTML;

  // Event binding for interactive path clicks
  const sectors = container.querySelectorAll('.stadium-sector');
  sectors.forEach(sectorEl => {
    // Click Event
    sectorEl.addEventListener('click', () => {
      selectSector(container, sectorEl.id, onSelectSector);
    });

    // Keyboard Access (Enter / Space)
    sectorEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSector(container, sectorEl.id, onSelectSector);
      }
    });
  });
}

function selectSector(container, sectorId, onSelectSector) {
  // Clear previous selection
  container.querySelectorAll('.stadium-sector').forEach(s => {
    s.classList.remove('selected');
    s.setAttribute('aria-pressed', 'false');
  });

  // Select new sector
  const activeSector = container.querySelector(`#${sectorId}`);
  if (activeSector) {
    activeSector.classList.add('selected');
    activeSector.setAttribute('aria-pressed', 'true');
  }

  // Callback to app.js
  if (onSelectSector && sectorsData[sectorId]) {
    onSelectSector(sectorsData[sectorId]);
  }
}

export function updateSectorState(sectorId, updates) {
  if (sectorsData[sectorId]) {
    Object.assign(sectorsData[sectorId], updates);
    const sectorEl = document.getElementById(sectorId);
    if (sectorEl) {
      // Update color class
      sectorEl.className = `stadium-sector ${sectorsData[sectorId].risk} ${sectorEl.classList.contains('selected') ? 'selected' : ''}`;
      // Update screen reader text
      sectorEl.setAttribute('aria-label', `${sectorsData[sectorId].name}, Capacity: ${sectorsData[sectorId].capacity} percent, Risk: ${sectorsData[sectorId].risk}`);
    }
  }
}
