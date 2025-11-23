import { FirebaseService } from './FirebaseService';
import { GameState, GameStateManager } from '../game/GameState';
import { Card } from '../game/CardUtils';
import { Meld } from '../game/GameRules';

export class GameService {
  // Create or get the main table game
  static async getOrCreateTable(): Promise<string> {
    try {
      const gameId = 'main-table'; // Single table for all players
      const existingGame = await FirebaseService.getGame(gameId);
      
      if (!existingGame) {
        const gameState = GameStateManager.createGame(gameId);
        await FirebaseService.createGame(gameId, gameState);
      }
      
      return gameId;
    } catch (error: any) {
      console.error('Error getting or creating table:', error);
      throw new Error(`Failed to get or create table: ${error.message || 'Unknown error'}`);
    }
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

    // Don't allow ready toggle if game already started
    if (gameState.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    const updatedState = GameStateManager.toggleReady(gameState, playerId);
    await FirebaseService.updateGame(gameId, updatedState);

    // Auto-start if enough players are ready
    // Fetch latest state after update to get all concurrent updates from other players
    // Retry more times with longer delays to handle Firebase propagation delays
    let retries = 10;
    let currentState: GameState | null = null;
    
    while (retries > 0) {
      // Longer delay to allow Firebase to propagate updates
      await new Promise(resolve => setTimeout(resolve, 200));
      
      currentState = await FirebaseService.getGame(gameId);
      if (!currentState) {
        console.log('Game state not found during retry');
        break;
      }

      // If game already started, we're done
      if (currentState.status !== 'waiting') {
        console.log('Game already started by another player, status:', currentState.status);
        return;
      }

      // Check if all seated players are ready
      const canStart = GameStateManager.canStartGame(currentState);
      const seatedPlayers = currentState.players.filter(p => p.seat !== null);
      const readyPlayers = seatedPlayers.filter(p => p.ready);
      
      console.log(`Retry check: ${readyPlayers.length}/${seatedPlayers.length} ready, canStart: ${canStart}`);
      
      if (canStart) {
        console.log('All players ready, starting game...');
        try {
          // Double-check status hasn't changed (prevent race conditions)
          const finalCheck = await FirebaseService.getGame(gameId);
          if (!finalCheck) {
            console.error('Game state disappeared during final check');
            return;
          }
          
          if (finalCheck.status !== 'waiting') {
            console.log('Game already started during final check, status:', finalCheck.status);
            return;
          }
          
          if (!GameStateManager.canStartGame(finalCheck)) {
            console.log('Game can no longer start (players changed)');
            return;
          }
          
          const startedState = GameStateManager.startGame(finalCheck);
          console.log('Game started with status:', startedState.status);
          console.log('Game state before save:', {
            status: startedState.status,
            players: startedState.players.length,
            exchangeCards: startedState.exchangeCards,
            drawPile: startedState.drawPile.length,
          });
          // Save the full game state - use set to ensure all fields are saved
          await FirebaseService.setGameState(gameId, startedState);
          console.log('Game state saved to Firebase successfully');
          
          // Verify the save worked
          await new Promise(resolve => setTimeout(resolve, 100));
          const verifyState = await FirebaseService.getGame(gameId);
          if (verifyState && verifyState.status === 'exchanging') {
            console.log('Game state verified, status is now:', verifyState.status);
          } else {
            console.error('Game state verification failed! Status:', verifyState?.status);
          }
          
          return;
        } catch (error: any) {
          console.error('Error starting game:', error);
          // Don't throw error here - the ready status was already updated successfully
          // The game will start when another player toggles ready or when the state syncs
          return;
        }
      }
      
      retries--;
    }
    
    // If we exhausted retries and still can't start, log for debugging
    if (currentState) {
      const seatedPlayers = currentState.players.filter(p => p.seat !== null);
      const readyPlayers = seatedPlayers.filter(p => p.ready);
      console.log(`Retries exhausted. Not all players ready: ${readyPlayers.length}/${seatedPlayers.length} ready`);
      console.log('Player states:', currentState.players.map(p => ({
        id: p.id,
        seat: p.seat,
        ready: p.ready
      })));
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

  // Select card to exchange (cambio phase)
  static async selectExchangeCard(gameId: string, playerId: string, cardId: string): Promise<void> {
    const gameState = await FirebaseService.getGame(gameId);
    if (!gameState) {
      throw new Error('Game not found');
    }

    const updatedState = GameStateManager.selectExchangeCard(gameState, playerId, cardId);
    await FirebaseService.updateGame(gameId, updatedState);

    // Check if all players have selected, then complete exchange
    const allSelected = updatedState.players.every(p => updatedState.exchangeCards?.[p.id]);
    if (allSelected) {
      const completedState = GameStateManager.completeExchange(updatedState);
      await FirebaseService.updateGame(gameId, completedState);
    }
  }

  // Subscribe to game state changes
  static subscribeToGameState(
    gameId: string,
    callback: (gameState: GameState | null) => void
  ): () => void {
    return FirebaseService.subscribeToGame(gameId, callback);
  }
}

