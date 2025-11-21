export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];

// Get numeric value for Conquian (A=1, 2-7=2-7, J=10, Q=11, K=12)
// According to Conquian rules: Ace is low, 7 connects to Jack (10)
// Valid sequences: A-2-3, 6-7-J, J-Q-K (no wrap-around like K-A-2)
export function getCardValue(rank: Rank): number {
  const rankMap: Record<Rank, number> = {
    'A': 1,   // Ace is always low
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    'J': 10,  // Jack (sota) = 10
    'Q': 11,  // Queen (caballo) = 11
    'K': 12,  // King (rey) = 12
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
// Conquian rules: Ace is low, 7 connects to Jack (10), no wrap-around
export function canAddToSequence(card: Card, sequence: Card[]): boolean {
  if (sequence.length === 0) return true;
  
  const sortedSequence = sortCards(sequence);
  const firstCard = sortedSequence[0];
  const lastCard = sortedSequence[sortedSequence.length - 1];
  
  // Must be same suit
  if (card.suit !== firstCard.suit) return false;
  
  const cardValue = getCardValue(card.rank);
  const firstValue = getCardValue(firstCard.rank);
  const lastValue = getCardValue(lastCard.rank);
  
  // Check if card can be added at the beginning
  // Prevent wrap-around: can't go from K(12) to A(1) or A(1) to K(12)
  if (cardValue === firstValue - 1) {
    // Special case: can't have K(12) before A(1) - no wrap-around
    if (cardValue === 12 && firstValue === 1) return false;
    return true;
  }
  
  // Check if card can be added at the end
  if (cardValue === lastValue + 1) {
    // Special case: can't have A(1) after K(12) - no wrap-around
    if (lastValue === 12 && cardValue === 1) return false;
    return true;
  }
  
  return false;
}

// Check if a card matches a set (same rank)
export function canAddToSet(card: Card, set: Card[]): boolean {
  if (set.length === 0) return true;
  return set.every(c => c.rank === card.rank);
}

