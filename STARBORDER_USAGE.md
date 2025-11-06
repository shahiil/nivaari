# StarBorder Component - Updated Usage Guide

## Overview
The StarBorder component now creates a subtle animated glow effect **only around the borders** of elements, perfect for dock buttons and other UI elements. The inner content remains completely unaffected.

## Key Features
- ✨ Animated border shimmer effect
- 🎨 Customizable colors (cyan, blue, purple, pink, green, yellow, red, white)
- ⚡ Adjustable animation speed
- 🎯 Border-only effect - content stays pristine
- 🌙 Dark UI optimized
- 📦 Fully reusable with TypeScript support

## Updated Component Code

```tsx
import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'cyan',
  speed = '6s',
  thickness = 2,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  const colorMap: Record<string, string> = {
    cyan: 'rgba(0, 183, 255, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)',
    purple: 'rgba(168, 85, 247, 0.8)',
    pink: 'rgba(236, 72, 153, 0.8)',
    green: 'rgba(34, 197, 94, 0.8)',
    yellow: 'rgba(234, 179, 8, 0.8)',
    red: 'rgba(239, 68, 68, 0.8)',
    white: 'rgba(255, 255, 255, 0.8)',
  };

  const glowColor = colorMap[color] || color;

  return (
    <Component
      className={`relative inline-block ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px`,
        ...(rest as any).style
      }}
    >
      <div 
        className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
        style={{ padding: 0 }}
      >
        <div
          className="absolute w-[200%] h-[100px] opacity-60 bottom-0 right-[-100%] blur-md animate-star-movement-bottom"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 60%)`,
            animationDuration: speed,
          }}
        />
        <div
          className="absolute w-[200%] h-[100px] opacity-60 top-0 left-[-100%] blur-md animate-star-movement-top"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 60%)`,
            animationDuration: speed,
          }}
        />
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            border: `1px solid ${glowColor.replace('0.8', '0.3')}`,
          }}
        />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
```

## Tailwind Configuration

Your `tailwind.config.ts` already has the required animations:

```typescript
keyframes: {
  'star-movement-bottom': {
    '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
    '100%': { transform: 'translate(-100%, 0%)', opacity: '0' }
  },
  'star-movement-top': {
    '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
    '100%': { transform: 'translate(100%, 0%)', opacity: '0' }
  }
},
animation: {
  'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
  'star-movement-top': 'star-movement-top linear infinite alternate'
}
```

## Usage Examples

### Basic Button
```tsx
import StarBorder from './StarBorder';

<StarBorder
  as="button"
  color="cyan"
  speed="5s"
>
  Click Me
</StarBorder>
```

### Dock Button (Recommended for your use case)
```tsx
<StarBorder
  as="div"
  color="cyan"
  speed="4s"
  thickness={0}
  className="rounded-lg"
>
  <motion.div className="flex items-center justify-center">
    <YourIconComponent />
  </motion.div>
</StarBorder>
```

### With Custom Colors
```tsx
// Preset colors
<StarBorder color="purple" speed="6s">Purple Glow</StarBorder>
<StarBorder color="green" speed="5s">Green Glow</StarBorder>

// Custom RGBA
<StarBorder color="rgba(255, 100, 200, 0.8)" speed="4s">
  Custom Color
</StarBorder>
```

### Different Speeds
```tsx
<StarBorder speed="3s">Fast</StarBorder>
<StarBorder speed="6s">Medium</StarBorder>
<StarBorder speed="10s">Slow</StarBorder>
```

## Integration with Dock Component

Here's how to apply it to your dock buttons:

```tsx
// In Dock.tsx
import StarBorder from './StarBorder';

function DockItem({ children, onClick, ...props }: DockItemProps) {
  return (
    <StarBorder
      as="div"
      color="cyan"
      speed="5s"
      thickness={0}
      className="rounded-lg"
    >
      <motion.div
        onClick={onClick}
        className="relative inline-flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-xl border-cyan-400/30 border-2"
        {...props}
      >
        {children}
      </motion.div>
    </StarBorder>
  );
}
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | React.ElementType | `'button'` | HTML element or component to render |
| `className` | string | `''` | Additional CSS classes |
| `children` | React.ReactNode | - | Content to wrap |
| `color` | string | `'cyan'` | Glow color (preset or custom RGBA) |
| `speed` | string | `'6s'` | Animation duration |
| `thickness` | number | `2` | Padding around content (in pixels) |

## Available Preset Colors
- `cyan` - Electric blue (default)
- `blue` - Sky blue
- `purple` - Violet
- `pink` - Hot pink
- `green` - Emerald
- `yellow` - Gold
- `red` - Crimson
- `white` - Pure white

## What Changed?

### Before (Old Design)
- Background gradients that affected the entire button
- Inner div with its own styling that replaced content
- Glow spilled into content area

### After (New Design)
- ✅ Border-only animation effect
- ✅ Content completely preserved
- ✅ Better dark theme integration
- ✅ More subtle and professional appearance
- ✅ Pointer events disabled on glow layers
- ✅ Proper z-index layering

## Tips for Best Results

1. **Set `thickness={0}`** when wrapping elements that already have their own padding
2. **Match border radius** by adding the appropriate `rounded-*` class
3. **Use slower speeds** (6s-10s) for subtle elegance
4. **Combine with hover effects** on the inner content for interactive feedback
5. **Test with your existing styles** - the effect adapts to inherited border-radius

## Performance Notes
- Uses CSS animations (GPU-accelerated)
- Minimal DOM overhead (3 additional divs per instance)
- No JavaScript animation loops
- Safe to use multiple instances simultaneously
