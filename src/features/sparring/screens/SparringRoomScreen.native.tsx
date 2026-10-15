import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/shared/ui/ThemedText';
import { radii } from '@/theme';
import { formatSparringTime, isSparringRoomCode } from '../domain/sparringRoom';
import { useSparringRoom } from '../hooks/useSparringRoom';
import type { SparringSide } from '../domain/sparring.types';

export function SparringRoomScreen() {
  const router = useRouter(); const { roomCode: raw } = useLocalSearchParams<{ roomCode: string }>(); const roomCode = Array.isArray(raw) ? raw[0] : raw;
  const { snapshot, error, send } = useSparringRoom(roomCode ?? '');
  useEffect(() => { void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); void NavigationBar.setVisibilityAsync('hidden'); return () => { void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); void NavigationBar.setVisibilityAsync('visible'); }; }, []);
  if (!isSparringRoomCode(roomCode ?? '')) return null;
  const scoreButton = (side:SparringSide, points:2|3) => <Pressable key={`${side}-${points}`} accessibilityRole="button" accessibilityLabel={`${side === 'red' ? 'Đỏ' : 'Xanh'} cộng ${points} điểm`} onPress={() => send({type:'judgeScore', side, points})} style={({pressed})=>[styles.scoreButton, side==='red'?styles.red:styles.blue, pressed&&styles.pressed]}><ThemedText style={styles.scoreButtonText}>{points}</ThemedText></Pressable>;
  return <View style={styles.page}><StatusBar hidden /><View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Rời sàn đấu" onPress={()=>router.back()}><ThemedText style={styles.back}>‹</ThemedText></Pressable><ThemedText style={styles.code}>{roomCode}</ThemedText><ThemedText style={styles.help}>?</ThemedText></View><View style={styles.scoreRow}><ScorePanel color="red" score={snapshot.redScore}/><ScorePanel color="blue" score={snapshot.blueScore}/></View><View style={styles.timer}><ThemedText style={styles.timerText}>{formatSparringTime(snapshot.remainingSeconds)}</ThemedText>{error?<ThemedText style={styles.error}>{error}</ThemedText>:null}</View><View style={styles.judging}>{['red','blue'].map((side)=><View key={side} style={styles.buttonGroup}>{scoreButton(side as SparringSide,2)}{scoreButton(side as SparringSide,3)}</View>)}</View><View style={styles.brand}><ThemedText style={styles.brandText}>TAEKWONDO VĂN QUÁN</ThemedText></View></View>;
}
function ScorePanel({color,score}:{color:'red'|'blue';score:number}) { return <View style={[styles.panel,color==='red'?styles.red:styles.blue]}><ThemedText style={styles.panelText}>{score}</ThemedText></View>; }
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#D5DDE0'},top:{height:58,backgroundColor:'#202020',paddingHorizontal:28,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{fontSize:48,lineHeight:48,color:'white'},code:{fontSize:30,fontWeight:'800',letterSpacing:4,color:'#202020',backgroundColor:'white',paddingHorizontal:18},help:{width:42,height:42,borderRadius:21,borderWidth:3,borderColor:'white',color:'white',fontSize:28,textAlign:'center'},scoreRow:{flexDirection:'row',gap:8,padding:8},panel:{flex:1,minHeight:104,borderRadius:radii.md,justifyContent:'center',alignItems:'center',borderWidth:5,borderColor:'#91A0A7'},red:{backgroundColor:'#EF3735'},blue:{backgroundColor:'#2E68F5'},panelText:{color:'white',fontSize:76,lineHeight:84},timer:{height:84,alignItems:'center',justifyContent:'center',backgroundColor:'#202020'},timerText:{color:'white',fontSize:46,fontWeight:'700'},error:{color:'#FFCF54'},judging:{flex:1,flexDirection:'row',gap:8,padding:8},buttonGroup:{flex:1,flexDirection:'row',gap:8},scoreButton:{flex:1,borderRadius:radii.md,justifyContent:'center',alignItems:'center',borderWidth:5,borderColor:'#91A0A7'},scoreButtonText:{fontSize:90,lineHeight:96,color:'white'},pressed:{opacity:.8,transform:[{scale:.98}]},brand:{height:54,backgroundColor:'#202020',alignItems:'center',justifyContent:'center'},brandText:{color:'white',fontSize:26,fontWeight:'800',fontStyle:'italic'}});
