/**
 * Collection Page - Art Object List
 * Displays all museum objects as scrollable cards
 */

import { collection } from '../data/collection.js';

export default class CollectionPage {
  constructor(router, params) {
    this.router = router;
    this.params = params;
  }

  render() {
    const objectCards = collection.map(obj => this.renderCard(obj)).join('');
    const arCount = collection.filter(obj => obj.hasAR).length;
    
    return `
      <div class="collection-page">
        <header class="collection-header">
          <button class="back-btn" data-action="back" aria-label="Back to home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>Art Collection</h1>
          <div class="header-spacer"></div>
        </header>

        <div class="collection-content">
          <!-- Breadcrumb Navigation -->
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="#/" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">Collection</span>
          </nav>
          
          <p class="collection-intro">
            Explore our curated selection of historical artifacts from ancient civilizations.
            Objects marked with ✨ feature immersive AR experiences.
          </p>
          
          <!-- Progress Indicator -->
          <div class="collection-stats">
            <span class="stat-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/>
              </svg>
              ${arCount} AR experiences available
            </span>
          </div>
          
          <div class="collection-grid">
            ${objectCards}
          </div>
        </div>
      </div>
    `;
  }

  renderCard(obj) {
    const featuredClass = obj.hasAR ? ' featured' : '';
    const originText = [obj.origin, obj.period].filter(Boolean).join(' \u00B7 ');

    return `
      <article class="object-card${featuredClass}" data-id="${obj.id}">
        <div class="card-image">
          <img src="${obj.thumbnail}" alt="${obj.title}" loading="lazy" />
          ${obj.hasAR ? '<span class="ar-badge">✨ AR</span>' : ''}
          <div class="tile-overlay">
            <span class="tile-title">${obj.title}</span>
            <span class="tile-origin">${originText}</span>
          </div>
        </div>
        <div class="card-content">
          <h2 class="card-title">${obj.title}</h2>
          <p class="card-period">${obj.period}</p>
          <span class="card-origin">${originText}</span>
          <p class="card-description">${obj.description}</p>
          <button class="card-btn" data-id="${obj.id}">
            View Details
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </button>
        </div>
      </article>
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

    // Card button handlers
    const cardButtons = document.querySelectorAll('.card-btn');
    cardButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id) {
          this.router.navigate(`/object/${id}`);
        }
      });
    });

    // Add staggered fade-in animation
    const cards = document.querySelectorAll('.object-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('fade-in');
      }, index * 100);
    });
  }

  cleanup() {
    // No resources to cleanup
    return Promise.resolve();
  }
}
