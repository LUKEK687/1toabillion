import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { colors } from '../constants/colors';
import { Card } from '../components/Card';
import { formatMoney, formatCompactMoney } from '../lib/utils';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { globalStats } = useGame();

  const StatItem = ({ label, value, icon, color = colors.primary }: { label: string, value: string | number, icon: string, color?: string }) => (
    <View style={styles.statItem}>
      <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Career Stats</Text>
          <View style={styles.grid}>
            <StatItem 
              label="Highest Net Worth" 
              value={formatMoney(globalStats.highestNetWorth)} 
              icon="trending-up"
              color={colors.primary}
            />
            <StatItem 
              label="Fastest Billion" 
              value={globalStats.fastestBillion ? `${globalStats.fastestBillion} days` : 'N/A'} 
              icon="timer-outline"
              color={colors.gold}
            />
            <StatItem 
              label="Games Played" 
              value={globalStats.gamesPlayed} 
              icon="game-controller-outline"
              color={colors.text}
            />
            <StatItem 
              label="Victories" 
              value={globalStats.victories} 
              icon="trophy-outline"
              color={colors.gold}
            />
            <StatItem 
              label="Bankruptcies" 
              value={globalStats.bankruptcies} 
              icon="skull-outline"
              color={colors.danger}
            />
            <StatItem 
              label="Largest Gain" 
              value={formatMoney(globalStats.largestGain)} 
              icon="arrow-up-circle-outline"
              color={colors.primary}
            />
            <StatItem 
              label="Largest Loss" 
              value={formatMoney(globalStats.largestLoss)} 
              icon="arrow-down-circle-outline"
              color={colors.danger}
            />
            <StatItem 
              label="Businesses Bought" 
              value={globalStats.businessesPurchased} 
              icon="briefcase-outline"
              color={colors.primary}
            />
            <StatItem 
              label="Lifetime Earnings" 
              value={formatCompactMoney(globalStats.lifetimeEarnings)} 
              icon="cash-outline"
              color={colors.primary}
            />
            <StatItem 
              label="Decisions Made" 
              value={globalStats.decisionsMade} 
              icon="git-network-outline"
              color={colors.text}
            />
            <StatItem 
              label="Total Days Lived" 
              value={globalStats.totalDaysPlayed} 
              icon="calendar-outline"
              color={colors.text}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 20,
  },
  card: {
    padding: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 24,
  },
  grid: {
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
});