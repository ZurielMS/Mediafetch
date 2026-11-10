import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Cpu,
  FolderCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import {
  AUDIO_QUALITIES,
  SUPPORTED_PLATFORMS,
  VIDEO_QUALITIES,
} from '../../../core/constants/mediaOptions';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { AppSettings, EngineStatus } from '../../../shared/types/media';

interface SettingsScreenProps {
  settings: AppSettings;
  engineStatus: EngineStatus | null;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdateEngine: (channel: 'stable' | 'nightly') => Promise<void>;
  onClearBrowserSession: () => Promise<void>;
  onClearHistory: () => void;
}

export function SettingsScreen({
  settings,
  engineStatus,
  onUpdateSettings,
  onUpdateEngine,
  onClearBrowserSession,
  onClearHistory,
}: SettingsScreenProps) {
  const [updatingChannel, setUpdatingChannel] = useState<
    'stable' | 'nightly' | null
  >(null);

  const handleEngineUpdate = async (channel: 'stable' | 'nightly') => {
    setUpdatingChannel(channel);
    try {
      await onUpdateEngine(channel);
    } finally {
      setUpdatingChannel(null);
    }
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Limpiar historial',
      'Esto borra la lista dentro de la app, pero mantiene tus archivos descargados en la carpeta Descargas del dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: onClearHistory,
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cpu size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Motor de descargas (yt-dlp + FFmpeg)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión yt-dlp</Text>
          <Text style={styles.infoValue}>
            {engineStatus?.ytDlpVersion ?? 'Verificando...'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Conversor FFmpeg</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color: engineStatus?.ffmpegReady
                  ? colors.success
                  : colors.warning,
              },
            ]}>
            {engineStatus?.ffmpegReady ? 'Activo (MP4 / MP3)' : 'Iniciando'}
          </Text>
        </View>

        <Text style={styles.helperText}>
          Si alguna plataforma cambia su reproductor, actualiza el motor desde
          aquí sin recompilar la APK.
        </Text>

        <View style={styles.updateBtnsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.updateBtnPrimary,
              updatingChannel !== null && styles.disabled,
              pressed && styles.pressed,
            ]}
            disabled={updatingChannel !== null}
            onPress={() => handleEngineUpdate('stable')}>
            {updatingChannel === 'stable' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={15} color="#FFFFFF" />
            )}
            <Text style={styles.updateBtnPrimaryText}>Actualizar Estable</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.updateBtnSecondary,
              updatingChannel !== null && styles.disabled,
              pressed && styles.pressed,
            ]}
            disabled={updatingChannel !== null}
            onPress={() => handleEngineUpdate('nightly')}>
            {updatingChannel === 'nightly' ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <RefreshCw size={15} color={colors.textPrimary} />
            )}
            <Text style={styles.updateBtnSecondaryText}>Nightly</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferencias por defecto</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchLabel}>Analizar automáticamente al pegar</Text>
            <Text style={styles.switchHint}>
              Carga título, portada y duración apenas pegues un enlace
            </Text>
          </View>
          <Switch
            value={settings.autoAnalyzeOnPaste}
            onValueChange={val =>
              onUpdateSettings({ autoAnalyzeOnPaste: val })
            }
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchLabel}>Usar sesión del navegador</Text>
            <Text style={styles.switchHint}>
              Aplica cookies y tokens de tus cuentas iniciadas en el Navegador
            </Text>
          </View>
          <Switch
            value={settings.useBrowserCookies}
            onValueChange={val =>
              onUpdateSettings({ useBrowserCookies: val })
            }
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.updateBtnSecondary,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            Alert.alert(
              'Cerrar sesiones web',
              '¿Deseas borrar todas las cookies y tokens guardados en el navegador integrado?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Cerrar sesiones',
                  style: 'destructive',
                  onPress: () => {
                    onClearBrowserSession();
                  },
                },
              ],
            );
          }}>
          <Text style={styles.updateBtnSecondaryText}>
            Cerrar sesiones y cookies del navegador
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.subLabel}>Formato inicial</Text>
        <View style={styles.chipsRow}>
          {(['mp4', 'mp3'] as const).map(fmt => {
            const active = settings.defaultFormat === fmt;
            return (
              <Pressable
                key={fmt}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() => onUpdateSettings({ defaultFormat: fmt })}>
                <Text
                  style={[
                    styles.choiceText,
                    active && styles.choiceTextActive,
                  ]}>
                  {fmt === 'mp4' ? 'MP4 (Video)' : 'MP3 (Música)'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.subLabel}>Calidad MP4 por defecto</Text>
        <View style={styles.chipsWrap}>
          {VIDEO_QUALITIES.map(q => {
            const active = settings.defaultVideoQuality === q.value;
            return (
              <Pressable
                key={q.value}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() =>
                  onUpdateSettings({ defaultVideoQuality: q.value })
                }>
                <Text
                  style={[
                    styles.choiceText,
                    active && styles.choiceTextActive,
                  ]}>
                  {q.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.subLabel}>Bitrate MP3 por defecto</Text>
        <View style={styles.chipsWrap}>
          {AUDIO_QUALITIES.map(q => {
            const active = settings.defaultAudioQuality === q.value;
            return (
              <Pressable
                key={q.value}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
                onPress={() =>
                  onUpdateSettings({ defaultAudioQuality: q.value })
                }>
                <Text
                  style={[
                    styles.choiceText,
                    active && styles.choiceTextActive,
                  ]}>
                  {q.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FolderCheck size={18} color={colors.mp3Accent} />
          <Text style={styles.cardTitle}>Dónde se guardan tus archivos</Text>
        </View>
        <Text style={styles.helperText}>
          • Videos MP4 y Música MP3 se guardan directamente en la carpeta
          Descargas (Download) de tu dispositivo, visibles en Archivos,
          Galería y tu reproductor de música.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fuentes compatibles</Text>
        <View style={styles.platformList}>
          {SUPPORTED_PLATFORMS.map(p => (
            <View key={p.name} style={styles.platformRow}>
              <CheckCircle2 size={15} color={colors.success} />
              <View style={styles.platformTextCol}>
                <Text style={styles.platformName}>{p.name}</Text>
                <Text style={styles.platformDetail}>{p.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.clearHistoryBtn,
          pressed && styles.pressed,
        ]}
        onPress={confirmClearHistory}>
        <Trash2 size={16} color="#FDA4AF" />
        <Text style={styles.clearHistoryText}>
          Limpiar historial de la app
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  updateBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  updateBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  updateBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  updateBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  updateBtnSecondaryText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchTextCol: {
    flex: 1,
  },
  switchLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  switchHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  subLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: colors.textPrimary,
  },
  platformList: {
    gap: spacing.sm + 2,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
  },
  platformTextCol: {
    flex: 1,
  },
  platformName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  platformDetail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: radius.lg,
    paddingVertical: 13,
  },
  clearHistoryText: {
    color: '#FDA4AF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});

