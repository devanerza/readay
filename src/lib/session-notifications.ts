import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance } from 'react-native-notify-kit';
import { t } from '../i18n';
import type { ScheduleBlockWithBook } from './schedule-blocks';

export const REMINDER_CHANNEL_ID = 'reading-reminders';
export const TIMER_CHANNEL_ID = 'session-timer';

const TIMER_NOTIFICATION_ID = 'readay-active-session';
const PREP_LEAD_MINUTES = 10;

let handlerConfigured = false;

function configureForegroundHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannels(): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: t('notification.channelReminders'),
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {}
  try {
    await notifee.createChannel({
      id: TIMER_CHANNEL_ID,
      name: t('notification.channelTimer'),
      importance: AndroidImportance.LOW,
    });
  } catch {}
}

export async function hasNotificationPermission(): Promise<boolean> {
  configureForegroundHandler();
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  configureForegroundHandler();
  await ensureChannels();
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted';
  } catch {
    return false;
  }
}

function blockDurationMinutes(block: ScheduleBlockWithBook): number {
  const [sh, sm] = block.start_time.split(':').map(Number);
  const [eh, em] = block.end_time.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

export async function syncBlockReminders(blocks: ScheduleBlockWithBook[]): Promise<void> {
  configureForegroundHandler();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}

  await ensureChannels();

  for (const block of blocks) {
    const [hour, minute] = block.start_time.split(':').map(Number);
    const weekday = block.day_of_week + 1;
    const durationMin = blockDurationMinutes(block);
    const bookId = block.books?.id ?? null;
    const bookTitle = block.books?.title ?? null;

    const data: Record<string, string> = {
      kind: 'block_start',
      target_minutes: String(durationMin),
      ...(bookId ? { book_id: bookId } : {}),
    };

    let prepTotal = hour * 60 + minute - PREP_LEAD_MINUTES;
    let prepWeekday = weekday;
    if (prepTotal < 0) {
      prepTotal += 24 * 60;
      prepWeekday = weekday === 1 ? 7 : weekday - 1;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `readay-prep-${block.id}`,
        content: {
          title: t('notification.prepTitle'),
          body: t('notification.prepBody', {
            label: block.label ?? t('notification.startTitle'),
            time: block.start_time.slice(0, 5),
          }),
          data: { ...data, kind: 'block_prep' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: prepWeekday,
          hour: Math.floor(prepTotal / 60),
          minute: prepTotal % 60,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    } catch {}

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `readay-start-${block.id}`,
        content: {
          title: t('notification.startTitle'),
          body: t('notification.startBody', {
            label: block.label ?? t('notification.startTitle'),
            withBook: bookTitle ? ` — "${bookTitle}"` : '',
          }),
          data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    } catch {}
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function displaySessionTimer(options: {
  body: string;
  running: boolean;
  baseTimestampMs?: number;
}): Promise<void> {
  try {
    await notifee.displayNotification({
      id: TIMER_NOTIFICATION_ID,
      title: t('notification.timerTitle'),
      body: options.body,
      data: { kind: 'active_session' },
      android: {
        channelId: TIMER_CHANNEL_ID,
        ongoing: true,
        smallIcon: 'ic_launcher',
        showChronometer: options.running,
        ...(options.running
          ? { chronometerDirection: 'up' as const, timestamp: options.baseTimestampMs ?? Date.now() }
          : {}),
      },
    });
  } catch {}
}

export async function startSessionTimer(bookTitle?: string | null): Promise<void> {
  await ensureChannels();
  await displaySessionTimer({ body: bookTitle ?? '', running: true, baseTimestampMs: Date.now() });
}

export async function pauseSessionTimer(elapsedSeconds: number): Promise<void> {
  await displaySessionTimer({
    body: `${t('notification.timerPaused')} · ${formatElapsed(elapsedSeconds)}`,
    running: false,
  });
}

export async function resumeSessionTimer(elapsedSeconds: number): Promise<void> {
  await displaySessionTimer({ body: '', running: true, baseTimestampMs: Date.now() - elapsedSeconds * 1000 });
}

export async function stopSessionTimer(): Promise<void> {
  try {
    await notifee.cancelNotification(TIMER_NOTIFICATION_ID);
  } catch {}
}
