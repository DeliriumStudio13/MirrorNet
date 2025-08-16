import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import serviceAccount from '@/config/serviceAccount.json';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { days = 30, testClockId } = await req.json();

    if (!testClockId) {
      return new NextResponse(
        JSON.stringify({ error: 'Test clock ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get the current time of the test clock
    const testClock = await stripe.testHelpers.testClocks.retrieve(testClockId);
    
    // Calculate new time (advance by specified number of days)
    const newTime = testClock.frozen_time + (days * 24 * 60 * 60);

    // Advance the test clock
    const advancedClock = await stripe.testHelpers.testClocks.advance(
      testClockId,
      { frozen_time: newTime }
    );

    return new NextResponse(
      JSON.stringify({
        message: `Advanced clock by ${days} days`,
        oldTime: new Date(testClock.frozen_time * 1000).toISOString(),
        newTime: new Date(advancedClock.frozen_time * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error advancing test clock:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to advance test clock',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
