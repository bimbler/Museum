/**
 * Museum Map Page
 * Interactive SVG floor plan with tappable zones
 */

export default class MapPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
  }

  render() {
    return `
      <div class="map-page">
        <header class="map-header">
          <button class="back-btn" data-action="back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>Museum Map</h1>
          <div class="header-spacer"></div>
        </header>

        <div class="map-content">
          <p class="map-intro">Tap on any gallery to learn more about the exhibits within.</p>
          
          <div class="map-container">
            <svg viewBox="0 0 800 600" class="museum-map">
              <!-- Main building outline -->
              <rect x="50" y="50" width="700" height="500" 
                    fill="rgba(255,255,255,0.05)" 
                    stroke="rgba(255,255,255,0.3)" 
                    stroke-width="3"/>
              
              <!-- Entrance -->
              <rect x="350" y="520" width="100" height="30" 
                    fill="rgba(100,200,100,0.3)" 
                    stroke="rgba(100,200,100,0.8)" 
                    stroke-width="2"/>
              <text x="400" y="540" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                ENTRANCE
              </text>
              
              <!-- Gallery 1: Ancient Asia -->
              <g class="map-zone" data-zone="asia" style="cursor: pointer;">
                <rect x="70" y="70" width="300" height="200" 
                      fill="rgba(139,105,20,0.2)" 
                      stroke="rgba(139,105,20,0.8)" 
                      stroke-width="2"
                      class="zone-rect"/>
                <text x="220" y="160" text-anchor="middle" fill="white" font-size="18" font-weight="bold">
                  Ancient Asia
                </text>
                <text x="220" y="185" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14">
                  Buddha • Ceramics • Textiles
                </text>
              </g>
              
              <!-- Gallery 2: Classical Europe -->
              <g class="map-zone" data-zone="europe" style="cursor: pointer;">
                <rect x="430" y="70" width="300" height="200" 
                      fill="rgba(26,77,139,0.2)" 
                      stroke="rgba(26,77,139,0.8)" 
                      stroke-width="2"
                      class="zone-rect"/>
                <text x="580" y="160" text-anchor="middle" fill="white" font-size="18" font-weight="bold">
                  Classical Europe
                </text>
                <text x="580" y="185" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14">
                  Marble Sculptures • Pottery
                </text>
              </g>
              
              <!-- Gallery 3: Byzantine Treasury -->
              <g class="map-zone" data-zone="byzantine" style="cursor: pointer;">
                <rect x="70" y="320" width="300" height="200" 
                      fill="rgba(255,215,0,0.2)" 
                      stroke="rgba(255,215,0,0.8)" 
                      stroke-width="2"
                      class="zone-rect"/>
                <text x="220" y="410" text-anchor="middle" fill="white" font-size="18" font-weight="bold">
                  Byzantine Treasury
                </text>
                <text x="220" y="435" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14">
                  Gold • Gems • Icons
                </text>
              </g>
              
              <!-- Gallery 4: Temporary Exhibitions -->
              <g class="map-zone" data-zone="temporary" style="cursor: pointer;">
                <rect x="430" y="320" width="300" height="200" 
                      fill="rgba(150,150,150,0.2)" 
                      stroke="rgba(150,150,150,0.8)" 
                      stroke-width="2"
                      class="zone-rect"/>
                <text x="580" y="410" text-anchor="middle" fill="white" font-size="18" font-weight="bold">
                  Temporary Exhibitions
                </text>
                <text x="580" y="435" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14">
                  Rotating Collections
                </text>
              </g>
              
              <!-- Central Atrium -->
              <circle cx="400" cy="300" r="50" 
                      fill="rgba(100,150,200,0.2)" 
                      stroke="rgba(100,150,200,0.8)" 
                      stroke-width="2"/>
              <text x="400" y="305" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                Atrium
              </text>
            </svg>
          </div>

          <div class="map-legend">
            <h3>Legend</h3>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-color" style="background: rgba(139,105,20,0.5);"></span>
                <span>Ancient Asia Gallery</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: rgba(26,77,139,0.5);"></span>
                <span>Classical Europe Gallery</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: rgba(255,215,0,0.5);"></span>
                <span>Byzantine Treasury</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: rgba(150,150,150,0.5);"></span>
                <span>Temporary Exhibitions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    // Back button handler
    const backBtn = document.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.router.navigate('/');
      });
    }

    // Zone click handlers
    const zones = document.querySelectorAll('.map-zone');
    zones.forEach(zone => {
      // Add hover effect
      const rect = zone.querySelector('.zone-rect');
      
      zone.addEventListener('mouseenter', () => {
        rect.style.opacity = '0.8';
      });
      
      zone.addEventListener('mouseleave', () => {
        rect.style.opacity = '1';
      });
      
      // Click handler
      zone.addEventListener('click', (e) => {
        const zoneName = e.currentTarget.getAttribute('data-zone');
        this.handleZoneClick(zoneName);
      });
    });
  }

  handleZoneClick(zoneName) {
    const zoneInfo = {
      asia: {
        title: 'Ancient Asia Gallery',
        description: 'Explore artifacts from China, Japan, Cambodia, and India spanning over 2000 years of history. Features our Buddha Statue with AR capability.'
      },
      europe: {
        title: 'Classical Europe Gallery',
        description: 'Roman and Greek sculptures, pottery, and everyday objects from the height of classical civilization.'
      },
      byzantine: {
        title: 'Byzantine Treasury',
        description: 'Golden reliquaries, jewelry, and religious icons from the Byzantine Empire, showcasing their masterful metalwork.'
      },
      temporary: {
        title: 'Temporary Exhibitions',
        description: 'Currently closed for installation. Check back soon for our next exhibition.'
      }
    };

    const info = zoneInfo[zoneName];
    if (info) {
      // Show modal with zone information
      const modal = document.createElement('div');
      modal.className = 'zone-modal';
      modal.innerHTML = `
        <div class="zone-modal-content">
          <button class="zone-modal-close">&times;</button>
          <h2>${info.title}</h2>
          <p>${info.description}</p>
          <button class="zone-modal-btn" data-action="view-collection">View Collection</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button
      modal.querySelector('.zone-modal-close').addEventListener('click', () => {
        modal.remove();
      });
      
      // View collection button
      modal.querySelector('[data-action="view-collection"]').addEventListener('click', () => {
        modal.remove();
        this.router.navigate('/collection');
      });
      
      // Click outside to close
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
      // Animate in
      setTimeout(() => modal.classList.add('visible'), 10);
    }
  }

  cleanup() {
    // Remove any open modals
    const modals = document.querySelectorAll('.zone-modal');
    modals.forEach(modal => modal.remove());
    return Promise.resolve();
  }
}
