import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * GeoVerification Component
 * 
 * This component allows verification of herb collection location by:
 * 1. Getting the user's current location
 * 2. Comparing it with the registered farm location
 * 3. Providing verification status based on proximity
 */
const GeoVerification = ({ route }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verified', 'failed'
  const [distance, setDistance] = useState(null);
  
  // Extract herb details from route params
  const { herb } = route.params || {};
  
  // Farm location coordinates from the herb data
  const farmLocation = herb && {
    latitude: parseFloat(herb.lat || 0),
    longitude: parseFloat(herb.lng || 0),
  };

  // Verification radius in meters (adjustable)
  const VERIFICATION_RADIUS = 5000; // 5km
  
  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        // Get current position with high accuracy
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        
        setLocation(location.coords);
        
        // Calculate distance if farm location is available
        if (farmLocation && farmLocation.latitude && farmLocation.longitude) {
          const calculatedDistance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            farmLocation.latitude,
            farmLocation.longitude
          );
          
          setDistance(calculatedDistance);
          
          // Set verification status based on distance
          if (calculatedDistance <= VERIFICATION_RADIUS / 1000) { // Convert meters to km
            setVerificationStatus('verified');
          } else {
            setVerificationStatus('failed');
          }
        } else {
          setErrorMsg('Farm location coordinates not available');
          setVerificationStatus('failed');
        }
      } catch (error) {
        setErrorMsg('Error getting location: ' + error.message);
        setVerificationStatus('failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /**
   * Calculate distance between two coordinates using the Haversine formula
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const getVerificationStatusUI = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="verified-user" size={40} color="#4CAF50" />
            <Text style={styles.verifiedText}>Location Verified</Text>
            <Text style={styles.distanceText}>
              You are {distance.toFixed(2)}km from the registered farm location
            </Text>
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <MaterialIcons name="gpp-bad" size={40} color="#F44336" />
            <Text style={styles.failedText}>Verification Failed</Text>
            {distance && (
              <Text style={styles.distanceText}>
                You are {distance.toFixed(2)}km from the registered farm location
              </Text>
            )}
          </View>
        );
      default:
        return <ActivityIndicator size="large" color="#2c5530" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c5530" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error" size={40} color="#F44336" />
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  const initialRegion = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geolocation Verification</Text>
      
      <View style={styles.mapContainer}>
        {initialRegion && (
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
          >
            {/* User's current location */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Your Location"
              pinColor="#2196F3"
            />
            
            {/* Farm location */}
            {farmLocation && farmLocation.latitude && farmLocation.longitude && (
              <>
                <Marker
                  coordinate={{
                    latitude: farmLocation.latitude,
                    longitude: farmLocation.longitude,
                  }}
                  title="Farm Location"
                  pinColor="#4CAF50"
                />
                
                {/* Verification radius circle */}
                <Circle
                  center={{
                    latitude: farmLocation.latitude,
                    longitude: farmLocation.longitude,
                  }}
                  radius={VERIFICATION_RADIUS}
                  fillColor="rgba(76, 175, 80, 0.1)"
                  strokeColor="rgba(76, 175, 80, 0.5)"
                />
              </>
            )}
          </MapView>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.herbInfo}>Batch: {herb?.batchId || 'Unknown'}</Text>
        <Text style={styles.herbInfo}>Herb: {herb?.name || herb?.herbName || 'Unknown'}</Text>
        <Text style={styles.herbInfo}>Farmer: {herb?.farmerName || 'Unknown'}</Text>
      </View>
      
      <View style={styles.verificationContainer}>
        {getVerificationStatusUI()}
      </View>
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => {
          setLoading(true);
          setVerificationStatus('pending');
          setErrorMsg(null);
          // Re-trigger the useEffect by forcing a re-render
          setLocation(null);
        }}
      >
        <MaterialIcons name="refresh" size={24} color="white" />
        <Text style={styles.refreshButtonText}>Refresh Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5530',
  },
  herbInfo: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  verificationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer: {
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  failedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 8,
  },
  distanceText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5530',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GeoVerification;