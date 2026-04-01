/**
 * Museum Map Page
 * Crow-inspired gallery map with region color-coding and collection links
 * Desktop: sidebar; Mobile: bottom sheet
 */

import { getObjectsByGallery } from '../data/collection.js';

const GALLERY_DATA = {
  g1:  { id: 'G1',  name: 'Gallery 1',  wing: 'Crow / Bar Junction', pos: 'Between wings, top', region: 'mixed' },
  g2:  { id: 'G2',  name: 'Gallery 2',  wing: 'Crow Galleries', pos: 'Top row, right', region: 'china' },
  g3:  { id: 'G3',  name: 'Gallery 3',  wing: 'Crow Galleries', pos: 'Top row, centre-right', region: 'china' },
  g4:  { id: 'G4',  name: 'Gallery 4',  wing: 'Crow Galleries', pos: 'Top row, centre-left', region: 'india' },
  g5:  { id: 'G5',  name: 'Gallery 5',  wing: 'Crow Galleries', pos: 'Top row, far left', region: 'japan' },
  g6:  { id: 'G6',  name: 'Gallery 6',  wing: 'Crow Galleries', pos: 'Lower left', region: 'japan' },
  g7:  { id: 'G7',  name: 'Gallery 7',  wing: 'Crow Galleries', pos: 'Lower centre-right', region: 'china' },
  g8:  { id: 'G8',  name: 'Gallery 8',  wing: 'Bar Galleries',  pos: 'Top', region: 'mixed' },
  g9:  { id: 'G9',  name: 'Gallery 9',  wing: 'Bar Galleries',  pos: 'Upper mid', region: 'mixed' },
  g10: { id: 'G10', name: 'Gallery 10', wing: 'Bar Galleries',  pos: 'Lower mid', region: 'india' },
  g11: { id: 'G11', name: 'Gallery 11', wing: 'Bar Galleries',  pos: 'Bottom', region: 'india' },
};

const REGION_LABELS = {
  japan: 'Japan',
  china: 'China / Jade',
  india: 'India / SE Asia',
  mixed: 'Mixed'
};

const SB_EMPTY_HTML = `
  <div class="sb-empty">
    <span class="orn">✦</span>
    <p>Select a gallery to view details.</p>
  </div>
`;

function buildSidebarContent(g) {
  const objects = getObjectsByGallery(g.id.toLowerCase());
  const regionLabel = REGION_LABELS[g.region] || g.region;

  const objectListHTML = objects.length > 0
    ? `<hr class="sb-div"/>
       <div class="sb-row">
         <span class="sb-lbl">Objects in Gallery</span>
         ${objects.map(obj => `
           <a href="#/object/${obj.id}" class="sb-object-link">
             <span class="sb-object-title">${obj.title}</span>
             <span class="sb-object-period">${obj.period}</span>
           </a>
         `).join('')}
       </div>`
    : '';

  return `
    <div class="sb-hd">
      <span class="sb-num">${g.wing} · Level 2</span>
      <div class="sb-name">${g.name}</div>
    </div>
    <div class="sb-body">
      <div class="sb-row">
        <span class="sb-lbl">Gallery ID</span>
        <span class="sb-val">${g.id}</span>
      </div>
      <hr class="sb-div"/>
      <div class="sb-row">
        <span class="sb-lbl">Location</span>
        <span class="sb-val">${g.pos}</span>
      </div>
      <hr class="sb-div"/>
      <div class="sb-row">
        <span class="sb-lbl">Region</span>
        <span class="sb-val">${regionLabel}</span>
      </div>
      <div>
        <span class="sb-tag">${g.wing}</span>
        <span class="sb-tag sb-tag-${g.region}">${regionLabel}</span>
      </div>
      ${objectListHTML}
    </div>`;
}

