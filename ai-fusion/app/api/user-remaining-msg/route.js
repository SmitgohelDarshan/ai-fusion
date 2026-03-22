import { aj } from "@/config/Arcjet";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    const user = await currentUser(); 
    const body = await req.json();
    const token = body?.token ? body.token : 0;
    const email = user?.primaryEmailAddress?.emailAddress;

    const decision = await aj.protect(req, { 
        userId: email, 
        requested: token 
    });

    // VIDEO FIX: Check the reason specifically
    console.log("Full Decision Reason:", decision.reason);

    // If decision.reason.remaining is undefined, it means Shield or Bot blocked it
    const remainingToken = decision.reason.remaining !== undefined 
        ? decision.reason.remaining 
        : 5; // Fallback to 5 if undefined to prevent UI crash

    console.log("Tokens remaining:", remainingToken);

    return NextResponse.json({
        remainingToken: remainingToken
    });
}