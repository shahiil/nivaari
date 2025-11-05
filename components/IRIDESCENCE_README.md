# Iridescence Component

A stunning React component that generates smooth animated backgrounds using OGL (a lightweight WebGL framework). Features shifting, wavy light patterns with iridescent gradients that move over time and react to mouse movement.

## Features

- ✨ Smooth WebGL-powered animations
- 🎨 Iridescent color gradients (blue, pink, purple, cyan)
- 🖱️ Optional mouse interaction
- 📱 Fully responsive
- ⚡ Lightweight and performant
- 🎛️ Highly customizable

## Installation

```bash
npm install ogl
# or
pnpm add ogl
# or
yarn add ogl
```

## Usage

### Basic Usage

```tsx
import Iridescence from '@/components/Iridescence';

export default function MyPage() {
  return (
    <section className="relative min-h-screen">
      <Iridescence />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </section>
  );
}
```

### Customized Usage

```tsx
<Iridescence
  color={[0.5, 0.7, 1.0]}  // RGB values (0-1)
  amplitude={0.5}          // Wave amplitude (0-2)
  speed={0.3}              // Animation speed (0-5)
  mouseReact={true}        // Enable mouse interaction
  className="z-0"          // Optional CSS classes
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `[number, number, number]` | `[0.5, 0.7, 1.0]` | RGB color tint (values 0-1) |
| `amplitude` | `number` | `0.5` | Wave amplitude (0-2). Higher = more movement |
| `speed` | `number` | `0.3` | Animation speed (0-5). Higher = faster |
| `mouseReact` | `boolean` | `true` | Enable mouse interaction |
| `className` | `string` | `''` | Additional CSS classes |

## Examples

### Subtle Background

```tsx
<Iridescence
  color={[0.7, 0.8, 0.95]}
  amplitude={0.3}
  speed={0.2}
  mouseReact={false}
/>
```

### Intense Animated Background

```tsx
<Iridescence
  color={[1.0, 0.5, 0.9]}   // Pink/purple tint
  amplitude={1.2}
  speed={0.8}
  mouseReact={true}
/>
```

### Blue-Cyan Theme

```tsx
<Iridescence
  color={[0.3, 0.6, 1.0]}
  amplitude={0.8}
  speed={0.5}
  mouseReact={true}
/>
```

## Integration Tips

1. **Always wrap content in a relative container** with `relative z-10` to ensure it appears above the background:
   ```tsx
   <section className="relative">
     <Iridescence />
     <div className="relative z-10">{/* Content */}</div>
   </section>
   ```

2. **For hero sections**, combine with semi-transparent backgrounds:
   ```tsx
   <section className="relative min-h-screen bg-background/80">
     <Iridescence />
     {/* Content */}
   </section>
   ```

3. **Adjust colors** to match your brand:
   - Blue tech: `[0.3, 0.6, 1.0]`
   - Purple/pink: `[0.8, 0.5, 0.9]`
   - Cyan/teal: `[0.4, 0.8, 0.9]`
   - Warm gradient: `[1.0, 0.7, 0.5]`

4. **Performance**: The component automatically handles cleanup and is optimized for 60fps animations.

## Technical Details

- Uses vertex and fragment shaders for the visual effect
- Implements multiple cosine wave layers for complexity
- Includes noise functions for texture
- Features smooth color transitions using cosine palettes
- Adds shimmer and vignette effects for elegance
- Automatically handles window resize
- Cleans up WebGL resources on unmount

## Browser Support

Works in all modern browsers that support WebGL:
- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

## Performance

- Lightweight: Only ~8KB minified
- 60fps smooth animations
- Minimal CPU usage
- No dependencies except OGL

## Troubleshooting

**Canvas not showing:**
- Ensure the parent element has a defined height
- Check that z-index is set correctly
- Verify OGL is installed

**Performance issues:**
- Lower the `amplitude` value
- Reduce the `speed` value
- Disable `mouseReact` on mobile devices

**Colors not matching:**
- RGB values should be between 0 and 1
- Use decimals: `0.5` not `128`
- Adjust based on your background colors

## License

MIT

## Credits

Built with [OGL](https://github.com/oframe/ogl) - A minimal WebGL framework.
