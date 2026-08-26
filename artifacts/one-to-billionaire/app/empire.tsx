import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { BUSINESSES, Business } from '../constants/businesses';
import { colors } from '../constants/colors';
import { Card } from '../components/Card';
import { formatMoney } from '../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SoundManager } from '../services/SoundManager';

type BusinessHolding = Record<string, unknown>;

type EmpireGameState = {
  businesses: string[];
  debt: number;
  cash: number;
  holdings?: Record<string, { id: string; level: number }>;
};

type EmpireGameContext = {
  gameState: EmpireGameState | null;
  passiveIncome: number;
  upgradeBusiness?: (holdingId: string) => void | Promise<void>;
};

const firstNumber = (holding: BusinessHolding, keys: string[], fallback = 0) => {
  for (const key of keys) {
    const value = holding[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
};

const firstString = (holding: BusinessHolding, keys: string[]) => {
  for (const key of keys) {
    const value = holding[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
};

export default function EmpireScreen() {
  const insets = useSafeAreaInsets();
  // GameContext is being expanded independently. This narrow bridge lets this
  // screen consume its additive holdings API without requiring the old engine
  // contract to change before this UI ships.
  const { gameState, passiveIncome, upgradeBusiness } = useGame() as unknown as EmpireGameContext;
  const [upgradedHoldingId, setUpgradedHoldingId] = useState<string | null>(null);

  if (!gameState) return null;

  const ownedCounts: Record<string, number> = {};
  gameState.businesses.forEach(id => {
    ownedCounts[id] = (ownedCounts[id] || 0) + 1;
  });

  const uniqueOwned = Object.keys(ownedCounts).map(id => BUSINESSES[id]).filter(Boolean);
  const businesses = uniqueOwned.filter(b => b.type === 'business');
  const assets = uniqueOwned.filter(b => b.type === 'asset');
  const investments = uniqueOwned.filter(b => b.type === 'investment');
  const holdingCards: BusinessHolding[] = Object.values(gameState.holdings ?? {}).map((holding) => {
    const business = BUSINESSES[holding.id];
    const baseValue = (business?.dailyIncome ?? 0) * 100;
    return {
      id: holding.id,
      businessId: holding.id,
      level: holding.level,
      purchasePrice: baseValue,
      currentValue: baseValue * holding.level,
      incomePerDay: (business?.dailyIncome ?? 0) * holding.level,
      upgradeCost: Math.floor(baseValue * Math.pow(2, Math.max(0, holding.level - 1))),
    };
  });
  const hasHoldingsApi = holdingCards.length > 0 && typeof upgradeBusiness === 'function';

  const handleUpgrade = async (holdingId: string) => {
    if (!upgradeBusiness) return;
    SoundManager.play('upgrade');
    setUpgradedHoldingId(holdingId);
    try {
      await upgradeBusiness(holdingId);
    } catch {
      SoundManager.play('miss');
    } finally {
      // Let the confirmation land before returning the control to its normal
      // state; the engine update itself remains the source of truth for level.
      setTimeout(() => setUpgradedHoldingId(null), 900);
    }
  };

  const renderHoldings = () => {
    const holdings = holdingCards;
    if (holdings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color={colors.muted} />
          <Text style={styles.emptyTitle}>No Assets Yet</Text>
          <Text style={styles.emptyDesc}>Make choices to acquire businesses and real estate.</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your Holdings</Text>
          {holdings.map((holding, index) => {
            const businessId = firstString(holding, ['businessId', 'business_id', 'id']);
            const catalogBusiness = BUSINESSES[businessId];
            const holdingId = firstString(holding, ['id', 'holdingId', 'businessId']) || `${businessId}-${index}`;
            const name = firstString(holding, ['name', 'businessName']) || catalogBusiness?.name || 'Business';
            const description = firstString(holding, ['description']) || catalogBusiness?.description || 'Growing your empire.';
            const purchasePrice = firstNumber(holding, ['purchasePrice', 'purchase_price', 'cost'], catalogBusiness ? catalogBusiness.dailyIncome * 100 : 0);
            const currentValue = firstNumber(holding, ['currentValue', 'current_value', 'value'], purchasePrice);
            const incomePerDay = firstNumber(holding, ['incomePerDay', 'income_per_day', 'dailyIncome'], catalogBusiness?.dailyIncome ?? 0);
            const level = firstNumber(holding, ['level'], 1);
            const upgradeCost = firstNumber(holding, ['upgradeCost', 'upgrade_cost', 'nextUpgradeCost'], 0);
            const profit = currentValue - purchasePrice;
            const cannotAfford = upgradeCost > gameState.cash;
            const isUpgrading = upgradedHoldingId === holdingId;

            return (
              <Card key={holdingId} style={styles.bizCard}>
                <View style={styles.bizHeader}>
                  <View style={styles.bizIcon}>
                    <Ionicons name={(catalogBusiness?.icon ?? 'business-outline') as any} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.bizInfo}>
                    <Text style={styles.bizName}>{name}</Text>
                    <Text style={styles.bizDesc}>{description}</Text>
                  </View>
                  <View style={styles.bizCount}>
                    <Text style={styles.bizCountText}>Lv. {level}</Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Purchase price</Text>
                    <Text style={styles.metricValue}>{formatMoney(purchasePrice)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Current value</Text>
                    <Text style={styles.metricValue}>{formatMoney(currentValue)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Income / day</Text>
                    <Text style={[styles.metricValue, styles.positive]}>+{formatMoney(incomePerDay)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Profit / loss</Text>
                    <Text style={[styles.metricValue, profit >= 0 ? styles.positive : styles.negative]}>
                      {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  testID={`upgrade-business-${holdingId}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Upgrade ${name}`}
                  disabled={cannotAfford || isUpgrading}
                  activeOpacity={0.8}
                  onPress={() => handleUpgrade(holdingId)}
                  style={[styles.upgradeButton, (cannotAfford || isUpgrading) && styles.upgradeButtonDisabled]}
                >
                  <Ionicons name="trending-up-outline" size={18} color={cannotAfford ? colors.muted : colors.background} />
                  <Text style={[styles.upgradeButtonText, (cannotAfford || isUpgrading) && styles.upgradeButtonTextDisabled]}>
                    {isUpgrading ? 'Upgraded!' : `Upgrade · ${formatMoney(upgradeCost)}`}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
      </View>
    );
  };

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
        {hasHoldingsApi ? renderHoldings() : uniqueOwned.length === 0 && gameState.debt === 0 ? (
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 12,
  },
  metric: {
    width: '46%',
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginBottom: 3,
  },
  metricValue: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  positive: {
    color: colors.primary,
  },
  negative: {
    color: colors.danger,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 46,
    marginTop: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  upgradeButtonDisabled: {
    backgroundColor: colors.cardSecondary,
  },
  upgradeButtonText: {
    color: colors.background,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  upgradeButtonTextDisabled: {
    color: colors.muted,
  },
});