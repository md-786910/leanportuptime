import api from './axiosInstance';

// Invitations
export const createInvitations = async (invitations) => {
  const { data } = await api.post('/api/invitations', { invitations });
  return data.data;
};

export const fetchInvitations = async (params = {}) => {
  const { data } = await api.get('/api/invitations', { params });
  return data.data;
};

export const updateInvitation = async (id, payload) => {
  const { data } = await api.patch(`/api/invitations/${id}`, payload);
  return data.data;
};

export const deleteInvitation = async (id) => {
  const { data } = await api.delete(`/api/invitations/${id}`);
  return data.data;
};

export const resendInvitation = async (id) => {
  const { data } = await api.post(`/api/invitations/${id}/resend`);
  return data.data;
};

export const acceptInvitation = async ({ token, name, password }) => {
  const { data } = await api.post('/api/invitations/accept', { token, name, password });
  return data.data;
};

// Team members
export const fetchTeamMembers = async () => {
  const { data } = await api.get('/api/users/team');
  return data.data;
};

export const updateTeamMember = async (userId, payload) => {
  const { data } = await api.patch(`/api/users/team/${userId}`, payload);
  return data.data;
};

export const removeTeamMember = async (userId) => {
  const { data } = await api.delete(`/api/users/team/${userId}`);
  return data.data;
};
