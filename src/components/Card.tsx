import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card as CardType, Suit } from '../game/CardUtils';
import { colors } from '../theme/colors';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: colors.hearts,
  diamonds: colors.diamonds,
  clubs: colors.clubs,
  spades: colors.spades,
};

export const Card: React.FC<CardProps> = ({
  card,
  onPress,
  selected = false,
  disabled = false,
  size = 'medium',
}) => {
  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  const sizeStyles = {
    small: { width: 50, height: 70, fontSize: 14 },
    medium: { width: 60, height: 84, fontSize: 16 },
    large: { width: 70, height: 98, fontSize: 18 },
  };

  const cardStyle = [
    styles.card,
    sizeStyles[size],
    selected && styles.selected,
    disabled && styles.disabled,
  ];

  const Content = (
    <View style={cardStyle}>
      <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
      <Text style={[styles.suit, { color: suitColor }]}>{suitSymbol}</Text>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: 4,
    margin: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  suit: {
    fontSize: 24,
    textAlign: 'center',
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 3,
    transform: [{ translateY: -5 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

