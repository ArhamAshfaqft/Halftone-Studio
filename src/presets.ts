import { Preset } from './types';

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'dtf-standard',
    name: 'DTF Standard (Soft Hand)',
    description: '45 LPI round screen with 2px choked underbase and black knockout. Ideal for film transfers.',
    settings: {
      lpi: 45,
      angle: 45,
      shape: 'round',
      dotScale: 1.0,
      dotFade: 25,
      fadeFeather: 15,
      knockoutMode: 'black',
      knockoutThreshold: 18,
      knockoutSoftness: 12,
      underbaseEnabled: true,
      underbaseChoke: 2,
      underbaseDensity: 100,
      microDotCleanup: true,
      microDotThreshold: 2,
      blackCutoff: 10,
      cmykMode: false
    }
  },
  {
    id: 'dtg-fine',
    name: 'High-Detail DTG (Fine Screen)',
    description: '60 LPI elliptical chain screen with 1px choke for direct-to-garment digital printers.',
    settings: {
      lpi: 60,
      angle: 45,
      shape: 'ellipse',
      dotScale: 0.95,
      dotFade: 20,
      fadeFeather: 10,
      knockoutMode: 'black',
      knockoutThreshold: 16,
      knockoutSoftness: 10,
      underbaseEnabled: true,
      underbaseChoke: 1,
      underbaseDensity: 95,
      microDotCleanup: true,
      microDotThreshold: 2,
      blackCutoff: 8,
      cmykMode: false
    }
  },
  {
    id: 'screen-print-classic',
    name: 'Screen Print (35 LPI Diamond)',
    description: '35 LPI diamond dot matrix with 3px choke. High ink opacity on manual & automatic presses.',
    settings: {
      lpi: 35,
      angle: 45,
      shape: 'diamond',
      dotScale: 1.05,
      dotFade: 30,
      fadeFeather: 15,
      knockoutMode: 'black',
      knockoutThreshold: 22,
      knockoutSoftness: 14,
      underbaseEnabled: true,
      underbaseChoke: 3,
      underbaseDensity: 100,
      microDotCleanup: true,
      microDotThreshold: 3,
      blackCutoff: 14,
      cmykMode: false
    }
  },
  {
    id: 'retro-screentone',
    name: 'Retro Line Screentone',
    description: '28 LPI linear frequency screen angled at 22.5 degrees for vintage manga & poster aesthetics.',
    settings: {
      lpi: 28,
      angle: 22.5,
      shape: 'line',
      dotScale: 1.1,
      dotFade: 15,
      fadeFeather: 10,
      knockoutMode: 'none',
      underbaseEnabled: false,
      microDotCleanup: false,
      blackCutoff: 5,
      cmykMode: false
    }
  },
  {
    id: 'cmyk-process',
    name: '4-Color CMYK Process',
    description: 'Cyan 15°, Magenta 75°, Yellow 0°, Black 45° simulated process halftone screens.',
    settings: {
      lpi: 55,
      shape: 'round',
      dotScale: 1.0,
      knockoutMode: 'none',
      underbaseEnabled: true,
      underbaseChoke: 2,
      cmykMode: true,
      cmykActiveChannel: 'composite'
    }
  }
];
