# אוצרות אוצרות - מחשבון ניקוד

A mobile-friendly score calculator and tracker for the **Otzarot Otzarot** (אוצרות אוצרות) board game.

## Features

- **Player Setup**: Support for 2-4 players with custom names
- **Score Calculator**: Input dice results and automatically calculate scores based on game rules
- **Fortune Cards**: All fortune card effects are supported (Gold, Diamond, Skulls, Monkey Business, Sorceress, Treasure Chest, Naval Battles)
- **Scoring Rules**:
  - Sets of identical dice (3-8 of a kind)
  - Individual diamond and gold coin bonuses (+100 each)
  - Full chest bonus (all 8 dice scoring)
  - Naval battle win/loss
  - Island of Skulls mechanic
- **Score History**: View complete turn-by-turn history for each player
- **Manual Score Entry**: Enter scores manually when needed
- **Undo**: Undo the last turn
- **Game State Persistence**: Game saves automatically to localStorage
- **Rules Reference**: Built-in quick rules reference
- **Mobile First**: Designed for mobile phones with touch-friendly controls

## How to Use

1. Open `index.html` in a browser
2. Set up players (2-4) and enter names
3. Each turn: tap "Calculate Score", select fortune card, input dice results
4. The calculator shows a real-time score breakdown
5. Confirm to add the score. First player to 8,000 wins!

## Game Rules Summary

| Set Size | Points |
|----------|--------|
| 3 of a kind | 100 |
| 4 of a kind | 200 |
| 5 of a kind | 500 |
| 6 of a kind | 1,000 |
| 7 of a kind | 2,000 |
| 8 of a kind | 4,000 |

- Each 💎 Diamond = +100 bonus
- Each 💰 Gold Coin = +100 bonus
- 💀 3+ Skulls = Bust (0 points)
- 📦 All 8 dice scoring = +500 Full Chest bonus
- ⚔️ Naval battles: Win for bonus, fail for penalty
