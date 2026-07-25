const ORTHANC_URL = process.env.ORTHANC_URL || 'http://localhost:8042';

// In-memory fallback if Orthanc is not running/available during development, to avoid crashes
const mockStore = new Map();

export async function uploadImage(patientId, fileBuffer) {
  try {
    const res = await fetch(`${ORTHANC_URL}/instances`, {
      method: 'POST',
      body: fileBuffer,
    });
    if (!res.ok) throw new Error(`Orthanc upload failed: ${res.statusText}`);
    const data = await res.json();
    return data.ID;
  } catch (err) {
    console.warn('Orthanc not available, using fallback in-memory store:', err.message);
    const mockId = 'mock-' + Math.random().toString(36).substr(2, 9);
    mockStore.set(mockId, fileBuffer);
    return mockId;
  }
}

export async function getImage(storeRefId) {
  if (storeRefId && storeRefId.startsWith('mock-')) {
    return mockStore.get(storeRefId);
  }
  try {
    const res = await fetch(`${ORTHANC_URL}/instances/${storeRefId}/file`);
    if (!res.ok) throw new Error(`Orthanc retrieve failed: ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error('Failed to get image from Orthanc:', err.message);
    return mockStore.get(storeRefId) || Buffer.alloc(0);
  }
}

export async function deleteImage(storeRefId) {
  if (!storeRefId) return;
  if (storeRefId.startsWith('mock-')) {
    mockStore.delete(storeRefId);
    return;
  }
  try {
    const res = await fetch(`${ORTHANC_URL}/instances/${storeRefId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Orthanc delete failed: ${res.statusText}`);
    }
  } catch (err) {
    console.error('Failed to delete image from Orthanc:', err.message);
  }
}
