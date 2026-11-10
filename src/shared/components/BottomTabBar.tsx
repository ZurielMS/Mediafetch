import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Download, FolderHeart, Globe, Settings } from 'lucide-react-native';
import { colors, radius, spacing } from '../../core/theme/tokens';

export type AppTab = 'downloader' | 'browser' | 'library' | 'settings';

interface BottomTabBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  libraryCount: number;
  activeDownloadCount: number;
  browserDetectedCount: number;
  bottomInset: number;
}

export function BottomTabBar({
  activeTab,
  onSelectTab,
  libraryCount,
  activeDownloadCount,
  browserDetectedCount,
  bottomInset,
}: BottomTabBarProps) {
  const tabs: Array<{
    key: AppTab;
    label: string;
    badge?: number;
    renderIcon: (active: boolean) => React.ReactNode;
  }> = [
    {
      key: 'downloader',
      label: 'Descargar',
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined,
      renderIcon: active => (
        <Download
          size={20}
          color={active ? colors.primary : colors.textMuted}
          strokeWidth={2.2}
        />
      ),
    },
    {
      key: 'browser',
      label: 'Navegador',
      badge: browserDetectedCount > 0 ? browserDetectedCount : undefined,
      renderIcon: active => (
        <Globe
          size={20}
          color={active ? colors.primary : colors.textMuted}
          strokeWidth={2.2}
        />
      ),
    },
    {
      key: 'library',
      label: 'Biblioteca',
      badge: libraryCount > 0 ? libraryCount : undefined,
      renderIcon: active => (
        <FolderHeart
          size={20}
          color={active ? colors.primary : colors.textMuted}
          strokeWidth={2.2}
        />
      ),
    },
    {
      key: 'settings',
      label: 'Ajustes',
      renderIcon: active => (
        <Settings
          size={20}
          color={active ? colors.primary : colors.textMuted}
          strokeWidth={2.2}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(bottomInset, spacing.sm) },
      ]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tabItem,
              isActive && styles.tabItemActive,
              pressed && styles.tabPressed,
            ]}
            onPress={() => onSelectTab(tab.key)}>
            <View style={styles.iconWrap}>
              {tab.renderIcon(isActive)}
              {tab.badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  tabItemActive: {
    backgroundColor: colors.primarySoft,
  },
  tabPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
