import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as invApi from '../api/invitations.api';

export const useInvitations = (params = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invitations', params],
    queryFn: () => invApi.fetchInvitations(params),
  });

  return { invitations: data || [], isLoading, error, refetch };
};

export const useTeamMembers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: invApi.fetchTeamMembers,
  });

  return { members: data || [], isLoading, error, refetch };
};

export const useInvitationMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invitations'] });
    queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
  };

  const createInvitations = useMutation({
    mutationFn: invApi.createInvitations,
    onSuccess: (results) => {
      invalidate();
      const sent = results.filter((r) => r.invitation).length;
      const failed = results.filter((r) => r.error).length;
      if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? 's' : ''} sent`);
      if (failed > 0) toast.error(`${failed} invitation${failed > 1 ? 's' : ''} failed`);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to send invitations'),
  });

  const updateInvitation = useMutation({
    mutationFn: ({ id, data }) => invApi.updateInvitation(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Invitation updated');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update'),
  });

  const deleteInvitation = useMutation({
    mutationFn: invApi.deleteInvitation,
    onSuccess: () => {
      invalidate();
      toast.success('Invitation revoked');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to revoke'),
  });

  const resendInvitation = useMutation({
    mutationFn: invApi.resendInvitation,
    onSuccess: () => {
      invalidate();
      toast.success('Invitation resent');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to resend'),
  });

  return { createInvitations, updateInvitation, deleteInvitation, resendInvitation };
};

export const useTeamMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teamMembers'] });

  const updateMember = useMutation({
    mutationFn: ({ userId, data }) => invApi.updateTeamMember(userId, data),
    onSuccess: () => {
      invalidate();
      toast.success('Member updated');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update member'),
  });

  const removeMember = useMutation({
    mutationFn: invApi.removeTeamMember,
    onSuccess: () => {
      invalidate();
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to remove member'),
  });

  return { updateMember, removeMember };
};
