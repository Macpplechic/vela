import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useVelaStore } from '../hooks/useVelaStore';
import { Colors } from '../constants/Colors';

export default function IndexScreen() {
  const { isLoading, onboarded, phase } = useVelaStore();

  useEffect(() => {
    if (isLoading) return;
    if (!onboarded) {
      router.replace('/onboarding');
    } else if (!phase) {
      router.replace('/quiz');
    } else {
      router.replace('/(tabs)/ritual');
    }
  }, [isLoading, onboarded, phase]);

  return (
    <View style={{ flex:1, backgroundColor:Colors.parchment, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={Colors.plum} size="large" />
    </View>
  );
}
