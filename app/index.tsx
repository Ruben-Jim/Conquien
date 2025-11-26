import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GameService } from '../src/services/GameService';
import { FirebaseService } from '../src/services/FirebaseService';
import { colors } from '../src/theme/colors';
import { database } from '../firebase.config';
import { ref, get } from 'firebase/database';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    console.log('handleJoinTable called');
    
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (loading) {
      console.log('Already loading, ignoring press');
      return;
    }

    console.log('Setting loading to true');
    setLoading(true);
    
    try {
      console.log('Starting join table process...');
      const playerId = FirebaseService.generatePlayerId();
      console.log('Generated playerId:', playerId);
      
      const gameId = await GameService.getOrCreateTable();
      console.log('Got gameId:', gameId);
      
      await GameService.joinGame(gameId, playerId, playerName.trim());
      console.log('Joined game successfully');
      
      const lobbyPath = `/lobby/${gameId}?playerId=${playerId}` as any;
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        bounces={false}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
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
            returnKeyType="done"
            onSubmitEditing={handleJoinTable}
            autoCorrect={false}
            autoComplete="name"
            textContentType="name"
            clearButtonMode="while-editing"
            enablesReturnKeyAutomatically={true}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.joinButton,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleJoinTable}
            disabled={loading}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            accessible={true}
            accessibilityLabel="Join Table"
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={styles.buttonText}>Join Table</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
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
    minHeight: 44, // Minimum touch target for mobile
    textAlignVertical: 'center',
    // Better mobile input styling
    includeFontPadding: false,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 56, // Increased minimum touch target for mobile (56px is better for mobile)
    minWidth: '100%',
    justifyContent: 'center',
    // Ensure button is above other elements
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10, // Ensure button is on top
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
    // Ensure text doesn't block touches
    pointerEvents: 'none',
  },
});

