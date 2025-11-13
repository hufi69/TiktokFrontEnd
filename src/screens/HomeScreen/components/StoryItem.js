import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../../constants/theme';

const StoryItem = ({ story, onPress }) => (
  <TouchableOpacity style={styles.storyContainer} onPress={() => onPress(story)}>
    <View style={[styles.storyImageContainer, story.isYourStory && styles.yourStoryBorder]}>
      <Image source={{ uri: story.avatar }} style={styles.storyImage} />
      {story.isYourStory && (
        <View style={styles.addStoryIcon}>
          <Icon name="plus" size={12} color="#fff" />
        </View>
      )}
    </View>
    <Text style={styles.storyUsername} numberOfLines={1}>
      {story.isYourStory ? 'You' : story.username}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  storyContainer: {
    alignItems: 'center',
    width: 70,
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.pink,
    padding: 2,
    position: 'relative',
  },
  yourStoryBorder: {
    borderColor: colors.border,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyUsername: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StoryItem;
