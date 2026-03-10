export type TileCategory = 
  | 'traffic'
  | 'pollution'
  | 'nature'
  | 'entertainment'
  | 'food'
  | 'health'
  | 'safety'
  | 'security'
  | 'energy'
  | 'water'
  | 'transportation'
  | 'education'
  | 'government'
  | 'residence'
  | 'commercial'
  | 'industrial'
  | 'empty';

export interface NivaariTile {
  id: string;
  x: number;
  y: number;
  width: number; // width in base tile units (e.g. 1 for 1x1, 4 for 4x4)
  height: number;
  category: TileCategory;
  name: string;
  description: string;
  upvotes: number;
  downvotes: number;
  color?: string;
  hierarchyLevel: 'world' | 'country' | 'state' | 'city' | 'zone' | 'building' | 'citizen';
}

export const generateDummyTiles = (centerX: number, centerY: number, radius: number): NivaariTile[] => {
  const tiles: NivaariTile[] = [];
  const categories: TileCategory[] = ['commercial', 'residence', 'nature', 'health', 'food', 'empty'];
  
  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      // Create some larger building blocks randomly (e.g. 2x2 or 3x3)
      // For simplicity in dummy generation, we're just making 1x1s right now
      // but the model supports larger dimensions.
      const cat = categories[Math.floor(Math.random() * categories.length)];
      
      tiles.push({
        id: `tile-${x}-${y}`,
        x,
        y,
        width: 1,
        height: 1,
        category: cat,
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Zone`,
        description: `This is a generic ${cat} area.`,
        upvotes: Math.floor(Math.random() * 100),
        downvotes: Math.floor(Math.random() * 10),
        hierarchyLevel: 'zone',
        color: getColorForCategory(cat)
      });
    }
  }
  return tiles;
};

export const getColorForCategory = (category: TileCategory): string => {
  switch (category) {
    case 'nature': return '#22c55e'; // green-500
    case 'health': return '#ef4444'; // red-500
    case 'commercial': return '#3b82f6'; // blue-500
    case 'residence': return '#eab308'; // yellow-500
    case 'food': return '#f97316'; // orange-500
    case 'traffic': return '#64748b'; // slate-500
    case 'empty': return '#1f2937'; // gray-800
    default: return '#374151'; // gray-700
  }
};
