import { useEffect } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';
import { usePracticeRoom } from '../hooks/usePracticeRoom';
import type { PracticeSide } from '../domain/practice.types';

const points: Array<1 | 2 | 3> = [1, 2, 3];

export function PracticeRoomScreen() {
  const router = useRouter(); const { roomCode: raw } = useLocalSearchParams<{ roomCode: string }>(); const roomCode = Array.isArray(raw) ? raw[0] : raw ?? '';
  const { snapshot, error, connecting, send } = usePracticeRoom(roomCode);
  const player = useVideoPlayer(snapshot.videoUrl ?? null, player => { player.loop = false; });
  useEffect(() => { void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); return () => { void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); }; }, []);
  useEffect(() => { if (snapshot.status === 'RUNNING') { player.currentTime = snapshot.mediaOffsetMs / 1000; player.play(); } else { player.pause(); if (snapshot.status === 'PAUSED' || snapshot.status === 'WAITING') player.currentTime = snapshot.mediaOffsetMs / 1000; } }, [player, snapshot.mediaOffsetMs, snapshot.status]);
  const enabled = snapshot.status === 'RUNNING';
  const score = (side: PracticeSide, point: 1 | 2 | 3) => { if (enabled) send({ type: 'judgeScore', side, points: point }); };
  return <View style={styles.page}><StatusBar hidden />
    {snapshot.videoUrl ? <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" /> : <View style={styles.empty}><ThemedText>Đang chờ video từ web…</ThemedText></View>}
    <View style={styles.top}><Pressable onPress={() => router.back()} style={styles.exit}><ThemedText style={styles.white}>Rời phòng</ThemedText></Pressable><ThemedText style={styles.white}>PHÒNG {roomCode} · Đỏ {snapshot.redScore} — {snapshot.blueScore} Xanh</ThemedText><ThemedText style={styles.white}>{connecting ? 'Đang kết nối' : snapshot.status}</ThemedText></View>
    {!enabled ? <View style={styles.overlay}><ThemedText style={styles.overlayText}>{snapshot.status === 'COUNTDOWN' ? '3 · 2 · 1' : snapshot.status === 'PAUSED' ? 'Đã tạm dừng — chờ đủ trọng tài sẵn sàng' : 'Tải video xong rồi nhấn Sẵn sàng'}</ThemedText><Pressable onPress={() => send({ type: 'ready' })} disabled={!snapshot.videoUploaded || snapshot.status === 'RUNNING'} style={styles.ready}><ThemedText style={styles.white}>SẴN SÀNG</ThemedText></Pressable></View> : null}
    <View pointerEvents={enabled ? 'auto' : 'none'} style={[styles.controls, !enabled && styles.disabled]}>
      {(['red', 'blue'] as PracticeSide[]).map(side => <View key={side} style={styles.column}>{points.map(point => <Pressable key={point} onPress={() => score(side, point)} style={[styles.point, side === 'red' ? styles.red : styles.blue]}><ThemedText style={styles.pointText}>+{point}</ThemedText></Pressable>)}</View>)}
    </View>
    {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
  </View>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#0B0B0B'},empty:{flex:1,alignItems:'center',justifyContent:'center'},top:{height:48,backgroundColor:'rgba(0,0,0,.72)',paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},white:{color:'#fff',fontWeight:'700'},exit:{padding:8},overlay:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,.45)',gap:16},overlayText:{color:'#fff',fontSize:22,fontWeight:'800',textAlign:'center'},ready:{backgroundColor:Colors.light.success,paddingHorizontal:28,paddingVertical:16,borderRadius:radii.lg},controls:{position:'absolute',left:14,right:14,bottom:14,flexDirection:'row',justifyContent:'space-between'},column:{gap:8},point:{width:92,height:54,borderRadius:10,alignItems:'center',justifyContent:'center',opacity:.78},red:{backgroundColor:'#C51E24'},blue:{backgroundColor:'#1767B1'},pointText:{color:'#fff',fontSize:20,fontWeight:'900'},disabled:{opacity:.25},error:{position:'absolute',bottom:8,alignSelf:'center',color:'#fff',backgroundColor:'#B00020',padding:6}});
