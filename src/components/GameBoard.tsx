import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
  const [showDebugView, setShowDebugView] = useState(false);
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === currentPlayerId);
  const discardPile = gameState.discardPile || [];
  const drawPile = gameState.drawPile || [];
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  const handleCreateMeld = () => {
    if (selectedCards.length >= 3) {
      onCreateMeld(selectedCards);
    }
  };

  return (
    <View style={styles.container}>
      {/* Debug toggle button */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setShowDebugView(!showDebugView)}
      >
        <Text style={styles.debugButtonText}>
          {showDebugView ? 'Hide' : 'Show'} All Cards
        </Text>
      </TouchableOpacity>

      {/* Debug view - show all players' cards */}
      {showDebugView && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>All Players' Cards (Debug View)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {gameState.players.map((player) => (
              <View key={player.id} style={styles.debugPlayerSection}>
                <Text style={styles.debugPlayerName}>
                  {player.name}
                </Text>
                <Text style={styles.debugCardCount}>
                  {(player.hand || []).length} cards
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.debugHand}
                >
                  {(player.hand || []).map((card) => (
                    <Card
                      key={card.id}
                      card={card}
                      size="small"
                      disabled={true}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Other players' info and melds */}
      {gameState.players
        .filter(p => p.id !== currentPlayerId)
        .map((player) => (
          <View key={player.id} style={styles.otherPlayerSection}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerInfoText}>
                {player.name} - {(player.hand || []).length} cards
              </Text>
              {gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === player.id) && (
                <Text style={styles.currentTurnBadge}>Current Turn</Text>
              )}
            </View>
            
            {/* Show other players' cards as face-down placeholders - always hidden */}
            {(player.hand || []).length > 0 && (
              <View style={styles.otherPlayerHand}>
                <Text style={styles.otherPlayerHandLabel}>
                  Hand: {(player.hand || []).length} cards (face down)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.otherPlayerHandContainer}
                >
                  {(player.hand || []).map((card, index) => (
                    <Card
                      key={`${player.id}-${index}`}
                      card={card}
                      size="small"
                      faceDown={true}
                      disabled={true}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <MeldArea
              melds={gameState.melds}
              playerId={player.id}
              showPlayerName={false}
              selectedCard={null}
              playerName={player.name}
            />
          </View>
        ))}

      {/* Discard pile and draw pile */}
      <View style={styles.pileContainer}>
        <View style={styles.pile}>
          <Text style={styles.pileLabel}>Draw Pile</Text>
          <Text style={styles.pileCount}>{drawPile.length}</Text>
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
            selectedCard={selectedCards.length === 1 ? (currentPlayer.hand || []).find(c => c.id === selectedCards[0]) || null : null}
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
            cards={currentPlayer.hand || []}
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
  otherPlayerSection: {
    marginBottom: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    marginBottom: 5,
  },
  playerInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  currentTurnBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugButton: {
    backgroundColor: colors.info,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugContainer: {
    backgroundColor: colors.backgroundDark,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.info,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  debugPlayerSection: {
    marginRight: 15,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 6,
    minWidth: 200,
  },
  debugPlayerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  debugCardCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debugHand: {
    maxHeight: 100,
  },
  otherPlayerHand: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
  otherPlayerHandLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  otherPlayerHandContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
});

