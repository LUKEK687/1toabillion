import React from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { GameResult, SpecialGameDescriptor } from '../../types/gameplay';

import { MoneyDrop } from './MoneyDrop';
import { PerfectDeal } from './PerfectDeal';
import { SafeCrack } from './SafeCrack';
import { StockPanic } from './StockPanic';
import { FlipIt } from './FlipIt';
import { MysteryReveal } from './MysteryReveal';
import { LuckyWheel } from './LuckyWheel';
import { Negotiation } from './Negotiation';
import { SwipeDecisionCard } from './SwipeDecisionCard';
import { PassiveIncomeBurst } from './PassiveIncomeBurst';

interface Props {
  visible: boolean;
  game: SpecialGameDescriptor | null;
  onComplete: (result: GameResult) => void;
  testID?: string;
}

export const SpecialGameOverlay: React.FC<Props> = ({ visible, game, onComplete, testID }) => {
  if (!game || !visible) return null;

  const renderGame = () => {
    switch (game.type) {
      case 'moneyDrop':
        return <MoneyDrop onComplete={onComplete} durationMs={game.durationMs} />;
      case 'perfectDeal':
        return <PerfectDeal onComplete={onComplete} />;
      case 'safeCrack':
        return <SafeCrack onComplete={onComplete} difficulty={game.difficulty} />;
      case 'stockPanic':
        return <StockPanic onComplete={onComplete} />;
      case 'flipIt':
        return <FlipIt onComplete={onComplete} rounds={game.rounds} />;
      case 'mysteryReveal':
        return <MysteryReveal onComplete={onComplete} itemRarity={game.itemRarity} />;
      case 'luckyWheel':
        return <LuckyWheel onComplete={onComplete} options={game.options} />;
      case 'negotiation':
        return <Negotiation onComplete={onComplete} startingPrice={game.startingPrice} targetPrice={game.targetPrice} />;
      case 'swipeDecision':
        return <SwipeDecisionCard 
          onComplete={onComplete} 
          title={game.title} 
          text={game.text} 
          leftValue={game.leftValue} 
          rightValue={game.rightValue} 
        />;
      case 'passiveIncomeBurst':
        return <PassiveIncomeBurst onComplete={onComplete} durationMs={game.durationMs} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID={testID}
    >
      <View style={styles.overlay}>
        {renderGame()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
});
