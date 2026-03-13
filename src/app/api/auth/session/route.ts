import { NextResponse } from 'next/server';
import { createClient, supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current session from Supabase SSR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { success: true, user: null },
        { status: 200 }
      );
    }

    // Fetch profile from public.users using admin client (bypass RLS if needed)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('[AUTH] Profile fetch error:', profileError);
      // Return auth user even if profile fails
      return NextResponse.json({
        success: true,
        user: {
          ...session.user,
          user_metadata: session.user.user_metadata
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...session.user,
        ...profile
      }
    });
  } catch (error: any) {
    console.error('[AUTH] Unexpected session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
