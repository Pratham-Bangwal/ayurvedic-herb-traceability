import React from 'react';
import { View, Text } from 'react-native';

// Minimal demo screen – integrate API calls / QR scanning later
export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        Ayurvedic Herb Traceability Mobile Demo{"\n"}Ready (SDK 49 / RN 0.72)
      </Text>
    </View>
  );
}
