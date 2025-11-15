import { Card, SUITS, RANKS } from './CardUtils';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = this.createDeck();
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }
    return deck;
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(numCards: number): Card[] {
    if (this.cards.length < numCards) {
      throw new Error('Not enough cards in deck');
    }
    return this.cards.splice(0, numCards);
  }

  draw(): Card | null {
    return this.cards.shift() || null;
  }

  getRemainingCount(): number {
    return this.cards.length;
  }

  getCards(): Card[] {
    return [...this.cards];
  }
}

