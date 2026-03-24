import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

export default function App() {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to automatically derive the local Vite server URL from the Expo Go connection
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri || Constants.manifest2?.extra?.expoGo?.hostUri;
    const localIp = hostUri ? hostUri.split(':')[0] : '10.0.2.2'; 
    const defaultViteUrl = `http://${localIp}:5173`;
    setUrl(defaultViteUrl);
    setInputUrl(defaultViteUrl);
  }, []);

  if (!url) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color="#14b8a6" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dev Debug Bar */}
      <View style={styles.devBar}>
        <TextInput 
          style={styles.input} 
          value={inputUrl}
          onChangeText={setInputUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity style={styles.button} onPress={() => { setUrl(inputUrl); setError(null); setLoading(true); }}>
          <Text style={styles.buttonText}>GO</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={styles.errorText}>Failed to load:</Text>
           <Text style={styles.errorSub}>{error}</Text>
           <Text style={styles.helpText}>1. Ensure 'npm run dev' is running in a terminal.</Text>
           <Text style={styles.helpText}>2. Verify the IP address matches your computer's local Wi-Fi IP.</Text>
           <Text style={styles.helpText}>3. Verify Vite is on port 5173.</Text>
        </View>
      ) : (
        <View style={styles.webviewWrapper}>
          {loading && (
             <View style={styles.loadingOverlay}>
               <ActivityIndicator size="large" color="#14b8a6" />
               <Text style={styles.loadingText}>Connecting to local server...</Text>
             </View>
          )}
          <WebView 
            source={{ uri: url }} 
            style={styles.webview} 
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setLoading(false);
              setError(nativeEvent.description || 'Unknown network error');
            }}
            injectedJavaScript={`
              const meta = document.createElement('meta'); 
              meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); 
              meta.setAttribute('name', 'viewport'); 
              document.getElementsByTagName('head')[0].appendChild(meta);
              true;
            `}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Default zinc-950
  },
  devBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#27272a',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#14b8a6', // Teal 500
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  webviewWrapper: {
    flex: 1,
    position: 'relative'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#a1a1aa',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  errorSub: {
    color: '#fca5a5',
    marginBottom: 24,
    textAlign: 'center',
  },
  helpText: {
    color: '#a1a1aa',
    textAlign: 'left',
    width: '100%',
    marginBottom: 4,
  }
});
