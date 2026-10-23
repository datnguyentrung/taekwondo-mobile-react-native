import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { ThemedText } from '@/shared/ui/ThemedText';
import { useToast } from '@/shared/ui/Toast';
import { getApiErrorMessage } from '@/infrastructure/http/httpError';
import { TrainingPlanFormSheet } from '../components/TrainingPlanFormSheet';
import { useCreateTrainingPlan } from '../queries/trainingPlanQueries';
import type { TrainingPlanCreateRequest } from '../api/trainingPlan.dto';
export function CreateTrainingPlanScreen(){const router=useRouter();const toast=useToast();const create=useCreateTrainingPlan();const [visible,setVisible]=useState(true);const submit=async(request:TrainingPlanCreateRequest)=>{try{const plan=await create.mutateAsync(request);toast.show({message:'Đã tạo gói học. Hãy tiếp tục cấu hình.',variant:'success'});router.replace(`/admin/training-plans/${plan.trainingPlanId}/requirements-addons` as never)}catch(error){toast.show({message:getApiErrorMessage(error,'Không thể tạo gói học.'),variant:'error'})}};return <><StackScreenLayout title="Tạo gói học"><View><ThemedText type="bodySmall">Thiết lập thông tin chung, sau đó cấu hình yêu cầu, khóa học và add-on.</ThemedText></View></StackScreenLayout><TrainingPlanFormSheet visible={visible} submitting={create.isPending} onClose={()=>router.back()} onSubmit={submit}/></>}
