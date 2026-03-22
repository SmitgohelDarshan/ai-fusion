import { Progress } from '@/components/ui/progress'
import React from 'react'

export default function UsageCreditProgress({ remainingToken }) {
  // If remainingToken is 4, then used is 5 - 4 = 1
  const used = 5 - (remainingToken ?? 5); 
  const progressValue = (used / 5) * 100;

  return (
    <div className='p-3 border rounded-2xl mb-5 flex flex-col gap-2'>
        <h2 className='font-bold text-xl'>Free Plan</h2>
        <p className='text-gray-400 font-medium'>{used}/5 messages Used</p>
        <Progress value={progressValue} />
    </div>
  )
}