export default class MapPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.currentGalleryId = null;
    this.sheetState = 'closed';
  }

  render() {
    return `
      <div class="map-page map-page-gallery">
        <header class="map-header">
          <button class="back-btn" data-action="back" aria-label="Back to home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>Museum Map</h1>
          <div class="header-spacer"></div>
        </header>

        <div class="map-shell">
          <div class="map-gallery-header">
            <h2 class="map-gallery-title">Gallery Map — Level 2</h2>
            <p class="map-gallery-subtitle">Crow Galleries · Bar Galleries</p>
          </div>

          <div class="map-layout">
            <div class="map-area">
              <svg class="fp" viewBox="0 0 740 580" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="740" height="580" fill="#100c04"/>
                <rect x="12" y="12" width="428" height="556" rx="2" fill="#120d04" stroke="#2a1507" stroke-width="1"/>
                <text class="sec-lbl" x="226" y="25" text-anchor="middle">Crow Galleries</text>

                <g class="groom japan" id="g5" data-gallery="g5" role="button" tabindex="0" aria-label="Gallery 5 - Japan">
                  <rect x="18" y="30" width="96" height="140" rx="1"/>
                  <text class="glabel" x="66" y="94" text-anchor="middle" dominant-baseline="central">G5</text>
                  <text class="gsub" x="66" y="112" text-anchor="middle">Gallery 5</text>
                </g>
                <g class="groom india" id="g4" data-gallery="g4" role="button" tabindex="0" aria-label="Gallery 4 - India">
                  <rect x="118" y="30" width="96" height="140" rx="1"/>
                  <text class="glabel" x="166" y="94" text-anchor="middle" dominant-baseline="central">G4</text>
                  <text class="gsub" x="166" y="112" text-anchor="middle">Gallery 4</text>
                </g>
                <g class="groom china" id="g3" data-gallery="g3" role="button" tabindex="0" aria-label="Gallery 3 - China">
                  <rect x="218" y="30" width="108" height="140" rx="1"/>
                  <text class="glabel" x="272" y="94" text-anchor="middle" dominant-baseline="central">G3</text>
                  <text class="gsub" x="272" y="112" text-anchor="middle">Gallery 3</text>
                </g>
                <g class="groom china" id="g2" data-gallery="g2" role="button" tabindex="0" aria-label="Gallery 2 - China">
                  <rect x="330" y="30" width="104" height="140" rx="1"/>
                  <text class="glabel" x="382" y="94" text-anchor="middle" dominant-baseline="central">G2</text>
                  <text class="gsub" x="382" y="112" text-anchor="middle">Gallery 2</text>
                </g>
                <g class="groom japan" id="g6" data-gallery="g6" role="button" tabindex="0" aria-label="Gallery 6 - Japan">
                  <rect x="18" y="178" width="210" height="212" rx="1"/>
                  <text class="glabel" x="123" y="278" text-anchor="middle" dominant-baseline="central">G6</text>
                  <text class="gsub" x="123" y="296" text-anchor="middle">Gallery 6</text>
                </g>
                <g class="groom china" id="g7" data-gallery="g7" role="button" tabindex="0" aria-label="Gallery 7 - China">
                  <rect x="232" y="178" width="202" height="212" rx="1"/>
                  <text class="glabel" x="333" y="278" text-anchor="middle" dominant-baseline="central">G7</text>
                  <text class="gsub" x="333" y="296" text-anchor="middle">Gallery 7</text>
                </g>
                <g class="dummy">
                  <rect x="18" y="398" width="210" height="160" rx="1"/>
                </g>
                <g class="dummy">
                  <rect x="232" y="398" width="202" height="160" rx="1"/>
                </g>
                <g class="groom" id="g1" data-gallery="g1" role="button" tabindex="0" aria-label="Gallery 1">
                  <rect x="448" y="30" width="82" height="140" rx="1"/>
                  <text class="glabel" x="489" y="94" text-anchor="middle" dominant-baseline="central">G1</text>
                  <text class="gsub" x="489" y="112" text-anchor="middle">Gallery 1</text>
                </g>
                <rect x="538" y="12" width="192" height="556" rx="2" fill="#120d04" stroke="#2a1507" stroke-width="1"/>
                <text class="sec-lbl" x="634" y="25" text-anchor="middle">Bar Galleries</text>
                <g class="groom" id="g8" data-gallery="g8" role="button" tabindex="0" aria-label="Gallery 8">
                  <rect x="544" y="30" width="180" height="124" rx="1"/>
                  <text class="glabel" x="634" y="85" text-anchor="middle" dominant-baseline="central">G8</text>
                  <text class="gsub" x="634" y="103" text-anchor="middle">Gallery 8</text>
                </g>
                <g class="groom" id="g9" data-gallery="g9" role="button" tabindex="0" aria-label="Gallery 9">
                  <rect x="544" y="162" width="180" height="124" rx="1"/>
                  <text class="glabel" x="634" y="217" text-anchor="middle" dominant-baseline="central">G9</text>
                  <text class="gsub" x="634" y="235" text-anchor="middle">Gallery 9</text>
                </g>
                <g class="groom india" id="g10" data-gallery="g10" role="button" tabindex="0" aria-label="Gallery 10 - India">
                  <rect x="544" y="294" width="180" height="124" rx="1"/>
                  <text class="glabel" x="634" y="349" text-anchor="middle" dominant-baseline="central">G10</text>
                  <text class="gsub" x="634" y="367" text-anchor="middle">Gallery 10</text>
                </g>
                <g class="groom india" id="g11" data-gallery="g11" role="button" tabindex="0" aria-label="Gallery 11 - India">
                  <rect x="544" y="426" width="180" height="124" rx="1"/>
                  <text class="glabel" x="634" y="481" text-anchor="middle" dominant-baseline="central">G11</text>
                  <text class="gsub" x="634" y="499" text-anchor="middle">Gallery 11</text>
                </g>
                <text x="732" y="576" text-anchor="end" style="font-size:9px;fill:#3a2a0e;font-family:'EB Garamond',serif;letter-spacing:0.06em;">N ↑</text>
              </svg>

              <!-- Region Legend -->
              <div class="map-legend">
                <span class="legend-item legend-japan"><span class="legend-swatch"></span>Japan</span>
                <span class="legend-item legend-china"><span class="legend-swatch"></span>China / Jade</span>
                <span class="legend-item legend-india"><span class="legend-swatch"></span>India / SE Asia</span>
              </div>

              <p class="floor-note">Level 1 — administration, reading rooms &amp; visitor services only</p>
            </div>

            <div class="map-sidebar" id="map-sidebar">
              <div id="sb">${SB_EMPTY_HTML}</div>
            </div>
          </div>
        </div>

        <!-- Mobile bottom sheet (hidden on desktop) -->
        <div class="map-bottom-sheet" id="map-bottom-sheet" data-state="closed" aria-hidden="true">
          <div class="map-sheet-handle" data-action="toggle-sheet" aria-label="Toggle gallery details"></div>
          <div class="map-sheet-header" data-action="toggle-sheet">
            <span class="map-sheet-title" id="map-sheet-title">Select a gallery</span>
            <button class="map-sheet-close" data-action="close-sheet" aria-label="Close details">&times;</button>
          </div>
          <div class="map-sheet-body" id="map-sheet-body">
            <div class="map-sheet-empty" id="map-sheet-empty">
              <span class="orn">✦</span>
              <p>Select a gallery on the map to view details.</p>
            </div>
            <div class="map-sheet-content" id="map-sheet-content" style="display: none;"></div>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    const backBtn = document.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.router.navigate('/'));
    }

    const rooms = document.querySelectorAll('.groom[data-gallery]');
    rooms.forEach((room) => {
      const id = room.getAttribute('data-gallery');
      const handleSelect = () => this.selectGallery(id);
      room.addEventListener('click', handleSelect);
      room.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });
    });

    document.querySelectorAll('[data-action="toggle-sheet"]').forEach((el) => {
      el.addEventListener('click', () => this.toggleSheet());
    });
    const closeSheet = document.querySelector('[data-action="close-sheet"]');
    if (closeSheet) {
      closeSheet.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setSheetState('closed');
      });
    }
  }

  selectGallery(id) {
    const prev = this.currentGalleryId;
    this.currentGalleryId = id;

    if (prev) {
      const prevEl = document.getElementById(prev);
      if (prevEl) prevEl.classList.remove('sel');
    }
    const el = document.getElementById(id);
    if (el) el.classList.add('sel');

    const g = GALLERY_DATA[id];
    if (!g) return;

    const sb = document.getElementById('sb');
    if (sb) sb.innerHTML = buildSidebarContent(g);

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      this.updateBottomSheet(g);
      this.setSheetState('half');
    }
  }

  updateBottomSheet(g) {
    const titleEl = document.getElementById('map-sheet-title');
    const emptyEl = document.getElementById('map-sheet-empty');
    const contentEl = document.getElementById('map-sheet-content');
    const sheet = document.getElementById('map-bottom-sheet');

    if (titleEl) titleEl.textContent = g ? g.name : 'Select a gallery';
    if (sheet) sheet.setAttribute('aria-hidden', g ? 'false' : 'true');

    if (g) {
      if (emptyEl) emptyEl.style.display = 'none';
      if (contentEl) {
        contentEl.style.display = 'block';
        contentEl.innerHTML = buildSidebarContent(g);
      }
    } else {
      if (emptyEl) emptyEl.style.display = 'block';
      if (contentEl) {
        contentEl.style.display = 'none';
        contentEl.innerHTML = '';
      }
    }
  }

  setSheetState(state) {
    this.sheetState = state;
    const sheet = document.getElementById('map-bottom-sheet');
    if (sheet) sheet.setAttribute('data-state', state);
  }

  toggleSheet() {
    const sheet = document.getElementById('map-bottom-sheet');
    if (!sheet) return;

    const state = sheet.getAttribute('data-state');
    if (state === 'closed') {
      this.setSheetState('half');
    } else {
      this.setSheetState('closed');
    }
  }

  cleanup() {
    return Promise.resolve();
  }
}
