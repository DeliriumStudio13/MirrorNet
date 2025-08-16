import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { firebaseToken } = await request.json();

    if (!firebaseToken) {
      return NextResponse.json({ error: 'Firebase token is required' }, { status: 400 });
    }

    const decodedToken = await auth.verifyIdToken(firebaseToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeCustomerId) {
      return NextResponse.json({ error: 'Stripe customer ID not found for user' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}