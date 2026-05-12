import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { room, action } = await req.json();
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const egressClient = new EgressClient(wsUrl, apiKey, apiSecret);

    if (action === 'start') {
      console.log(`Starting recording for room: ${room}`);
      
      // Configure where to save the file. 
      // This usually requires S3 or similar to be configured in the Egress service.
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: `recordings/${room}-${Date.now()}.mp4`,
      });

      // Start Room Composite Egress (records the whole room as one video)
      const info = await egressClient.startRoomCompositeEgress(room, {
        file: fileOutput,
      });

      return NextResponse.json({ success: true, egressId: info.egressId });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Egress Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
