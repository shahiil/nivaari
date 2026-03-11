import { z } from 'zod';
import { ACTIVE_FILTERS, ACTIVE_TOOLS, CHAT_ROLES, DISASTER_CATEGORIES, TILE_TYPES, TRAVEL_TYPES, VIEW_MODES } from '@/lib/nivaari/domain';

export const tileTypeSchema = z.enum(TILE_TYPES);
export const activeToolSchema = z.enum(ACTIVE_TOOLS);
export const activeFilterSchema = z.enum(ACTIVE_FILTERS);
export const travelTypeSchema = z.enum(TRAVEL_TYPES);
export const viewModeSchema = z.enum(VIEW_MODES);
export const disasterCategorySchema = z.enum(DISASTER_CATEGORIES);
export const chatRoleSchema = z.enum(CHAT_ROLES);

export const nivaariDataSchema = z.object({
  category: z.string().default(''),
  zone: z.union([z.literal(''), z.literal('public'), z.literal('private')]).default(''),
  confidence: z.number().min(0).max(100).default(50),
  upvotes: z.number().int().min(0).default(0),
  downvotes: z.number().int().min(0).default(0),
  hasEmergency: z.boolean().optional(),
  emergencyType: z.string().optional(),
});

export const tileSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  z: z.number(),
  width: z.number().int().positive().optional(),
  depth: z.number().int().positive().optional(),
  type: tileTypeSchema,
  creator: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  disaster: z.object({
    category: disasterCategorySchema,
    type: z.string().optional(),
  }).optional(),
  data: nivaariDataSchema.optional(),
});

export const gridSchema = z.record(z.string(), tileSchema);

export const chatMessageSchema = z.object({
  role: z.union([chatRoleSchema, z.literal('assistant')]),
  text: z.string().min(1),
});

export const aiRequestSchema = z.object({
  history: z.array(chatMessageSchema).default([]),
});

export const aiResponseSchema = z.object({
  category: z.string().default(''),
  type: tileTypeSchema,
  confidence: z.number().min(0).max(100).default(50),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
