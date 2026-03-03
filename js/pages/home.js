/**
 * Home Page - Gamified Museum Entry
 * Lightweight, no 3D, CSS animations only
 */

import { getARCount } from '../data/collection.js';

export default class HomePage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
  }

  render() {
    const arCount = getARCount();
    
    return `
      <div class="home-page">
        <div class="home-background"></div>
        
        <div class="home-content">
          <header class="home-header">
            <div class="museum-logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect x="5" y="15" width="50" height="35" stroke="white" stroke-width="2" fill="none"/>
                <rect x="10" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="22" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="34" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <rect x="46" y="20" width="8" height="25" fill="white" opacity="0.8"/>
                <polygon points="30,5 5,15 55,15" fill="white"/>
                <rect x="0" y="50" width="60" height="3" fill="white"/>
              </svg>
            </div>
            <h1 class="museum-title">Museum AR</h1>
            <p class="museum-subtitle">Discover History Through Technology</p>
          </header>

          <nav class="home-nav">
            <button class="home-btn primary" data-route="/collection">
              <span class="btn-icon">🎨</span>
              <span class="btn-text">Explore Art Collection</span>
              <span class="btn-subtitle">${arCount} AR Experience${arCount !== 1 ? 's' : ''} Available</span>
            </button>

            <button class="home-btn secondary" data-route="/map">
              <span class="btn-icon">🗺️</span>
              <span class="btn-text">View Museum Map</span>
              <span class="btn-subtitle">Navigate the Galleries</span>
            </button>
          </nav>

          <div class="home-badge">
            <span class="badge-pulse"></span>
            <span class="badge-text">✨ ${arCount} AR Experience${arCount !== 1 ? 's' : ''} Available</span>
          </div>

          <footer class="home-footer">
            <p>Point your camera at exhibit markers to view artifacts in 3D</p>
          </footer>
        </div>
      </div>
    `;
  }

  mount() {
    // Add event listeners for navigation buttons
    const buttons = document.querySelectorAll('[data-route]');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        if (route) {
          this.router.navigate(route);
        }
      });
    });

    // Add fade-in animation
    setTimeout(() => {
      document.querySelector('.home-content')?.classList.add('fade-in');
    }, 100);
  }

  cleanup() {
    // No resources to cleanup (no WebGL, no streams)
    return Promise.resolve();
  }
}
