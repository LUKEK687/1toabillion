import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, PanResponder, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAG_WIDTH = 80;
const BAG_HEIGHT = 60;
const ITEM_SIZE = 40;
const GAME_HEIGHT = 500; // approximate height

type DropItemType = {
  id: string;
  x: number;
  y: number;
  type: 'money' | 'expense';
  value: number;
  speed: number;
  caught: boolean;
};

export const MoneyDrop: React.FC<BaseGameProps> = ({ onComplete, durationMs = 5000, testID }) => {
  const [bagX, setBagX] = useState(SCREEN_WIDTH / 2 - BAG_WIDTH / 2);
  const bagXRef = useRef(bagX);
  const [items, setItems] = useState<DropItemType[]>([]);
  const itemsRef = useRef<DropItemType[]>([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newX = bagXRef.current + gestureState.dx;
        newX = Math.max(0, Math.min(newX, SCREEN_WIDTH - BAG_WIDTH));
        setBagX(newX);
      },
      onPanResponderRelease: () => {
        bagXRef.current = bagX;
      },
      onPanResponderGrant: () => {
        bagXRef.current = bagX;
      }
    })
  ).current;

  useEffect(() => { bagXRef.current = bagX; }, [bagX]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    // Spawner
    timerRef.current = setInterval(() => {
      const isMoney = Math.random() > 0.3;
      const newItem: DropItemType = {
        id: Math.random().toString(),
        x: Math.random() * (SCREEN_WIDTH - ITEM_SIZE),
        y: -ITEM_SIZE,
        type: isMoney ? 'money' : 'expense',
        value: isMoney ? 100 : -50,
        speed: 5 + Math.random() * 5,
        caught: false,
      };
      itemsRef.current.push(newItem);
    }, 500);

    // Game Loop
    loopRef.current = setInterval(() => {
      const currentItems = itemsRef.current;
      const currentBagX = bagXRef.current;
      let newScore = scoreRef.current;

      const nextItems = currentItems.map(item => {
        if (item.caught) return item;
        
        const newY = item.y + item.speed;
        
        // Collision check
        const bagRect = { x: currentBagX, y: GAME_HEIGHT - BAG_HEIGHT - 20, w: BAG_WIDTH, h: BAG_HEIGHT };
        const itemRect = { x: item.x, y: newY, w: ITEM_SIZE, h: ITEM_SIZE };
        
        if (
          itemRect.x < bagRect.x + bagRect.w &&
          itemRect.x + itemRect.w > bagRect.x &&
          itemRect.y < bagRect.y + bagRect.h &&
          itemRect.h + itemRect.y > bagRect.y
        ) {
          newScore += item.value;
          return { ...item, caught: true, y: newY };
        }
        
        return { ...item, y: newY };
      }).filter(item => !item.caught && item.y < GAME_HEIGHT + 100);

      itemsRef.current = nextItems;
      setItems([...nextItems]);
      if (newScore !== scoreRef.current) {
        setScore(newScore);
      }
    }, 1000 / 60);

    const endTimeout = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (loopRef.current) clearInterval(loopRef.current);
      
      onComplete({
        score: scoreRef.current,
        multiplier: 1,
        bonus: 0,
        outcome: scoreRef.current > 0 ? 'success' : 'failure'
      });
    }, durationMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (loopRef.current) clearInterval(loopRef.current);
      clearTimeout(endTimeout);
    };
  }, [durationMs, onComplete]);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.scoreText}>${score}</Text>
      
      <View style={{ height: GAME_HEIGHT, width: '100%', position: 'relative' }}>
        {items.map(item => (
          !item.caught && (
            <View
              key={item.id}
              style={[
                styles.item,
                { left: item.x, top: item.y, backgroundColor: item.type === 'money' ? colors.primary : colors.danger }
              ]}
            >
              <Ionicons name={item.type === 'money' ? 'cash-outline' : 'warning-outline'} size={20} color="#000" />
            </View>
          )
        ))}
        
        <View
          {...panResponder.panHandlers}
          style={[
            styles.bag,
            { left: bagX, top: GAME_HEIGHT - BAG_HEIGHT - 20 }
          ]}
        >
          <Ionicons name="briefcase" size={40} color={colors.background} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    paddingTop: 40,
  },
  scoreText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: colors.primary,
    marginBottom: 20,
  },
  item: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bag: {
    position: 'absolute',
    width: BAG_WIDTH,
    height: BAG_HEIGHT,
    backgroundColor: colors.gold,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
});
