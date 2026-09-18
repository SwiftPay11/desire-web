import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getNotifications() {
  return apiFetch(
    ENDPOINTS.NOTIFICATIONS.GET_ALL,
    {
      method: 'GET',
    },
  );
}

export async function getUnreadNotificationCount() {
  return apiFetch(
    ENDPOINTS.NOTIFICATIONS
      .UNREAD_COUNT,
    {
      method: 'GET',
    },
  );
}

export async function markNotificationAsRead(
  notificationId,
) {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.NOTIFICATIONS
      .MARK_READ(notificationId),
    {
      method: 'PATCH',
    },
  );
}

export async function markAllNotificationsAsRead() {
  return apiFetch(
    ENDPOINTS.NOTIFICATIONS
      .MARK_ALL_READ,
    {
      method: 'PATCH',
    },
  );
}