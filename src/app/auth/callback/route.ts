import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { EmailOtpType } from '@supabase/supabase-js'; // Import EmailOtpType

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/home';

  if (token_hash && type) {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Cast type to EmailOtpType as it's used for email verification
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?message=Could not authenticate user', request.url));
}