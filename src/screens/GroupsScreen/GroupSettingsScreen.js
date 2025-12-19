import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, radius } from '../../constants/theme';
import { useAppDispatch } from '../../hooks/hooks';
import { updateGroup, deleteGroup } from '../../store/slices/groupsSlice';

const GroupSettingsScreen = ({ group, userRole, onBack, onGroupUpdated, onGroupDeleted }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [privacy, setPrivacy] = useState(group?.privacy || 'public');
  const [allowMemberPosts, setAllowMemberPosts] = useState(group?.settings?.allowMemberPosts ?? true);
  const [requireApprovalForPosts, setRequireApprovalForPosts] = useState(group?.settings?.requireApprovalForPosts ?? false);
  const [maxMembers, setMaxMembers] = useState(group?.settings?.maxMembers?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const groupId = group?._id || group?.id;
  const isAdmin = userRole === 'admin';

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        description: description.trim(),
        privacy,
        settings: {
          allowMemberPosts,
          requireApprovalForPosts,
          maxMembers: maxMembers ? parseInt(maxMembers, 10) : null,
        },
      };

      const result = await dispatch(updateGroup({ groupId, groupData: updates })).unwrap();
      Alert.alert('Success', 'Group settings updated');
      onGroupUpdated?.(result);
      onBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update group settings');
    } finally {
      setSaving(false);
    }
  }, [name, description, privacy, allowMemberPosts, requireApprovalForPosts, maxMembers, groupId, dispatch, onGroupUpdated, onBack]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              Alert.alert('Success', 'Group deleted');
              onGroupDeleted?.();
              onBack();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete group');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [groupId, dispatch, onGroupDeleted, onBack]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Settings</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.pink} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell people what this group is about"
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyOptions}>
              {[
                { value: 'public', label: 'Public', icon: 'globe', desc: 'Anyone can find and join' },
                { value: 'private', label: 'Private', icon: 'lock', desc: 'Anyone can find, but must request to join' },
                { value: 'secret', label: 'Secret', icon: 'eye-slash', desc: 'Only members can find this group' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.privacyOption, privacy === option.value && styles.privacyOptionActive]}
                  onPress={() => setPrivacy(option.value)}
                >
                  <View style={styles.privacyOptionHeader}>
                    <Icon name={option.icon} size={18} color={privacy === option.value ? colors.pink : colors.textLight} />
                    <Text style={[styles.privacyOptionLabel, privacy === option.value && styles.privacyOptionLabelActive]}>
                      {option.label}
                    </Text>
                  </View>
                  <Text style={styles.privacyOptionDesc}>{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Post Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Member Posts</Text>
              <Text style={styles.settingDesc}>Members can create posts in this group</Text>
            </View>
            <Switch
              value={allowMemberPosts}
              onValueChange={setAllowMemberPosts}
              trackColor={{ false: colors.border, true: colors.pink }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Approval for Posts</Text>
              <Text style={styles.settingDesc}>Posts must be approved by admins/moderators before being visible</Text>
            </View>
            <Switch
              value={requireApprovalForPosts}
              onValueChange={setRequireApprovalForPosts}
              trackColor={{ false: colors.border, true: colors.pink }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Member Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Members</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty for unlimited"
              placeholderTextColor={colors.textLight}
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>Leave empty for unlimited members</Text>
          </View>
        </View>

        {/* Danger Zone - Admin Only */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Group</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              This will permanently delete the group and all its content. This action cannot be undone.
            </Text>
          </View>
        )}
      </ScrollView>
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
  saveButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  saveButtonText: {
    color: colors.pink,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  section: {
    padding: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.m,
  },
  dangerTitle: {
    color: colors.error,
  },
  inputGroup: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.m,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  privacyOptions: {
    gap: spacing.s,
  },
  privacyOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyOptionActive: {
    borderColor: colors.pink,
    backgroundColor: colors.bg,
  },
  privacyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  privacyOptionLabelActive: {
    color: colors.pink,
  },
  privacyOptionDesc: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 28,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.m,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textLight,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default GroupSettingsScreen;
