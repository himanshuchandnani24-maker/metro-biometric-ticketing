const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || data.message || 'Request failed', response.status, data);
  }
  return data;
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = localStorage.getItem('metro_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  return parseResponse(response);
}

async function multipartRequest(path, formData) {
  const headers = {};
  const token = localStorage.getItem('metro_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return parseResponse(response);
}

export async function registerUser({ name, email, password }) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser({ email, password }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getWalletBalance(userId) {
  return request(`/wallet/${userId}`);
}

export async function getWalletConfig() {
  return request('/wallet/config');
}

export async function createWalletOrder(userId, amount) {
  return request('/wallet/create-order', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount }),
  });
}

export async function verifyWalletPayment(paymentData) {
  return request('/wallet/verify-payment', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
}

export async function getWalletPayments(userId) {
  return request(`/wallet/payments/${userId}`);
}

export async function topupWallet(userId, amount) {
  return request('/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount }),
  });
}

export async function registerFingerprint(userId, file) {
  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('fingerprint', file);
  return multipartRequest('/fingerprint/register', formData);
}

export async function getFingerprintStatus(userId) {
  return request(`/fingerprint/status/${userId}`);
}

export async function verifyFingerprint(userId, file) {
  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('fingerprint', file);
  return multipartRequest('/fingerprint/verify', formData);
}

export async function tripEntry(userId, entryStationId, file) {
  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('entry_station_id', String(entryStationId));
  formData.append('fingerprint', file);
  return multipartRequest('/trip/entry', formData);
}

export async function tripExit(userId, exitStationId, file) {
  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('exit_station_id', String(exitStationId));
  formData.append('fingerprint', file);
  return multipartRequest('/trip/exit', formData);
}

export async function getTripHistory(userId) {
  return request(`/trip/history/${userId}`);
}

export async function getAdminTrips() {
  return request('/admin/trips');
}

export async function getAdminRevenue() {
  return request('/admin/revenue');
}

export async function getAdminAlerts() {
  return request('/admin/alerts');
}

export { ApiError };
