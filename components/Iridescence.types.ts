/**
 * Type definitions for the Iridescence component
 */

export interface IridescenceProps {
  /**
   * RGB color tint for the effect
   * Values should be between 0 and 1
   * @default [0.5, 0.7, 1.0]
   * @example [0.3, 0.6, 1.0] // Blue tint
   * @example [1.0, 0.5, 0.9] // Pink/purple tint
   */
  color?: [number, number, number];

  /**
   * Wave amplitude - controls the strength of the wave movement
   * Range: 0 - 2
   * @default 0.5
   * @example 0.3 // Subtle movement
   * @example 1.2 // Intense movement
   */
  amplitude?: number;

  /**
   * Animation speed - controls how fast the effect animates
   * Range: 0 - 5
   * @default 0.3
   * @example 0.2 // Slow, calm
   * @example 0.8 // Fast, energetic
   */
  speed?: number;

  /**
   * Enable mouse interaction - the effect will respond to mouse movement
   * @default true
   */
  mouseReact?: boolean;

  /**
   * Additional CSS classes to apply to the container
   * @default ''
   */
  className?: string;
}

/**
 * Preset configurations for common use cases
 */
export const IridescencePresets = {
  default: {
    color: [0.5, 0.7, 1.0] as [number, number, number],
    amplitude: 0.5,
    speed: 0.3,
    mouseReact: true,
  },
  subtle: {
    color: [0.7, 0.8, 0.95] as [number, number, number],
    amplitude: 0.3,
    speed: 0.2,
    mouseReact: false,
  },
  intense: {
    color: [1.0, 0.5, 0.9] as [number, number, number],
    amplitude: 1.2,
    speed: 0.8,
    mouseReact: true,
  },
  oceanBlue: {
    color: [0.3, 0.6, 1.0] as [number, number, number],
    amplitude: 0.6,
    speed: 0.4,
    mouseReact: true,
  },
  cosmicPurple: {
    color: [0.8, 0.4, 1.0] as [number, number, number],
    amplitude: 0.7,
    speed: 0.5,
    mouseReact: true,
  },
  warmSunset: {
    color: [1.0, 0.6, 0.5] as [number, number, number],
    amplitude: 0.5,
    speed: 0.3,
    mouseReact: true,
  },
} as const;

/**
 * Color palette suggestions for common themes
 */
export const IridescenceColors = {
  blueTech: [0.3, 0.6, 1.0] as [number, number, number],
  purplePink: [0.8, 0.5, 0.9] as [number, number, number],
  cyanTeal: [0.4, 0.8, 0.9] as [number, number, number],
  warmGradient: [1.0, 0.7, 0.5] as [number, number, number],
  coolGray: [0.7, 0.8, 0.95] as [number, number, number],
  neonGreen: [0.5, 1.0, 0.6] as [number, number, number],
  royalPurple: [0.6, 0.4, 1.0] as [number, number, number],
  coralPink: [1.0, 0.6, 0.7] as [number, number, number],
} as const;
