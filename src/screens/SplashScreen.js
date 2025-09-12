import React, { useEffect, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
} from 'react-native';

const SplashScreen = ({ onFinish }) => {
  const [logoScale] = useState(new Animated.Value(0.8));
  const [logoOpacity] = useState(new Animated.Value(0));
  const [decorativeOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();


    
    Animated.timing(decorativeOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Auto navigate to onboarding after 3 seconds
    setTimeout(() => {
      onFinish();
    }, 3000);
  }, [onFinish]);

  return (
    <View style={styles.content}>
      
      <Animated.View style={[styles.decorativeCircle1, { opacity: decorativeOpacity }]} />
      <Animated.View style={[styles.decorativeCircle2, { opacity: decorativeOpacity }]} />
      <Animated.View style={[styles.decorativeCircle3, { opacity: decorativeOpacity }]} />
      <Animated.View style={[styles.decorativeCircle4, { opacity: decorativeOpacity }]} />
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]}
      >
        <View style={styles.logo}>
          <View style={styles.logoInner} />
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.loadingContainer, { opacity: decorativeOpacity }]}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B9D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFB6C1',
    top: '25%',
    left: '20%',
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B9D',
    top: '30%',
    right: '25%',
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFB6C1',
    bottom: '35%',
    left: '15%',
  },
  decorativeCircle4: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B9D',
    bottom: '40%',
    right: '20%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B9D',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});

export default SplashScreen;
