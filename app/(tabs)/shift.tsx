import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/Colors';
import { PHASES, COMMUNITY_POSTS } from '../../constants/Data';
import { useVelaStore } from '../../hooks/useVelaStore';

export default function ShiftScreen() {
  const { phase, likedPosts, setLikedPosts } = useVelaStore();
  const [filter, setFilter] = useState('all');
  const [newPost, setNewPost] = useState('');
  const [reportTarget, setReportTarget] = useState<{ id: number; user: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const pd = PHASES[phase ?? 'late'];

  const allFiltered = filter === 'all' ? COMMUNITY_POSTS : COMMUNITY_POSTS.filter(p => p.tag === filter);
  const filtered = allFiltered.filter(p => !blockedUsers.includes(p.user));
  const phaseColors: Record<string, string> = { early:Colors.gold, late:Colors.rose, post:Colors.sage };
  const tagColors: Record<string, string> = { wins:Colors.sage, tips:Colors.gold, questions:Colors.plumLight, health:Colors.rose };

  const toggleLike = async (id: number) => {
    const next = likedPosts.includes(id) ? likedPosts.filter(x => x !== id) : [...likedPosts, id];
    await setLikedPosts(next);
  };

  const submitReport = () => {
    if (!reportReason) { Alert.alert('Select a reason', 'Please choose a reason.'); return; }
    setReportTarget(null); setReportReason('');
    Alert.alert('Report submitted', 'Thanks. We review all reports within 24 hours.');
  };

  if (!hasAcceptedTerms) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.logoText}>vela</Text>
          <Text style={styles.subText}>your shift. your terms.</Text>
        </View>
        <View style={styles.termsGate}>
          <Text style={styles.termsTitle}>Community Guidelines</Text>
          <Text style={styles.termsBody}>
            {'The Shift is a space for honest, supportive conversation. By joining you agree to our '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://macpplechic.github.io/vela/terms')}>Terms of Use</Text>
            {'. Zero tolerance for harassment or abusive content.'}
          </Text>
          <TouchableOpacity style={styles.termsBtn} onPress={() => setHasAcceptedTerms(true)} activeOpacity={0.85}>
            <Text style={styles.termsBtnText}>I Agree — Enter The Shift</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logoText}>vela</Text>
        <Text style={styles.subText}>your shift. your terms.</Text>
      </View>
      <ScrollView style={{flex:1}} contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>The Shift</Text>
        <Text style={styles.pageSub}>Women who get it, because they're living it.</Text>

        <View style={styles.composeCard}>
          <TextInput
            style={styles.composeInput}
            value={newPost}
            onChangeText={setNewPost}
            placeholder="Share something with your community..."
            placeholderTextColor={Colors.mist}
            multiline
            numberOfLines={3}
          />
          <View style={styles.composeFooter}>
            <Text style={styles.composeAs}>Sharing as {pd.label}</Text>
            <TouchableOpacity onPress={() => { if (newPost.trim()) { Alert.alert('Posted!', 'Your post has been shared.'); setNewPost(''); } }} style={styles.postButton}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap:8, paddingRight:20 }}>
          {['all','wins','tips','questions','health'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, { borderColor:filter===f?Colors.plum:Colors.parchmentDark, backgroundColor:filter===f?Colors.plum:Colors.cream }]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, { color:filter===f?Colors.parchment:Colors.mist }]}>{f === 'all' ? 'All posts' : f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(p => (
          <View key={p.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: phaseColors[p.phase] ?? Colors.gold }]}>
                <Text style={styles.avatarText}>{p.av}</Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postUser}>{p.user}</Text>
                <Text style={styles.postPhase}>{PHASES[p.phase].label} · {p.time} ago</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor:`${tagColors[p.tag] ?? Colors.gold}20` }]}>
                <Text style={[styles.tagText, { color: tagColors[p.tag] ?? Colors.gold }]}>{p.tag}</Text>
              </View>
              <TouchableOpacity onPress={() => setReportTarget({ id: p.id, user: p.user })} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                <Text style={styles.moreBtn}>···</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postText}>{p.text}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => toggleLike(p.id)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: likedPosts.includes(p.id) ? Colors.rose : Colors.mist }]}>
                  {likedPosts.includes(p.id) ? '♥' : '♡'} {p.likes + (likedPosts.includes(p.id) ? 1 : 0)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Replies coming soon', 'This feature is in progress.')  }>
                <Text style={styles.actionText}>◎ reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height:20 }} />
      </ScrollView>
      <Modal visible={!!reportTarget} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setReportTarget(null)} />
        <View style={styles.reportSheet}>
          <Text style={styles.reportTitle}>Report {reportTarget?.user}</Text>
          <Text style={styles.reportSub}>Anonymous. Reviewed within 24 hours.</Text>
          {['Spam','Harassment or bullying','Misinformation','Inappropriate content','Other'].map(r => (
            <TouchableOpacity key={r} style={[styles.reasonRow, reportReason===r && styles.reasonRowActive]} onPress={() => setReportReason(r)}>
              <Text style={[styles.reasonText, reportReason===r && styles.reasonTextActive]}>{r}</Text>
              {reportReason===r && <Text style={styles.reasonCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.reportBtn, !reportReason && styles.reportBtnDisabled]} onPress={submitReport} disabled={!reportReason} activeOpacity={0.85}>
            <Text style={styles.reportBtnText}>Submit Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.blockBtn} onPress={() => { setBlockedUsers(prev => [...prev, reportTarget?.user ?? '']); setReportTarget(null); setReportReason(''); Alert.alert('User blocked', `${reportTarget?.user} has been blocked and removed from your feed.`); }} activeOpacity={0.85}>
            <Text style={styles.blockBtnText}>🚫 Block this user</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setReportTarget(null); setReportReason(''); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.parchment},
  header:{backgroundColor:Colors.plum,paddingHorizontal:20,paddingTop:8,paddingBottom:14},
  logoText:{fontFamily:Fonts.serif,fontSize:24,color:Colors.goldLight,letterSpacing:4},
  subText:{fontFamily:Fonts.sans,fontSize:10,color:Colors.mist,letterSpacing:3,textTransform:'uppercase',marginTop:1},
  content:{padding:20, paddingBottom:100},
  pageTitle:{fontFamily:Fonts.serif,fontSize:26,color:Colors.plum,marginBottom:4},
  pageSub:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist,marginBottom:20},
  composeCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:16,padding:16,marginBottom:16},
  composeInput:{fontFamily:Fonts.sans,fontSize:13,color:Colors.plum,minHeight:72,textAlignVertical:'top',marginBottom:10},
  composeFooter:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8},
  composeAs:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  postButton:{backgroundColor:Colors.plum,borderRadius:20,paddingVertical:7,paddingHorizontal:20},
  postButtonText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.parchment},
  filterRow:{marginBottom:16},
  filterChip:{paddingVertical:6,paddingHorizontal:14,borderRadius:20,borderWidth:1},
  filterText:{fontFamily:Fonts.sans,fontSize:12,textTransform:'capitalize'},
  postCard:{backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark,borderRadius:16,padding:16,marginBottom:10},
  postHeader:{flexDirection:'row',alignItems:'flex-start',gap:8,marginBottom:10,flexWrap:'wrap'},
  avatar:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
  avatarText:{fontFamily:Fonts.sansMedium,fontSize:12,color:Colors.cream},
  postMeta:{flex:1},
  postUser:{fontFamily:Fonts.sansMedium,fontSize:13,color:Colors.plum},
  postPhase:{fontFamily:Fonts.sans,fontSize:11,color:Colors.mist},
  tagBadge:{paddingVertical:3,paddingHorizontal:8,borderRadius:10},
  tagText:{fontFamily:Fonts.sansMedium,fontSize:10,textTransform:'uppercase',letterSpacing:0.5},
  postText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,lineHeight:22,marginBottom:12},
  postActions:{flexDirection:'row',gap:16},
  actionBtn:{},
  actionText:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist},
  moreBtn:{fontFamily:Fonts.sans,fontSize:18,color:Colors.mist,paddingHorizontal:4},
  termsGate:{flex:1,justifyContent:'center',alignItems:'center',padding:32},
  termsTitle:{fontFamily:Fonts.serif,fontSize:22,color:Colors.plum,marginBottom:16,textAlign:'center'},
  termsBody:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,lineHeight:22,textAlign:'center',marginBottom:28},
  termsLink:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum,textDecorationLine:'underline'},
  termsBtn:{backgroundColor:Colors.plum,borderRadius:28,paddingVertical:16,paddingHorizontal:40},
  termsBtnText:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.parchment},
  modalBackdrop:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)'},
  reportSheet:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:Colors.parchment,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24,paddingBottom:40},
  reportTitle:{fontFamily:Fonts.serif,fontSize:18,color:Colors.plum,marginBottom:4},
  reportSub:{fontFamily:Fonts.sans,fontSize:12,color:Colors.mist,marginBottom:16},
  reasonRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:13,paddingHorizontal:12,borderRadius:10,marginBottom:6,backgroundColor:Colors.cream,borderWidth:0.5,borderColor:Colors.parchmentDark},
  reasonRowActive:{backgroundColor:'#3C204015',borderColor:Colors.plum},
  reasonText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.plum},
  reasonTextActive:{fontFamily:Fonts.sansMedium,color:Colors.plum},
  reasonCheck:{fontFamily:Fonts.sansMedium,fontSize:14,color:Colors.plum},
  reportBtn:{backgroundColor:Colors.plum,borderRadius:28,paddingVertical:15,alignItems:'center',marginTop:8,marginBottom:8},
  reportBtnDisabled:{opacity:0.4},
  reportBtnText:{fontFamily:Fonts.sansMedium,fontSize:15,color:Colors.parchment},
  blockBtn:{backgroundColor:'#FFF0F0',borderWidth:1,borderColor:Colors.rose,borderRadius:28,paddingVertical:13,alignItems:'center',marginBottom:8},
  blockBtnText:{fontFamily:Fonts.sans,fontSize:14,color:Colors.rose},
  cancelBtn:{alignItems:'center',paddingVertical:10},
  cancelText:{fontFamily:Fonts.sans,fontSize:13,color:Colors.mist},
});
