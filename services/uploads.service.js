import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function uploadSingleFile(file) {
  if (!(file instanceof File)) {
    throw new Error(
      'Please select a valid file.',
    );
  }

  const formData = new FormData();

  formData.append(
    'image',
    file,
  );

  return apiFetch(
    ENDPOINTS.UPLOADS.PAYMENT_PROOF,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function uploadAdminImage(file) {
  if (!(file instanceof File)) {
    throw new Error(
      'Please select a valid image.',
    );
  }

  const formData = new FormData();

  formData.append(
    'image',
    file,
  );

  return apiFetch(
    ENDPOINTS.UPLOADS.SINGLE,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function uploadAdminImages(files) {
  if (
    !Array.isArray(files) ||
    files.length === 0
  ) {
    throw new Error(
      'Please select at least one image.',
    );
  }

  const formData = new FormData();

  files.forEach((file) => {
    if (!(file instanceof File)) {
      throw new Error(
        'One or more selected images are invalid.',
      );
    }

    formData.append(
      'images',
      file,
    );
  });

  return apiFetch(
    ENDPOINTS.UPLOADS.MULTIPLE,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export function getUploadedFileUrl(response) {
  return (
    response?.url ||
    response?.fileUrl ||
    response?.path ||
    response?.filename ||
    response?.file?.url ||
    response?.file?.fileUrl ||
    response?.file?.path ||
    response?.file?.filename ||
    response?.data?.url ||
    response?.data?.fileUrl ||
    response?.data?.path ||
    response?.data?.filename ||
    ''
  );
}

export function getUploadedFileUrls(response) {
  const files =
    response?.files ||
    response?.images ||
    response?.data?.files ||
    response?.data?.images ||
    [];

  if (!Array.isArray(files)) {
    return [];
  }

  return files
    .map((file) => {
      if (
        typeof file ===
        'string'
      ) {
        return file;
      }

      return (
        file?.url ||
        file?.fileUrl ||
        file?.path ||
        file?.filename ||
        ''
      );
    })
    .filter(Boolean);
}