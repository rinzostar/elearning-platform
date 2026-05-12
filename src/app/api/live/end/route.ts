import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { room } = await req.json();

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" in request body' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    
    // Delete the room, which forcefully disconnects all participants
    await roomService.deleteRoom(room);

    // Mark course as ended in the database (so UI can reflect it even before egress finishes)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      await supabase.from('courses').update({ isEnded: true }).eq('id', room);
    }

    return NextResponse.json({ success: true, message: 'Room ended successfully' });
  } catch (error: any) {
    console.error('Error ending room:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
