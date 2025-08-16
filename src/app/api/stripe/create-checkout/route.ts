import { NextResponse } from 'next/server';
import { stripe, PREMIUM_PRICE_ID } from '@/lib/stripe';
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST() {
  console.log('Received checkout session creation request');
  
  try {
    // 1. Get and verify the authorization token
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const token = authHeader?.split('Bearer ')[1];
    if (!token) {
      console.error('No token provided in Authorization header');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 2. Verify Firebase token
    console.log('Verifying Firebase token...');
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const userId = decodedToken.uid;
    console.log('Token verified for user:', userId);

    // Create a test clock for this customer
    console.log('Creating test clock...');
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
      name: `Test Clock for ${userId}`,
    });
    console.log('Created test clock:', testClock.id);

    // 3. Get user data
    console.log('Fetching user data from Firestore...');
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      console.error('No user data found for ID:', userId);
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 4. Handle Stripe customer
    let stripeCustomerId = userData.stripeCustomerId;
    console.log('Existing Stripe customer ID:', stripeCustomerId);

    // Create new Stripe customer if needed
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer...');
      try {
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: {
            userId: userId
          },
          test_clock: testClock.id // Associate customer with test clock
        });
        stripeCustomerId = customer.id;
        console.log('Created new Stripe customer:', stripeCustomerId);

        // Update user with new Stripe customer ID and test clock ID
        await db.collection('users').doc(userId).update({
          stripeCustomerId: stripeCustomerId,
          stripeTestClockId: testClock.id // Store test clock ID for future use
        });
        console.log('Updated user with new Stripe customer ID and test clock ID');
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Failed to create Stripe customer',
            details: error.message 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 5. Create checkout session
    console.log('Creating Stripe checkout session...');
    if (!PREMIUM_PRICE_ID) {
      console.error('STRIPE_PREMIUM_PRICE_ID not configured');
      return new NextResponse(
        JSON.stringify({ error: 'Premium price not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL not configured');
      return new NextResponse(
        JSON.stringify({ error: 'App URL not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/dashboard/premium?checkout=success`,
        cancel_url: `${baseUrl}/dashboard/premium?checkout=canceled`,
        metadata: {
          userId: userId,
          testClockId: testClock.id
        },
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            userId: userId,
            plan: 'monthly_trial',
            testClockId: testClock.id
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        payment_method_collection: 'always', // Always require payment method
        custom_text: {
          submit: {
            message: 'Your card will be charged €3.99/month after the 30-day free trial. Cancel anytime.'
          }
        }
      });

      if (!session.url) {
        console.error('No URL in created session');
        return new NextResponse(
          JSON.stringify({ error: 'No checkout URL created' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      console.log('Checkout session created successfully:', session.id);
      console.log('Checkout URL:', session.url);
      
      return new NextResponse(
        JSON.stringify({ 
          url: session.url,
          testClockId: testClock.id // Return test clock ID for testing
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in checkout creation:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}