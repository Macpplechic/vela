import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/Colors';
import { PHASES, FOOD_DB, Food } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

export default function PlateScreen() {
  const { phase, foods, setFoods, totals } = useVelaStore();
  const [search, setSearch] = useState('');
  const [showFood, setShowFood] = useState(false);
  const pd = PHASES[phase ?? 'late'];

  const pct = (v: number, m: number) => Math.min(100, Math.round((v / m) * 100));
  const aiScore = foods.length > 0 ? Math.min(100, Math.round((totals.ai / (foods.length * 10)) * 100)) : 0;
  const filteredFoods = search.length > 1 ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30) : [];

  const addFood = async (f: Food) => {
    await setFoods([...foods, f]);
    setSearch('');
  };
  const removeFood = async (i: number) => {
    await setFoods(foods.filter((_, j) => j !== i));
  };

  const nutrients = [
    { key:'protein' as keyof typeof totals, label:'Protein', u:'g', color:Colors.rose },
    { key:'fiber' as keyof typeof totals, label:'Fiber', u:'g', color:Colors.sage },
    { key:'calcium' as keyof typeof totals, label:'Calcium', u:'mg', color:Colors.gold },
    { key:'magnesium' as keyof typeof totals, label:'Magnesium', u:'mg', color:Colors.plumLight },
    { key:'omega3' as keyof typeof totals, label:'Omega-3', u:'g', color:Colors.teal },
    { key:'phyto' as keyof typeof totals, label:'Phytoestrogens', u:'mg', color:Colors.gold },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>The Peri Plate</Text>
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
        {showFood && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add food</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search anti-inflammatory foods..."
              placeholderTextColor={Colors.mist}
            />
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              {filteredFoods.map((f, i) => (
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
  content: { padding:20 },
  titleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  pageTitle: { fontFamily: Fonts.serif, fontSize:24, color: Colors.plum },
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
  emptyState: { alignItems:'center', paddingVertical:48 },
  emptyIcon: { fontFamily: Fonts.serif, fontSize:32, color: Colors.parchmentDark, marginBottom:12 },
  emptyTitle: { fontFamily: Fonts.sans, fontSize:14, color: Colors.plum, marginBottom:6 },
  emptyText: { fontFamily: Fonts.sans, fontSize:12, color: Colors.mist },
});
