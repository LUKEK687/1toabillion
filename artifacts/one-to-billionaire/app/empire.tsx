import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { BUSINESSES, Business } from '../constants/businesses';
import { colors } from '../constants/colors';
import { Card } from '../components/Card';
import { formatMoney } from '../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCounter } from '../components/AnimatedCounter';

export default function EmpireScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, passiveIncome } = useGame();

  if (!gameState) return null;

  const ownedCounts: Record<string, number> = {};
  gameState.businesses.forEach(id => {
    ownedCounts[id] = (ownedCounts[id] || 0) + 1;
  });

  const uniqueOwned = Object.keys(ownedCounts).map(id => BUSINESSES[id]).filter(Boolean);
  const businesses = uniqueOwned.filter(b => b.type === 'business');
  const assets = uniqueOwned.filter(b => b.type === 'asset');
  const investments = uniqueOwned.filter(b => b.type === 'investment');

  const renderSection = (title: string, list: Business[]) => {
    if (list.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>{title}</Text>
        {list.map(biz => (
          <Card key={biz.id} style={styles.bizCard}>
            <View style={styles.bizHeader}>
              <View style={styles.bizIcon}>
                <Ionicons name={biz.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.bizInfo}>
                <Text style={styles.bizName}>{biz.name}</Text>
                <Text style={styles.bizDesc}>{biz.description}</Text>
              </View>
              <View style={styles.bizCount}>
                <Text style={styles.bizCountText}>x{ownedCounts[biz.id]}</Text>
              </View>
            </View>
            <View style={styles.bizFooter}>
              <Text style={styles.bizIncomeLabel}>Income / Day</Text>
              <Text style={styles.bizIncomeValue}>+{formatMoney(biz.dailyIncome * ownedCounts[biz.id])}</Text>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Passive Income</Text>
        <AnimatedCounter value={passiveIncome} style={styles.totalValue} />
        <Text style={styles.perDay}>per day</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {uniqueOwned.length === 0 && gameState.debt === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyTitle}>No Assets Yet</Text>
            <Text style={styles.emptyDesc}>
              Make choices to acquire businesses and real estate.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {renderSection('Businesses', businesses)}
            {renderSection('Assets & Real Estate', assets)}
            {renderSection('Investments', investments)}
            
            {gameState.debt > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeading, { color: colors.danger }]}>Outstanding Debt</Text>
                <Card style={[styles.bizCard, { borderColor: colors.dangerMuted }]}>
                  <View style={styles.bizHeader}>
                    <View style={[styles.bizIcon, { backgroundColor: colors.dangerMuted }]}>
                      <Ionicons name="card-outline" size={24} color={colors.danger} />
                    </View>
                    <View style={styles.bizInfo}>
                      <Text style={styles.bizName}>Liabilities</Text>
                      <Text style={styles.bizDesc}>Money you owe</Text>
                    </View>
                  </View>
                  <View style={styles.bizFooter}>
                    <Text style={styles.bizIncomeLabel}>Total Debt</Text>
                    <Text style={[styles.bizIncomeValue, { color: colors.danger }]}>{formatMoney(gameState.debt)}</Text>
                  </View>
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  totalValue: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
  },
  perDay: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginTop: 4,
  },
  scroll: {
    padding: 20,
  },
  sectionsContainer: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeading: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  bizCard: {
    padding: 16,
  },
  bizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bizIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bizInfo: {
    flex: 1,
  },
  bizName: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  bizDesc: {
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  bizCount: {
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bizCountText: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  bizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bizIncomeLabel: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  bizIncomeValue: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});