export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];

// Get numeric value for sorting (A=1, 2-7=2-7, J=8, Q=9, K=10)
export function getCardValue(rank: Rank): number {
  const rankMap: Record<Rank, number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    'J': 8,
    'Q': 9,
    'K': 10,
  };
  return rankMap[rank];
}

// Sort cards by suit first, then by rank
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitOrder = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    if (suitOrder !== 0) return suitOrder;
    return getCardValue(a.rank) - getCardValue(b.rank);
  });
}

// Check if two cards are the same
export function cardsEqual(card1: Card, card2: Card): boolean {
  return card1.suit === card2.suit && card1.rank === card2.rank;
}

// Check if a card can be added to a sequence
export function canAddToSequence(card: Card, sequence: Card[]): boolean {
  if (sequence.length === 0) return true;
  
  const sortedSequence = sortCards(sequence);
  const firstCard = sortedSequence[0];
  const lastCard = sortedSequence[sortedSequence.length - 1];
  
  // Check if card can be added at the beginning
  if (card.suit === firstCard.suit) {
    const cardValue = getCardValue(card.rank);
    const firstValue = getCardValue(firstCard.rank);
    if (cardValue === firstValue - 1) return true;
  }
  
  // Check if card can be added at the end
  if (card.suit === lastCard.suit) {
    const cardValue = getCardValue(card.rank);
    const lastValue = getCardValue(lastCard.rank);
    if (cardValue === lastValue + 1) return true;
  }
  
  return false;
}

// Check if a card matches a set (same rank)
export function canAddToSet(card: Card, set: Card[]): boolean {
  if (set.length === 0) return true;
  return set.every(c => c.rank === card.rank);
}

