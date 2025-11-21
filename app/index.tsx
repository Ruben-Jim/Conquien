import React, { useState, useEffect } from 'react';
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
import { database } from '../firebase.config';
import { ref, get } from 'firebase/database';

export default function HomeScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Test Firebase connection on mount
  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Try to read from a simple path to test connection
        const testRef = ref(database, '.info');
        await get(testRef);
        console.log('Firebase connection: OK');
        setFirebaseReady(true);
      } catch (error: any) {
        console.warn('Firebase connection test failed (may still work):', error?.message);
        // Still allow proceeding - Firebase might work even if this test fails
        setFirebaseReady(true);
      }
    };
    testFirebase();
  }, []);

  const handleJoinTable = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting join table process...');
      const playerId = FirebaseService.generatePlayerId();
      console.log('Generated playerId:', playerId);
      
      const gameId = await GameService.getOrCreateTable();
      console.log('Got gameId:', gameId);
      
      await GameService.joinGame(gameId, playerId, playerName.trim());
      console.log('Joined game successfully');
      
      const lobbyPath = `/lobby/${gameId}?playerId=${playerId}`;
      console.log('Navigating to lobby:', lobbyPath);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        router.replace(lobbyPath);
      }, 100);
    } catch (error: any) {
      console.error('Error joining table:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to join table';
      console.error('Error details:', error);
      Alert.alert('Error', errorMessage);
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
          style={[styles.button, styles.joinButton, loading && styles.buttonDisabled]}
          onPress={() => {
            console.log('Button pressed!');
            handleJoinTable();
          }}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

