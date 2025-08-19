import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received create-portal request');

    // Apply rate limiting (3 requests per minute for portal creation)
    try {
      await rateLimit(req, 3, 60 * 1000);
    } catch (rateLimitError) {
      console.log('Rate limit exceeded for portal creation:', rateLimitError.message);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'Access-Control-Allow-Origin': '*',
            ...getRateLimitHeaders(req, 3),
          },
        }
      );
    }
    const rateLimitHeaders = getRateLimitHeaders(req, 3);

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
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      console.error('Firebase token verification failed:', error.message);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token', details: error.message }),
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

    // 3. Get user data
    console.log('Fetching user data from Firestore...');
    const userDoc = await adminDb.collection('users').doc(userId).get();
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

    // 4. Verify user has premium status (should have a customer ID)
    if (!userData.isPremium) {
      console.error('User is not premium, cannot access billing portal:', userId);
      return new NextResponse(
        JSON.stringify({ error: 'Premium subscription required to access billing portal' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 5. Handle Stripe customer
    let stripeCustomerId = userData.stripeCustomerId;
    console.log('Existing Stripe customer ID:', stripeCustomerId);

    // If we have a stripeCustomerId, verify it exists in Stripe
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
        console.log('Verified existing Stripe customer:', stripeCustomerId);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log('Stored Stripe customer not found, creating new one');
          stripeCustomerId = null; // Reset so we create a new one
        } else {
          console.error('Error retrieving existing Stripe customer:', error.message);
          throw error; // Re-throw if it's a different error
        }
      }
    }

    // Create new Stripe customer if needed
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer...');
      try {
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: {
            userId: userId
          }
        });
        stripeCustomerId = customer.id;
        console.log('Created new Stripe customer:', stripeCustomerId);

        // Update user with new Stripe customer ID
        await adminDb.collection('users').doc(userId).update({
          stripeCustomerId: stripeCustomerId
        });
        console.log('Updated user with new Stripe customer ID');
      } catch (error: any) {
        console.error('Error creating Stripe customer:', error.message);
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

    // 6. Create portal session
    console.log('Creating Stripe portal session...');
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      });

      console.log('Portal session created successfully:', portalSession.id);
      console.log('Portal URL:', portalSession.url);

      return new NextResponse(
        JSON.stringify({ url: portalSession.url }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            ...rateLimitHeaders,
          },
        }
      );
    } catch (error: any) {
      console.error('Error creating Stripe portal session:', error.message);
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to create portal session',
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
  } catch (error: any) {
    console.error('Unexpected error in portal creation:', error.message);
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