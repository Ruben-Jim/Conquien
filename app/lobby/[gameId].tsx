import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGameState } from '../../src/hooks/useGameState';
import { GameService } from '../../src/services/GameService';
import { colors } from '../../src/theme/colors';

export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gameId, playerId } = useLocalSearchParams<{ gameId: string; playerId: string }>();
  const { gameState, loading } = useGameState(gameId || null);

  useEffect(() => {
    // Redirect to game when it starts (either exchanging or playing phase)
    if (gameState?.status === 'exchanging' || gameState?.status === 'playing') {
      console.log('Lobby: Game started, redirecting to game screen. Status:', gameState.status);
      router.replace(`/game/${gameId}?playerId=${playerId}`);
    }
  }, [gameState?.status, gameId, playerId, router]);

  // Fallback: Check if game should start but hasn't (in case toggleReady missed it)
  useEffect(() => {
    if (!gameState || gameState.status !== 'waiting' || !gameId || loading) {
      return;
    }

    const seatedCount = gameState.players.filter(p => p.seat !== null).length;
    const allReady = seatedCount >= 2 && 
                     gameState.players.every(p => p.seat === null || p.ready);

    if (allReady) {
      // Wait a bit to see if the game starts automatically (give toggleReady time to work)
      const timeout = setTimeout(async () => {
        // Re-check the state
        const currentState = await GameService.getGameState(gameId);
        if (currentState && currentState.status === 'waiting') {
          const stillAllReady = currentState.players.filter(p => p.seat !== null).length >= 2 &&
                                currentState.players.every(p => p.seat === null || p.ready);
          if (stillAllReady) {
            console.log('Lobby: Fallback - All players ready but game not started, attempting to start...');
            try {
              await GameService.startGame(gameId);
            } catch (error: any) {
              console.error('Lobby: Fallback start game error:', error);
              // If error is that game already started, that's fine
              if (!error.message?.includes('already started')) {
                console.error('Unexpected error starting game:', error);
              }
            }
          }
        }
      }, 2000); // Wait 2 seconds before checking (give toggleReady time)

      return () => clearTimeout(timeout);
    }
  }, [gameState?.status, gameState?.players, gameId, loading]);

  const handleSelectSeat = async (seat: number) => {
    if (!gameId || !playerId) return;

    try {
      await GameService.selectSeat(gameId, playerId, seat);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to select seat');
    }
  };

  const handleToggleReady = async () => {
    if (!gameId || !playerId) return;

    try {
      await GameService.toggleReady(gameId, playerId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle ready status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading table...</Text>
      </View>
    );
  }

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Table not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const seats = [0, 1, 2, 3];
  const readyCount = gameState.players.filter(p => p.ready).length;
  const seatedCount = gameState.players.filter(p => p.seat !== null).length;
  const allReady = seatedCount >= 2 && 
                   gameState.players.every(p => p.seat === null || p.ready);

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
        <Text style={styles.title}>Conquian Table</Text>
        <Text style={styles.subtitle}>
          {seatedCount < 2 
            ? `Need ${2 - seatedCount} more player${2 - seatedCount === 1 ? '' : 's'} to start`
            : `${readyCount}/${seatedCount} players ready`}
        </Text>
      </View>

      <View style={styles.seatsContainer}>
        {seats.map((seat) => {
          const playerInSeat = gameState.players.find(p => p.seat === seat);
          const isCurrentPlayerSeat = currentPlayer?.seat === seat;
          const isSeatAvailable = !playerInSeat;

          return (
            <TouchableOpacity
              key={seat}
              style={[
                styles.seat,
                isCurrentPlayerSeat && styles.seatSelected,
                playerInSeat && !isCurrentPlayerSeat && styles.seatTaken,
              ]}
              onPress={() => {
                if (isSeatAvailable || isCurrentPlayerSeat) {
                  handleSelectSeat(seat);
                }
              }}
              disabled={!isSeatAvailable && !isCurrentPlayerSeat}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.seatNumber}>Seat {seat + 1}</Text>
              {playerInSeat ? (
                <>
                  <Text style={styles.playerName}>{playerInSeat.name}</Text>
                  {playerInSeat.ready ? (
                    <Text style={styles.readyBadge}>✓ Ready</Text>
                  ) : (
                    <Text style={styles.notReadyBadge}>Not Ready</Text>
                  )}
                </>
              ) : (
                <Text style={styles.emptySeat}>Empty</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {currentPlayer && currentPlayer.seat !== null && (
        <View style={styles.readySection}>
          <TouchableOpacity
            style={[
              styles.readyButton,
              currentPlayer.ready && styles.readyButtonActive,
            ]}
            onPress={handleToggleReady}
          >
            <Text style={styles.readyButtonText}>
              {currentPlayer.ready ? 'Not Ready' : 'Ready Up'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentPlayer && currentPlayer.seat === null && (
        <View style={styles.instructionSection}>
          <Text style={styles.instructionText}>
            Select an empty seat to join the game
          </Text>
        </View>
      )}

      {allReady && (
        <View style={styles.startingSection}>
          <Text style={styles.startingText}>Starting game...</Text>
        </View>
      )}
    </ScrollView>
  );
}

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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  seatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  seat: {
    width: '45%',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  seatSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.backgroundDark,
  },
  seatTaken: {
    opacity: 0.7,
  },
  seatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySeat: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  readyBadge: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
    marginTop: 5,
  },
  notReadyBadge: {
    fontSize: 14,
    color: colors.warning,
    marginTop: 5,
  },
  readySection: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
    minHeight: 44, // Minimum touch target for mobile
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: colors.success,
  },
  readyButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionSection: {
    marginTop: 'auto',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startingSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  startingText: {
    fontSize: 18,
    color: colors.success,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 44, // Minimum touch target for mobile
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
});
