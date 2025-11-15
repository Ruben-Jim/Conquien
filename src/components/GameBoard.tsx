import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { PlayerHand } from './PlayerHand';
import { MeldArea } from './MeldArea';
import { GameState, Player } from '../game/GameState';
import { Card as CardType } from '../game/CardUtils';
import { colors } from '../theme/colors';
import { canAddToMeld } from '../game/GameRules';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  onDrawCard: (fromDiscard: boolean) => void;
  onDiscardCard: (cardId: string) => void;
  onCardSelect: (cardId: string) => void;
  onCreateMeld: (cardIds: string[]) => void;
  onAddToMeld: (cardId: string, meldId: string) => void;
  selectedCards: string[];
  canDraw: boolean;
  canDiscard: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  onDrawCard,
  onDiscardCard,
  onCardSelect,
  onCreateMeld,
  onAddToMeld,
  selectedCards,
  canDraw,
  canDiscard,
}) => {
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === currentPlayerId);
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  const handleCreateMeld = () => {
    if (selectedCards.length >= 3) {
      onCreateMeld(selectedCards);
    }
  };

  return (
    <View style={styles.container}>
      {/* Other players' melds */}
      {gameState.players
        .filter(p => p.id !== currentPlayerId)
        .map((player) => (
          <MeldArea
            key={player.id}
            melds={gameState.melds}
            playerId={player.id}
            showPlayerName={true}
            selectedCard={null}
          />
        ))}

      {/* Discard pile and draw pile */}
      <View style={styles.pileContainer}>
        <View style={styles.pile}>
          <Text style={styles.pileLabel}>Draw Pile</Text>
          <Text style={styles.pileCount}>{gameState.drawPile.length}</Text>
          {canDraw && isCurrentTurn && (
            <TouchableOpacity
              style={styles.drawButton}
              onPress={() => onDrawCard(false)}
            >
              <Text style={styles.buttonText}>Draw</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pile}>
          <Text style={styles.pileLabel}>Discard Pile</Text>
          {topDiscard ? (
            <>
              <Card card={topDiscard} size="medium" />
              {canDraw && isCurrentTurn && (
                <TouchableOpacity
                  style={styles.drawButton}
                  onPress={() => onDrawCard(true)}
                >
                  <Text style={styles.buttonText}>Take</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.emptyPile}>Empty</Text>
          )}
        </View>
      </View>

      {/* Current player's melds */}
      {currentPlayer && (
        <View>
          <MeldArea
            melds={gameState.melds}
            playerId={currentPlayerId}
            onCardPress={(cardId, meldId) => onCardPress(cardId)}
            onMeldPress={(meldId) => {
              if (selectedCards.length === 1) {
                onAddToMeld(selectedCards[0], meldId);
              }
            }}
            selectedCard={selectedCards.length === 1 ? currentPlayer.hand.find(c => c.id === selectedCards[0]) || null : null}
            showPlayerName={true}
          />
          {selectedCards.length === 1 && isCurrentTurn && (
            <Text style={styles.hintText}>
              Tap a highlighted meld above to add the selected card, or create a new meld
            </Text>
          )}
        </View>
      )}

      {/* Current player's hand */}
      {currentPlayer && (
        <View style={styles.playerSection}>
          <PlayerHand
            cards={currentPlayer.hand}
            onCardPress={onCardSelect}
            selectedCards={selectedCards}
            disabled={!isCurrentTurn}
          />
          
          {isCurrentTurn && (
            <View style={styles.actionButtons}>
              {selectedCards.length >= 3 && (
                <TouchableOpacity
                  style={styles.meldButton}
                  onPress={handleCreateMeld}
                >
                  <Text style={styles.buttonText}>Create Meld</Text>
                </TouchableOpacity>
              )}
              {selectedCards.length === 1 && canDiscard && (
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => onDiscardCard(selectedCards[0])}
                >
                  <Text style={styles.buttonText}>Discard</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!isCurrentTurn && (
            <Text style={styles.waitingText}>Waiting for your turn...</Text>
          )}
        </View>
      )}

      {/* Turn indicator */}
      <View style={styles.turnIndicator}>
        <Text style={styles.turnText}>
          Current Turn: {gameState.players[gameState.currentPlayerIndex]?.name || 'Unknown'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.background,
  },
  pileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  pile: {
    alignItems: 'center',
    padding: 10,
  },
  pileLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  pileCount: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  emptyPile: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  drawButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  playerSection: {
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  meldButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discardButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  waitingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  turnIndicator: {
    backgroundColor: colors.currentTurn,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  turnText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.text,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

