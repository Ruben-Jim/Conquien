import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameState } from '../game/GameState';
import { Card } from './Card';
import { PlayerHand } from './PlayerHand';
import { colors } from '../theme/colors';

interface ExchangePhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onSelectCard: (cardId: string) => void;
}

export const ExchangePhase: React.FC<ExchangePhaseProps> = ({
  gameState,
  currentPlayerId,
  onSelectCard,
}) => {
  const insets = useSafeAreaInsets();
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const exchangeCards = gameState.exchangeCards || {};
  const selectedCardId = exchangeCards[currentPlayerId];
  
  // Find next player (clockwise - to the right)
  const sortedPlayers = [...gameState.players].sort((a, b) => (a.seat || 0) - (b.seat || 0));
  const currentPlayerIndex = sortedPlayers.findIndex(p => p.id === currentPlayerId);
  const nextPlayerIndex = (currentPlayerIndex + 1) % sortedPlayers.length;
  const nextPlayer = sortedPlayers[nextPlayerIndex];

  const allPlayersSelected = gameState.players.every(p => exchangeCards[p.id]);

  if (!currentPlayer) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 20 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>The Exchange (Cambio)</Text>
        <Text style={styles.subtitle}>
          Select one card to pass to {nextPlayer.name}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {allPlayersSelected 
            ? 'All players ready! Exchanging cards...'
            : `${gameState.players.filter(p => exchangeCards[p.id]).length}/${gameState.players.length} players have selected`}
        </Text>
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand - Select one card to exchange:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {currentPlayer.hand.map((card) => {
            const isSelected = card.id === selectedCardId;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => onSelectCard(card.id)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.cardWrapper, isSelected && styles.cardWrapperSelected]}>
                  <Card
                    card={card}
                    size="medium"
                    selected={isSelected}
                    disabled={false}
                  />
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedCardId && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>
            ✓ You will pass this card to {nextPlayer.name}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: colors.backgroundDark,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  handContainer: {
    marginBottom: 20,
  },
  handLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  cardWrapper: {
    marginRight: 10,
    alignItems: 'center',
  },
  cardWrapperSelected: {
    transform: [{ scale: 1.1 }],
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  selectedBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmationContainer: {
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmationText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

