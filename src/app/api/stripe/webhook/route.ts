import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { trackError, trackBusinessEvent, withPerformanceTracking, logInfo } from '@/lib/monitoring';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    // Apply generous rate limiting for webhooks (100 requests per minute)
    try {
      await rateLimit(req, 100, 60 * 1000);
    } catch (rateLimitError) {
      console.log('Rate limit exceeded for webhook:', rateLimitError.message);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            ...getRateLimitHeaders(req, 100),
          }
        }
      );
    }
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    logInfo('Received webhook event', { eventType: event.type, eventId: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const handleCheckoutCompleted = withPerformanceTracking(
  'stripe.checkout.completed',
  async (session: Stripe.Checkout.Session) => {
    try {
      logInfo('Processing checkout completed', { sessionId: session.id });
      
      // Stripe has automatically created a customer - get the customer ID
      const stripeCustomerId = session.customer as string;
      console.log('Checkout completed for Stripe customer:', stripeCustomerId);
      
      // Get userId from metadata
      let userId = session.metadata?.userId;
      
      if (!userId) {
        // If no userId in session metadata, try to find user by email
        console.log('No userId in session metadata, looking up user by email...');
        
        // Get customer email from Stripe (since we used customer_email)
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        const customerEmail = customer.email;
        
        if (customerEmail) {
          // Find user in Firestore by email
          const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', customerEmail)
            .limit(1)
            .get();
          
          if (!usersSnapshot.empty) {
            userId = usersSnapshot.docs[0].id;
            console.log('Found user by email:', userId);
          }
        }
        
        if (!userId) {
          trackError(new Error('Could not find userId for checkout session'), {
            action: 'checkout_completed',
            additionalData: { sessionId: session.id, customerEmail }
          });
          return;
        }
      }

      // Update user with premium status and store the new customer ID
      await updateUserPremiumStatus(userId, stripeCustomerId);
      
      // Track successful business event
      trackBusinessEvent('premium_subscription_started', {
        userId,
        sessionId: session.id,
        customerId: stripeCustomerId,
        amount: session.amount_total,
        currency: session.currency
      });
      
      console.log(`Successfully processed checkout for user ${userId}, customer ${stripeCustomerId}`);
      
    } catch (error) {
      trackError(error as Error, {
        action: 'checkout_completed',
        additionalData: { sessionId: session.id }
      });
      throw error; // Re-throw to maintain error handling
    }
  }
);

async function updateUserPremiumStatus(userId: string, stripeCustomerId: string) {
  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update({
    isPremium: true,
    stripeCustomerId: stripeCustomerId,
    premiumActivatedAt: new Date(),
    subscriptionStatus: 'active',
    premiumTokens: 3  // Grant 3 premium tokens on upgrade
  });
  console.log(`User ${userId} upgraded to premium`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription created:', subscription.id);
    
    // Get userId from metadata or customer
    let userId = subscription.metadata?.userId;
    if (!userId) {
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      userId = customer.metadata?.userId;
    }

    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    const userRef = adminDb.collection('users').doc(userId);
    const isPremiumStatus = subscription.status === 'active' || subscription.status === 'trialing';
    
    // Get current user data to check if they already have tokens
    const userDoc = await userRef.get();
    const currentTokens = userDoc.data()?.premiumTokens || 0;
    
    await userRef.update({
      isPremium: isPremiumStatus,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      premiumActivatedAt: isPremiumStatus ? new Date() : null,
      // Only grant tokens if they don't have any and are becoming premium
      premiumTokens: isPremiumStatus && currentTokens === 0 ? 3 : currentTokens
    });

    console.log(`Subscription ${subscription.id} created for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription updated:', subscription.id);
    
    // Get userId from metadata or customer
    let userId = subscription.metadata?.userId;
    if (!userId) {
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      userId = customer.metadata?.userId;
    }

    if (!userId) {
      // If still no userId, try to find user by subscription ID
      const usersSnapshot = await adminDb.collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        console.error('No user found for subscription:', subscription.id);
        return;
      }
      
      userId = usersSnapshot.docs[0].id;
    }

    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      isPremium: subscription.status === 'active' || subscription.status === 'trialing',
      subscriptionStatus: subscription.status
    });

    console.log(`Subscription ${subscription.id} updated`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

const handleSubscriptionDeleted = withPerformanceTracking(
  'stripe.subscription.deleted',
  async (subscription: Stripe.Subscription) => {
    try {
      logInfo('Processing subscription deleted', { subscriptionId: subscription.id });
      
      // Find user by subscription ID
      const usersSnapshot = await adminDb.collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        trackError(new Error('No user found for deleted subscription'), {
          action: 'subscription_deleted',
          additionalData: { subscriptionId: subscription.id }
        });
        return;
      }
      
      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      
      await userDoc.ref.update({
        isPremium: false,
        subscriptionStatus: 'canceled',
        premiumCanceledAt: new Date(),
        premiumPlan: null,
        premiumTokens: 0 // Reset tokens on cancellation
      });

      // Track business event for churn analysis
      trackBusinessEvent('premium_subscription_canceled', {
        userId,
        subscriptionId: subscription.id,
        canceledAt: new Date(),
        subscriptionCreated: subscription.created
      });

      logInfo('Subscription canceled successfully', { 
        subscriptionId: subscription.id, 
        userId 
      });
      
    } catch (error) {
      trackError(error as Error, {
        action: 'subscription_deleted',
        additionalData: { subscriptionId: subscription.id }
      });
      throw error;
    }
  }
);

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment succeeded:', invoice.id);
    
    if (!invoice.subscription) {
      return; // Not a subscription payment
    }

    // Find user by subscription ID
    const usersSnapshot = await adminDb.collection('users')
      .where('stripeSubscriptionId', '==', invoice.subscription)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('No user found for subscription:', invoice.subscription);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({
      isPremium: true,
      subscriptionStatus: 'active',
      lastPaymentAt: new Date()
    });

    console.log(`Payment succeeded for user ${userDoc.id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment failed:', invoice.id);
    
    if (!invoice.subscription) {
      return; // Not a subscription payment
    }

    // Find user by subscription ID
    const usersSnapshot = await adminDb.collection('users')
      .where('stripeSubscriptionId', '==', invoice.subscription)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('No user found for subscription:', invoice.subscription);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({
      subscriptionStatus: 'past_due',
      lastFailedPaymentAt: new Date()
    });

    console.log(`Payment failed for user ${userDoc.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}