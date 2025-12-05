import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../constants/theme';

const ResetSuccessScreen = ({ onDone }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={onDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            {/* Success Icon with gradient effect */}
            <View style={styles.iconContainer}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <View style={styles.checkSquare}>
                    <Icon name="check" size={24} color={colors.pink} />
                  </View>
                </View>
              </View>
              {/* Decorative dots */}
              <View style={[styles.decorativeDot, styles.dot1]} />
              <View style={[styles.decorativeDot, styles.dot2]} />
              <View style={[styles.decorativeDot, styles.dot3]} />
              <View style={[styles.decorativeDot, styles.dot4]} />
            </View>

            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.caption}>Your account is ready to use</Text>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={onDone}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryText}>Go to Homepage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    backgroundColor: colors.bg,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.pink,
  },
  decorativeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    opacity: 0.6,
  },
  dot1: {
    top: 10,
    left: 20,
  },
  dot2: {
    top: 20,
    right: 15,
  },
  dot3: {
    bottom: 15,
    left: 15,
  },
  dot4: {
    bottom: 10,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.pink,
    marginBottom: 12,
    textAlign: 'center',
  },
  caption: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.pink,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetSuccessScreen;

