// Daily reminder and notification manager

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options,
      });
    } catch (e) {
      console.warn('Could not trigger Notification:', e);
    }
  }
}

// Check and fire reminder if it's currently due
export function checkDailyReminder(reminderTime: string, enabled: boolean): boolean {
  if (!enabled || !reminderTime) return false;

  const now = new Date();
  const [targetHour, targetMinute] = reminderTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // If matching the hour and minute within 5 min window and not fired today
  const todayKey = `reminder_sent_${now.toISOString().split('T')[0]}`;
  const alreadySent = localStorage.getItem(todayKey);

  if (currentHour === targetHour && Math.abs(currentMinute - targetMinute) <= 2 && !alreadySent) {
    localStorage.setItem(todayKey, 'true');
    sendBrowserNotification('🎙️ وقت تمرین اسپیکینگ روزانه‌ت فرا رسیده!', {
      body: 'فقط ۵ دقیقه با مربی هوش مصنوعیت صحبت کن تا استریک و تسلط زبانت حفظ بشه.',
    });
    return true;
  }

  return false;
}
