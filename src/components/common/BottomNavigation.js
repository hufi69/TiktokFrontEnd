import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

const TABS = [
  { id: 'home',   icon: 'home',          label: 'Home' },
  { id: 'search', icon: 'search',        label: 'Search' },
  { id: 'create', icon: 'plus',          label: 'Create' },
  { id: 'inbox', icon: 'paper-plane-o', label: 'Inbox' },
  { id: 'profile',icon: 'user-o',        label: 'Profile' },
];

const BottomNavigation = ({ activeTab, onTabPress, unreadCount = 0 }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 8) } // only place we use bottom inset
      ]}
    >
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          {tab.id === 'create' ? (
            <View style={styles.createFab}>
              <Icon name={tab.icon} size={20} color={colors.bg} />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <Icon
                name={tab.icon}
                size={24}
                color={activeTab === tab.id ? colors.text : colors.textLight}
              />
              {/* Unread badge for inbox */}
              {tab.id === 'inbox' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '+99' : `+${unreadCount}`}
                  </Text>
                </View>
              )}
            </View>
          )}
          <Text
            style={[
              styles.label,
              { color: activeTab === tab.id ? colors.text : colors.textLight }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,               
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.s,
    paddingHorizontal: spacing.s,
    // optional shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
    gap: 4,
  },
  createFab: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF3040',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BottomNavigation;
