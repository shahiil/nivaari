# 🔍 Dock Search Bar - Animated Search Feature

## Overview
A beautifully animated search bar that appears above the dock with smooth transitions, frosted glass aesthetics, and floating suggestions.

## ✨ Features

### Visual Design
- **Frosted Glass Effect**: `backdrop-blur-xl` with dark translucent background
- **Cyan Glow Border**: Animated pulsing glow around the search bar
- **Matches Dock Style**: Consistent with your dark theme aesthetic
- **Floating Suggestions**: Elevated panel with soft shadows

### Animations

#### Search Bar Entry
- **Slide-up**: Moves from `y: 20` to `y: 0`
- **Fade-in**: Opacity from `0` to `1`
- **Scale**: Grows from `0.9` to `1.0`
- **Spring Animation**: Natural bouncy feel
- **Duration**: 300ms

#### Suggestions Panel
- **Slide-up**: Moves from `y: 10` to `y: 0`
- **Fade-in**: Opacity from `0` to `1`
- **Scale**: Grows from `0.95` to `1.0`
- **Staggered Items**: Each result animates in with 50ms delay
- **Duration**: 300ms

#### Individual Suggestion Items
- **Slide-in**: Each item slides from left (`x: -10` to `x: 0`)
- **Sequential**: 50ms delay between items for waterfall effect
- **Hover Effect**: Cyan background glow on hover

### Interactions

#### Opening
1. Click Search icon in dock
2. Search bar slides up from bottom (above dock)
3. Input auto-focuses
4. Backdrop appears (click to close)

#### Searching
1. Type 3+ characters
2. 500ms debounce delay
3. API call to OpenStreetMap Nominatim
4. Suggestions fade in above search bar
5. Each result animates sequentially

#### Selecting
1. Hover over suggestion (cyan glow)
2. "Go →" indicator appears
3. Click to navigate
4. Map smoothly pans to location
5. Search bar closes with reverse animation

#### Closing
- Click outside (backdrop)
- Press ESC key
- Select a location
- All animations reverse smoothly

## 🎨 Styling Details

### Search Bar
```css
- Background: black/60 with backdrop-blur-xl
- Border: 2px solid cyan-400/40
- Shadow: 0_0_50px_rgba(0,183,255,0.5)
- Border Radius: rounded-2xl
- Padding: px-5 py-4
- Animated gradient overlay for pulse effect
```

### Suggestions Panel
```css
- Background: black/60 with backdrop-blur-xl
- Border: 1px solid cyan-400/30
- Shadow: 0_0_40px_rgba(0,183,255,0.4)
- Border Radius: rounded-2xl
- Max Height: 400px with scroll
- Margin Bottom: 12px (gap from search bar)
```

### Suggestion Items
```css
- Padding: p-3
- Hover: bg-cyan-400/10
- Border Radius: rounded-xl
- Transition: all 200ms
- Icon Background: bg-cyan-400/10 (lighter on hover)
```

## 🎯 Component Props

```typescript
interface DockSearchBarProps {
  isOpen: boolean;              // Controls visibility
  onClose: () => void;          // Called when closed
  onLocationSelect: (          // Called when location selected
    lat: number, 
    lng: number, 
    name: string
  ) => void;
}
```

## 📍 Position & Z-Index

```
Z-Index Layers:
- Map: z-[50]
- Backdrop: z-[65]
- Dock: z-[70]
- Search Bar: z-[75]
- Modals: z-[80-85]
```

Position:
- `fixed bottom-28` (above dock)
- `left-1/2 -translate-x-1/2` (centered)
- `max-w-2xl` (responsive width)

## 🚀 Usage

```tsx
import DockSearchBar from '@/components/DockSearchBar';
import { AnimatePresence } from 'framer-motion';

function Dashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>();
  
  const handleLocationSelect = (lat, lng, name) => {
    setMapCenter([lat, lng]);
    toast.success(`Navigating to ${name}`);
  };

  return (
    <>
      {/* Your dock with search icon */}
      <Dock items={[
        { 
          icon: <Search />, 
          label: 'Search', 
          onClick: () => setSearchOpen(true) 
        }
      ]} />
      
      {/* Animated search bar */}
      <AnimatePresence>
        {searchOpen && (
          <DockSearchBar
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onLocationSelect={handleLocationSelect}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

## 🎭 Animation Variants

### Entry Animation
```typescript
initial={{ opacity: 0, y: 20, scale: 0.9 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ 
  duration: 0.3, 
  type: 'spring', 
  stiffness: 300, 
  damping: 25 
}}
```

### Exit Animation
```typescript
exit={{ opacity: 0, y: 20, scale: 0.9 }}
```

### Suggestions Panel
```typescript
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
transition={{ duration: 0.3, ease: 'easeOut' }}
```

### Staggered Items
```typescript
initial={{ opacity: 0, x: -10 }}
animate={{ opacity: 1, x: 0 }}
transition={{ 
  delay: index * 0.05,  // 50ms between items
  duration: 0.2 
}}
```

## ⚡ Performance

- **Debounced Search**: 500ms delay prevents API spam
- **Limited Results**: Max 8 suggestions shown
- **Efficient Rendering**: AnimatePresence handles mount/unmount
- **GPU Accelerated**: All animations use transform and opacity
- **Conditional Rendering**: Only renders when open

## 🎨 Theming

All colors are customizable via the cyan theme:
- Primary: `cyan-400` (#00B7FF)
- Border: `cyan-400/30-40` (30-40% opacity)
- Glow: `rgba(0, 183, 255, 0.4-0.5)`
- Hover: `cyan-400/10` (10% opacity)

## 🔥 Key Highlights

✅ **Smooth Animations**: Spring physics for natural feel  
✅ **Frosted Glass**: Modern translucent aesthetic  
✅ **Dock Integration**: Appears above, doesn't disturb dock  
✅ **Keyboard Support**: ESC to close, auto-focus input  
✅ **Loading States**: Spinner while searching  
✅ **Empty States**: Helpful messages for users  
✅ **Responsive**: Works on all screen sizes  
✅ **Accessible**: Keyboard navigation, ARIA labels  
✅ **Clean Code**: TypeScript, properly typed  
✅ **Reusable**: Easy to integrate anywhere  

The search bar creates a premium, polished user experience that feels integrated with your dock while maintaining its own distinct presence! 🌟
