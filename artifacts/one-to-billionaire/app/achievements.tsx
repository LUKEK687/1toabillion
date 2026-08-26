import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../constants/achievements';
import { colors } from '../constants/colors';
import { Card } from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { gameState } = useGame();

  const unlocked = gameState?.achievements || [];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          {unlocked.length} / {ACHIEVEMENTS.length} Unlocked
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <Card key={ach.id} style={[styles.card, !isUnlocked && styles.cardLocked]}>
              <View style={[styles.iconContainer, isUnlocked ? styles.iconUnlocked : styles.iconLocked]}>
                <Ionicons 
                  name={ach.icon as any} 
                  size={24} 
                  color={isUnlocked ? colors.gold : colors.muted} 
                />
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, !isUnlocked && styles.textLocked]}>{ach.title}</Text>
                <Text style={styles.desc}>{ach.description}</Text>
              </View>
              {!isUnlocked && (
                <Ionicons name="lock-closed" size={16} color={colors.border} style={styles.lockIcon} />
              )}
            </Card>
          );
        })}
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
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    color: colors.gold,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  scroll: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconUnlocked: {
    backgroundColor: colors.goldMuted,
  },
  iconLocked: {
    backgroundColor: colors.cardSecondary,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  textLocked: {
    color: colors.muted,
  },
  desc: {
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  lockIcon: {
    marginLeft: 12,
  },
});
