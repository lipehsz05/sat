import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { BrandLogo } from '@/components/ui/BrandLogo';
import type { AppColors } from '@/constants/theme';
import { brandGradient, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocationDisplayName, useLocationLabels } from '@/context/LocationLabelsContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import type { HomeLayoutSharedProps } from '@/hooks/useHomeScreenData';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { InvoicesByLocation, ServiceLocation } from '@/lib/api-contract';
import { formatCurrency, formatDate } from '@/lib/api-contract';
import { NOTIFICATIONS_SCREEN } from '@/lib/notifications/routes';

const QUICK_ACTION_COLORS = ['#2563EB', '#EA580C', '#7C3AED', '#059669'] as const;
const QUICK_ACTION_GAP = 4;
const QUICK_ACTION_SHORT_LABELS: Record<string, string> = {
  release: 'Liberar',
  report: 'Reportar',
  negotiate: 'Negociar',
  tax: 'Notas',
};

function locationIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes('escrit') || lower.includes('empresa') || lower.includes('matriz')) {
    return 'briefcase-outline';
  }
  if (lower.includes('casa') || lower.includes('resid')) {
    return 'home-outline';
  }
  return 'location-outline';
}

function ProfileAvatar({ name, onPress }: { name: string; onPress: () => void }) {
  const styles = useThemedStyles(createAvatarStyles);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.avatar}
      accessibilityRole="button"
      accessibilityLabel="Abrir ajustes"
    >
      <Text style={styles.initials}>{initials}</Text>
    </TouchableOpacity>
  );
}

