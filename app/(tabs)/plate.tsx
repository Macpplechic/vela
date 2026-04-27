import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { PHASES, FOOD_DB, Food } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

export default function PlateScreen() {
  const { phase, foods, setFoods, totals } = useVelaStore();
  const [search, setSearch] = useState('');
  const [showFood, setShowFood] = useState(false);

  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const USDA_KEY = 'DEMO_KEY'; // Replace with your free key from fdc.nal.usda.gov

  const pd = PHASES[phase ?? 'late'];

  const pct = (v: number, m: number) => Math.min(100, Math.round((v / m) * 100));
  const aiScore = foods.length > 0 ? Math.min(100, Math.round((totals.ai / (foods.length * 10)) * 100)) : 0;
  const searchUSDA = async (query: string) => {
    if (query.length < 2) { setApiResults([]); return; }
    setApiLoading(true);
    try {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=20&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy`
      );
      const data = await res.json();
      const mapped = (data.foods ?? []).map((f: any) => {
        const get = (name: string) => {
          const n = f.foodNutrients?.find((x: any) =>
            x.nutrientName?.toLowerCase().includes(name.toLowerCase())
          );
          return Math.round((n?.value ?? 0) * 10) / 10;
        };
        return {
          id: `usda_${f.fdcId}`,
          name: f.description?.split(',')[0]?.replace(/raw$/i,'').trim() ?? f.description,
          category: 'usda',
          protein: get('protein'),
          fiber: get('fiber'),
          calcium: get('calcium'),
          magnesium: get('magnesium'),
          omega3: get('18:3') || get('omega'),
          phyto: 0,
          cal: get('energy') || get('calor'),
          ai: Math.min(10, Math.round((get('18:3') * 2 + (get('fiber') > 3 ? 2 : 0) + (get('protein') > 15 ? 1 : 0)))),
          phase: ['early','late','post'] as any,
        };
      }).filter((f: any) => f.cal > 0 || f.protein > 0);
      setApiResults(mapped);
    } catch(e) {
      // fallback to local search
      setApiResults([]);
    } finally {
      setApiLoading(false);
    }
  };

  const getAiAdvice = () => {
    const phaseKey = pd.label?.toLowerCase() ?? '';
    const p = Math.round(totals.protein);
    const proteinTarget = pd.targets.protein;
    const fiberTarget = pd.targets.fiber;
    const f = Math.round(totals.fiber);
    const aiS = aiScore;

    // Pick the most urgent nutrient gap
    const gaps = [
      { nutrient: 'protein', pct: p / proteinTarget, tips: [
        'Add 3oz of wild salmon — 22g protein, richest omega-3 source available.',
        'Stir 2 tbsp hemp seeds into yogurt — 10g complete protein, done in 30 seconds.',
        'Hard-boil 2 eggs tonight — 12g protein, keeps in the fridge all week.',
      ]},
      { nutrient: 'fiber', pct: f / fiberTarget, tips: [
        'Add half an avocado to your next meal — 5g fiber, hormone-supportive fats.',
        'Toss a handful of edamame into whatever you're eating — 8g fiber, 17g protein.',
        'Swap your bread for a small sweet potato — 4g fiber, phytoestrogen boost.',
      ]},
      { nutrient: 'anti-inflammatory', pct: aiS / 100, tips: [
        'Add fresh ginger or turmeric to your next meal — top-tier anti-inflammatory.',
        'A small handful of walnuts right now — best plant-based anti-inflammatory food.',
        'Add dark leafy greens to any meal — spinach or kale doubles your score.',
      ]},
    ].sort((a, b) => a.pct - b.pct);

    const gap = gaps[0];
    const tip = gap.tips[Math.floor(Math.random() * gap.tips.length)];
    setAiAdvice(tip);
  };

  const scanMeal = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Please allow camera access to photograph your meal.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (result.canceled) return;
    setScannedImage(result.assets[0].uri);
    // Show search after photo so user can find and log the foods they photographed
    setShowFood(true);
    Alert.alert(
      '📷 Meal captured!',
      'Search for the foods in your photo below and tap to add them to your plate.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const filteredFoods = search.length > 1 ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30) : [];

  const addFood = async (f: Food) => {
    await setFoods([...foods, f]);
    setSearch('');
  };
  const removeFood = async (i: number) => {
    await setFoods(foods.filter((_, j) => j !== i));
  };

  const nutrients = [
    { key:'protein' as keyof typeof totals, label:'Protein', u:'g', color:Colors.rose, tip:'Key for muscle & mood' },
    { key:'fiber' as keyof typeof totals, label:'Fiber', u:'g', color:Colors.sage },
    { key:'calcium' as keyof typeof totals, label:'Calcium', u:'mg', color:Colors.gold },
    { key:'magnesium' as keyof typeof totals, label:'Magnesium', u:'mg', color:Colors.plumLight },
    { key:'omega3' as keyof typeof totals, label:'Omega-3', u:'g', color:Colors.teal },
    { key:'phyto' as keyof typeof totals, label:'Phytoestrogens', u:'mg', color:Colors.gold },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>The Peri Plate</Text>
          <TouchableOpacity style={styles.scanButton} onPress={scanMeal} activeOpacity={0.85}>
            <Text style={styles.scanButtonText}>📷 photo log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowFood(!showFood)}>
            <Text style={styles.addButtonText}>+ log food</Text>
          </TouchableOpacity>
        </View>

        {/* Score row */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Calories</Text>
            <Text style={styles.scoreNum}>{Math.round(totals.cal)}</Text>
          </View>
          <View style={[styles.scoreCard, { backgroundColor: Colors.sagePale, borderColor: Colors.sage }]}>
            <Text style={[styles.scoreLabel, { color: Colors.sage }]}>Anti-inflam</Text>
            <Text style={[styles.scoreNum, { color: Colors.sage }]}>{aiScore}<Text style={styles.scoreDenom}>/100</Text></Text>
          </View>
        </View>

        {/* Nutrient rings (simplified as bars for native) */}
        <View style={styles.ringGrid}>
          {nutrients.map(n => {
            const val = totals[n.key] as number;
            const target = pd.targets[n.key as keyof typeof pd.targets] as number;
            const p = pct(val, target);
            return (
              <View key={n.label} style={styles.ringCard}>
                <View style={styles.ringCircle}>
                  <View style={[styles.ringFill, { backgroundColor: n.color, height: `${p}%` as any }]} />
                  <Text style={styles.ringPct}>{p}%</Text>
                </View>
                <Text style={styles.ringLabel}>{n.label}</Text>
                <Text style={styles.ringVal}>{n.key==='omega3'?val.toFixed(1):Math.round(val)}{n.u}</Text>
              </View>
            );
          })}
        </View>

        {/* Food search */}
        <TouchableOpacity style={styles.aiAdviceBtn} onPress={getAiAdvice} activeOpacity={0.85}>
          <Text style={styles.aiAdviceBtnText}>✦ What should I eat today?</Text>
        </TouchableOpacity>

        {aiAdvice && (
          <View style={styles.aiAdviceCard}>
            <Text style={styles.aiAdviceLabel}>✦ VELA RECOMMENDS</Text>
            <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
            <TouchableOpacity onPress={() => setAiAdvice(null)}>
              <Text style={styles.aiAdviceDismiss}>dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showFood && foods.length === 0 && (
          <View style={styles.suggestCard}>
            <Text style={styles.suggestTitle}>✦ Best foods for {pd.label}</Text>
            <Text style={styles.suggestSub}>Tap any to add instantly</Text>
            <View style={styles.suggestRow}>
              {[
                {name:'Wild salmon', emoji:'🐟'},
                {name:'Flaxseed', emoji:'🌱'},
                {name:'Broccoli', emoji:'🥦'},
                {name:'Edamame', emoji:'🫘'},
                {name:'Walnuts', emoji:'🥜'},
              ].map(s => (
                <TouchableOpacity key={s.name} style={styles.suggestChip}
                  onPress={() => {
                    const food = FOOD_DB.find(f => f.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
                    if (food) addFood(food);
                  }}>
                  <Text style={styles.suggestEmoji}>{s.emoji}</Text>
                  <Text style={styles.suggestName}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {scannedImage && !showFood && (
          <View style={styles.scanPreview}>
            <Image source={{ uri: scannedImage }} style={styles.scanImage} />
          </View>
        )}

        {showFood && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add food</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={(t) => { setSearch(t); searchUSDA(t); }}
              placeholder="Type to search 2,400+ foods..."
              placeholderTextColor={Colors.mist}
            />
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              {apiLoading && (
                <View style={{alignItems:'center', padding:20}}>
                  <ActivityIndicator color={Colors.plum} />
                  <Text style={{fontFamily:Fonts.sans, fontSize:12, color:Colors.mist, marginTop:8}}>Searching 600,000+ foods...</Text>
                </View>
              )}
              {(apiResults.length > 0 ? apiResults : filteredFoods).map((f, i) => (
                <TouchableOpacity key={i} style={styles.foodRow} onPress={() => addFood(f)} activeOpacity={0.7}>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                      <Text style={styles.foodName}>{f.name}</Text>
                      <Text style={styles.foodAi}>✦ {f.ai}/10</Text>
                    </View>
                    <Text style={styles.foodMeta}>{f.protein}g protein · {f.fiber}g fiber · {f.cal} cal</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Logged foods */}
        {foods.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logged today</Text>
            {foods.map((f, i) => (
              <View key={i} style={[styles.loggedRow, i < foods.length-1 && styles.loggedBorder]}>
                <View style={{ flex:1 }}>
                  <Text style={styles.loggedName}>{f.name}</Text>
                  <Text style={styles.loggedMeta}>{f.protein}g protein · ✦ {f.ai}/10</Text>
                </View>
                <TouchableOpacity onPress={() => removeFood(i)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {foods.length === 0 && !showFood && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyText}>Tap "log food" to begin</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor: Colors.parchment },
  header: { backgroundColor: Colors.plum, paddingHorizontal:20, paddingTop:8, paddingBottom:14 },
  logoText: { fontFamily: Fonts.serif, fontSize:24, color: Colors.goldLight, letterSpacing:4 },
  subText: { fontFamily: Fonts.sans, fontSize:10, color: Colors.mist, letterSpacing:3, textTransform:'uppercase', marginTop:1 },
  scroll: { flex:1 },
  content: { padding:20, paddingBottom:100 },
  titleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  pageTitle: { fontFamily: Fonts.serif, fontSize:24, color: Colors.plum },
  scanButton:{backgroundColor:Colors.teal,borderRadius:20,paddingVertical:9,paddingHorizontal:14,marginRight:8},
  scanButtonText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.parchment,letterSpacing:0.5},
  scanPreview:{borderRadius:18,overflow:'hidden',marginBottom:12,height:200},
  scanImage:{width:'100%',height:200,borderRadius:18},
  scanOverlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(61,31,58,0.7)',alignItems:'center',justifyContent:'center',gap:12},
  scanOverlayText:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.parchment},
  addButton: { backgroundColor: Colors.plum, borderRadius:20, paddingVertical:9, paddingHorizontal:18 },
  addButtonText: { fontFamily: Fonts.sans, fontSize:12, color: Colors.parchment, letterSpacing:1 },
  scoreRow: { flexDirection:'row', gap:10, marginBottom:16 },
  scoreCard: { flex:1, backgroundColor: Colors.cream, borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:18, padding:16, alignItems:'center' },
  scoreLabel: { fontFamily: Fonts.sans, fontSize:10, color: Colors.mist, letterSpacing:2, textTransform:'uppercase', marginBottom:4 },
  scoreNum: { fontFamily: Fonts.sansMedium, fontSize:28, color: Colors.plum },
  scoreDenom: { fontFamily: Fonts.sans, fontSize:13, color: Colors.mist },
  ringGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  ringCard: { width:'30.5%', backgroundColor: Colors.cream, borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:14, padding:12, alignItems:'center' },
  ringCircle: { width:56, height:56, backgroundColor: Colors.parchmentDark, borderRadius:28, marginBottom:8, overflow:'hidden', justifyContent:'flex-end', alignItems:'center' },
  ringFill: { width:'100%', position:'absolute', bottom:0 },
  ringPct: { fontFamily: Fonts.sansMedium, fontSize:12, color: Colors.plum, position:'absolute', top:'50%', transform:[{translateY:-8}] },
  ringLabel: { fontFamily: Fonts.sans, fontSize:10, color: Colors.mist, marginBottom:2 },
  ringVal: { fontFamily: Fonts.sans, fontSize:12, color: Colors.plum },
  card: { backgroundColor: Colors.cream, borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:18, padding:18, marginBottom:12 },
  cardTitle: { fontFamily: Fonts.serif, fontSize:18, color: Colors.plum, marginBottom:12 },
  searchInput: { borderWidth:0.5, borderColor: Colors.parchmentDark, borderRadius:12, padding:10, fontSize:13, fontFamily: Fonts.sans, color: Colors.plum, backgroundColor: Colors.parchment, marginBottom:10 },
  foodRow: { padding:11, marginBottom:6, borderRadius:12, borderWidth:0.5, borderColor: Colors.parchmentDark, backgroundColor: Colors.parchment },
  foodName: { fontFamily: Fonts.sansMedium, fontSize:13, color: Colors.plum, marginBottom:2 },
  foodAi: { fontFamily: Fonts.sans, fontSize:11, color: Colors.sage },
  foodMeta: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist },
  loggedRow: { flexDirection:'row', alignItems:'center', paddingVertical:8 },
  loggedBorder: { borderBottomWidth:0.5, borderBottomColor: Colors.parchmentDark },
  loggedName: { fontFamily: Fonts.sans, fontSize:13, color: Colors.plum },
  loggedMeta: { fontFamily: Fonts.sans, fontSize:11, color: Colors.mist },
  removeBtn: { padding:4 },
  removeBtnText: { fontSize:18, color: Colors.mist },
  aiAdviceBtn:{backgroundColor:Colors.plum,borderRadius:18,paddingVertical:14,alignItems:'center',marginBottom:12},
  aiAdviceBtnText:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.goldLight,letterSpacing:0.5},
  aiAdviceCard:{backgroundColor:'#F0EBF5',borderWidth:1,borderColor:Colors.plum,borderRadius:16,padding:16,marginBottom:12},
  aiAdviceLabel:{fontFamily:Fonts.sansMedium,fontSize:10,color:Colors.plum,letterSpacing:2,marginBottom:8},
  aiAdviceText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,lineHeight:22,marginBottom:8},
  aiAdviceDismiss:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,textAlign:'right'},
  suggestCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:18,padding:18,marginBottom:12},
  suggestTitle:{fontFamily:Fonts.serif,fontSize:16,color:Colors.plum,marginBottom:2},
  suggestSub:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist,marginBottom:12},
  suggestRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  suggestChip:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:Colors.parchment,borderRadius:20,paddingVertical:7,paddingHorizontal:12,borderWidth:0.5,borderColor:Colors.parchmentDark},
  suggestEmoji:{fontSize:14},
  suggestName:{fontFamily:Fonts.sans,fontSize:12,color:Colors.plum},
  emptyState: { alignItems:'center', paddingVertical:48 },
  emptyIcon: { fontFamily: Fonts.serif, fontSize:32, color: Colors.parchmentDark, marginBottom:12 },
  emptyTitle: { fontFamily: Fonts.sans, fontSize:14, color: Colors.plum, marginBottom:6 },
  emptyText: { fontFamily: Fonts.sans, fontSize:12, color: Colors.mist },
});
