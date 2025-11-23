import { useState, useEffect } from 'react';
import { GameState } from '../game/GameState';
import { GameService } from '../services/GameService';

export function useGameState(gameId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGameState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial load
    GameService.getGameState(gameId)
      .then(setGameState)
      .catch(err => {
        setError(err.message);
        setGameState(null);
      })
      .finally(() => setLoading(false));

    // Subscribe to real-time updates
    const unsubscribe = GameService.subscribeToGameState(gameId, (state) => {
      console.log('Game state updated:', state?.status, 'players:', state?.players?.length);
      setGameState(state);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  return { gameState, loading, error };
}

