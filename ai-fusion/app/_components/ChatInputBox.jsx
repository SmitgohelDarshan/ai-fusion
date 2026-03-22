import { Button } from '@/components/ui/button'
import { Mic, Paperclip, Send } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
import AiMultiModels from './AiMultiModels'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/FirebaseConfig';
import { useAuth, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function ChatInputBox() {
    const [userInput, setUserInput] = useState("");
    const {user} = useUser();
    const {aiSelectedModels, setAiSelectedModels, messages, setMessages} = useContext(AiSelectedModelContext);
    const [chatId, setChatId] = useState();
    const params = useSearchParams();
    const {has} = useAuth();
    const paidUser = has({ plan: 'unlimited_plan' });

    useEffect(()=>{
        const chatId_ = params.get('chatId')
        if (chatId_) {
            setChatId(chatId_);
            GetMessages(chatId_);
        } else {
            // setMessages([]);
            setMessages({});
            // setChatId(uuidv4());
            const newId = uuidv4();
            setChatId(newId);
        }
    },[params]);

    // const handleSend = async () => {
    //     if (!userInput.trim()) return;

    //     if (!paidUser) {
    //         const result = await axios.post('/api/user-remaining-msg', {
    //             token:1
    //         });
    //         const remainingToken = result?.data?.remainingToken;
    //         if (remainingToken < 0) {
    //             console.log("Limit Exceed");
    //             toast.error('Maximum Daily Limit Exceed');
    //             return;
    //         }
    //     }
        
    //     // 1️⃣ Add user message to all enabled models
    //     setMessages((prev) => {
    //         const updated = { ...prev };
    //         Object.keys(aiSelectedModels).forEach((modelKey) => {
    //             if (aiSelectedModels[modelKey].enable) {
    //                 updated[modelKey] = [
    //                 ...(updated[modelKey] ?? []),
    //                 { role: "user", content: userInput },
    //                 ];
    //             } 
    //         });
    //         return updated;
    //     });

    //     const currentInput = userInput; // capture before reset
    //     setUserInput("");

    //     // 2️⃣ Fetch response from each enabled model
    //     Object.entries(aiSelectedModels).forEach(async ([parentModel, modelInfo]) => {
    //         if (!modelInfo.modelId || aiSelectedModels[parentModel].enable == false) return;

    //         // Add loading placeholder before API call
    //         setMessages((prev) => ({
    //             ...prev,
    //             [parentModel]: [
    //                 ...(prev[parentModel] ?? []),
    //                 { role: "assistant", content: "Loading...", model: parentModel, loading: true },
    //             ],
    //         }));


    //         try {
    //             const result = await axios.post("/api/ai-multi-model", {
    //                 model: modelInfo.modelId,
    //                 msg: [{ role: "user", content: currentInput }],
    //                 parentModel,
    //             });

    //             const { aiResponse, model } = result.data;

    //             // 3️⃣ Add AI response to that model’s messages
    //             setMessages((prev) => {
    //                 const updated = [...(prev[parentModel] ?? [])];
    //                 const loadingIndex = updated.findIndex((m) => m.loading);

    //                 if (loadingIndex !== -1) {
    //                     updated[loadingIndex] = {
    //                         role: "assistant",
    //                         content: aiResponse,
    //                         model,
    //                         loading: false,
    //                     };
    //                 } else {
    //                     // fallback if no loading msg found
    //                     updated.push({
    //                         role: "assistant",
    //                         content: aiResponse,
    //                         model,
    //                         loading: false,
    //                     });
    //                 }

    //                 return { ...prev, [parentModel]: updated };
    //             });
    //         } catch (err) {
    //             console.error(err);
    //             setMessages((prev) => ({
    //                 ...prev,
    //                 [parentModel]: [
    //                     ...(prev[parentModel] ?? []),
    //                     { role: "assistant", content: "⚠️ Error fetching response." },
    //                 ],
    //             }));
    //         }
    //     });
    // };
    const handleSend = async () => {
      if (!userInput.trim()) return;

      // 1. Token Check
      if (!paidUser) {
        const result = await axios.post("/api/user-remaining-msg", {
          token: 1,
        });
        if (result?.data?.remainingToken < 0) {
          toast.error("Maximum Daily Limit Exceeded");
          return;
        }
      }

      const currentInput = userInput;
      setUserInput("");

      // 2. Add User message AND a 'loading' placeholder to each enabled model
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(aiSelectedModels).forEach((modelKey) => {
          if (aiSelectedModels[modelKey].enable) {
            updated[modelKey] = [
              ...(updated[modelKey] ?? []),
              { role: "user", content: currentInput },
              // CRITICAL: Change "Loading..." to "loading" (lowercase) to match your UI
              {
                role: "assistant",
                content: "loading",
                model: modelKey,
                loading: true,
              },
            ];
          }
        });
        return updated;
      });

      // 3. Loop through models to fetch API response
      Object.entries(aiSelectedModels).forEach(
        async ([parentModel, modelInfo]) => {
          if (!modelInfo.modelId || !modelInfo.enable) return;

          try {
            const result = await axios.post("/api/ai-multi-model", {
              model: modelInfo.modelId,
              msg: [{ role: "user", content: currentInput }],
              parentModel,
            });

            const { aiResponse, model } = result.data;

            // 4. Find the 'loading' message and replace it with the real AI response
            setMessages((prev) => {
              const modelMsgs = [...(prev[parentModel] ?? [])];
              const loadingIndex = modelMsgs.findIndex(
                (m) => m.loading === true || m.content === "loading",
              );

              if (loadingIndex !== -1) {
                modelMsgs[loadingIndex] = {
                  role: "assistant",
                  content: aiResponse,
                  model: model || parentModel,
                  loading: false,
                };
              }
              return { ...prev, [parentModel]: modelMsgs };
            });
          } catch (err) {
            console.error(err);
            // Replace loading with error message if API fails
            setMessages((prev) => {
              const modelMsgs = [...(prev[parentModel] ?? [])];
              const loadingIndex = modelMsgs.findIndex((m) => m.loading);
              if (loadingIndex !== -1) {
                modelMsgs[loadingIndex] = {
                  role: "assistant",
                  content: "⚠️ Error fetching response.",
                };
              }
              return { ...prev, [parentModel]: modelMsgs };
            });
          }
        },
      );
    };
    // useEffect(()=>{
    //     if (messages) {
    //         SaveMessages();
    //     }
    // },[messages]);
    useEffect(() => {
        // Only save if messages is NOT empty (Object.keys check)
        if (messages && Object.keys(messages).length > 0) {
            SaveMessages();
        }
    }, [messages]);

    const SaveMessages = async () => {
        if (!chatId || !user) return;

        const docRef = doc(db, 'chatHistory', chatId);

        await setDoc(docRef, {
            chatId:chatId, 
            userEmail: user?.primaryEmailAddress?.emailAddress,
            messages:messages,
            lastUpdated: Date.now() 
        })
    }

    const GetMessages = async(id) => {
        if (!id) return;
        const docRef = doc(db, "chatHistory", id);
        const docSnap = await getDoc(docRef);
        // const docData = docSnap.data();
        // setMessages(docData.messages);
        if (docSnap.exists()) {
        const docData = docSnap.data();
        setMessages(docData.messages || {});
    }
    }

  return (
    <div className='relative min-h-screen flex flex-col'>
        {/* Main Content */}
        <div className='flex-1'>
            <AiMultiModels/>
        </div>
        {/* Chat Input Box */}
        <div className='fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4'>
            <div className='w-full border rounded-xl shadow-md max-w-2xl p-4'>
                <input type="text" 
                    placeholder='Ask me anything...'
                    value={userInput}
                    className='border-0 outline-none w-full'
                    onChange={(event)=>setUserInput(event.target.value)} />
                <div className='mt-3 flex justify-between items-center'>
                    <Button className={''} variant='ghost' size='icon'>
                        <Paperclip className='h-5 w-5' />
                    </Button>
                    <div className='flex gap-5'>
                        <Button variant='ghost' size='icon'><Mic/></Button>
                        <Button  size='icon' onClick={handleSend}><Send/></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
