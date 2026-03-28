import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  { glyph:'\u25d0', title:'You are not losing your mind.', subtitle:'Perimenopause affects 1 billion women worldwide. Vela gives you the tools, knowledge, and community to navigate it with clarity.', color:Colors.gold, bg:Colors.goldPale },
  { glyph:'\u25c8', title:'Your body. Your data.', subtitle:'Track what you eat, how you sleep, and which symptoms show up — then watch Vela surface patterns your doctor never had time to find.', color:Colors.sage, bg:Colors.sagePale },
  { glyph:'\u25ce', title:'Science-backed. Women-led.', subtitle:'Every supplement, food, and breathwork protocol in Vela is rooted in peer-reviewed research on hormonal health and the menopausal transition.', color:Colors.teal, bg:Colors.tealPale },
  { glyph:'\u25c9', title:'Your shift. Your terms.', subtitle:'Vela does not tell you how to feel about this chapter. It gives you everything you need to move through it on your own terms.', color:Colors.plum, bg:Colors.parchmentDark },
];

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSlide(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleNext = () => {
    if (slide < SLIDES.length - 1) { goTo(slide + 1); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace('/quiz'); }
  };

  const s = SLIDES[slide];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topRow}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, { backgroundColor: i===slide ? Colors.plum : Colors.parchmentDark, width: i===slide ? 20 : 6 }]} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => router.replace('/quiz')} style={styles.skipBtn}>
          <Text allowFontScaling={false} style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ flex:1 }}>
        {SLIDES.map((sl, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.glyphContainer, { backgroundColor: sl.bg }]}>
              <Text allowFontScaling={false} style={[styles.glyph, { color: sl.color }]}>{sl.glyph}</Text>
            </View>
            <Text allowFontScaling={false} style={styles.title}>{sl.title}</Text>
            <Text allowFontScaling={false} style={styles.subtitle}>{sl.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text allowFontScaling={false} style={styles.nextBtnText}>
            {slide < SLIDES.length - 1 ? 'Continue \u2192' : 'Find my phase \u2192'}
          </Text>
        </TouchableOpacity>
        {slide === SLIDES.length - 1 && (
          <Text allowFontScaling={false} style={styles.legalText}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:Colors.parchment },
  topRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:24, paddingTop:8, paddingBottom:16 },
  dots:{ flexDirection:'row', gap:6, alignItems:'center' },
  dot:{ height:6, borderRadius:3 },
  skipBtn:{ padding:8 },
  skipText:{ fontFamily:Fonts.sans, fontSize:13, color:Colors.mist },
  slide:{ paddingHorizontal:32, alignItems:'center', justifyContent:'center', paddingBottom:40 },
  glyphContainer:{ width:120, height:120, borderRadius:60, alignItems:'center', justifyContent:'center', marginBottom:40 },
  glyph:{ fontSize:56 },
  title:{ fontFamily:Fonts.serif, fontSize:28, color:Colors.plum, textAlign:'center', lineHeight:38, marginBottom:20 },
  subtitle:{ fontFamily:Fonts.sans, fontSize:15, color:Colors.mist, textAlign:'center', lineHeight:24 },
  bottom:{ paddingHorizontal:24, paddingBottom:32, gap:12 },
  nextBtn:{ backgroundColor:Colors.plum, borderRadius:30, padding:18, alignItems:'center' },
  nextBtnText:{ fontFamily:Fonts.sansMedium, fontSize:15, color:Colors.parchment, letterSpacing:1 },
  legalText:{ fontFamily:Fonts.sans, fontSize:10, color:Colors.mist, textAlign:'center', lineHeight:16 },
});
