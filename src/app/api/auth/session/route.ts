import { NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user from Supabase SSR
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: true, user: null },
        { status: 200 }
      );
    }

    // Fetch profile from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch KYC status
    const { data: kycData } = await supabaseAdmin
      .from('kyc')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    const userData = {
      ...user,
      ...(profile || {}),
      kyc_status: kycData?.status || 'not_started'
    };

    return NextResponse.json({
      success: true,
      user: userData
    });
  } catch (error: any) {
    console.error('[AUTH] Unexpected session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
