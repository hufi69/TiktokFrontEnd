import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../../constants/theme';
import { CONFIG } from '../../../config';

const getGroupImageUrl = (image) => {
  if (!image) return null;
  if (/^https?:\/\//.test(image)) return image;
  const baseUrl = CONFIG.API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;
};

const GroupItem = ({ group, onPress, isJoined, onJoin, joining }) => {
  const privacyIcon = group.privacy === 'public' ? 'globe' : 
                     group.privacy === 'private' ? 'lock' : 'eye-slash';

  const handleJoinPress = (e) => {
    e.stopPropagation();
    onJoin?.(group);
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {getGroupImageUrl(group.coverImage || group.profileImage) ? (
        <Image 
          source={{ uri: getGroupImageUrl(group.coverImage || group.profileImage) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverImagePlaceholder}>
          <Icon name="image" size={32} color={colors.textLight} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          {getGroupImageUrl(group.profileImage) ? (
            <Image 
              source={{ uri: getGroupImageUrl(group.profileImage) }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="users" size={24} color={colors.textLight} />
            </View>
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
              <Icon name={privacyIcon} size={14} color={colors.textLight} />
            </View>
            {group.description && (
              <Text style={styles.description} numberOfLines={2}>
                {group.description}
              </Text>
            )}
          </View>
          {!isJoined && onJoin && (
            <TouchableOpacity
              style={[styles.joinButton, joining && styles.joinButtonDisabled]}
              onPress={handleJoinPress}
              disabled={joining}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>{joining ? 'Joining...' : 'Join'}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Icon name="users" size={14} color={colors.textLight} />
            <Text style={styles.statText}>{group.memberCount || 0} members</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="file-text" size={14} color={colors.textLight} />
            <Text style={styles.statText}>{group.postCount || 0} posts</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderRadius: radius.m,
    marginBottom: spacing.m,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.m,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: radius.m,
    marginRight: spacing.s,
    backgroundColor: colors.surface,
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: radius.m,
    marginRight: spacing.s,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 12,
    color: colors.textLight,
  },
  joinButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginLeft: spacing.s,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: colors.pink,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupItem;
