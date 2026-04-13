// Fasoo Design System (FDS) v2.0 Tokens
export const FDS_TOKENS = {
  colors: {
    // Semantic Tokens mapped to their Light Mode HEX values
    'Color/bg/primary': {
      hex: '#f2f8ff',
      description: 'Main background color'
    },
    'Color/bg/secondary': {
      hex: '#ffffff',
      description: 'Secondary background color'
    },
    'Color/text/primary': {
      hex: '#1a1c1e',
      description: 'Primary text color'
    },
    'Color/text/secondary': {
      hex: '#717985',
      description: 'Secondary text color'
    },
    'Color/brand': {
      hex: '#3182f6',
      description: 'Brand identity color'
    },
    'Color/text/main': {
      hex: '#252d38',
      description: 'Main text color'
    }
  },
  radius: {
    'radius/12': {
      value: '12px',
      description: 'Common component radius'
    }
  }
};

// Helper: Convert RGB/RGBA to HEX for comparison
export function rgbToHex(rgb) {
  if (!rgb) return null;
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase();
}
