import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGameState } from '../../src/hooks/useGameState';
import { colors } from '../../src/theme/colors';

export default function WinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gameId, playerId } = useLocalSearchParams<{ gameId: string; playerId: string }>();
  const { gameState, loading } = useGameState(gameId || null);

  if (loading || !gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const winner = gameState.players.find(p => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 20 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {isWinner ? (
          <>
            <Text style={styles.winnerText}>🎉 You Won! 🎉</Text>
            <Text style={styles.congratsText}>Congratulations!</Text>
          </>
        ) : (
          <>
            <Text style={styles.loserText}>Game Over</Text>
            <Text style={styles.winnerName}>
              {winner?.name || 'Unknown'} won the game!
            </Text>
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 20,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 24,
    color: colors.text,
    marginBottom: 40,
  },
  loserText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  winnerName: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minHeight: 44, // Minimum touch target for mobile
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});

