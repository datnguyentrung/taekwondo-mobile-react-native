import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';
import { practiceApi } from '@/features/sparring-practice/data/practiceApi';

export default function PracticeLobby() {
  const router=useRouter(); const [code,setCode]=useState(''); const [joining,setJoining]=useState(false);
  const join=async()=>{if(!/^\d{4}$/.test(code))return Alert.alert('Mã không hợp lệ','Nhập 4 chữ số của phòng luyện tập.');setJoining(true);try{await practiceApi.get(code);router.push(`/tkd/practice/${code}` as Href);}catch{Alert.alert('Không tìm thấy phòng','Kiểm tra lại mã phòng.');}finally{setJoining(false);}};
  return <StackScreenLayout title="TẬP LÀM TRỌNG TÀI" headerVariant="dark" scrollEnabled={false} refreshEnabled={false} contentContainerStyle={styles.content}><View style={styles.card}><ThemedText type="subtitle">MÃ PHÒNG</ThemedText><TextInput value={code} onChangeText={v=>setCode(v.replace(/\D/g,'').slice(0,4))} keyboardType="number-pad" style={styles.input} placeholder="0000"/><Pressable disabled={joining} onPress={()=>void join()} style={styles.button}><ThemedText style={styles.buttonText}>{joining?'ĐANG VÀO…':'VÀO LÀM GIÁM ĐỊNH'}</ThemedText></Pressable></View></StackScreenLayout>;
}
const styles=StyleSheet.create({content:{flexGrow:1,justifyContent:'center',padding:20},card:{gap:20},input:{height:72,backgroundColor:'#fff',borderRadius:radii.md,fontSize:28,textAlign:'center'},button:{backgroundColor:Colors.light.primary,padding:18,borderRadius:radii.md,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800'}});
