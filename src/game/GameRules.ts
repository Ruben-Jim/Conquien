import { Card, canAddToSequence, canAddToSet, getCardValue } from './CardUtils';

export type MeldType = 'set' | 'sequence';

export interface Meld {
  id: string;
  type: MeldType;
  cards: Card[];
  playerId: string;
}

// Check if cards form a valid set (3 or 4 of the same rank)
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  const rank = cards[0].rank;
  return cards.every(card => card.rank === rank);
}

// Check if cards form a valid sequence (3+ consecutive cards of same suit)
export function isValidSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  
  const sorted = [...cards].sort((a, b) => {
    if (a.suit !== b.suit) return 0;
    return getCardValue(a.rank) - getCardValue(b.rank);
  });
  
  const suit = sorted[0].suit;
  if (!sorted.every(card => card.suit === suit)) return false;
  
  for (let i = 1; i < sorted.length; i++) {
    const prevValue = getCardValue(sorted[i - 1].rank);
    const currValue = getCardValue(sorted[i].rank);
    if (currValue !== prevValue + 1) return false;
  }
  
  return true;
}

// Check if a meld is valid
export function isValidMeld(cards: Card[]): boolean {
  return isValidSet(cards) || isValidSequence(cards);
}

// Check if a card can be added to any existing meld
export function canAddToMeld(card: Card, melds: Meld[]): Meld | null {
  for (const meld of melds) {
    if (meld.type === 'set' && canAddToSet(card, meld.cards)) {
      return meld;
    }
    if (meld.type === 'sequence' && canAddToSequence(card, meld.cards)) {
      return meld;
    }
  }
  return null;
}

// Check if player has won (9 cards melded)
export function hasWon(melds: Meld[], playerId: string): boolean {
  const playerMelds = melds.filter(m => m.playerId === playerId);
  const totalMeldedCards = playerMelds.reduce((sum, meld) => sum + meld.cards.length, 0);
  return totalMeldedCards >= 9;
}

// Count total melded cards for a player
export function countMeldedCards(melds: Meld[], playerId: string): number {
  const playerMelds = melds.filter(m => m.playerId === playerId);
  return playerMelds.reduce((sum, meld) => sum + meld.cards.length, 0);
}

