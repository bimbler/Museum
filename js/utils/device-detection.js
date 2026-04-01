/**
 * Device Detection Utility
 * Detects Android Chrome and WebXR support
 */

/**
 * Check if device is Android with Chrome browser
 * @returns {boolean}
 */
export function isAndroidChrome() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua);
  return isAndroid && isChrome;
}

/**
 * Check if browser supports WebXR
 * @returns {Promise<boolean>}
 */
export async function supportsWebXR() {
  if (!('xr' in navigator)) {
    return false;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    return supported;
  } catch (error) {
    console.warn('WebXR support check failed:', error);
    return false;
  }
}

/**
 * Check if device supports WebXR with hit-test
 * @returns {Promise<boolean>}
 */
export async function supportsWebXRHitTest() {
  if (!('xr' in navigator)) {
    return false;
  }

  try {
    // Check if immersive-ar with hit-test is supported
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    return supported;
  } catch (error) {
    console.warn('WebXR hit-test support check failed:', error);
    return false;
  }
}

/**
 * Get device info for debugging
 * @returns {object}
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  return {
    userAgent: ua,
    isAndroid: /Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isChrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
    isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
    hasWebXR: 'xr' in navigator,
    hasARCore: isAndroidChrome(), // Approximation
    platform: navigator.platform,
    vendor: navigator.vendor
  };
}

/**
 * Check comprehensive AR support
 * @returns {Promise<object>}
 */
export async function checkARSupport() {
  const deviceInfo = getDeviceInfo();
  const webxrSupported = await supportsWebXR();
  
  return {
    ...deviceInfo,
    webxrSupported,
    markerARSupported: true, // MindAR works on most devices with camera
    planeARSupported: webxrSupported && deviceInfo.isAndroid,
    quickLookSupported: deviceInfo.isIOS,
    recommendedAR: webxrSupported && deviceInfo.isAndroid ? 'plane' : 'marker'
  };
}

/**
 * Show appropriate AR options based on device
 * @returns {Promise<{showMarkerAR: boolean, showPlaneAR: boolean}>}
 */
export async function getAROptions() {
  const support = await checkARSupport();
  
  return {
    showMarkerAR: true, // Always show marker AR (works everywhere)
    showPlaneAR: support.planeARSupported, // WebXR on Android Chrome
    showQuickLookAR: support.quickLookSupported, // AR Quick Look on iOS
    deviceSupport: support
  };
}
