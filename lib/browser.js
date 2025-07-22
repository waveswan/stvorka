export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isMobileFirefox() {
  return /Firefox/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);
}