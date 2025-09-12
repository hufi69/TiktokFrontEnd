# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Keep React Native bridge
-keep class com.facebook.react.bridge.** { *; }

# Keep JavaScript interface
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}

# Keep Redux
-keep class com.facebook.react.bridge.ReadableArray { *; }
-keep class com.facebook.react.bridge.ReadableMap { *; }
-keep class com.facebook.react.bridge.WritableArray { *; }
-keep class com.facebook.react.bridge.WritableMap { *; }

# Keep AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Keep Image Picker
-keep class com.imagepicker.** { *; }

# Keep Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Remove unused code
-dontwarn **
-ignorewarnings

# Optimize
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}
