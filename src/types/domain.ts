import { z } from 'zod';

export const RatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type Rating = z.infer<typeof RatingSchema>;

export const CardStatusSchema = z.enum(['new', 'learning', 'review', 'mastered']);
export type CardStatus = z.infer<typeof CardStatusSchema>;