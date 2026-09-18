import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getAdminDashboard() {
  return apiFetch(
    ENDPOINTS.ADMIN_DASHBOARD.GET,
    {
      method: 'GET',
    },
  );
}