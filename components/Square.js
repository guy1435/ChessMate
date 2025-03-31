import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

const Square = ({ backgroundColor, onPress, children }) => {
  return (
    <TouchableOpacity
      style={[styles.square, { backgroundColor }]}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  square: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Square;