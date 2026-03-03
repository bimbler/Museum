/**
 * Hash-based Router for SPA navigation
 * Supports dynamic route parameters and proper cleanup lifecycle
 */
export default class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = null;
    this.params = {};
    
    // Bind event handlers
    this.handleRoute = this.handleRoute.bind(this);
    
    // Listen for hash changes and initial load
    window.addEventListener('hashchange', this.handleRoute);
    window.addEventListener('load', this.handleRoute);
  }

  /**
   * Navigate to a new route programmatically
   * @param {string} path - The path to navigate to (without #)
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Parse route path and extract parameters
   * @param {string} pattern - Route pattern like '/object/:id'
   * @param {string} path - Actual path like '/object/buddha'
   * @returns {object|null} - Extracted params or null if no match
   */
  matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(p => p);
    const pathParts = path.split('/').filter(p => p);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // Dynamic segment
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        // Static segment doesn't match
        return null;
      }
    }

    return params;
  }

  /**
   * Find matching route and page class
   * @param {string} path - Current path
   * @returns {object} - { PageClass, params }
   */
  findRoute(path) {
    // Try exact match first
    if (this.routes[path]) {
      return { PageClass: this.routes[path], params: {} };
    }

    // Try pattern matching
    for (const [pattern, PageClass] of Object.entries(this.routes)) {
      if (pattern.includes(':')) {
        const params = this.matchRoute(pattern, path);
        if (params !== null) {
          return { PageClass, params };
        }
      }
    }

    // No match found
    return null;
  }

  /**
   * Handle route changes
   */
  async handleRoute() {
    // Get current hash without the #
    const hash = window.location.hash.slice(1) || '/';
    
    // Find matching route
    const match = this.findRoute(hash);
    
    if (!match) {
      // 404 - redirect to home
      console.warn(`Route not found: ${hash}`);
      this.navigate('/');
      return;
    }

    const { PageClass, params } = match;
    this.params = params;

    // Cleanup old page
    if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
      try {
        await this.currentPage.cleanup();
      } catch (error) {
        console.error('Error during page cleanup:', error);
      }
    }

    // Create new page instance
    try {
      this.currentPage = new PageClass(this, params);
      
      // Render page
      const appContainer = document.getElementById('app');
      if (!appContainer) {
        console.error('App container not found');
        return;
      }

      const html = await this.currentPage.render();
      appContainer.innerHTML = html;

      // Call mount lifecycle if exists
      if (typeof this.currentPage.mount === 'function') {
        await this.currentPage.mount();
      }

    } catch (error) {
      console.error('Error loading page:', error);
      // Show error state
      document.getElementById('app').innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; color: white;">
          <h1>Error Loading Page</h1>
          <p>${error.message}</p>
          <button onclick="window.location.hash = '/'" style="margin-top: 20px; padding: 10px 20px; border-radius: 8px; border: none; background: white; color: black; cursor: pointer;">
            Go Home
          </button>
        </div>
      `;
    }
  }

  /**
   * Get current route parameters
   * @returns {object}
   */
  getParams() {
    return this.params;
  }

  /**
   * Destroy router and cleanup
   */
  destroy() {
    window.removeEventListener('hashchange', this.handleRoute);
    window.removeEventListener('load', this.handleRoute);
    
    if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
      this.currentPage.cleanup();
    }
  }
}
