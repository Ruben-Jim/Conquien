import { ref, set, get, onValue, off, push, update, remove, DatabaseReference } from 'firebase/database';
import { database } from '../../firebase.config';
import { GameState } from '../game/GameState';

export class FirebaseService {
  // Normalize game state from Firebase (ensure all required fields exist)
  private static normalizeGameState(rawData: any, gameId: string): GameState {
    // Normalize players array - ensure each player has all required fields
    const players = (rawData.players || []).map((player: any) => ({
      id: player.id || '',
      name: player.name || 'Unknown',
      hand: player.hand || [],
      isHost: player.isHost || false,
      position: player.position || 0,
      seat: player.seat !== undefined ? player.seat : null,
      ready: player.ready || false,
      isAI: player.isAI || false,
    }));

    // Handle status - support 'waiting', 'exchanging', 'playing', 'finished'
    const validStatuses = ['waiting', 'exchanging', 'playing', 'finished'];
    const status = validStatuses.includes(rawData.status) ? rawData.status : 'waiting';

    return {
      gameId: rawData.gameId || gameId,
      players,
      currentPlayerIndex: rawData.currentPlayerIndex || 0,
      drawPile: rawData.drawPile || [],
      discardPile: rawData.discardPile || [],
      melds: rawData.melds || [],
      status,
      winnerId: rawData.winnerId || null,
      createdAt: rawData.createdAt || Date.now(),
      // Only include exchangeCards if it exists and is not null
      exchangeCards: rawData.exchangeCards && Object.keys(rawData.exchangeCards).length > 0 
        ? rawData.exchangeCards 
        : undefined,
    };
  }
  // Create a new game
  static async createGame(gameId: string, gameState: GameState): Promise<void> {
    // Clean up undefined fields before saving
    const cleanState: any = { ...gameState };
    if (cleanState.exchangeCards === undefined) {
      delete cleanState.exchangeCards;
    }
    await set(ref(database, `games/${gameId}`), cleanState);
  }

  // Get game state
  static async getGame(gameId: string): Promise<GameState | null> {
    const snapshot = await get(ref(database, `games/${gameId}`));
    if (!snapshot.exists()) {
      return null;
    }
    
    const rawData = snapshot.val();
    return this.normalizeGameState(rawData, gameId);
  }

  // Update game state
  static async updateGame(gameId: string, updates: Partial<GameState> | GameState): Promise<void> {
    // Prepare updates for Firebase - remove undefined values and handle exchangeCards
    const firebaseUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        firebaseUpdates[key] = value;
      }
    }
    
    // If exchangeCards is explicitly undefined, remove it from Firebase
    if ('exchangeCards' in updates && updates.exchangeCards === undefined) {
      // First update all other fields
      delete firebaseUpdates.exchangeCards;
      await update(ref(database, `games/${gameId}`), firebaseUpdates);
      // Then remove exchangeCards field
      await update(ref(database, `games/${gameId}/exchangeCards`), null);
    } else {
      // Normal update
      await update(ref(database, `games/${gameId}`), firebaseUpdates);
    }
  }

  // Listen to game state changes
  static subscribeToGame(
    gameId: string,
    callback: (gameState: GameState | null) => void
  ): () => void {
    const gameRef = ref(database, `games/${gameId}`);
    
    onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        callback(this.normalizeGameState(rawData, gameId));
      } else {
        callback(null);
      }
    });

    // Return unsubscribe function
    return () => {
      off(gameRef);
    };
  }

  // Add player to game
  static async addPlayerToGame(gameId: string, playerId: string, playerName: string): Promise<void> {
    try {
      const gameRef = ref(database, `games/${gameId}`);
      const snapshot = await get(gameRef);
      
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }

      const rawData = snapshot.val();
      const gameState = this.normalizeGameState(rawData, gameId);
      
      const { GameStateManager } = require('../game/GameState');
      const updatedState = GameStateManager.addPlayer(gameState, playerId, playerName);
      
      // Clean up undefined fields before saving
      const cleanState: any = { ...updatedState };
      if (cleanState.exchangeCards === undefined) {
        delete cleanState.exchangeCards;
      }
      await set(gameRef, cleanState);
    } catch (error: any) {
      console.error('Error adding player to game:', error);
      throw new Error(`Failed to add player: ${error.message || 'Unknown error'}`);
    }
  }

  // Remove player from game
  static async removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) return;

    const games = snapshot.val();
    for (const [gameId, rawGameState] of Object.entries(games)) {
      const state = this.normalizeGameState(rawGameState as any, gameId);
      const players = state.players || [];
      if (players.some(p => p.id === playerId)) {
        const updatedPlayers = players.filter(p => p.id !== playerId);
        
        // If no players left, delete game
        if (updatedPlayers.length === 0) {
          await remove(ref(database, `games/${gameId}`));
        } else {
          // Reassign host if needed
          if (players.find(p => p.id === playerId)?.isHost && updatedPlayers.length > 0) {
            updatedPlayers[0].isHost = true;
          }
          
          await update(ref(database, `games/${gameId}`), {
            players: updatedPlayers,
          });
        }
        break;
      }
    }
  }

  // Generate unique game ID
  static generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique player ID
  static generatePlayerId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

