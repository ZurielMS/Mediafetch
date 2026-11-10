import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FolderOpen, Search, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { DownloadedItem } from '../../../shared/types/media';
import { DownloadedItemCard } from '../components/DownloadedItemCard';

type LibraryFilter = 'all' | 'mp4' | 'mp3';

interface LibraryScreenProps {
  items: DownloadedItem[];
  onOpenItem: (item: DownloadedItem) => void;
  onShareItem: (item: DownloadedItem) => void;
  onDeleteItem: (item: DownloadedItem) => void;
}

export function LibraryScreen({
  items,
  onOpenItem,
  onShareItem,
  onDeleteItem,
}: LibraryScreenProps) {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      if (filter !== 'all' && item.format !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(q) ||
        item.platform.toLowerCase().includes(q)
      );
    });
  }, [filter, items, query]);

  const counts = useMemo(
    () => ({
      all: items.length,
      mp4: items.filter(i => i.format === 'mp4').length,
      mp3: items.filter(i => i.format === 'mp3').length,
    }),
    [items],
  );

  return (
    <View style={styles.container}>
      <View style={styles.controlsBox}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en tus descargas..."
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: `Todos (${counts.all})` },
              { key: 'mp4', label: `Videos MP4 (${counts.mp4})` },
              { key: 'mp3', label: `Música MP3 (${counts.mp3})` },
            ] as const
          ).map(chip => {
            const active = filter === chip.key;
            return (
              <Pressable
                key={chip.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(chip.key)}>
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={
          filteredItems.length === 0 ? styles.emptyContainer : styles.listContent
        }
        renderItem={({ item }) => (
          <DownloadedItemCard
            item={item}
            onOpen={onOpenItem}
            onShare={onShareItem}
            onDelete={onDeleteItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <FolderOpen size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {items.length === 0
                ? 'Aún no tienes descargas'
                : 'Sin resultados para ese filtro'}
            </Text>
            <Text style={styles.emptyDesc}>
              {items.length === 0
                ? 'Pega cualquier enlace en la pestaña Descargar para guardar videos MP4 o música MP3 en tu teléfono.'
                : 'Prueba limpiando la búsqueda o cambiando entre MP4 y MP3.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsBox: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

