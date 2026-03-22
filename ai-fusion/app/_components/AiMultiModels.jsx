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
import { Loader, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext";
import { useAuth, useUser } from "@clerk/nextjs";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import { UserDetailContext } from "@/context/UserDetailContext";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PricingModal from "./PricingModal";

export default function AiMultiModels() {
  const {user} = useUser();
  const [aiModelList, setAiModelList] = useState(AiModelList);
  const {aiSelectedModels, setAiSelectedModels, messages, setMessages} = useContext(AiSelectedModelContext);  
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { has } = useAuth();
  const paidUser = has({ plan: 'unlimited_plan' });


  console.log("--- DEBUG PERMISSIONS ---");
console.log("Clerk Paid User:", paidUser);
console.log("Firebase User Detail:", userDetail);
console.log("--------------------------");

  // // CRITICAL: If context isn't loaded yet, don't render the map
  // if (!aiSelectedModels) {
  //   return <div className="p-10">Loading Models...</div>;
  // }


  const onToggleChange=(model,value)=>{
        setAiModelList((prev)=>
            prev.map((m)=>
                m.model === model ? {...m,enable:value} : m))

        setAiSelectedModels((prev)=>({
            ...prev,
            [model]:{
              ...(prev?.[model] ?? {}),
              enable:value
            }
        }))

        console.log(aiSelectedModels);
        
  }

  // const onSelectValue = async(parentModel,value)=>{



  //   // // 1. Create the new object first
  //   // const updatedModels = {
  //   //   ...aiSelectedModels,
  //   //   [parentModel]: { modelId: value }
  //   // };

  //   // // 2. Update the UI state
  //   // setAiSelectedModels(updatedModels);

  //   // // 3. Update Firebase with the NEW object
  //   // const email = user?.primaryEmailAddress?.emailAddress;
  //   // if (email) {
  //   //   const docRef = doc(db, "users", email);
  //   //   await updateDoc(docRef, {
  //   //     selectedModelPref: updatedModels // Use the variable, not the state!
  //   //   });
  //   // }


  //    setAiSelectedModels(prev => ({
  //     ...prev, [parentModel]:{modelId: value}
  //    }))
     
  //    // Update to Firebase Database
  //    const email = user?.primaryEmailAddress?.emailAddress;
  //     if (email) {
  //       const docRef = doc(db, "users", email);
  //       await updateDoc(docRef, {
  //         selectedModelPref: aiSelectedModels // Use the variable, not the state!
  //       });
  //   }
  // }

  const onSelectValue = async(parentModel, value) => {
    // 1. Create the new object FIRST (This is what the video does to avoid the lag)
    const updatedModels = {
        ...aiSelectedModels,
        [parentModel]: { 
            ...aiSelectedModels[parentModel], // Keep existing properties like 'enable'
            modelId: value 
        }
    };

    // 2. Update the UI state
    setAiSelectedModels(updatedModels);
     
    // 3. Update Firebase using the 'updatedModels' variable, NOT 'aiSelectedModels'
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
        const docRef = doc(db, "users", email);
        try {
            await updateDoc(docRef, {
                selectedModelPref: updatedModels // CRITICAL: Use the variable here!
            });
            console.log("Firebase Updated Successfully");
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }
  }


  return (
    // <div className="flex flex-1 h-[75vh] border-b">
    //   {aiModelList.map((model, index) => (
    //     <div key={model.model} className={`flex flex-col border-r h-full overflow-auto transition-all ${model.enable ? 'flex-1 min-w-[400px]' : 'w-[100px] flex-none'}`}>
    //     <div className="flex w-full h-17.5 gap-2 items-center justify-between border-0 p-4">
    //       <div className="flex items-center gap-4 w-full">
    //         <Image src={model.icon} alt={model.model} width={24} height={24} />

    //         {!paidUser &&
    //         model.enable && <Select
    //         defaultValue={aiSelectedModels?.[model.model]?.modelId}
    //         onValueChange={(value)=>onSelectValue(model.model,value)}
    //         disabled={model.premium && !paidUser && userDetail?.plan !== 'Paid'} >
    //           <SelectTrigger className="w-45">
    //             <SelectValue placeholder={aiSelectedModels?.[model.model]?.modelId || "Select Model"}/>
    //           </SelectTrigger>
    //           <SelectContent position="popper" className="z-50">
    //              <SelectGroup className=''>

    //               {/* Free Models */}
    //               <SelectLabel className={'text-sm text-gray-400'}>Free</SelectLabel>
    //                 {model.subModel.map((subModel, index) => subModel.premium == false && (
    //                   <SelectItem key={index} value={subModel.id}>
    //                     {subModel.name}
    //                   </SelectItem>
    //                 ))}
    //               </SelectGroup>

    //               {/* Premium Models */}
    //               <SelectGroup className='p-3'>
    //               <SelectLabel className={'text-sm text-gray-400'}>Premium</SelectLabel>
    //                 {model.subModel.map((subModel, index) => subModel.premium == true && (
    //                   <SelectItem key={index} value={subModel.id} disabled={!paidUser}>
    //                     {subModel.name} {subModel.premium && <Lock className="h-4 w-4"/>}
    //                   </SelectItem>
    //                 ))}
    //               </SelectGroup>
    //           </SelectContent>
    //         </Select>
    //         }
    //       </div>
    //       <div>
    //         {model.enable ? <Switch checked={model.enable} disabled={!paidUser && model.premium}
    //             onCheckedChange={(v)=>onToggleChange(model.model, v)} />
    //             : <MessageSquare onClick={()=>onToggleChange(model.model, true)}/>}
    //       </div>
    //     </div>
    //     {/* {!paidUser && model.premium && model.enable && <div className="flex justify-center items-center h-full">
    //         <Button><Lock/> Upgrade to unlock</Button>
    //     </div>} */}
    //     {/* Find this section near the bottom of the map */}
    //     {!paidUser && model.premium && model.enable && (
    //       <div className="flex justify-center items-center h-full">
    //         {/* Wrap the button with your PricingModal component */}
    //         <PricingModal>
    //           <Button className="flex gap-2">
    //             <Lock /> Upgrade to unlock
    //           </Button>
    //         </PricingModal>
    //       </div>
    //     )}

    //     {model.enable && <div className="flex-1 p-4">
    //       <div className="flex-1 p-4 space-y-2">
    //         {messages[model.model]?.map((m,i)=>(
    //           <div className={`p-2 rounded-md ${m.role == 'user' ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-900"}`}>
    //               {m.role == 'assistant' && (
    //                 <span className="text-sm text-gray-300">{m.model??model.model}</span>
    //               )}
    //               <div className="flex gap-3 items-center">
    //                 {m.content == 'loading' && <><Loader className="animate-spin"/><span>Thinking...</span></>}
    //               </div>
    //               {m?.content !== 'loading' && m?.content && <Markdown remarkPlugins={[remarkGfm]}>{m?.content}</Markdown>}
    //           </div>
    //         ))}
    //       </div>
    //     </div>}
    //     </div>
    //   ))}

    // </div>

    //     <div className="flex flex-1 h-[75vh] border-b">
    //   {aiModelList.map((model, index) => (
    //     <div
    //       key={model.model}
    //       className={`flex flex-col border-r h-full overflow-auto transition-all
    //       ${model.enable ? 'flex-1 min-w-[400px]' : 'w-[100px] flex-none'}`}
    //     >
    //       {/* Header Section of each Model Column */}
    //       <div className="flex w-full h-17.5 gap-2 items-center justify-between border-b p-4">
    //         <div className="flex items-center gap-4 w-full">
    //           <Image src={model.icon} alt={model.model} width={25} height={25} />

    //           {/* Video Logic: Select box is shown if the model is enabled */}
    //           {model.enable && (
    //             <Select
    //               defaultValue={aiSelectedModels?.[model.model]?.modelId}
    //               onValueChange={(value) => onSelectValue(model.model, value)}
    //               disabled={model.premium && !paidUser} // Locks entire select if base model is premium
    //             >
    //               <SelectTrigger className="w-45">
    //                 <SelectValue placeholder="Select Model" />
    //               </SelectTrigger>
    //               <SelectContent position="popper" className="z-50">
    //                 <SelectGroup>
    //                   <SelectLabel className="text-sm text-gray-400">Free</SelectLabel>
    //                   {model.subModel.map((sub, i) => !sub.premium && (
    //                     <SelectItem key={i} value={sub.id}>
    //                       {sub.name}
    //                     </SelectItem>
    //                   ))}
    //                 </SelectGroup>

    //                 <SelectGroup className="p-1">
    //                   <SelectLabel className="text-sm text-gray-400">Premium</SelectLabel>
    //                   {model.subModel.map((sub, i) => sub.premium && (
    //                     <SelectItem
    //                       key={i}
    //                       value={sub.id}
    //                       disabled={!paidUser} // Locks specific premium sub-models
    //                     >
    //                       <div className="flex items-center gap-2">
    //                         {sub.name} <Lock className="h-3 w-3" />
    //                       </div>
    //                     </SelectItem>
    //                   ))}
    //                 </SelectGroup>
    //               </SelectContent>
    //             </Select>
    //           )}
    //         </div>

    //         {/* Toggle / Message Icon */}
    //         <div>
    //           {model.enable ? (
    //             <Switch
    //               checked={model.enable}
    //               onCheckedChange={(v) => onToggleChange(model.model, v)}
    //             />
    //           ) : (
    //             <MessageSquare
    //               className="cursor-pointer"
    //               onClick={() => onToggleChange(model.model, true)}
    //             />
    //           )}
    //         </div>
    //       </div>

    //       {/* Premium Upgrade Overlay (Video logic) */}
    //       {!paidUser && model.premium && model.enable && (
    //         <div className="flex flex-col justify-center items-center h-full gap-4 bg-gray-50/50">
    //           <PricingModal>
    //             <Button className="flex gap-2">
    //               <Lock /> Upgrade to unlock {model.model}
    //             </Button>
    //           </PricingModal>
    //         </div>
    //       )}

    //       {/* Chat Messages Section */}
    //       {model.enable && (!model.premium || paidUser) && (
    //         <div className="flex-1 p-4 overflow-y-auto">
    //           <div className="space-y-4">
    //             {messages[model.model]?.map((m, i) => (
    //               <div
    //                 key={i}
    //                 className={`p-3 rounded-lg ${m.role === 'user' ? "bg-blue-50 ml-10" : "bg-gray-100 mr-10"}`}
    //               >
    //                 {m.role === 'assistant' && (
    //                   <p className="text-[10px] text-gray-400 mb-1">{m.model || model.model}</p>
    //                 )}

    //                 {m.content === 'loading' ? (
    //                   <div className="flex gap-2 items-center text-sm italic text-gray-500">
    //                     <Loader className="animate-spin h-4 w-4" /> Thinking...
    //                   </div>
    //                 ) : (
    //                   <div className="text-sm prose prose-sm max-w-none">
    //                     <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
    //                   </div>
    //                 )}
    //               </div>
    //             ))}
    //           </div>
    //         </div>
    //       )}
    //     </div>
    //   ))}
    // </div>

    <div className="flex flex-1 h-[75vh] border-b">
      {aiModelList.map((model, index) => (
        <div
          key={index}
          className={`flex flex-col border-r h-full overflow-auto transition-all 
      ${model.enable ? "flex-1 min-w-[400px]" : "w-[100px] flex-none"}`}
        >
          {/* COLUMN HEADER */}
          <div className="flex w-full h-17.5 gap-2 items-center justify-between border-b p-4">
            <div className="flex items-center gap-4 w-full">
              <Image
                src={model.icon}
                alt={model.model}
                width={25}
                height={25}
              />

              {/* SELECT BOX LOGIC */}
              {model.enable && (
                <Select
                  defaultValue={aiSelectedModels?.[model.model]?.modelId}
                  onValueChange={(value) => onSelectValue(model.model, value)}
                  // Entire select is disabled ONLY if the parent category is premium and user hasn't paid
                  disabled={
                    model.premium && !paidUser && userDetail?.plan !== "Paid"
                  }
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-50">
                    {/* FREE GROUP */}
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-400">
                        Free Models
                      </SelectLabel>
                      {model.subModel.map(
                        (sub, i) =>
                          !sub.premium && (
                            <SelectItem key={i} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ),
                      )}
                    </SelectGroup>

                    {/* PREMIUM GROUP */}
                    <SelectGroup className="mt-2">
                      <SelectLabel className="text-xs text-gray-400">
                        Premium Models
                      </SelectLabel>
                      {model.subModel.map(
                        (sub, i) =>
                          sub.premium && (
                            <SelectItem
                              key={i}
                              value={sub.id}
                              disabled={
                                !paidUser && userDetail?.plan !== "Paid"
                              }
                            >
                              <div className="flex items-center gap-2">
                                {sub.name} <Lock className="h-3 w-3" />
                              </div>
                            </SelectItem>
                          ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* TOGGLE SWITCH */}
            <div>
              {model.enable ? (
                <Switch
                  checked={model.enable}
                  onCheckedChange={(v) => onToggleChange(model.model, v)}
                  disabled={model.premium && !paidUser}
                />
              ) : (
                <MessageSquare
                  className="cursor-pointer text-gray-400 hover:text-primary"
                  onClick={() => onToggleChange(model.model, true)}
                />
              )}
            </div>
          </div>

          {/* UPGRADE OVERLAY (Triggers for Premium Columns) */}
          {!paidUser && model.premium && model.enable && (
            <div className="flex flex-col justify-center items-center h-full bg-slate-50/50">
              <PricingModal>
                <Button className="flex gap-2 shadow-lg">
                  <Lock className="h-4 w-4" /> Upgrade to unlock {model.model}
                </Button>
              </PricingModal>
            </div>
          )}

          {/* CHAT AREA (Only accessible if free or paid) */}
          {model.enable && (!model.premium || paidUser) && (
            <div className="flex-1 p-4">
              {/* CHAT AREA */}
              {model.enable && (!model.premium || paidUser) && (
                <div className="flex-1 p-4 overflow-y-auto h-[60vh]">
                  <div className="flex flex-col gap-5">
                    {messages[model.model]?.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg w-fit max-w-[80%] 
              ${m.role === "user" ? "bg-blue-100 text-blue-900 self-end" : "bg-gray-100 text-gray-900 self-start"}`}
                      >
                        {m.role === "assistant" && (
                          <p className="text-[10px] text-gray-400 mb-1">
                            {m.model || model.model}
                          </p>
                        )}

                        {m.content === 'loading' ? (
                          <div className="flex gap-2 items-center text-sm italic">
                            <Loader className="animate-spin h-4 w-4" />{" "}
                            Thinking...
                          </div>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none">
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </Markdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
