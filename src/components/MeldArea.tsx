import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Meld, canAddToMeld } from '../game/GameRules';
import { colors } from '../theme/colors';
import { Card as CardType } from '../game/CardUtils';

interface MeldAreaProps {
  melds: Meld[];
  playerId: string;
  onCardPress?: (cardId: string, meldId: string) => void;
  onMeldPress?: (meldId: string) => void;
  selectedCard?: CardType | null;
  showPlayerName?: boolean;
  playerName?: string; // Optional player name to display
}

export const MeldArea: React.FC<MeldAreaProps> = ({
  melds,
  playerId,
  onCardPress,
  onMeldPress,
  selectedCard,
  showPlayerName = false,
  playerName,
}) => {
  const playerMelds = melds.filter(m => m.playerId === playerId);

  if (playerMelds.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showPlayerName && (
        <Text style={styles.playerName}>
          {playerName || (playerMelds[0].playerId === playerId ? 'Your Melds' : `Player ${playerId.slice(-4)}'s Melds`)}
        </Text>
      )}
      {playerMelds.map((meld) => {
        const canAddSelected = selectedCard && canAddToMeld(selectedCard, [meld]);
        const MeldWrapper = canAddSelected && onMeldPress ? TouchableOpacity : View;
        
        return (
          <MeldWrapper
            key={meld.id}
            style={[
              styles.meldContainer,
              canAddSelected && styles.meldContainerHighlighted,
            ]}
            onPress={canAddSelected ? () => onMeldPress?.(meld.id) : undefined}
            disabled={!canAddSelected}
          >
            <Text style={styles.meldType}>
              {meld.type === 'set' ? 'Set' : 'Sequence'} ({meld.cards.length} cards)
              {canAddSelected && ' - Tap to add card!'}
            </Text>
            <View style={styles.cardsContainer}>
              {meld.cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onPress={() => onCardPress?.(card.id, meld.id)}
                  size="small"
                />
              ))}
            </View>
          </MeldWrapper>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  meldContainer: {
    marginBottom: 10,
  },
  meldContainerHighlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 5,
    backgroundColor: colors.backgroundDark,
  },
  meldType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

