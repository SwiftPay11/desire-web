import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function changePassword(payload) {
  if (!payload?.currentPassword) {
    throw new Error(
      'Current password is required.',
    );
  }

  if (!payload?.newPassword) {
    throw new Error(
      'New password is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.AUTH.CHANGE_PASSWORD,
    {
      method: 'POST',
      body: JSON.stringify({
        currentPassword:
          payload.currentPassword,
        newPassword:
          payload.newPassword,
      }),
    },
  );
}