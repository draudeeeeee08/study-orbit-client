import { api } from './axios';

export interface DeckData {
  title: string;
  description?: string;
  color: string;
  dailyNewLimit: number;
  subject?: string; // Required by your backend model
}

// Fetch all decks
export const getDecks = async () => {
  const response = await api.get('/decks');
  return response.data;
}

// Create a new deck
export const createDeck = async (deckData: DeckData) => {
  const response = await api.post('/decks', deckData);
  return response.data;
}

// Update an existing deck
export const updateDeck = async (id: string, deckData: DeckData) => {
  const response = await api.put(`/decks/${id}`, deckData);
  return response.data;
}

// Delete a deck
export const deleteDeck = async (id: string) => {
  const response = await api.delete(`/decks/${id}`);
  return response.data;
}