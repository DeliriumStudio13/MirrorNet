import { NextRequest, NextResponse } from 'next/server';
import { stripe, PREMIUM_PRICE_ID } from '@/lib/stripe';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  console.log('Received checkout session creation request');
  
  try {
    // Apply rate limiting (5 requests per minute for checkout creation)
    try {
      await rateLimit(req, 5, 60 * 1000);
    } catch (rateLimitError) {
      console.log('Rate limit exceeded for checkout creation:', rateLimitError.message);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...getRateLimitHeaders(req, 5),
          },
        }
      );
    }
    const rateLimitHeaders = getRateLimitHeaders(req, 5);
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
          },
        }
      );
    }

    // 2. Verify Firebase token
    console.log('Verifying Firebase token...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
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
          },
        }
      );
    }

    // 4. Create checkout session (customer will be created after payment validation)
    console.log('Creating Stripe checkout session...');
    if (!PREMIUM_PRICE_ID) {
      console.error('STRIPE_PREMIUM_PRICE_ID not configured');
      return new NextResponse(
        JSON.stringify({ error: 'Premium price not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
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
          },
        }
      );
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: userData.email,  // Let Stripe create customer after payment validation
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
          userId: userId
        },
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            userId: userId,
            plan: 'monthly_trial'
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
            },
          }
        );
      }

      console.log('Checkout session created successfully:', session.id);
      console.log('Checkout URL:', session.url);
      
      return new NextResponse(
        JSON.stringify({ url: session.url }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitHeaders,
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
        },
      }
    );
  }
}