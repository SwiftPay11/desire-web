import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getAddresses() {
  return apiFetch(ENDPOINTS.ADDRESSES.GET_ALL);
}

export async function createAddress(data) {
  return apiFetch(ENDPOINTS.ADDRESSES.CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(id, data) {
  return apiFetch(ENDPOINTS.ADDRESSES.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id) {
  return apiFetch(ENDPOINTS.ADDRESSES.DELETE(id), {
    method: 'DELETE',
  });
}

export async function setDefaultAddress(id) {
  return apiFetch(ENDPOINTS.ADDRESSES.SET_DEFAULT(id), {
    method: 'PATCH',
  });
}