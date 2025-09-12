import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../constants/theme';

const GoogleOAuthWebView = ({ url, onSuccess, onError }) => {
  const handleNavigationStateChange = (navState) => {
    // Check if the URL contains the success callback
    if (navState.url.includes('/oauth-callback')) {
      // Extract token and user data from URL
      const urlParams = new URLSearchParams(navState.url.split('?')[1]);
      const token = urlParams.get('token');
      const user = urlParams.get('user');
      
      if (token && user) {
        onSuccess({ token, user: JSON.parse(decodeURIComponent(user)) });
      } else {
        onError('Failed to get authentication data');
      }
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webview: {
    flex: 1,
  },
});

export default GoogleOAuthWebView;
