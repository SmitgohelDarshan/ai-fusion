import React, { useContext, useState } from "react";
import AiModelList from "@/shared/AiModelList";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { useUser } from "@clerk/nextjs";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function AiMultiModels() {
  const {user} = useUser();
  const [aiModelList, setAiModelList] = useState(AiModelList);
  const { aiSelectedModels, setAiSelectedModels } = useContext(AiSelectedModelContext);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  // // CRITICAL: If context isn't loaded yet, don't render the map
  // if (!aiSelectedModels) {
  //   return <div className="p-10">Loading Models...</div>;
  // }

  const onToggleChange=(model,value)=>{
        setAiModelList((prev)=>
            prev.map((m)=>
                m.model === model ? {...m,enable:value} : m))
  }

  const onSelectValue = async(parentModel,value)=>{
    // 1. Create the new object first
    const updatedModels = {
      ...aiSelectedModels,
      [parentModel]: { modelId: value }
    };

    // 2. Update the UI state
    setAiSelectedModels(updatedModels);

    // 3. Update Firebase with the NEW object
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
      const docRef = doc(db, "users", email);
      await updateDoc(docRef, {
        selectedModelPref: updatedModels // Use the variable, not the state!
      });
    }
    //  setAiSelectedModels(prev => ({
    //   ...prev, [parentModel]:{modelId: value}
    //  }))
     
    //  // Update to Firebase Database
    //  const email = user?.primaryEmailAddress?.emailAddress;
    //   if (email) {
    //     const docRef = doc(db, "users", email);
    //     await updateDoc(docRef, {
    //       selectedModelPref: aiSelectedModels // Use the variable, not the state!
    //     });
    // }
  }


  return (
    <div className="flex flex-1 h-[75vh] border-b">
      {aiModelList.map((model, index) => (
        <div key={model.model} className={`flex flex-col border-r h-full overflow-auto transition-all ${model.enable ? 'flex-1 min-w-[400px]' : 'w-[100px] flex-none'}`}>
        <div className="flex w-full h-17.5 gap-2 items-center justify-between border-0 p-4">
          <div className="flex items-center gap-4 w-full">
            <Image src={model.icon} alt={model.model} width={24} height={24} />

            {
            model.enable && <Select 
            defaultValue={aiSelectedModels?.[model.model]?.modelId} 
            onValueChange={(value)=>onSelectValue(model.model,value)} 
            disabled={model.premium && userDetail?.plan !== 'Paid'} >
              <SelectTrigger className="w-45">
                <SelectValue placeholder={aiSelectedModels?.[model.model]?.modelId || "Select Model"}/>
              </SelectTrigger>
              <SelectContent position="popper" className="z-50">
                 <SelectGroup className=''>

                  {/* Free Models */}
                  <SelectLabel className={'text-sm text-gray-400'}>Free</SelectLabel>
                    {model.subModel.map((subModel, index) => subModel.premium == false && (
                      <SelectItem key={index} value={subModel.id}>
                        {subModel.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  {/* Premium Models */}
                  <SelectGroup className='p-3'>
                  <SelectLabel className={'text-sm text-gray-400'}>Premium</SelectLabel>
                    {model.subModel.map((subModel, index) => subModel.premium == true && (
                      <SelectItem key={index} value={subModel.id} disabled={userDetail?.plan !== 'Paid'}>
                        {subModel.name} {subModel.premium && <Lock className="h-4 w-4"/>}
                      </SelectItem>
                    ))}
                  </SelectGroup>
              </SelectContent>
            </Select>
            }
          </div>
          <div>
            {model.enable ? <Switch checked={model.enable}
                onCheckedChange={(v)=>onToggleChange(model.model, v)} />
                : <MessageSquare onClick={()=>onToggleChange(model.model, true)}/>}
          </div>
        </div>
        {model.premium && model.enable && <div className="flex justify-center items-center h-full">
            <Button><Lock/> Upgrade to unlock</Button>
        </div>}
        </div>
      ))}

    </div>
  );
}
