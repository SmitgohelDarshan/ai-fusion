"use client"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import React, { useContext, useEffect, useState } from "react"
import { SignInButton, useAuth, useUser } from "@clerk/nextjs"
import { Bolt, Moon, Sun, User2, Zap } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import UsageCreditProgress from "./UsageCreditProgress"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/config/FirebaseConfig"
import moment from "moment/moment"
import Link from "next/link"
import axios from "axios"
import { AiSelectedModelContext } from "@/context/AiSelectedModelContext"
import PricingModal from "./PricingModal"

export function AppSidebar() {
    const {theme, setTheme} = useTheme();
    const {user} = useUser();
    const [chatHistory, setChatHistory] = useState([]);
    const [freeMsgCount, setFreeMsgCount] = useState(0);
    const {aiSelectedModels, setAiSelectedModels, messages, setMessages} = useContext(AiSelectedModelContext);
    const { has } = useAuth();
    const paidUser = has({ plan: 'unlimited_plan' });


    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(()=>{
      user && GetChatHistory();
    },[user, messages])

    useEffect(()=>{
      GetRemainingTokenMsgs();
    },[messages])

    // const GetChatHistory = async() => {
    //   const q = query(collection(db, "chatHistory"), where("userEmail",'==',user?.primaryEmailAddress?.emailAddress))
    //   const querySnapshot = await getDocs(q);

    //   // querySnapshot.forEach((doc)=>{
    //   //   console.log(doc.id, doc.data());
    //   //   setChatHistory(prev => [...prev, doc.data()])
    //   // })
    //   // Create a temporary array to hold all chats
    //   const history = [];
    //   querySnapshot.forEach((doc) => {
    //       history.push(doc.data());
    //   });
      
    //   // Set the state ONCE with the full list
    //   setChatHistory(history);
    // }

    const GetChatHistory = async () => {
      if (!user) return; // Safety check

      const q = query(
        collection(db, "chatHistory"),
        where("userEmail", "==", user?.primaryEmailAddress?.emailAddress),
      );

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // FILTER: Only push to history if messages exist and the object is not empty
        // In your project, messages is an object { modelName: [] }
        if (data.messages && Object.keys(data.messages).length > 0) {
          history.push(data);
        }
      });

      // Sort by timestamp so the latest chat is always at the top
      const sortedHistory = history.sort(
        (a, b) => b.lastUpdated - a.lastUpdated,
      );

      setChatHistory(sortedHistory);
    };

    const GetLastUserMessageFromChat = (chat)=>{
        const allMessages = Object.values(chat.messages).flat();
        const userMessages = allMessages.filter(msg=>msg.role == 'user');

        const lastUserMsg = userMessages[userMessages.length-1]?.content || null;

        const lastUpdated = chat.lastUpdated || Date.now();
        const formattedDate = moment(lastUpdated).fromNow();

        return {
          chatId: chat.chatId,
          message: lastUserMsg,
          lastMsgDate: formattedDate
        }
    }

    // const GetRemainingTokenMsgs = async() => {
    //   const result = await axios.post('/api/user-remaining-msg');
    //   console.log(result);
    //   setFreeMsgCount(result?.data?.remainingToken);
    // }
    const GetRemainingTokenMsgs = async () => {
        const result = await axios.post('/api/user-remaining-msg', {});         
        // setFreeMsgCount(result.data.remainingToken);
        setFreeMsgCount(result.data.remainingToken ?? 0);
      }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image
                src={"/logo.svg"}
                alt="logo"
                width={60}
                height={60}
                className="w-[40px] h-[40px]"
              />
              <h2 className="font-mono  font-bold text-xl">AI Fusion</h2>
            </div>
            <div>
              {mounted &&
                (theme === "light" ? (
                  <Button variant={"ghost"} onClick={() => setTheme("dark")}>
                    <Sun />
                  </Button>
                ) : (
                  <Button variant={"ghost"} onClick={() => setTheme("light")}>
                    <Moon />
                  </Button>
                ))}
            </div>
          </div>
          {user ? (
            <Link href={"/"}>
              <Button className="mt-7 w-full" size="lg">
                + New Chat
              </Button>
            </Link>
          ) : (
            <SignInButton>
              <Button className="mt-7 w-full" size="lg">
                + New Chat
              </Button>
            </SignInButton>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className={"p-3"}>
            <h2 className="font-bold text-lg">Chat</h2>
            {!user && (
              <p className="text-sm text-gray-400">
                Sign in to start chating with multiple AI model
              </p>
            )}
            {/* {chatHistory.map((chat,index)=>{

                  return(
                    <Link href={'?chatId='+chat.chatId} key={index} className="mt-2 hover:bg-gray-100 p-3">
                      <div className="hover:bg-gray-100 p-3 cursor-pointer">
                        <h2 className="text-sm text-gray-400">{GetLastUserMessageFromChat(chat).lastMsgDate}</h2>
                        <h2 className="text-lg line-clamp-1">{GetLastUserMessageFromChat(chat).message}</h2>
                      </div>
                      <hr className="my-1"/>
                    </Link>
                  );
                })} */}
                {chatHistory.map((chat, index) => (
                  <Link
                    href={"?chatId=" + chat.chatId}
                    key={index}
                    className="mt-2 block hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                  >
                    <div className="cursor-pointer">
                      <h2 className="text-[10px] text-gray-400">
                        {GetLastUserMessageFromChat(chat).lastMsgDate}
                      </h2>
                      <h2 className="text-sm line-clamp-1 font-medium">
                        {GetLastUserMessageFromChat(chat).message || "New Chat"}
                      </h2>
                    </div>
                  </Link>
                ))}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-3 mb-10">
          {!user ? (
            <SignInButton mode="modal">
              <Button className={"w-full"} size="lg">
                Sign In/Sign Up
              </Button>
            </SignInButton>
          ) : (
            <div>
              {!paidUser && (
                <div className="mt-5">
                  <UsageCreditProgress remainingToken={freeMsgCount} />
                  <PricingModal>
                    <Button className={"w-full bg-blue-600 hover:bg-blue-700 text-white flex gap-2"}>
                      <Zap className="fill-current"/> Upgrade Plan
                    </Button>
                  </PricingModal>
                </div>
              )}
              <Button className="flex" variant="ghost">
                <User2 /> <h2>Settings</h2>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}