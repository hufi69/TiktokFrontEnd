import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../../constants/theme';
import { CONFIG } from '../../../config';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return DEFAULT_AVATAR;
  if (/^https?:\/\//.test(profilePicture)) return profilePicture;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/public/uploads/users/${profilePicture}`;
};

const GroupMemberItem = ({ member, onPress, currentUserRole, onRoleChange }) => {
  const isAdmin = member.role === 'admin';
  const isModerator = member.role === 'moderator';
  const canManage = currentUserRole === 'admin';
  const isCurrentUser = false; 
  const handleMenuPress = (e) => {
    e.stopPropagation();
    onRoleChange?.(member);
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: getAvatarUrl(member.user?.profilePicture) }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {member.user?.fullName || member.user?.userName || 'Unknown'}
          </Text>
          {isAdmin && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Admin</Text>
            </View>
          )}
          {isModerator && !isAdmin && (
            <View style={[styles.roleBadge, styles.moderatorBadge]}>
              <Text style={styles.roleText}>Mod</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>
          @{member.user?.userName || 'unknown'}
        </Text>
      </View>
      {canManage && (
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <Icon name="ellipsis-v" size={18} color={colors.textLight} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.m,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textLight,
  },
  roleBadge: {
    backgroundColor: colors.pink,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.s,
  },
  moderatorBadge: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  menuButton: {
    padding: spacing.xs,
  },
});

export default GroupMemberItem;
