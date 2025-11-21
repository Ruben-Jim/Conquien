# Card Assets

This directory is for card image assets if you want to use actual card images instead of the styled text-based cards.

## Card Naming Convention

If you add card images, name them using this pattern:
- `{suit}_{rank}.png`
- Examples:
  - `hearts_A.png`
  - `diamonds_7.png`
  - `clubs_K.png`
  - `spades_J.png`

## Card Back

Add a card back image named:
- `card_back.png`

## Supported Formats

- PNG (recommended for transparency)
- JPG
- SVG (if using react-native-svg)

## Image Dimensions

Recommended sizes:
- Small cards: 50x70px
- Medium cards: 65x91px (recommended)
- Large cards: 80x112px

## Usage

Once you add images, update `src/components/CardAssets.ts` to use the image paths.

