import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import { Layers, Plus } from 'reicon-react-native';
import { useRouter } from 'expo-router';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { FormField, SegmentedTabs } from '@/shared/ui/commerce/CommercePrimitives';
import { AppIcon } from '@/shared/ui/AppIcon';
import { Colors, effects, radii } from '@/theme';
import { ThemedText } from '@/shared/ui/ThemedText';
import { useCreateTrainingPlan, useTrainingPlans } from '../queries/trainingPlanQueries';
import { useCan } from '@/features/authorization/hooks/useAccess';
import { Permission } from '@/features/authorization/domain/permissions';
import { useToast } from '@/shared/ui/Toast';
import { getApiErrorMessage } from '@/infrastructure/http/httpError';
import { TrainingPlanFormSheet } from '../components/TrainingPlanFormSheet';
import type { TrainingPlanCreateRequest, TrainingPlanSimpleResponse } from '../api/trainingPlan.dto';

/** Admin entry surface. CRUD actions deliberately live behind feature mutations for reuse by detail/forms. */
export function TrainingPlanManagementScreen() {
 const router=useRouter(); const toast=useToast(); const canCreate=useCan(Permission.TRAINING_PLAN_CREATE); const [tab,setTab]=useState('ALL'); const [search,setSearch]=useState('');
 const [isCreateOpen,setIsCreateOpen]=useState(false);
 const create=useCreateTrainingPlan();
 const plans=useTrainingPlans({size:100,sort:'name,asc',status:tab==='ALL'?undefined:tab==='ACTIVE'?'ACTIVE':'INACTIVE'});
 const items=useMemo(()=> (plans.data?.content??[]).filter(item=>item.name.toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN'))),[plans.data?.content,search]);

 const handleCreate=async(request:TrainingPlanCreateRequest)=>{
  try{
   const plan=await create.mutateAsync(request);
   setIsCreateOpen(false);
   toast.show({message:'Đã tạo gói học. Hãy tiếp tục cấu hình.',variant:'success'});
   router.push(`/admin/training-plans/${plan.trainingPlanId}/requirements-addons` as never);
  }catch(error){
   toast.show({message:getApiErrorMessage(error,'Không thể tạo gói học.'),variant:'error'});
  }
 };

 return <>
  <StackScreenLayout title="Gói học" contentContainerStyle={styles.content} onRefresh={async()=>{await plans.refetch();}} refreshing={plans.isRefetching}>
   <SegmentedTabs value={tab} onChange={setTab} tabs={[{value:'ALL',label:'Tất cả'},{value:'ACTIVE',label:'Đang bán'},{value:'INACTIVE',label:'Tạm dừng'}]}/>
   <View style={styles.searchRow}><View style={styles.grow}><FormField value={search} onChangeText={setSearch} placeholder="Tìm theo tên gói học, cấp độ..."/></View>{canCreate?<Pressable accessibilityRole="button" accessibilityLabel="Tạo gói học" hitSlop={8} pressRetentionOffset={12} onPress={()=>setIsCreateOpen(true)} style={({pressed})=>[styles.add,pressed&&styles.addPressed]}><AppIcon icon={<Plus/>} size={22} color={Colors.light.surface}/></Pressable>:null}</View>
   {plans.isPending?<View style={styles.state}><ActivityIndicator color={Colors.light.primary}/></View>:items.map(plan=><PlanCard key={plan.trainingPlanId} plan={plan} onPress={()=>router.push(`/admin/training-plans/${plan.trainingPlanId}` as never)}/>)}
   {!plans.isPending&&items.length===0?<ThemedText type="bodySmall" style={styles.empty}>Chưa có gói học phù hợp.</ThemedText>:null}
  </StackScreenLayout>
  <TrainingPlanFormSheet visible={isCreateOpen} submitting={create.isPending} onClose={()=>setIsCreateOpen(false)} onSubmit={handleCreate}/>
 </>;
}
const money=(value:number)=>`${new Intl.NumberFormat('vi-VN').format(value)}đ`;
export const levelLabel=(level:string)=>({BASIC:'Cơ bản',ADVANCED:'Nâng cao',EXPERT:'Chuyên sâu'}[level]??level);
export function PlanCard({plan,onPress}:{plan:TrainingPlanSimpleResponse;onPress?:()=>void}){const active=plan.status==='ACTIVE';return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.card,pressed&&effects.pressed]}><View style={styles.icon}><AppIcon icon={<Layers/>} size={29} color={Colors.light.primary}/></View><View style={styles.copy}><ThemedText type="title" numberOfLines={1}>{plan.name}</ThemedText><View style={styles.level}><ThemedText type="bodySmall" style={styles.levelText}>{levelLabel(plan.level)}</ThemedText></View><ThemedText type="bodySmall" style={styles.muted}>{plan.durationMonths} tháng · {plan.includedSessionCount} buổi</ThemedText></View><View style={styles.price}><View style={[styles.status,active?styles.active:styles.inactive]}><ThemedText type="featureLabel" style={active?styles.activeText:styles.inactiveText}>● {active?'Đang bán':'Tạm dừng'}</ThemedText></View>{plan.basePrice!==plan.finalPrice?<ThemedText type="bodySmall" style={styles.old}>{money(plan.basePrice)}</ThemedText>:null}<ThemedText type="title" style={styles.red}>{money(plan.finalPrice)}</ThemedText></View></Pressable>}
const styles=StyleSheet.create({content:{paddingTop:16,paddingHorizontal:20,paddingBottom:32,gap:20},searchRow:{flexDirection:'row',alignItems:'flex-end',gap:12},grow:{flex:1},add:{width:48,height:48,borderRadius:radii.md,backgroundColor:Colors.light.primary,alignItems:'center',justifyContent:'center'},addPressed:{opacity:0.82,transform:[{scale:0.97}]},state:{paddingVertical:48,alignItems:'center'},card:{flexDirection:'row',gap:12,padding:16,backgroundColor:Colors.light.surface,borderRadius:radii.md,...effects.soft},icon:{width:72,height:72,borderRadius:radii.md,alignItems:'center',justifyContent:'center',backgroundColor:Colors.light.primarySoft},copy:{flex:1,gap:7},level:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:3,borderRadius:radii.pill,backgroundColor:Colors.light.primarySoft},levelText:{color:Colors.light.primary},muted:{color:Colors.light.textSecondary},price:{alignItems:'flex-end',gap:5},status:{paddingHorizontal:9,paddingVertical:4,borderRadius:radii.pill},active:{backgroundColor:Colors.light.successSoft},inactive:{backgroundColor:Colors.light.errorSoft},activeText:{color:Colors.light.success},inactiveText:{color:Colors.light.error},old:{color:Colors.light.textSecondary,textDecorationLine:'line-through'},red:{color:Colors.light.primary},empty:{textAlign:'center',color:Colors.light.textSecondary,paddingVertical:42}});
