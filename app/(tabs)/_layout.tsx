import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors, Fonts } from '../../constants/Colors';
import { useVelaStore } from '../../hooks/useVelaStore';

function TabIcon({ glyph, label, focused, showDot }: { glyph: string; label: string; focused: boolean; showDot?: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 1, width: '100%' }}>
      {showDot && (
        <View style={{ position: 'absolute', top: 0, right: '20%', width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold }} />
      )}
      <Text allowFontScaling={false} style={{ fontSize: 18, color: focused ? Colors.plum : Colors.mist }}>{glyph}</Text>
      <Text allowFontScaling={false} numberOfLines={1} style={{
        fontSize: 9,
        textTransform: 'uppercase',
        fontFamily: focused ? Fonts.sansMedium : Fonts.sansLight,
        color: focused ? Colors.plum : Colors.mist,
        marginTop: 2,
        width: '100%',
        textAlign: 'center',
      }}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { fluxActive, coolActive } = useVelaStore();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.cream,
        borderTopWidth: 3,
        borderTopColor: Colors.plum,
        height: 82,
        paddingBottom: 24,
        paddingTop: 8,
      },
      tabBarShowLabel: false,
      tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
    }}>
      <Tabs.Screen name="ritual" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="◌" label="Ritual" focused={focused} /> }} />
      <Tabs.Screen name="plate" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="◈" label="Plate" focused={focused} /> }} />
      <Tabs.Screen name="flux" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="◎" label="Flux" focused={focused} showDot={!fluxActive} /> }} />
      <Tabs.Screen name="cool" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="◇" label="Cool" focused={focused} showDot={!coolActive} /> }} />
      <Tabs.Screen name="shift" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="⬡" label="Shift" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon glyph="◉" label="Me" focused={focused} /> }} />
    </Tabs>
  );
}
