import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AnimationManager, createSimpleDecorations } from '../utils/animations/AnimationUtils';

const PINK = '#FF6B9D';
const TEXT = '#2C2C2C';
const MUTED = '#666666';

const WelcomeScreen = ({
  onBack,
  onSignUp,
  onSignInPassword,
  onGoogle,
  onFacebook,
  onApple,
}) => {
  const animationManager = useRef(new AnimationManager()).current;
  const { animations, values } = createSimpleDecorations(3);
  
  // Cat animation values (optimized)
  const catBob = useRef(new Animated.Value(0)).current;
  const catTail = useRef(new Animated.Value(0)).current; 
  const catEar = useRef(new Animated.Value(0)).current;  
  const catBlink = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    // Start decorative animations
    animations.forEach(animation => animation.start());
    
    // Cat: bob, tail wag, ear twitch, blink
    const bob = animationManager.createBobAnimation(catBob, { duration: 1600 });
    const tail = animationManager.createLinearLoop(catTail, { duration: 1200 });
    const ear = animationManager.createFloatingAnimation(catEar, { duration: 1000 });
    bob.animation.start();
    tail.start();
    ear.animation.start();

    const blink = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(catBlink, { toValue: 0.25, duration: 100, useNativeDriver: true }),
        Animated.timing(catBlink, { toValue: 1, duration: 120, useNativeDriver: true }),
      ])
    );
    blink.start();

    return () => {
    
      animations.forEach(animation => animation.stop());
      animationManager.stopAll();
    };
  }, []);

  // interpolations
  const decorativeTransforms = values.map((value, index) => ({
    translateY: value.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [0, -4 - (index * 2)] 
    }),
    scale: value.interpolate({ 
      inputRange: [0, 1], 
      outputRange: [1, 1.02 + (index * 0.01)] 
    }),
  }));

  const catTranslateY = catBob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const tailRotate = catTail.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '342deg'] });
  const earRotate = catEar.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });
  const earRotateOpp = catEar.interpolate({ inputRange: [0, 1], outputRange: ['6deg', '-6deg'] });

  // Edge swipe back handler
  const startX = useRef(0);
  const swipe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        startX.current = evt.nativeEvent.pageX || 0;
        return false;
      },
      onMoveShouldSetPanResponder: (evt, g) => {
        const fromEdge = startX.current <= 32;
        return fromEdge && Math.abs(g.dx) > 12 && Math.abs(g.dy) < 10;
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50 && onBack) onBack();
      },
    })
  ).current;

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
        <Icon name="chevron-left" size={22} color={TEXT} />
      </TouchableOpacity>
     
      {decorativeTransforms.map((transform, index) => (
        <Animated.View
          key={index}
          style={[
            styles.decorativeCircle,
            styles[`decorativeCircle${index + 1}`],
            { transform: [{ translateY: transform.translateY }, { scale: transform.scale }] }
          ]}
        />
      ))}
      
      <View style={styles.header}>
       
        <Animated.View style={[styles.catStage, { transform: [{ translateY: catTranslateY }] }]}>
         
          <Animated.View style={[styles.catTail, { transform: [{ translateX: -20 }, { rotate: tailRotate }, { translateX: 20 }] }]} />
          
          <View style={styles.catBody} />
        
          <View style={styles.catHeadGroup}>
            <View style={styles.catHead} />
            <Animated.View style={[styles.catEar, styles.catEarLeft, { transform: [{ rotate: earRotate }] }]} />
            <Animated.View style={[styles.catEar, styles.catEarRight, { transform: [{ rotate: earRotateOpp }] }]} />
            <Animated.View style={[styles.catEyes, { transform: [{ scaleY: catBlink }] }]}> 
              <View style={styles.eye} />
              <View style={styles.eye} />
            </Animated.View>
            <View style={styles.catCollar} />
          </View>
          <View style={[styles.paw, styles.pawLeft]} />
          <View style={[styles.paw, styles.pawRight]} />
        </Animated.View>
        
        <Text style={styles.title}>
          Welcome to <Text style={styles.titlePink}>Tic Toe</Text>
        </Text>
        <Text style={styles.subtitle}>Connect, share and Lets Have Fun</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.socialButton} onPress={onGoogle} accessibilityRole="button" accessibilityLabel="Continue with Google">
          <View style={styles.socialIconWrap}>
            <Icon name="google" size={18} color="#EA4335" />
          </View>
          <Text style={styles.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={onFacebook} accessibilityRole="button" accessibilityLabel="Continue with Facebook">
          <View style={styles.socialIconWrap}>
            <Icon name="facebook" size={18} color="#1877F2" />
          </View>
          <Text style={styles.socialText}>Continue with Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={onApple} accessibilityRole="button" accessibilityLabel="Continue with Apple">
          <View style={styles.socialIconWrap}>
            <Icon name="apple" size={18} color="#000000" />
          </View>
          <Text style={styles.socialText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onSignInPassword}>
          <Text style={styles.primaryText}>Sign in with password</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don’t have an account? </Text>
        <TouchableOpacity onPress={onSignUp}>
          <Text style={styles.footerLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    zIndex: 10,
    elevation: 3,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#FFB6C1',
  },
  decorativeCircle1: {
    width: 20,
    height: 20,
    top: '18%',
    left: '12%',
  },
  decorativeCircle2: {
    width: 16,
    height: 16,
    backgroundColor: PINK,
    top: '24%',
    right: '18%',
  },
  decorativeCircle3: {
    width: 12,
    height: 12,
    bottom: '20%',
    left: '10%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // Cat visuals
  catStage: { width: 140, height: 110, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 },
  catBody: { position: 'absolute', bottom: 22, width: 86, height: 46, backgroundColor: TEXT, borderRadius: 23 },
  catHeadGroup: { position: 'absolute', bottom: 48, alignItems: 'center' },
  catHead: { width: 48, height: 48, backgroundColor: TEXT, borderRadius: 24 },
  catEar: { position: 'absolute', width: 12, height: 12, backgroundColor: TEXT, transform: [{ rotate: '45deg' }] },
  catEarLeft: { top: -2, left: -4 },
  catEarRight: { top: -2, right: -4 },
  catEyes: { position: 'absolute', top: 16, width: 32, flexDirection: 'row', justifyContent: 'space-between' },
  eye: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  catCollar: { position: 'absolute', top: 34, width: 30, height: 4, borderRadius: 2, backgroundColor: PINK },
  catTail: { position: 'absolute', right: 10, bottom: 42, width: 40, height: 8, borderRadius: 4, backgroundColor: TEXT },
  paw: { position: 'absolute', bottom: 12, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ffffff', shadowColor: PINK, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  pawLeft: { left: 48 },
  pawRight: { right: 48 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  titlePink: {
    color: PINK,
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  socialIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  socialText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
  },


  primaryButton: {
    backgroundColor: PINK,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: MUTED,
    fontSize: 14,
  },
  footerLink: {
    color: PINK,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WelcomeScreen;

