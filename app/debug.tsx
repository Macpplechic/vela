import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Debug() {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const screen = Dimensions.get('screen');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>window width: {width}</Text>
      <Text style={styles.text}>window height: {height}</Text>
      <Text style={styles.text}>screen width: {screen.width}</Text>
      <Text style={styles.text}>screen height: {screen.height}</Text>
      <Text style={styles.text}>inset top: {insets.top}</Text>
      <Text style={styles.text}>inset bottom: {insets.bottom}</Text>
      <Text style={styles.text}>inset left: {insets.left}</Text>
      <Text style={styles.text}>inset right: {insets.right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, marginBottom: 10 },
});
