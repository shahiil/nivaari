# RotatingText Component Documentation

A powerful React + TypeScript component for creating smooth, animated rotating text effects using Framer Motion. Perfect for hero sections, headlines, and dynamic content.

## Features

- ✨ Smooth spring-based animations with Framer Motion
- 🎯 Character-by-character or word-by-word animation
- 🎨 Customizable stagger effects (first, last, center, random)
- 🔄 Auto-rotation with configurable intervals
- 🎮 Imperative controls via ref (next, previous, jumpTo, reset)
- 📱 Fully responsive
- 🎭 Customizable animation variants
- 🌐 Accurate grapheme handling with Intl.Segmenter

## Installation

Framer Motion is already installed in your project.

## Basic Usage

```tsx
import RotatingText from '@/components/RotatingText';
import '@/components/RotatingText.css';

export default function MyComponent() {
  return (
    <div>
      <h1>
        Stay <RotatingText texts={['Safe', 'Informed', 'Protected']} />
      </h1>
    </div>
  );
}
```

## Hero Headline Example (Already Created)

```tsx
import HeroHeadline from '@/components/HeroHeadline';

<HeroHeadline />
// Renders: "Stay Safe" → "Stay Informed" → "Stay Protected"
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `texts` | `string[]` | **Required** | Array of words/phrases to rotate |
| `rotationInterval` | `number` | `3000` | Time in ms before switching |
| `staggerDuration` | `number` | `0.3` | Duration of stagger effect in seconds |
| `staggerFrom` | `'first' \| 'last' \| 'center' \| 'random'` | `'first'` | Direction to stagger from |
| `splitBy` | `'character' \| 'word'` | `'character'` | Split animation mode |
| `loop` | `boolean` | `true` | Loop through texts continuously |
| `auto` | `boolean` | `true` | Auto-rotate texts |
| `mainClassName` | `string` | `''` | Class for main container |
| `splitLevelClassName` | `string` | `''` | Class for word/character container |
| `elementLevelClassName` | `string` | `''` | Class for individual elements |
| `initial` | `TargetAndTransition` | See below | Custom initial animation |
| `animate` | `TargetAndTransition` | See below | Custom animate state |
| `exit` | `TargetAndTransition` | See below | Custom exit animation |
| `transition` | `Transition` | See below | Custom transition config |

## Default Animations

```tsx
// Default initial state
{
  opacity: 0,
  y: 20,
  rotateX: -90,
}

// Default animate state
{
  opacity: 1,
  y: 0,
  rotateX: 0,
}

// Default exit state
{
  opacity: 0,
  y: -20,
  rotateX: 90,
}

// Default transition
{
  type: 'spring',
  stiffness: 200,
  damping: 20,
}
```

## Advanced Examples

### Character-by-Character Animation

```tsx
<RotatingText
  texts={['Safe', 'Informed', 'Protected']}
  splitBy="character"
  staggerFrom="first"
  staggerDuration={0.3}
  rotationInterval={3000}
/>
```

### Word-by-Word Animation

```tsx
<RotatingText
  texts={['Be Safe', 'Stay Informed', 'Get Protected']}
  splitBy="word"
  staggerFrom="center"
  staggerDuration={0.5}
/>
```

### Custom Fade Animation

```tsx
<RotatingText
  texts={['Safe', 'Informed', 'Protected']}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 30,
  }}
/>
```

### Random Stagger Effect

```tsx
<RotatingText
  texts={['Security', 'Information', 'Protection']}
  staggerFrom="random"
  staggerDuration={0.5}
  splitBy="character"
/>
```

### Slow, Dramatic Animation

```tsx
<RotatingText
  texts={['Safe', 'Secure', 'Protected']}
  rotationInterval={5000}
  staggerDuration={0.8}
  staggerFrom="center"
  transition={{
    type: 'spring',
    stiffness: 100,
    damping: 25,
  }}
/>
```

## Imperative Controls with Ref

```tsx
import { useRef } from 'react';
import RotatingText, { RotatingTextRef } from '@/components/RotatingText';

function MyComponent() {
  const rotatingRef = useRef<RotatingTextRef>(null);

  return (
    <div>
      <RotatingText
        ref={rotatingRef}
        texts={['Safe', 'Informed', 'Protected']}
        auto={false}
      />
      
      <button onClick={() => rotatingRef.current?.next()}>
        Next
      </button>
      <button onClick={() => rotatingRef.current?.previous()}>
        Previous
      </button>
      <button onClick={() => rotatingRef.current?.jumpTo(0)}>
        First
      </button>
      <button onClick={() => rotatingRef.current?.reset()}>
        Reset
      </button>
    </div>
  );
}
```

## Styling

### Using Tailwind Classes

```tsx
<RotatingText
  texts={['Safe', 'Informed', 'Protected']}
  mainClassName="text-6xl font-bold"
  elementLevelClassName="text-cyan-400"
/>
```

### Custom CSS

```css
.my-rotating-text {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #00b7ff, #a855f7);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

```tsx
<RotatingText
  texts={['Safe', 'Informed', 'Protected']}
  mainClassName="my-rotating-text"
/>
```

## Integration in Homepage

Update your `app/page.tsx`:

```tsx
import HeroHeadline from '@/components/HeroHeadline';

export default function HomePage() {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="container mx-auto text-center">
        <HeroHeadline />
        <p className="text-xl mt-6">Your subheadline here</p>
      </div>
    </section>
  );
}
```

## Stagger Patterns

### First (Default)
Characters animate from left to right:
```
S → a → f → e
```

### Last
Characters animate from right to left:
```
e → f → a → S
```

### Center
Characters animate from center outward:
```
    ↓
S ← a → f → e
```

### Random
Characters animate in random order:
```
f → S → e → a
```

## Performance Tips

1. **Limit stagger duration**: Keep `staggerDuration` under 1 second for best UX
2. **Optimize rotation interval**: 3-5 seconds works best for readability
3. **Use character mode sparingly**: Word mode is faster for long phrases
4. **Limit simultaneous instances**: Use 2-3 rotating texts max per page

## Browser Support

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

Note: `Intl.Segmenter` fallback ensures compatibility with older browsers.

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import RotatingText, { 
  RotatingTextProps, 
  RotatingTextRef 
} from '@/components/RotatingText';
```

## Troubleshooting

**Text not animating:**
- Check that `auto={true}` is set
- Verify `texts` array has multiple items
- Ensure Framer Motion is installed

**Choppy animation:**
- Reduce `staggerDuration`
- Lower `rotationInterval`
- Check browser performance

**Characters overlapping:**
- Add letter-spacing in CSS
- Use `display: inline-block` on parent
- Check `overflow: visible` on container

## Examples in Your Project

The `HeroHeadline` component is ready to use:

```tsx
<HeroHeadline />
```

This renders:
```
Stay Safe       (3 seconds)
Stay Informed   (3 seconds)
Stay Protected  (3 seconds)
↺ Loop
```

## Credits

Built with:
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
