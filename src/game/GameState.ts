import { Deck } from './Deck';
import { Card } from './CardUtils';
import { Meld, hasWon, canAddToMeld } from './GameRules';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHost: boolean;
  position: number; // 0-3 for 4 players
  seat: number | null; // Selected seat (0-3) or null if not seated
  ready: boolean; // Ready status
  isAI?: boolean; // True for AI/placeholder players
}

export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  melds: Meld[];
  status: 'waiting' | 'exchanging' | 'playing' | 'finished';
  winnerId: string | null;
  createdAt: number;
  exchangeCards?: Record<string, string>; // playerId -> cardId they selected to exchange
}

const CARDS_PER_PLAYER = 8;
const MAX_PLAYERS = 4;

export class GameStateManager {
  static createGame(gameId: string): GameState {
    return {
      gameId,
      players: [],
      currentPlayerIndex: 0,
      drawPile: [],
      discardPile: [],
      melds: [],
      status: 'waiting',
      winnerId: null,
      createdAt: Date.now(),
    };
  }

  static addPlayer(gameState: GameState, playerId: string, playerName: string): GameState {
    // Ensure players array exists (Firebase might not return it)
    const players = gameState.players || [];
    
    if (players.some(p => p.id === playerId)) {
      return gameState; // Player already in game
    }

    // First player becomes host
    const isHost = players.length === 0;

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      isHost,
      position: 0, // Will be set when seated
      seat: null,
      ready: false,
    };

