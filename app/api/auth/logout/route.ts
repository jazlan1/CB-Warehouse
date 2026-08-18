import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // ✅ دونوں کوکیز کو ایک ساتھ ڈیلیٹ کر رہے ہیں تاکہ کوئی بھی باقی نہ رہے
    cookieStore.delete("token");
    cookieStore.delete("auth_token"); 

    return NextResponse.json(
      { 
        success: true, 
        message: "All auth tokens and cookies cleared successfully." 
      }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during logout." }, 
      { status: 500 }
    );
  }
}