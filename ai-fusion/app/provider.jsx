'use client'
import React, { useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './_components/AppSidebar'
import AppHeader from './_components/AppHeader'
import { useUser } from '@clerk/nextjs'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/FirebaseConfig'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { DefaultModel } from '@/shared/AiModelsShared'
import { UserDetailContext } from '@/context/UserDetailContext'
function Provider({
    children,
    ...props
}) {

  const {user} = useUser();
  const [aiSelectedModels, setAiSelectedModels] = useState(DefaultModel);
  const [userDetail, setUserDetail] = useState();
  const [messages, setMessages] = useState({});

  // useEffect(()=>{
  //   CreateNewUser();
  // },[user]);

  useEffect(() => {
    // Only run if user is defined and has an email address
    if (user?.primaryEmailAddress?.emailAddress) {
      CreateNewUser();
    }
  }, [user]);

  useEffect(()=>{
    if (aiSelectedModels) {
        updateAIModelSelectionPref();
    }
  },[aiSelectedModels]);

  const updateAIModelSelectionPref=async()=>{
    const email = user?.primaryEmailAddress?.emailAddress;
          if (email) {
            const docRef = doc(db, "users", email);
            await updateDoc(docRef, {
              selectedModelPref: aiSelectedModels // Use the variable, not the state!
            });
         }
  }

  const CreateNewUser= async() => {
    // If user exist?
    const userRef = doc(db, "users", user?.primaryEmailAddress?.emailAddress);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userInfo = userSnap.data();
        // ENSURE THIS LINE IS PRESENT: It syncs the DB data to your Context
        setUserDetail(userInfo); 
        setAiSelectedModels(userInfo?.selectedModelPref || DefaultModel);
    } else {
        const userData = {
            name: user?.fullName,
            email: user?.primaryEmailAddress?.emailAddress,
            createdAt: new Date(),
            reminingMsg: 5,
            plan: 'Free', // Default for new users
        }
        await setDoc(userRef, userData);
        setUserDetail(userData);
    }
  }
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...props}>
        <UserDetailContext.Provider value={{userDetail, setUserDetail}}>  
          <AiSelectedModelContext.Provider value={{aiSelectedModels, setAiSelectedModels, messages, setMessages}}>  
            <SidebarProvider>
              <AppSidebar/>
              
              {/* <div className='w-full overflow-hidden'><AppHeader/>{children}</div> */}
              <div className='flex flex-col w-full h-screen overflow-hidden'>
                <AppHeader />
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </AiSelectedModelContext.Provider>
        </UserDetailContext.Provider>
    </NextThemesProvider>
  )
}

export default Provider