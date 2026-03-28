import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/Colors';

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.logo}>vela</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/quiz')}>
        <Text style={styles.buttonText}>Begin →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parchment, alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: Fonts.serif, fontSize: 48, color: Colors.plum, marginBottom: 40 },
  button: { backgroundColor: Colors.plum, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.parchment },
});
