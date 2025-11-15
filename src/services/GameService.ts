import { FirebaseService } from './FirebaseService';
import { GameState, GameStateManager } from '../game/GameState';
import { Card } from '../game/CardUtils';
import { Meld } from '../game/GameRules';

export class GameService {
  // Create or get the main table game
  static async getOrCreateTable(): Promise<string> {
    const gameId = 'main-table'; // Single table for all players
    const existingGame = await FirebaseService.getGame(gameId);
    
    if (!existingGame) {
      const gameState = GameStateManager.createGame(gameId);
      await FirebaseService.createGame(gameId, gameState);
    }
    
    return gameId;
  }

  // Join an existing game
  static async joinGame(gameId: string, playerId: string, playerName: string): Promise<void> {
    await FirebaseService.addPlayerToGame(gameId, playerId, playerName);
  }

  // Select a seat
  static async selectSeat(gameId: string, playerId: string, seat: number): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.selectSeat(gameState, playerId, seat);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Toggle ready status
  static async toggleReady(gameId: string, playerId: string): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.toggleReady(gameState, playerId);
    await FirebaseService.updateGame(gameId, updatedState);

    // Auto-start if all 4 players are ready
    if (GameStateManager.canStartGame(updatedState)) {
      const startedState = GameStateManager.startGame(updatedState);
      await FirebaseService.updateGame(gameId, startedState);
    }
  }

  // Start the game (auto-starts when all ready, but can be manual too)
  static async startGame(gameId: string): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.startGame(gameState);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Draw a card
  static async drawCard(
    gameId: string,
    playerId: string,
    fromDiscard: boolean
  ): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.drawCard(gameState, playerId, fromDiscard);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Discard a card
  static async discardCard(gameId: string, playerId: string, cardId: string): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.discardCard(gameState, playerId, cardId);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Create a meld
  static async createMeld(gameId: string, playerId: string, cardIds: string[]): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.createMeld(gameState, playerId, cardIds);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Add card to existing meld
  static async addCardToMeld(
    gameId: string,
    playerId: string,
    cardId: string,
    meldId: string
  ): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.addCardToMeld(gameState, playerId, cardId, meldId);
    await FirebaseService.updateGame(gameId, updatedState);
  }

  // Get game state
  static async getGameState(gameId: string): Promise<GameState | null> {
    return await FirebaseService.getGame(gameId);
  }

  // Subscribe to game state changes
  static subscribeToGameState(
    gameId: string,
    callback: (gameState: GameState | null) => void
  ): () => void {
    return FirebaseService.subscribeToGame(gameId, callback);
  }
}

