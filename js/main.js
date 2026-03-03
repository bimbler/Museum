/**
 * Main Entry Point
 * Initializes the router and defines all routes
 */

import Router from './router.js';
import HomePage from './pages/home.js';
import MapPage from './pages/map.js';
import CollectionPage from './pages/collection.js';
import ObjectDetailPage from './pages/object-detail.js';
import ARViewerPage from './pages/ar-viewer.js';

// Initialize thumbnails (must be done before collection is used)
import './data/thumbnails.js';

// Create router with all routes
const router = new Router({
  '/': HomePage,
  '/map': MapPage,
  '/collection': CollectionPage,
  '/object/:id': ObjectDetailPage,
  '/object/:id/ar': ARViewerPage
});

// Make router globally accessible for debugging
window.museumRouter = router;

console.log('Museum AR Experience loaded');
