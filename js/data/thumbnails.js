/**
 * Generate placeholder thumbnails as data URIs
 * These will be replaced with actual images later
 */

function createPlaceholderThumbnail(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 400, 400);
  
  // Add subtle pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(200, 200, 30 + i * 30, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 200, 200);
  
  return canvas.toDataURL('image/png');
}

// Generate and export thumbnails
export const thumbnails = {
  buddha: createPlaceholderThumbnail('Buddha\nStatue', '#8b6914'),
  vase: createPlaceholderThumbnail('Ancient\nVase', '#1a4d8b'),
  bust: createPlaceholderThumbnail('Marble\nBust', '#e8e8e8'),
  relic: createPlaceholderThumbnail('Golden\nRelic', '#ffd700')
};

// Replace collection thumbnails with generated ones
import { collection } from './collection.js';

collection.forEach(obj => {
  if (thumbnails[obj.id]) {
    obj.thumbnail = thumbnails[obj.id];
  }
});