function LocationPicker({
  locations,
  selectedId,
  onSelect,
}: {
  locations: ServiceLocation[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const styles = useThemedStyles(createLocationPickerStyles);
  const { getDisplayName } = useLocationLabels();
  const [modalVisible, setModalVisible] = useState(false);
  const selected = locations.find((l) => l.id === selectedId) ?? locations[0];
  const displayName = useLocationDisplayName(selected.id, selected.name);
  const canPick = locations.length > 1;

  const pillContent = (
    <>
      <Ionicons name="location-outline" size={16} color={styles.pillIcon.color} />
      <Text style={styles.pillText} numberOfLines={1}>
        {displayName}
      </Text>
      {canPick ? (
        <Ionicons name="chevron-down" size={16} color={styles.pillIcon.color} />
      ) : null}
    </>
  );

  const handleSelect = (locationId: string) => {
    onSelect(locationId);
    setModalVisible(false);
  };

  return (
    <>
      {canPick ? (
        <TouchableOpacity
          style={styles.pill}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Endereço selecionado: ${displayName}. Toque para trocar`}
        >
          {pillContent}
        </TouchableOpacity>
      ) : (
        <View
          style={styles.pill}
          accessibilityLabel={`Endereço: ${displayName}`}
          accessibilityRole="text"
        >
          {pillContent}
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Selecionar endereço</Text>
            <ScrollView style={styles.pickerList} bounces={false}>
              {locations.map((location) => {
                const name = getDisplayName(location.id, location.name);
                const active = location.id === selectedId;
                return (
                  <Pressable
                    key={location.id}
                    style={[styles.pickerOption, active && styles.pickerOptionActive]}
                    onPress={() => handleSelect(location.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.pickerOptionBody}>
                      <Text style={[styles.pickerOptionName, active && styles.pickerOptionNameActive]}>
                        {name}
                      </Text>
                      <Text style={styles.pickerOptionPlan}>{location.planName}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={styles.pickerCheck.color} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.pickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function StatusCard({
  location,
  group,
  totalOpen,
}: {
  location: ServiceLocation;
  group: InvoicesByLocation | undefined;
  totalOpen: number;
}) {
  const styles = useThemedStyles(createStatusCardStyles);
  const nextInvoice = group?.invoices[0];
  const locationOpen = group?.openTotal ?? 0;
  const openAmount = locationOpen > 0 ? locationOpen : totalOpen;

  const openInvoice = () => {
    if (nextInvoice) {
      router.push(`/invoice/${nextInvoice.id}`);
      return;
    }
    router.push('/(tabs)/invoices');
  };

  return (
    <Pressable
      onPress={openInvoice}
      accessibilityRole="button"
      accessibilityLabel={`Internet conectada. Plano ${location.planName}. Total em aberto ${formatCurrency(openAmount)}. Toque para ver a fatura`}
      style={({ pressed }) => [pressed && styles.cardPressed]}
    >
      <LinearGradient
        colors={[brandGradient.start, brandGradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.wifiBg} pointerEvents="none">
          <Ionicons name="wifi" size={132} color={styles.wifiIcon.color} style={styles.wifiIconRotate} />
        </View>

        <View style={styles.cardInner}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusTitle}>Internet conectada</Text>
          </View>
          <Text style={styles.statusSubtitle}>Tudo funcionando perfeitamente!</Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metric, styles.metricWithDivider]}>
              <Ionicons name="speedometer-outline" size={16} color={styles.metricIcon.color} />
              <Text style={styles.metricLabel}>Plano</Text>
              <Text style={styles.metricValue} numberOfLines={2}>
                {location.planName}
              </Text>
            </View>
            <View style={[styles.metric, styles.metricWithDivider]}>
              <Ionicons name="calendar-outline" size={16} color={styles.metricIcon.color} />
              <Text style={styles.metricLabel}>Próximo vencimento</Text>
              <Text style={styles.metricValue}>
                {nextInvoice ? formatDate(nextInvoice.dueDate) : '—'}
              </Text>
            </View>
            <View style={[styles.metric, styles.metricLast]}>
              <Ionicons name="receipt-outline" size={16} color={styles.metricIcon.color} />
              <Text style={styles.metricLabel}>Total em aberto</Text>
              <Text style={styles.metricValue} numberOfLines={1}>
                {formatCurrency(openAmount)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function QuickActionGrid({
  actions,
  onAction,
}: {
  actions: HomeLayoutSharedProps['quickActions'];
  onAction: HomeLayoutSharedProps['onQuickAction'];
}) {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles(createQuickGridStyles);
  const itemWidth = Math.floor(
    (screenWidth - spacing.lg * 2 - QUICK_ACTION_GAP * (actions.length - 1)) / actions.length,
  );

  return (
    <View style={styles.grid}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.item, { width: itemWidth }]}
          onPress={() => onAction(action.route as Href)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: (QUICK_ACTION_COLORS[index] ?? '#2563EB') + '18' },
            ]}
          >
            <Ionicons
              name={action.icon}
              size={18}
              color={QUICK_ACTION_COLORS[index] ?? '#2563EB'}
            />
          </View>
          <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {QUICK_ACTION_SHORT_LABELS[action.id] ?? action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ServiceStatusSection({ locations }: { locations: ServiceLocation[] }) {
  const styles = useThemedStyles(createServiceStatusStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Status dos serviços</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} accessibilityRole="button">
          <Text style={styles.link}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {locations.map((location, index) => (
        <ServiceStatusRow key={location.id} location={location} isLast={index === locations.length - 1} />
      ))}

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={18} color={styles.infoIcon.color} />
        <Text style={styles.infoText}>Não há instabilidades na sua região</Text>
      </View>
    </View>
  );
}

function ServiceStatusRow({ location, isLast }: { location: ServiceLocation; isLast: boolean }) {
  const styles = useThemedStyles(createServiceRowStyles);
  const displayName = useLocationDisplayName(location.id, location.name);

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.iconCircle}>
        <Ionicons name={locationIcon(location.name)} size={20} color={styles.icon.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.plan}>{location.planName}</Text>
        <View style={styles.statusRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Online · Conexão estável</Text>
        </View>
      </View>
    </View>
  );
}

function OpenInvoiceCarousel({ groups, loading }: { groups: InvoicesByLocation[]; loading: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createInvoiceCarouselStyles);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Faturas em aberto</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')} accessibilityRole="button">
          <Text style={styles.link}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : groups.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma fatura em aberto no momento.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          decelerationRate="fast"
        >
          {groups.map((group) => (
            <OpenInvoiceCard key={group.location.id} group={group} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function OpenInvoiceCard({ group }: { group: InvoicesByLocation }) {
  const styles = useThemedStyles(createOpenInvoiceCardStyles);
  const displayName = useLocationDisplayName(group.location.id, group.location.name);
  const invoice = group.invoices[0];
  if (!invoice) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.location}>{displayName}</Text>
      <Text style={styles.plan}>{group.location.planName}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Em aberto</Text>
      </View>
      <Text style={styles.due}>Vencimento: {formatDate(invoice.dueDate)}</Text>
      <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
      <TouchableOpacity
        style={styles.payBtn}
        onPress={() => router.push(`/invoice/${invoice.id}`)}
        accessibilityRole="button"
      >
        <Text style={styles.payBtnText}>Pagar agora</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReferralBanner() {
  const styles = useThemedStyles(createReferralStyles);

  return (
    <LinearGradient
      colors={[brandGradient.start, brandGradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="gift-outline" size={28} color={styles.icon.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Indique e ganhe</Text>
        <Text style={styles.subtitle}>
          Indique amigos e ganhe descontos na sua próxima fatura!
        </Text>
      </View>
      <TouchableOpacity
        style={styles.cta}
        onPress={() =>
          Alert.alert(
            'Indique e ganhe',
            'Programa de indicação em breve. Fique de olho nas novidades!',
          )
        }
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Indicar agora</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

export function HomeDashboardLayout({
  groups,
  loading,
  quickActions,
  totalOpen,
  onQuickAction,
}: HomeLayoutSharedProps) {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const styles = useThemedStyles(createDashboardStyles);
  const locations = profile?.locations ?? [];
  const [selectedLocationId, setSelectedLocationId] = useState('');

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocationId('');
      return;
    }
    setSelectedLocationId((current) =>
      current && locations.some((l) => l.id === current) ? current : locations[0].id,
    );
  }, [locations]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? locations[0],
    [locations, selectedLocationId],
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.location.id === selectedLocation?.id),
    [groups, selectedLocation?.id],
  );

  if (!profile) return null;

  const firstName = profile.name.split(' ')[0];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerArea}>
        <View style={styles.topBar}>
          <BrandLogo variant="dashboard" size="dashboard" style={styles.logoSlot} />
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => router.push(NOTIFICATIONS_SCREEN)}
              style={styles.notifBtn}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
            >
              <Ionicons name="notifications-outline" size={24} color={styles.notifIcon.color} />
              {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
            </TouchableOpacity>
            <ProfileAvatar name={profile.name} onPress={() => router.push('/(tabs)/settings')} />
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
          <View style={styles.greetingSubRow}>
            <Text style={styles.greetingSub}>Aqui está o que acontece na sua conta</Text>
            {selectedLocation ? (
              <LocationPicker
                locations={locations}
                selectedId={selectedLocation.id}
                onSelect={setSelectedLocationId}
              />
            ) : null}
          </View>
        </View>
      </View>

      {selectedLocation ? (
        <StatusCard location={selectedLocation} group={selectedGroup} totalOpen={totalOpen} />
      ) : null}

      <Text style={styles.sectionTitle}>Acessos rápidos</Text>
      <QuickActionGrid actions={quickActions} onAction={onQuickAction} />

      {locations.length > 0 ? <ServiceStatusSection locations={locations} /> : null}

      <OpenInvoiceCarousel groups={groups} loading={loading} />

      <ReferralBanner />
    </ScrollView>
  );
}

function createDashboardStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: 0,
      paddingBottom: spacing.xl,
    },
    headerArea: {
      marginBottom: spacing.sm,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    logoSlot: {
      flexShrink: 0,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    notifBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifIcon: {
      color: colors.primary,
    },
    notifDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    greetingBlock: {
      width: '100%',
    },
    greetingSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: 4,
    },
    greeting: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    greetingSub: {
      flex: 1,
      flexShrink: 1,
      fontSize: typography.label,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
  });
}

function createAvatarStyles(colors: AppColors) {
  return StyleSheet.create({
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      color: colors.white,
      fontSize: typography.label,
      fontWeight: '700',
    },
  });
}

function createLocationPickerStyles(colors: AppColors) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    pillIcon: {
      color: colors.primary,
    },
    pillText: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primary,
      maxWidth: 96,
    },
    pickerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    pickerSheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      maxHeight: '70%',
    },
    pickerTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    pickerList: {
      maxHeight: 320,
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
    },
    pickerOptionActive: {
      backgroundColor: colors.background,
    },
    pickerOptionBody: {
      flex: 1,
    },
    pickerOptionName: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    pickerOptionNameActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    pickerOptionPlan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pickerCheck: {
      color: colors.primary,
    },
    pickerCancel: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    pickerCancelText: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.primaryLight,
    },
  });
}

function createStatusCardStyles(colors: AppColors) {
  return StyleSheet.create({
    cardPressed: {
      opacity: 0.92,
    },
    card: {
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    wifiBg: {
      position: 'absolute',
      right: -24,
      top: -28,
      zIndex: 0,
    },
    wifiIcon: {
      color: 'rgba(255,255,255,0.07)',
    },
    wifiIconRotate: {
      transform: [{ rotate: '24deg' }],
    },
    cardInner: {
      zIndex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    statusTitle: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.success,
    },
    statusSubtitle: {
      fontSize: 11,
      color: colors.textMutedOnDark,
      marginTop: 2,
      marginBottom: spacing.xs,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    metric: {
      flex: 1,
      flexBasis: 0,
      gap: 3,
      paddingRight: spacing.xs,
    },
    metricLast: {
      flex: 1,
      paddingRight: 0,
    },
    metricWithDivider: {
      borderRightWidth: 1,
      borderRightColor: 'rgba(255,255,255,0.18)',
      marginRight: spacing.xs,
    },
    metricIcon: {
      color: colors.textMutedOnDark,
    },
    metricLabel: {
      fontSize: 10,
      lineHeight: 13,
      minHeight: 22,
      color: colors.textMutedOnDark,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textOnDark,
      lineHeight: 16,
    },
  });
}

function createQuickGridStyles(colors: AppColors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'flex-start',
      gap: QUICK_ACTION_GAP,
      width: '100%',
    },
    item: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingTop: 6,
      paddingBottom: 6,
      paddingHorizontal: 2,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 0,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 12,
      width: '100%',
    },
  });
}

function createServiceStatusStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
    },
    link: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    infoIcon: {
      color: colors.primaryLight,
    },
    infoText: {
      flex: 1,
      fontSize: typography.label,
      color: colors.textSecondary,
    },
  });
}

function createServiceRowStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: colors.primaryLight,
    },
    body: {
      flex: 1,
    },
    name: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    plan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    statusText: {
      fontSize: typography.label,
      color: colors.success,
      fontWeight: '500',
    },
  });
}

function createInvoiceCarouselStyles(colors: AppColors) {
  return StyleSheet.create({
    section: {
      marginTop: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
    },
    link: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    carousel: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}

function createOpenInvoiceCardStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      width: 220,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    location: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    plan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentLight,
      borderRadius: radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: spacing.sm,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    due: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    amount: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 4,
      marginBottom: spacing.sm,
    },
    payBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    payBtnText: {
      color: colors.white,
      fontSize: typography.body,
      fontWeight: '700',
    },
  });
}

function createReferralStyles(colors: AppColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: colors.white,
    },
    body: {
      flex: 1,
    },
    title: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textOnDark,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textMutedOnDark,
      marginTop: 2,
      lineHeight: 16,
    },
    cta: {
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    ctaText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
