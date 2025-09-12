import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AnimationManager, createSimpleDecorations } from '../utils/animations/AnimationUtils';

const OnboardingScreen = ({ onNext, onSkip }) => {
  const animationManager = useRef(new AnimationManager()).current;
  const { animations, values } = createSimpleDecorations(2);
  const bob = useRef(new Animated.Value(0)).current; 
  const wheel = useRef(new Animated.Value(0)).current; // spin 0..1

  useEffect(() => {
    // Start decorative
    animations.forEach(animation => animation.start());
    const bobLoop = animationManager.createBobAnimation(bob, { duration: 1600 });
    const wheelLoop = animationManager.createLinearLoop(wheel, { duration: 1800 });
    bobLoop.animation.start();
    wheelLoop.start();

    return () => {
      animations.forEach(animation => animation.stop());
      animationManager.stopAll();
    };
  }, []);

  // Simplified interpolations
  const decorativeTransforms = values.map((value, index) => ({
    translateY: value.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [0, -3 - (index * 2)] 
    }),
    scale: value.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [1, 1.03 + (index * 0.02)] 
    }),
  }));

  // Interpolations
  const bobTranslateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const deckTilt = bob.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '-18deg'] });
  const personTilt = bob.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });
  const armSwing = bob.interpolate({ inputRange: [0, 1], outputRange: ['20deg', '40deg'] });
  const legSwing = bob.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '-6deg'] });
  const wheelSpin = wheel.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.onboardingContent}>
      
      {decorativeTransforms.map((transform, index) => (
        <Animated.View
          key={index}
          style={[
            styles.decorativeElement,
            styles[`decorativeElement${index + 1}`],
            { transform: [{ translateY: transform.translateY }, { scale: transform.scale }] }
          ]}
        />
      ))}

      <View style={styles.illustrationContainer}>
        {/* Person on skateboard (animated) */}
        <Animated.View style={[styles.skateboardContainer, { transform: [{ translateY: bobTranslateY }] }]}>
          {/* Deck */}
          <Animated.View style={[styles.skateboardDeck, { transform: [{ rotate: deckTilt }] }]} />
          {/* Wheels */}
          <Animated.View style={[styles.skateboardWheel, styles.wheelLeft, { transform: [{ rotate: deckTilt }, { rotate: wheelSpin }] }]} />
          <Animated.View style={[styles.skateboardWheel, styles.wheelRight, { transform: [{ rotate: deckTilt }, { rotate: wheelSpin }] }]} />
          {/* Person */}
          <Animated.View style={[styles.person, { transform: [{ translateY: bobTranslateY }, { rotate: personTilt }] }]}>
            <View style={styles.personHead} />
            <View style={styles.personBody} />
            <Animated.View style={[styles.personArm, { transform: [{ rotate: armSwing }] }]} />
            <Animated.View style={[styles.personLeg, { transform: [{ rotate: legSwing }] }]} />
          </Animated.View>
        </Animated.View>
      </View>

     
      <View style={styles.textContainer}>
        <Text style={styles.onboardingTitle}>Tic Toe Social Media{'\n'}App of the Entertainment</Text>
        <Text style={styles.onboardingDescription}>
          You will be able to{'\n'}
          connect with your friends and followers and share your moments with them.
        </Text>
      </View>

      
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

     
      <View style={styles.pageIndicators}>
        <View style={[styles.indicator, styles.indicatorActive]} />
        <View style={styles.indicator} />
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
  },
  decorativeElement: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: '#FF6B9D',
  },
  decorativeElement1: {
    width: 12,
    height: 12,
    top: '15%',
    right: '15%',
  },
  decorativeElement2: {
    width: 8,
    height: 8,
    backgroundColor: 'orange',
    top: '20%',
    left: '10%',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  skateboardContainer: { width: 200, height: 200, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  skateboardDeck: { width: 120, height: 30, backgroundColor: '#2C2C2C', borderRadius: 15, position: 'absolute', bottom: 60 },
  skateboardWheel: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF6B9D', position: 'absolute', bottom: 52 },
  wheelLeft: { left: 50 },
  wheelRight: { right: 50 },
  person: { position: 'absolute', bottom: 80, left: 85 },
  personHead: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2C2C2C', marginBottom: 2 },
  personBody: { width: 16, height: 25, backgroundColor: '#2C2C2C', borderRadius: 8, marginLeft: 2 },
  personArm: { width: 20, height: 4, backgroundColor: '#2C2C2C', borderRadius: 2, position: 'absolute', top: 25, left: -2 },
  personLeg: { width: 4, height: 18, backgroundColor: '#2C2C2C', borderRadius: 2, position: 'absolute', bottom: -18, left: 6 },
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
  },
  buttonContainer: {
    marginBottom: 30,
  },
  nextButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#FF6B9D',
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
  },
  skipButtonText: {
    color: '#999999',
    fontSize: 16,
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
    backgroundColor: '#FF6B9D',
    width: 24,
  },
});

export default OnboardingScreen;
