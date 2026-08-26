import React from 'react';
import { View, StyleSheet, Text, Switch, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { colors } from '../constants/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { resetProgress } = useGame();

  const handleReset = () => {
    Alert.alert(
      'Reset All Progress',
      'Are you sure? This will delete your current game, all stats, and all achievements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => resetProgress() 
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Music</Text>
              <Text style={styles.settingDesc}>Background music during your run</Text>
            </View>
            <Switch
              value={settings.music}
              onValueChange={(val) => updateSettings({ music: val })}
              trackColor={{ false: colors.cardSecondary, true: colors.primary }}
              thumbColor="#fff"
              testID="settings-music"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound Effects</Text>
              <Text style={styles.settingDesc}>Feedback for wins, purchases, and more</Text>
            </View>
            <Switch
              value={settings.sounds}
              onValueChange={(val) => updateSettings({ sounds: val })}
              trackColor={{ false: colors.cardSecondary, true: colors.primary }}
              thumbColor="#fff"
              testID="settings-sounds"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Haptics</Text>
              <Text style={styles.settingDesc}>Vibration feedback on actions</Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={(val) => updateSettings({ haptics: val })}
              trackColor={{ false: colors.cardSecondary, true: colors.primary }}
              thumbColor="#fff"
              testID="settings-haptics"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Reduced Motion</Text>
              <Text style={styles.settingDesc}>Disable animations</Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={(val) => updateSettings({ reducedMotion: val })}
              trackColor={{ false: colors.cardSecondary, true: colors.primary }}
              thumbColor="#fff"
              testID="settings-reduced-motion"
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This is a fictional entertainment game, not financial advice. 
            The scenarios and outcomes do not represent real-world investing, 
            business practices, or financial realities. Please do not base 
            actual financial decisions on this game.
          </Text>
        </Card>

        <View style={styles.dangerZone}>
          <Button
            title="Reset All Progress"
            variant="danger"
            icon="trash-outline"
            onPress={handleReset}
          />
        </View>
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
    gap: 20,
  },
  card: {
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDesc: {
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  disclaimerTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  disclaimerText: {
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  dangerZone: {
    marginTop: 20,
  },
});
