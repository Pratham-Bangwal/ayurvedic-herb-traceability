import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { fetchTrace } from '../utils/api';

export function ConsumerScan() {
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);

  async function simulateScan() {
    setError(null); setTrace(null);
    try { setTrace(await fetchTrace(batchId)); } catch (e) { setError(e.message); }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Consumer Verification</Text>
      <Text>Enter Batch ID (simulating QR scan):</Text>
      <TextInput value={batchId} onChangeText={setBatchId} placeholder="Batch ID" style={{ borderWidth:1, padding:8, marginVertical:8 }} />
      <Button title="Scan" onPress={simulateScan} />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {trace && (
        <View style={{ marginTop: 16 }}>
          <Text>Batch: {trace.batchId}</Text>
          <Text>Name: {trace.name}</Text>
          <Text>Events: {(trace.processingEvents||[]).length}</Text>
          <Text>Chain TX: {trace.chain?.txHash}</Text>
        </View>
      )}
    </View>
  );
}
