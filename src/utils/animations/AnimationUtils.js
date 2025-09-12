import { Animated, Easing } from 'react-native';
export class AnimationManager {
  constructor() {
    this.activeAnimations = new Set();
    this.isPaused = false;
  }
  //resuable floating animation
  createFloatingAnimation(animatedValue, options = {}) {
    const {
      duration = 1800,
      delay = 0,
      range = [-6, 6],
      easing = Easing.inOut(Easing.sin)
    } = options;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ])
    );

    this.activeAnimations.add(animation);
    return { animation, interpolatedValue: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: range
    }) };
  }

  // linear loop animation wheel spinning
  createLinearLoop(animatedValue, options = {}) {
    const { duration = 2000, from = 0, to = 1 } = options;
    animatedValue.setValue(from);
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: to,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    this.activeAnimations.add(animation);
    return animation;
  }

  // bob animation 
  createBobAnimation(animatedValue, options = {}) {
    const {
      duration = 1400,
      range = [0, -8],
      easing = Easing.inOut(Easing.sin)
    } = options;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ])
    );

    this.activeAnimations.add(animation);
    return { animation, interpolatedValue: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: range
    }) };
  }

  // Start all animations
  startAll() {
    if (!this.isPaused) {
      this.activeAnimations.forEach(animation => animation.start());
    }
  }

  stopAll() {
    this.activeAnimations.forEach(animation => animation.stop());
    this.activeAnimations.clear();
  }
  pause() {
    this.isPaused = true;
    this.activeAnimations.forEach(animation => animation.stop());
  }
  resume() {
    this.isPaused = false;
    this.startAll();
  }
}
// decorative elements
export const createSimpleDecorations = (count = 3) => {
  const animations = [];
  const values = [];

  for (let i = 0; i < count; i++) {
    const value = new Animated.Value(0);
    values.push(value);
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 1500 + (i * 200), // Stagger timing
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          delay: i * 200,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 1500 + (i * 200),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animations.push(animation);
  }

  return { animations, values };
};

// Create a linear loop animation (for wheels, etc.)
export const createLinearLoop = (animatedValue, options = {}) => {
  const { duration = 2000 } = options;
  
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    { iterations: -1, resetBeforeIteration: true }
  );
};

// Optimized interpolation 
export const createInterpolation = (animatedValue, outputRange, inputRange = [0, 1]) => {
  return animatedValue.interpolate({ inputRange, outputRange });
};
