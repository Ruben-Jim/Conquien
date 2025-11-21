import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGameState } from '../../src/hooks/useGameState';
import { GameService } from '../../src/services/GameService';
import { GameBoard } from '../../src/components/GameBoard';
import { ExchangePhase } from '../../src/components/ExchangePhase';
import { colors } from '../../src/theme/colors';
import { isValidMeld, canAddToMeld } from '../../src/game/GameRules';
import { Card } from '../../src/game/CardUtils';

export default function GameScreen() {
  const router = useRouter();
  const { gameId, playerId } = useLocalSearchParams<{ gameId: string; playerId: string }>();
  const { gameState, loading } = useGameState(gameId || null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (gameState?.status === 'finished') {
      router.replace(`/win/${gameId}?playerId=${playerId}`);
    }
  }, [gameState?.status, gameId, playerId]);

  useEffect(() => {
    // Reset hasDrawn when turn changes
    if (gameState) {
      const currentPlayerIndex = gameState.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex !== gameState.currentPlayerIndex) {
        setHasDrawn(false);
        setSelectedCards([]);
      }
    }
  }, [gameState?.currentPlayerIndex, playerId]);


  if (loading || !gameState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Player not found in game</Text>
      </View>
    );
  }

  const isCurrentTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === playerId);
  const canDraw = isCurrentTurn && !hasDrawn;
  const canDiscard = isCurrentTurn && hasDrawn && selectedCards.length === 1;

  const handleDrawCard = async (fromDiscard: boolean) => {
    if (!gameId || !playerId) return;

    try {
      await GameService.drawCard(gameId, playerId, fromDiscard);
      setHasDrawn(true);
      
      // Check if the drawn card can be used in existing melds (forced use)
      const updatedState = await GameService.getGameState(gameId);
      if (updatedState) {
        const currentPlayer = updatedState.players.find(p => p.id === playerId);
        if (currentPlayer) {
          const lastCard = currentPlayer.hand[currentPlayer.hand.length - 1];
          const playerMelds = updatedState.melds.filter(m => m.playerId === playerId);
          const canUseInMeld = canAddToMeld(lastCard, playerMelds);
          
          if (canUseInMeld) {
            Alert.alert(
              'Card Can Be Used!',
              'This card can be added to one of your existing melds. Please select the card and the meld to add it to.',
              [{ text: 'OK' }]
            );
          }
        }
      }
      
      setSelectedCards([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to draw card');
    }
  };

  const handleDiscardCard = async (cardId: string) => {
    if (!gameId || !playerId) return;

    try {
      await GameService.discardCard(gameId, playerId, cardId);
      setHasDrawn(false);
      setSelectedCards([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to discard card');
    }
  };

  const handleCardSelect = (cardId: string) => {
    if (!isCurrentTurn || !hasDrawn) return;

    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleCreateMeld = async (cardIds: string[]) => {
    if (!gameId || !playerId) return;

    // Validate meld
    const cards = currentPlayer.hand.filter(c => cardIds.includes(c.id));
    if (!isValidMeld(cards)) {
      Alert.alert('Error', 'Invalid meld. Cards must form a set or sequence.');
      return;
    }

    try {
      await GameService.createMeld(gameId, playerId, cardIds);
      setSelectedCards([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create meld');
    }
  };

  const handleAddToMeld = async (cardId: string, meldId: string) => {
    if (!gameId || !playerId) return;

    try {
      await GameService.addCardToMeld(gameId, playerId, cardId, meldId);
      setSelectedCards([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add card to meld');
    }
  };

  const handleSelectExchangeCard = async (cardId: string) => {
    if (!gameId || !playerId) return;

    try {
      await GameService.selectExchangeCard(gameId, playerId, cardId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to select exchange card');
    }
  };

  // Show exchange phase if game is in exchanging status
  if (gameState.status === 'exchanging') {
    return (
      <View style={styles.container}>
        <ExchangePhase
          gameState={gameState}
          currentPlayerId={playerId!}
          onSelectCard={handleSelectExchangeCard}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameBoard
        gameState={gameState}
        currentPlayerId={playerId!}
        onDrawCard={handleDrawCard}
        onDiscardCard={handleDiscardCard}
        onCardSelect={handleCardSelect}
        onCreateMeld={handleCreateMeld}
        onAddToMeld={handleAddToMeld}
        selectedCards={selectedCards}
        canDraw={canDraw}
        canDiscard={canDiscard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
  },
});

