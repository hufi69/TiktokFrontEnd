import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchJoinRequests, approveJoinRequest, rejectJoinRequest } from '../../store/slices/groupsSlice';
import { CONFIG } from '../../config';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/public/img/users/${profilePicture}`;
};

const JoinRequestsScreen = ({ group, onBack, onUserPress }) => {
  const dispatch = useAppDispatch();
  const { joinRequests, isLoading } = useAppSelector(state => state.groups);
  const groupId = group?._id || group?.id;
  const requests = groupId ? (joinRequests[groupId] || []) : [];
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchJoinRequests(groupId));
    }
  }, [groupId, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (groupId) {
      await dispatch(fetchJoinRequests(groupId));
    }
    setRefreshing(false);
  }, [groupId, dispatch]);

  const handleApprove = useCallback(async (request) => {
    setProcessing(request._id || request.id);
    try {
      await dispatch(approveJoinRequest({ groupId, requestId: request._id || request.id })).unwrap();
      Alert.alert('Success', 'Join request approved');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  }, [groupId, dispatch]);

  const handleReject = useCallback(async (request) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${request.user?.fullName || request.user?.userName}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(request._id || request.id);
            try {
              await dispatch(rejectJoinRequest({ groupId, requestId: request._id || request.id })).unwrap();
              Alert.alert('Success', 'Join request rejected');
            } catch (error) {
              Alert.alert('Error', error || 'Failed to reject request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  }, [groupId, dispatch]);

  const renderRequest = useCallback(({ item }) => {
    const isProcessing = processing === (item._id || item.id);
    return (
      <View style={styles.requestItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress?.(item.user)}
          disabled={isProcessing}
        >
          <Image
            source={{ uri: getAvatarUrl(item.user?.profilePicture) }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.user?.fullName || item.user?.userName || 'Unknown'}
            </Text>
            <Text style={styles.userHandle}>@{item.user?.userName || 'unknown'}</Text>
            {item.message && (
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            )}
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.actionText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            <Icon name="times" size={16} color="#fff" />
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [processing, handleApprove, handleReject, onUserPress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Join Requests</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group?.name || 'Group'}</Text>
        <Text style={styles.count}>{requests.length} pending request{requests.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.pink]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="user-plus" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>All join requests have been processed</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.s,
  },
  groupInfo: {
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: 14,
    color: colors.textLight,
  },
  listContent: {
    padding: spacing.m,
  },
  requestItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: spacing.m,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.m,
    backgroundColor: colors.surface,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userHandle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    gap: spacing.xs,
  },
  approveButton: {
    backgroundColor: colors.pink,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.m,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});

export default JoinRequestsScreen;
