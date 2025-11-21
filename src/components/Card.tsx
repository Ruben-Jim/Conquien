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
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#DC143C', // Crimson red
  diamonds: '#DC143C', // Crimson red
  clubs: '#000000', // Black
  spades: '#000000', // Black
};

const RANK_DISPLAY: Record<string, string> = {
  'A': 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
};

export const Card: React.FC<CardProps> = ({
  card,
  onPress,
  selected = false,
  disabled = false,
  size = 'medium',
  faceDown = false,
}) => {
  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const rankDisplay = RANK_DISPLAY[card.rank] || card.rank;

  const sizeStyles = {
    small: { 
      width: 50, 
      height: 70, 
      cornerFontSize: 10,
      centerFontSize: 24,
      borderRadius: 6,
      padding: 3,
    },
    medium: { 
      width: 65, 
      height: 91, 
      cornerFontSize: 12,
      centerFontSize: 32,
      borderRadius: 8,
      padding: 4,
    },
    large: { 
      width: 80, 
      height: 112, 
      cornerFontSize: 14,
      centerFontSize: 40,
      borderRadius: 10,
      padding: 5,
    },
  };

  const currentSize = sizeStyles[size];

  const cardStyle = [
    styles.card,
    {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.borderRadius,
      padding: currentSize.padding,
    },
    selected && styles.selected,
    disabled && styles.disabled,
  ];

  const Content = faceDown ? (
    <View style={[cardStyle, styles.cardBack]}>
      <View style={styles.cardBackPattern}>
        <Text style={styles.cardBackText}>♠</Text>
        <Text style={styles.cardBackText}>♥</Text>
        <Text style={styles.cardBackText}>♦</Text>
        <Text style={styles.cardBackText}>♣</Text>
      </View>
    </View>
  ) : (
    <View style={cardStyle}>
      {/* Top-left corner */}
      <View style={[styles.corner, styles.cornerTopLeft]}>
        <Text style={[styles.cornerRank, { fontSize: currentSize.cornerFontSize, color: suitColor }]}>
          {rankDisplay}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: currentSize.cornerFontSize * 0.85, color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>

      {/* Center suit symbol */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, { fontSize: currentSize.centerFontSize, color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>

      {/* Bottom-right corner (rotated) */}
      <View style={[styles.corner, styles.cornerBottomRight]}>
        <Text style={[styles.cornerRank, { fontSize: currentSize.cornerFontSize, color: suitColor }]}>
          {rankDisplay}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: currentSize.cornerFontSize * 0.85, color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    margin: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'space-between',
    alignItems: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    // Add subtle gradient effect with border
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  corner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: {
    fontWeight: 'bold',
    lineHeight: 14,
  },
  cornerSuit: {
    lineHeight: 12,
    marginTop: -2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    minHeight: 40,
  },
  centerSuit: {
    fontWeight: 'normal',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 3,
    transform: [{ translateY: -8 }, { scale: 1.08 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  cardBack: {
    backgroundColor: '#1a237e',
    borderColor: '#0d47a1',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Add pattern effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  cardBackPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: 8,
  },
  cardBackText: {
    color: '#FFFFFF',
    fontSize: 20,
    opacity: 0.25,
    margin: 2,
  },
});

