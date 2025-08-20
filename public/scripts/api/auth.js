const AUTH_API_BASE = '/api/v1/auth';

// Get authenticated user's personal details
export async function getMe() {
  const res = await fetch(`${AUTH_API_BASE}/me`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Failed to load user');

  return data.data;
}

// Update user info (name, etc.)
export async function updateUser(updates) {
  const res = await fetch(`${AUTH_API_BASE}/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update failed');
  return data.data;
}

// Request reset password link
export async function requestPasswordReset(email) {
  const res = await fetch(`${AUTH_API_BASE}/resetPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Reset link request failed');
  return data.msg;
}

// Reset password with token
export async function resetPassword({ token, newPassword }) {
  const res = await fetch(`${AUTH_API_BASE}/resetPassword`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      newPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Password reset failed');
  return data.message;
}

// Request email update link
export async function requestEmailUpdate(newEmail) {
  const res = await fetch(`${AUTH_API_BASE}/updateEmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email: newEmail }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Email update request failed');
  return data.msg;
}

// Confirm email update (usually via token in URL)
export async function confirmEmailUpdate(token) {
  const res = await fetch(`${AUTH_API_BASE}/updateEmail?token=${token}`, {
    method: 'GET',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Email update failed');
  return data.message;
}
