import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GameService } from '../src/services/GameService';
import { FirebaseService } from '../src/services/FirebaseService';
import { colors } from '../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinTable = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const playerId = FirebaseService.generatePlayerId();
      const gameId = await GameService.getOrCreateTable();
      await GameService.joinGame(gameId, playerId, playerName.trim());
      router.push(`/lobby/${gameId}?playerId=${playerId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conquian</Text>
        <Text style={styles.subtitle}>Spanish Card Game</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.textSecondary}
          value={playerName}
          onChangeText={setPlayerName}
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={[styles.button, styles.joinButton]}
          onPress={handleJoinTable}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Join Table</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

