import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGameState } from '../../src/hooks/useGameState';
import { GameService } from '../../src/services/GameService';
import { colors } from '../../src/theme/colors';

export default function LobbyScreen() {
  const router = useRouter();
  const { gameId, playerId } = useLocalSearchParams<{ gameId: string; playerId: string }>();
  const { gameState, loading } = useGameState(gameId || null);

  useEffect(() => {
    if (gameState?.status === 'playing') {
      router.replace(`/game/${gameId}?playerId=${playerId}`);
    }
  }, [gameState?.status, gameId, playerId]);

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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