    return {
      ...gameState,
      players: [...players, newPlayer],
    };
  }

  static removePlayer(gameState: GameState, playerId: string): GameState {
    const players = gameState.players || [];
    return {
      ...gameState,
      players: players.filter(p => p.id !== playerId),
    };
  }

  static selectSeat(gameState: GameState, playerId: string, seat: number): GameState {
    if (seat < 0 || seat >= MAX_PLAYERS) {
      throw new Error('Invalid seat number');
    }

    // Check if seat is already taken by another player
    const seatTakenBy = gameState.players.find(p => p.seat === seat && p.id !== playerId);
    if (seatTakenBy) {
      throw new Error('Seat is already taken');
    }

    // Check if there are already 4 seated players (excluding current player)
    const seatedCount = gameState.players.filter(p => p.seat !== null && p.id !== playerId).length;
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const isCurrentlySeated = currentPlayer?.seat !== null;
    
    // If trying to sit and there are already 4 seated (and current player isn't one of them), deny
    if (!isCurrentlySeated && seatedCount >= MAX_PLAYERS) {
      throw new Error('All seats are taken');
    }

    const players = gameState.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          seat,
          position: seat, // Position matches seat
          ready: false, // Reset ready when changing seat
        };
      }
      return p;
    });

    return {
      ...gameState,
      players,
    };
  }

  static toggleReady(gameState: GameState, playerId: string): GameState {
    const players = gameState.players.map(p => {
      if (p.id === playerId) {
        if (p.seat === null) {
          throw new Error('Must select a seat first');
        }
        return {
          ...p,
          ready: !p.ready,
        };
      }
      return p;
    });

    return {
      ...gameState,
      players,
    };
  }

  static canStartGame(gameState: GameState): boolean {
    const seatedPlayers = gameState.players.filter(p => p.seat !== null);
    // Require at least 2 players to start
    if (seatedPlayers.length < 2) {
      return false;
    }
    // All seated players must be ready
    return seatedPlayers.every(p => p.ready);
  }

  static startGame(gameState: GameState): GameState {
    if (!GameStateManager.canStartGame(gameState)) {
      throw new Error('At least 2 players must be seated and ready');
    }

    if (gameState.status !== 'waiting') {
      throw new Error('Game already started');
    }

    // Sort players by seat position (only real players)
    const sortedPlayers = gameState.players
      .filter(p => p.seat !== null)
      .sort((a, b) => (a.seat || 0) - (b.seat || 0));

    const deck = new Deck();
    deck.shuffle();

    // Deal cards to each player (sorted by seat)
    const playersWithHands = sortedPlayers.map(player => ({
      ...player,
      hand: deck.deal(CARDS_PER_PLAYER),
    }));

    // Remaining cards form draw pile
    const drawPile = deck.getCards();

    return {
      ...gameState,
      players: playersWithHands,
      drawPile,
      status: 'exchanging', // Start with exchange phase
      currentPlayerIndex: 0,
      exchangeCards: {}, // Track which card each player wants to exchange
    };
  }

  static drawCard(gameState: GameState, playerId: string, fromDiscard: boolean): GameState {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== gameState.currentPlayerIndex) {
      throw new Error('Not your turn');
    }

    let drawnCard: Card | null = null;
    let newDrawPile = [...gameState.drawPile];
    let newDiscardPile = [...gameState.discardPile];

    if (fromDiscard) {
      if (newDiscardPile.length === 0) {
        throw new Error('Discard pile is empty');
      }
      drawnCard = newDiscardPile.pop()!;
    } else {
      if (newDrawPile.length === 0) {
        throw new Error('Draw pile is empty');
      }
      drawnCard = newDrawPile.shift()!;
    }

    const players = [...gameState.players];
    const currentPlayer = players[playerIndex];
    
    // Check if drawn card can be used in existing melds (forced use)
    const playerMelds = gameState.melds.filter(m => m.playerId === playerId);
    const canUseInMeld = canAddToMeld(drawnCard, playerMelds);
    
    if (canUseInMeld) {
      // Card must be used in meld - add to hand but mark for forced use
      // The UI will handle prompting the user to use it
      players[playerIndex] = {
        ...currentPlayer,
        hand: [...currentPlayer.hand, drawnCard],
      };
    } else {
      // Card goes to hand normally
      players[playerIndex] = {
        ...currentPlayer,
        hand: [...currentPlayer.hand, drawnCard],
      };
    }

    return {
      ...gameState,
      players,
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
    };
  }

  static discardCard(gameState: GameState, playerId: string, cardId: string): GameState {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== gameState.currentPlayerIndex) {
      throw new Error('Not your turn');
    }

    const player = gameState.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not in hand');
    }

    const discardedCard = player.hand[cardIndex];
    const newHand = player.hand.filter((_, i) => i !== cardIndex);

    const players = [...gameState.players];
    players[playerIndex] = {
      ...player,
      hand: newHand,
    };

    // Check if next player can use this card (counter-clockwise rotation)
    // In counter-clockwise, next player is (currentIndex - 1 + players.length) % players.length
    const nextPlayerIndex = (playerIndex - 1 + gameState.players.length) % gameState.players.length;
    const nextPlayer = players[nextPlayerIndex];
    const nextPlayerMelds = gameState.melds.filter(m => m.playerId === nextPlayer.id);
    const canUseCard = canAddToMeld(discardedCard, nextPlayerMelds);

    // If next player can use it, they must take it (forced)
    if (canUseCard) {
      // Card goes to next player's hand (they must use it)
      players[nextPlayerIndex] = {
        ...nextPlayer,
        hand: [...nextPlayer.hand, discardedCard],
      };
      
      // Advance turn to next player (counter-clockwise)
      const newCurrentPlayerIndex = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      
      return {
        ...gameState,
        players,
        currentPlayerIndex: newCurrentPlayerIndex,
      };
    } else {
      // Add to discard pile
      const newDiscardPile = [...gameState.discardPile, discardedCard];
      
      // Advance turn (counter-clockwise)
      const newCurrentPlayerIndex = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
      
      return {
        ...gameState,
        players,
        discardPile: newDiscardPile,
        currentPlayerIndex: newCurrentPlayerIndex,
      };
    }
  }

  static createMeld(gameState: GameState, playerId: string, cardIds: string[]): GameState {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Verify all cards are in player's hand
    const cards = cardIds
      .map(id => player.hand.find(c => c.id === id))
      .filter((c): c is Card => c !== undefined);

    if (cards.length !== cardIds.length) {
      throw new Error('Not all cards are in hand');
    }

    // Validate meld
    const { isValidMeld } = require('./GameRules');
    if (!isValidMeld(cards)) {
      throw new Error('Invalid meld');
    }

    // Remove cards from hand
    const newHand = player.hand.filter(c => !cardIds.includes(c.id));
    const players = gameState.players.map(p =>
      p.id === playerId ? { ...p, hand: newHand } : p
    );

    // Add meld
    const newMeld: Meld = {
      id: `meld-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: cards.every(c => c.rank === cards[0].rank) ? 'set' : 'sequence',
      cards,
      playerId,
    };

    // Check for win
    let winnerId = gameState.winnerId;
    let status = gameState.status;
    if (hasWon([...gameState.melds, newMeld], playerId)) {
      winnerId = playerId;
      status = 'finished';
    }

    return {
      ...gameState,
      players,
      melds: [...gameState.melds, newMeld],
      winnerId,
      status,
    };
  }

  static addCardToMeld(gameState: GameState, playerId: string, cardId: string, meldId: string): GameState {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      throw new Error('Card not in hand');
    }

    const meld = gameState.melds.find(m => m.id === meldId);
    if (!meld) {
      throw new Error('Meld not found');
    }

    // Check if card can be added to meld
    const { canAddToMeld } = require('./GameRules');
    if (!canAddToMeld(card, [meld])) {
      throw new Error('Card cannot be added to this meld');
    }

    // Remove card from hand
    const newHand = player.hand.filter(c => c.id !== cardId);
    const players = gameState.players.map(p =>
      p.id === playerId ? { ...p, hand: newHand } : p
    );

    // Add card to meld
    const melds = gameState.melds.map(m =>
      m.id === meldId ? { ...m, cards: [...m.cards, card] } : m
    );

    // Check for win
    let winnerId = gameState.winnerId;
    let status = gameState.status;
    if (hasWon(melds, playerId)) {
      winnerId = playerId;
      status = 'finished';
    }

    return {
      ...gameState,
      players,
      melds,
      winnerId,
      status,
    };
  }

  // Select a card to exchange (cambio phase)
  static selectExchangeCard(gameState: GameState, playerId: string, cardId: string): GameState {
    if (gameState.status !== 'exchanging') {
      throw new Error('Game is not in exchanging phase');
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Verify card is in player's hand
    if (!player.hand.some(c => c.id === cardId)) {
      throw new Error('Card not in hand');
    }

    const exchangeCards = { ...(gameState.exchangeCards || {}) };
    exchangeCards[playerId] = cardId;

    return {
      ...gameState,
      exchangeCards,
    };
  }

  // Complete the exchange (all players pass cards clockwise)
  static completeExchange(gameState: GameState): GameState {
    if (gameState.status !== 'exchanging') {
      throw new Error('Game is not in exchanging phase');
    }

    const exchangeCards = gameState.exchangeCards || {};
    const sortedPlayers = [...gameState.players].sort((a, b) => (a.seat || 0) - (b.seat || 0));
    
    // Check all players have selected a card
    if (sortedPlayers.some(p => !exchangeCards[p.id])) {
      throw new Error('Not all players have selected a card to exchange');
    }

    // Pass cards clockwise (to the right, which is next index in sorted array)
    // Each player passes to the player on their right
    // We need to get cards from original hands before any modifications
    const players = sortedPlayers.map((player, index) => {
      const cardToGiveId = exchangeCards[player.id];
      
      // Remove the card being given from this player's hand
      const newHand = player.hand.filter(c => c.id !== cardToGiveId);
      
      // Get the card from the player on the left (who is passing TO this player)
      // Previous player passes their selected card to current player
      const previousPlayerIndex = (index - 1 + sortedPlayers.length) % sortedPlayers.length;
      const previousPlayer = sortedPlayers[previousPlayerIndex];
      const cardToReceiveId = exchangeCards[previousPlayer.id];
      
      // Find the card in the previous player's original hand
      const cardToReceive = previousPlayer.hand.find(c => c.id === cardToReceiveId);
      
      if (!cardToReceive) {
        throw new Error(`Card ${cardToReceiveId} not found in previous player's hand`);
      }

      // Add the received card to the new hand
      newHand.push(cardToReceive);

      return {
        ...player,
        hand: newHand,
      };
    });

    return {
      ...gameState,
      players,
      status: 'playing',
      exchangeCards: undefined,
      currentPlayerIndex: 0, // Start with first player
    };
  }
}

