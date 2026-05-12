import { WebhookReceiver } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY || '',
  process.env.LIVEKIT_API_SECRET || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('Authorization');

    if (!sig) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const event = receiver.receive(body, sig);
    console.log('LiveKit Webhook Event:', event.event);

    // When a recording (egress) ends, save the URL to the course
    if (event.event === 'egress_ended') {
      const egressInfo = event.egressInfo;
      const courseId = egressInfo?.roomName;
      const fileUrl = egressInfo?.fileResults?.[0]?.location;

      if (courseId && fileUrl) {
        console.log(`Saving recording URL for course ${courseId}: ${fileUrl}`);
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' // Ideally use SERVICE_ROLE_KEY here
        );

        const { error } = await supabase
          .from('courses')
          .update({ recordedUrl: fileUrl })
          .eq('id', courseId);

        if (error) {
          console.error('Error updating course with recording URL:', error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
