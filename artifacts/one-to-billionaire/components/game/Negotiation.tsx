import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';
import { createCompletionGate, negotiationOutcome, negotiationResult } from '../../game-engine/miniGameLogic';

export const Negotiation: React.FC<BaseGameProps & { startingPrice: number; targetPrice: number }> = ({ 
  onComplete, 
  startingPrice, 
  targetPrice, 
  testID 
}) => {
  const [offer, setOffer] = useState(startingPrice * 0.5);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'accepted' | 'counter' | 'rejected'>('idle');
  const [counterOffer, setCounterOffer] = useState<number | null>(null);
  const completionGate = useRef(createCompletionGate()).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (callback: () => void, delay: number) => {
    timers.current.push(setTimeout(callback, delay));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  
  const submitOffer = () => {
    setStatus('thinking');
    
    schedule(() => {
      const outcome = negotiationOutcome(offer, targetPrice);
      if (outcome === 'accepted') {
        setStatus('accepted');
        schedule(() => completionGate.tryComplete(() => onComplete(negotiationResult('accepted', offer))), 1500);
      } else if (outcome === 'counter') {
        setStatus('counter');
        setCounterOffer(targetPrice + (startingPrice - targetPrice) * 0.2); // slight drop from starting
      } else {
        setStatus('rejected');
        schedule(() => completionGate.tryComplete(() => onComplete(negotiationResult('rejected', offer))), 1500);
      }
    }, 1500);
  };

  const walkAway = () => {
    completionGate.tryComplete(() => onComplete({ score: 0, multiplier: 1, bonus: 0, outcome: 'walked' }));
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => status === 'idle' || status === 'counter',
    onPanResponderMove: (_, gs) => {
      const range = startingPrice * 1.5;
      const delta = (gs.dx / 250) * range;
      setOffer(prev => Math.max(0, Math.min(startingPrice * 1.5, prev + delta)));
    }
  })).current;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Negotiation</Text>
      
      <View style={styles.dialogueBox}>
        <Text style={styles.dialogueText}>
          {status === 'idle' && "Make me an offer."}
          {status === 'thinking' && "Hmm... let me think about that."}
          {status === 'accepted' && "Deal! It's yours."}
          {status === 'rejected' && "No way! I'm insulted. We're done here."}
          {status === 'counter' && `I can't do $${Math.round(offer)}. How about $${Math.round(counterOffer!)}?`}
        </Text>
      </View>

      <Text style={styles.offerLabel}>Your Offer: ${Math.round(offer)}</Text>
      
      <View style={styles.sliderTrack} {...panResponder.panHandlers}>
        <View style={[styles.sliderFill, { width: `${(offer / (startingPrice * 1.5)) * 100}%` }]} />
        <View style={styles.sliderThumb} />
      </View>

      <View style={styles.actions}>
        <Button 
          title="Walk Away" 
          variant="ghost" 
          onPress={walkAway} 
          disabled={status === 'thinking' || status === 'accepted' || status === 'rejected'}
          style={styles.btn}
        />
        <Button 
          title="Make Offer" 
          variant="primary" 
          onPress={submitOffer} 
          disabled={status === 'thinking' || status === 'accepted' || status === 'rejected'}
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 40,
  },
  dialogueBox: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
  },
  dialogueText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  offerLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: colors.primary,
    marginBottom: 20,
  },
  sliderTrack: {
    width: '100%',
    height: 40,
    backgroundColor: colors.cardSecondary,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 40,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
});
