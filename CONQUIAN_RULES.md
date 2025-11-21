# Conquian Rules Implementation

Based on the official rules from [pagat.com](https://www.pagat.com/rummy/conquian.html#mexican)

## ✅ Implemented Correctly

### Card Values
- **Ace (A) = 1** - Always low, next to 2
- **2-7** = 2-7 (standard)
- **Jack (J) = 10** - Also called "sota" in Spanish
- **Queen (Q) = 11** - Also called "caballo" (horseman) in Spanish  
- **King (K) = 12** - Also called "rey" in Spanish

### Sequence Rules
- ✅ Ace is always low (A-2-3 is valid)
- ✅ 7 connects to Jack (6-7-J is valid)
- ✅ No wrap-around (K-A-2 is **invalid**, J-Q-K is valid)
- ✅ Sequences must be same suit and consecutive

### Meld Types
- ✅ **Set (tercia)**: 3-4 cards of same rank
- ✅ **Sequence (escalera)**: 3+ consecutive cards of same suit

### Basic Gameplay
- ✅ 8 cards dealt to each player
- ✅ Win condition: 9 cards melded (11 total including face-up card)
- ✅ Cards can be rearranged between melds
- ✅ Forcing mechanism partially implemented

## ⚠️ Differences from Official Rules

### Player Count
- **Current**: 4 players (with AI)
- **Official**: 2-3 players for Mexican Conquian, 2 players for Anglo-American
- **Note**: 4 players works but is a variant

### The Exchange (Cambio)
- **Missing**: Initial card passing phase
- **Official Rule**: Before first turn, each player passes one unwanted card face down to the player on their right simultaneously
- **Status**: Not implemented yet

### Turn Order
- **Current**: Counter-clockwise
- **Official**: Anti-clockwise (same thing, but first turn has special rules)
- **Note**: First player to dealer's right turns first card, with specific passing rules

### Forcing Mechanism
- **Current**: Basic forcing when card can be added to meld
- **Official**: More complex rules about priority and when forcing can occur
- **Status**: Partially implemented, needs refinement

### Win Condition
- **Current**: 9 cards melded
- **Official**: 9 cards melded + 11th card from face-up pile
- **Status**: Needs update to require the 11th card comes from discard/face-up

## 📝 Notes

The current implementation follows the core Conquian rules with some simplifications:
- Card values and sequences are now correct
- Meld validation matches official rules
- The game is playable and fun, even with 4 players

For a fully authentic experience, consider implementing:
1. The Exchange (cambio) phase
2. Proper 2-3 player support
3. Enhanced forcing rules
4. Win condition requiring 11th card from face-up

## References

- [Pagat.com Conquian Rules](https://www.pagat.com/rummy/conquian.html#mexican)
- Mexican Conquian: 2-3 players, Spanish 40-card deck
- Anglo-American Conquian: 2 players, 40-card deck (52-card pack minus 8s, 9s, 10s)

