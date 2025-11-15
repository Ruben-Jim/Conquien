import { ref, set, get, onValue, off, push, update, remove, DatabaseReference } from 'firebase/database';
import { database } from '../../firebase.config';
import { GameState } from '../game/GameState';

export class FirebaseService {
  // Create a new game
  static async createGame(gameId: string, gameState: GameState): Promise<void> {
    await set(ref(database, `games/${gameId}`), gameState);
  }

  // Get game state
  static async getGame(gameId: string): Promise<GameState | null> {
    const snapshot = await get(ref(database, `games/${gameId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Update game state
  static async updateGame(gameId: string, updates: Partial<GameState>): Promise<void> {
    await update(ref(database, `games/${gameId}`), updates);
  }

  // Listen to game state changes
  static subscribeToGame(
    gameId: string,
    callback: (gameState: GameState | null) => void
  ): () => void {
    const gameRef = ref(database, `games/${gameId}`);
    
    onValue(gameRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });

    // Return unsubscribe function
    return () => {
      off(gameRef);
    };
  }

  // Add player to game
  static async addPlayerToGame(gameId: string, playerId: string, playerName: string): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }

    const gameState: GameState = snapshot.val();
    const { GameStateManager } = require('../game/GameState');
    const updatedState = GameStateManager.addPlayer(gameState, playerId, playerName);
    
    await set(gameRef, updatedState);
  }

  // Remove player from game
  static async removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) return;

    const games = snapshot.val();
    for (const [gameId, gameState] of Object.entries(games)) {
      const state = gameState as GameState;
      if (state.players.some(p => p.id === playerId)) {
        const updatedPlayers = state.players.filter(p => p.id !== playerId);
        
        // If no players left, delete game
        if (updatedPlayers.length === 0) {
          await remove(ref(database, `games/${gameId}`));
        } else {
          // Reassign host if needed
          if (state.players.find(p => p.id === playerId)?.isHost && updatedPlayers.length > 0) {
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

