/**
 * app/coach.tsx
 * Vela AI Coach screen.
 * Navigate to it with: router.push('/coach')
 * Add a tab or button wherever makes sense — profile tab is a good home.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../constants/Colors';
import { useVelaStore } from '../hooks/useVelaStore';
import { useVelaCoach, buildCoachContext } from '../hooks/useVelaCoach';

const SUGGESTIONS = [
  'Why am I getting hot flashes?',
  'How is my sleep trending?',
  'What supplements should I prioritize?',
  'Help me prepare for my doctor visit',
  'Why do I have brain fog?',
  'What\'s causing my mood swings?',
  'How is my bone health?',
  'Am I making progress?',
];

function ModeIndicator({ mode }: { mode: string }) {
  if (mode === 'checking') return null;
  const isAI = mode === 'apple-intelligence';
  return (
    <View style={[ind.wrap, { backgroundColor: isAI ? Colors.sagePale : Colors.indigoPale }]}>
      <Text style={[ind.text, { color: isAI ? Colors.sage : Colors.indigo }]}>
        {isAI ? '🔒 Apple Intelligence · on-device · private' : '◎ Smart coach · rule-based'}
      </Text>
    </View>
  );
}

const ind = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: 'center', marginBottom: 10 },
  text: { fontFamily: Fonts.sans, fontSize: 11 },
});

function Bubble({ role, text }: { role: 'user' | 'coach'; text: string }) {
  const isCoach = role === 'coach';
  return (
    <View style={[bub.wrap, isCoach ? bub.coachWrap : bub.userWrap]}>
      {isCoach && <Text style={bub.avatar}>✦</Text>}
      <View style={[bub.bubble, isCoach ? bub.coachBubble : bub.userBubble]}>
        <Text style={[bub.text, isCoach ? bub.coachText : bub.userText]}>{text}</Text>
      </View>
    </View>
  );
}

const bub = StyleSheet.create({
  wrap:        { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  coachWrap:   { justifyContent: 'flex-start' },
  userWrap:    { justifyContent: 'flex-end' },
  avatar:      { fontSize: 14, color: Colors.gold, marginRight: 8, marginBottom: 6 },
  bubble:      { maxWidth: '82%', borderRadius: 18, padding: 14 },
  coachBubble: { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderBottomLeftRadius: 4 },
  userBubble:  { backgroundColor: Colors.plum, borderBottomRightRadius: 4 },
  text:        { fontSize: 14, lineHeight: 22 },
  coachText:   { fontFamily: Fonts.sans, color: Colors.plum },
  userText:    { fontFamily: Fonts.sans, color: Colors.parchment },
});

export default function CoachScreen() {
  const store = useVelaStore();
  const context = buildCoachContext({
    phase: store.phase,
    history: store.history,
    sleepHistory: store.sleepHistory,
    streak: store.streak,
    mySupps: store.mySupps,
    suppAdherence: store.suppAdherence,
  });

  const { messages, isTyping, mode, sendMessage, clearMessages } = useVelaCoach(context);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setShowSuggestions(false);
    await sendMessage(msg);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Vela Coach</Text>
          <Text style={styles.titleSub}>Your personal wellness coach</Text>
        </View>
        <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
          <Text style={styles.clearText}>clear</Text>
        </TouchableOpacity>
      </View>

      <ModeIndicator mode={mode} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(m => (
            <Bubble key={m.id} role={m.role} text={m.text} />
          ))}
          {isTyping && (
            <View style={[bub.wrap, bub.coachWrap]}>
              <Text style={bub.avatar}>✦</Text>
              <View style={[bub.bubble, bub.coachBubble, { paddingVertical: 16, paddingHorizontal: 18 }]}>
                <ActivityIndicator size="small" color={Colors.mist} />
              </View>
            </View>
          )}

          {/* Suggested questions — show only at start */}
          {showSuggestions && messages.length <= 1 && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestLabel}>Try asking</Text>
              <View style={styles.suggestGrid}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestChip}
                    activeOpacity={0.7}
                    onPress={() => handleSend(s)}
                  >
                    <Text style={styles.suggestText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach anything..."
            placeholderTextColor={Colors.mist}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim() || isTyping}
            onPress={() => handleSend()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.parchment },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.plum, gap: 12 },
  backBtn:       { padding: 4 },
  backText:      { fontFamily: Fonts.sans, fontSize: 20, color: Colors.goldLight },
  title:         { fontFamily: Fonts.serif, fontSize: 18, color: Colors.goldLight },
  titleSub:      { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mist, marginTop: 1 },
  clearBtn:      { padding: 6 },
  clearText:     { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mist },
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 10 },
  suggestions:   { marginTop: 8 },
  suggestLabel:  { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.mist, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  suggestGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip:   { backgroundColor: Colors.cream, borderWidth: 0.5, borderColor: Colors.parchmentDark, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 13 },
  suggestText:   { fontFamily: Fonts.sans, fontSize: 12, color: Colors.plum },
  inputRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, borderTopWidth: 0.5, borderTopColor: Colors.parchmentDark, backgroundColor: Colors.parchment },
  input:         { flex: 1, backgroundColor: Colors.cream, borderRadius: 20, borderWidth: 0.5, borderColor: Colors.parchmentDark, paddingHorizontal: 16, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 14, color: Colors.plum, maxHeight: 100 },
  sendBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.plum, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.parchmentDark },
  sendBtnText:   { fontFamily: Fonts.sansMedium, fontSize: 18, color: Colors.parchment, lineHeight: 22 },
});
