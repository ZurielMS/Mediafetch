import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ClipboardPaste, Link2, Search, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { detectPlatform, isValidMediaUrl } from '../../../core/utils/urlUtils';

interface UrlInputCardProps {
  url: string;
  onChangeUrl: (value: string) => void;
  onPaste: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analyzeError: string | null;
}

export function UrlInputCard({
  url,
  onChangeUrl,
  onPaste,
  onClear,
  onAnalyze,
  isAnalyzing,
  analyzeError,
}: UrlInputCardProps) {
  const validUrl = isValidMediaUrl(url);
  const platform = validUrl ? detectPlatform(url) : null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Link2 size={16} color={colors.primary} />
          <Text style={styles.label}>Enlace de video o música</Text>
        </View>
        {platform && (
          <View
            style={[
              styles.platformBadge,
              { borderColor: `${platform.color}66` },
            ]}>
            <View
              style={[
                styles.platformDot,
                { backgroundColor: platform.color },
              ]}
            />
            <Text style={styles.platformText}>{platform.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={onChangeUrl}
          placeholder="Pega aquí el enlace (YouTube, TikTok, IG, SoundCloud...)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="search"
          onSubmitEditing={() => {
            if (validUrl && !isAnalyzing) {
              onAnalyze();
            }
          }}
          selectionColor={colors.primary}
        />
        {url.length > 0 && (
          <Pressable style={styles.clearBtn} onPress={onClear} hitSlop={8}>
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.pasteButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onPaste}>
          <ClipboardPaste size={16} color="#FFFFFF" />
          <Text style={styles.pasteButtonText}>Pegar enlace</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.analyzeButton,
            (!validUrl || isAnalyzing) && styles.buttonDisabled,
            pressed && validUrl && !isAnalyzing && styles.buttonPressed,
          ]}
          disabled={!validUrl || isAnalyzing}
          onPress={onAnalyze}>
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Search size={16} color={colors.textPrimary} />
          )}
          <Text style={styles.analyzeButtonText}>
            {isAnalyzing ? 'Analizando...' : 'Vista previa'}
          </Text>
        </Pressable>
      </View>

      {analyzeError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{analyzeError}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 6,
    marginLeft: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pasteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  pasteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  analyzeButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12,
    lineHeight: 17,
  },
});

