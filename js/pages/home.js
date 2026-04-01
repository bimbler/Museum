/**
 * Home Page - Crow Museum of Asian Art
 * Ink/gold branded hero with rotating exhibition quote and timeline
 */

import { getARCount, collection, exhibitions } from '../data/collection.js';

export default class HomePage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
    this.quoteIndex = 0;
    this.quoteInterval = null;
  }

  render() {
    const arCount = getARCount();

    const quotes = collection
      .filter(obj => obj.longDescription)
      .map(obj => ({
        text: obj.description.length > 140 ? obj.description.substring(0, 140) + '...' : obj.description,
        source: obj.title
      }));

    const timelineCards = exhibitions.map(ex => `
      <div class="exhibition-card">
        <div class="exhibition-thumb" style="background-image: url('${ex.thumb}');"></div>
        <h3>${ex.title}</h3>
        <span class="exhibition-dates">${ex.dates}</span>
        <span class="exhibition-location">${ex.location}</span>
      </div>
    `).join('');

    return `
      <div class="home-page">
        <div class="home-hero">
          <!-- Brand Panel (40%) -->
          <div class="brand-panel">
            <div class="museum-logo">
              <svg width="80" height="80" viewBox="0 0 60 60" fill="none">
                <rect x="5" y="15" width="50" height="35" stroke="white" stroke-width="2" fill="none"/>
                <rect x="10" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="22" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="34" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="46" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <polygon points="30,5 5,15 55,15" fill="white"/>
                <rect x="0" y="50" width="60" height="3" fill="white"/>
              </svg>
            </div>

            <h1 class="museum-title">Crow Museum of Asian Art</h1>
            <hr class="title-rule" />
            <p class="museum-subtitle">The University of Texas at Dallas</p>

            <nav class="home-nav">
              <button class="home-btn home-btn-primary" data-route="/collection" aria-label="Explore art collection">
                <span class="btn-icon">🎨</span>
                <div class="btn-content">
                  <span class="btn-text">Explore Collection</span>
                  <span class="btn-subtitle">View ${arCount} AR experience${arCount !== 1 ? 's' : ''}</span>
                </div>
              </button>

              <button class="home-btn home-btn-outline" data-route="/map" aria-label="View museum map">
                <span class="btn-icon">🗺️</span>
                <div class="btn-content">
                  <span class="btn-text">View Museum Map</span>
                  <span class="btn-subtitle">Navigate the galleries</span>
                </div>
              </button>
            </nav>

            <div class="home-badge">
              <span class="badge-pulse"></span>
              <span class="badge-text">${arCount} AR Experience${arCount !== 1 ? 's' : ''} Available</span>
            </div>

            <!-- Rotating Exhibition Quote -->
            ${quotes.length > 0 ? `
              <div class="quote-rotator" id="quote-rotator">
                ${quotes.map((q, i) => `
                  <blockquote class="rotating-quote${i === 0 ? ' active' : ''}" data-index="${i}">
                    <p>"${q.text}"</p>
                    <cite>— ${q.source}</cite>
                  </blockquote>
                `).join('')}
              </div>
            ` : ''}

            <footer class="home-footer">
              <p>Point your camera at exhibit markers to view artifacts in 3D</p>
            </footer>
          </div>

          <!-- Hero Image Section (60%) -->
          <div class="hero-image"></div>
        </div>

        <!-- Exhibition Timeline -->
        ${exhibitions.length > 0 ? `
          <section class="exhibition-section">
            <h2 class="exhibition-heading">Current & Upcoming Exhibitions</h2>
            <div class="exhibition-timeline">
              ${timelineCards}
            </div>
          </section>
        ` : ''}
      </div>
    `;
  }

  mount() {
    const buttons = document.querySelectorAll('[data-route]');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          this.router.navigate(route);
        }
      });
    });

    this.startQuoteRotation();
  }

  startQuoteRotation() {
    const quotes = document.querySelectorAll('.rotating-quote');
    if (quotes.length <= 1) return;

    this.quoteInterval = setInterval(() => {
      quotes[this.quoteIndex].classList.remove('active');
      this.quoteIndex = (this.quoteIndex + 1) % quotes.length;
      quotes[this.quoteIndex].classList.add('active');
    }, 6000);
  }

  cleanup() {
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    }
    return Promise.resolve();
  }
}
