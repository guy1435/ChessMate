import React from 'react';
import { Image, StyleSheet } from 'react-native';

const Piece = ({ piece }) => {
  const pieceImages = {
    'RookBlack': require('../assets/images/RookBlack.png'),
    'KnightBlack': require('../assets/images/KnightBlack.png'),
    'BishopBlack': require('../assets/images/BishopBlack.png'),
    'QueenBlack': require('../assets/images/QueenBlack.png'),
    'KingBlack': require('../assets/images/KingBlack.png'),
    'PawnBlack': require('../assets/images/PawnBlack.png'),
    'RookWhite': require('../assets/images/RookWhite.png'),
    'KnightWhite': require('../assets/images/KnightWhite.png'),
    'BishopWhite': require('../assets/images/BishopWhite.png'),
    'QueenWhite': require('../assets/images/QueenWhite.png'),
    'KingWhite': require('../assets/images/KingWhite.png'),
    'PawnWhite': require('../assets/images/PawnWhite.png'),
  };

  return piece ? (
    <Image
      source={pieceImages[piece]}
      style={styles.piece}
      resizeMode="contain"
    />
  ) : null;
};

const styles = StyleSheet.create({
  piece: {
    width: '80%',
    height: '80%',
  },
});

export default Piece;
