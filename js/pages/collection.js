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
    
    return `
      <div class="collection-page">
        <header class="collection-header">
          <button class="back-btn" data-action="back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>Art Collection</h1>
          <div class="header-spacer"></div>
        </header>

        <div class="collection-content">
          <p class="collection-intro">
            Explore our curated selection of historical artifacts from ancient civilizations.
            Objects marked with ✨ feature immersive AR experiences.
          </p>
          
          <div class="collection-grid">
            ${objectCards}
          </div>
        </div>
      </div>
    `;
  }

  renderCard(obj) {
    return `
      <article class="object-card" data-id="${obj.id}">
        <div class="card-image">
          <img src="${obj.thumbnail}" alt="${obj.title}" loading="lazy" />
          ${obj.hasAR ? '<span class="ar-badge">✨ AR</span>' : ''}
        </div>
        <div class="card-content">
          <h2 class="card-title">${obj.title}</h2>
          <p class="card-period">${obj.period}</p>
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
