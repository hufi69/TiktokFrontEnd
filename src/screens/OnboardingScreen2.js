import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../constants/theme';

// Import the illustration image
const illustrationImage = require('../assets/toktok(2).png');

const OnboardingScreen2 = ({ onNext, onSkip }) => {
  return (
    <View style={styles.onboardingContent}>
      {/* Illustration from assets */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={illustrationImage} 
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.onboardingTitle}>Let's Connect with Everyone in the World</Text>
        <Text style={styles.onboardingDescription}>
          You will be able to connect with your friends and followers and share your moments with them.By sharing your moments with them, you will be able to connect with them and share your moments with them.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Page Indicators */}
      <View style={styles.pageIndicators}>
        <View style={styles.indicator} />
        <View style={[styles.indicator, styles.indicatorActive]} />
        <View style={styles.indicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  onboardingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#F7F7F7',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
    maxHeight: 400,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  onboardingDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  nextButton: {
    backgroundColor: colors.pink,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: colors.pink,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: colors.pink,
    borderRadius: 25,
    backgroundColor: '#FFF5F8',
  },
  skipButtonText: {
    color: colors.pink,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: colors.pink,
    width: 24,
  },
});

export default OnboardingScreen2;

