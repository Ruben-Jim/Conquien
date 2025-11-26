import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Card as CardType } from '../game/CardUtils';
import { sortCards } from '../game/CardUtils';
import { colors } from '../theme/colors';

interface PlayerHandProps {
  cards: CardType[];
  onCardPress?: (cardId: string) => void;
  selectedCards?: string[];
  disabled?: boolean;
  showSortButton?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards = [],
  onCardPress,
  selectedCards = [],
  disabled = false,
  showSortButton = true,
}) => {
  const [sorted, setSorted] = useState(false);
  const [displayCards, setDisplayCards] = useState(cards || []);

  React.useEffect(() => {
    setDisplayCards(sorted ? sortCards(cards) : cards);
  }, [cards, sorted]);

  const handleSort = () => {
    setSorted(!sorted);
    setDisplayCards(sorted ? cards : sortCards(cards));
  };

  return (
    <View style={styles.container}>
      {showSortButton && (
        <View style={styles.header}>
          <Text style={styles.label}>Your Hand ({cards.length} cards)</Text>
          <TouchableOpacity
            onPress={handleSort}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={styles.sortButton}>
              {sorted ? 'Unsort' : 'Sort'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.handContainer}
      >
        {displayCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onPress={() => onCardPress?.(card.id)}
            selected={selectedCards.includes(card.id)}
            disabled={disabled}
            size="medium"
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: colors.backgroundDark,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  sortButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 44, // Minimum touch target for mobile
    textAlignVertical: 'center',
  },
  handContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
});

