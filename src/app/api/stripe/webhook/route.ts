import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import serviceAccount from '@/config/serviceAccount.json';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
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
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    // Handle the event
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout completed:', session.id);
    
    // Get userId from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId found in session metadata');
      // Try to get user by customer ID
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (customer.metadata?.userId) {
        await updateUserPremiumStatus(customer.metadata.userId, session.customer as string, session.subscription as string);
      } else {
        console.error('No userId found in customer metadata');
      }
      return;
    }

    await updateUserPremiumStatus(userId, session.customer as string, session.subscription as string);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function updateUserPremiumStatus(userId: string, stripeCustomerId: string, subscriptionId: string) {
  console.log(`Updating premium status for user ${userId}`);
  console.log(`Customer ID: ${stripeCustomerId}`);
  console.log(`Subscription ID: ${subscriptionId}`);

  const userRef = db.collection('users').doc(userId);
  
  try {
    await userRef.update({
      isPremium: true,
      stripeCustomerId: stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
      premiumActivatedAt: new Date(),
      subscriptionStatus: 'active',
      premiumTokens: 3,  // Grant 3 premium tokens on upgrade
      premiumPlan: 'monthly_trial'
    });
    console.log(`Successfully updated user ${userId} to premium status`);
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error; // Re-throw to ensure the error is logged in the webhook handler
  }
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

    const userRef = db.collection('users').doc(userId);
    const isPremiumStatus = subscription.status === 'active' || subscription.status === 'trialing';
    
    // Get current user data to check if they already have tokens
    const userDoc = await userRef.get();
    const currentTokens = userDoc.data()?.premiumTokens || 0;
    
    await userRef.update({
      isPremium: isPremiumStatus,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      premiumActivatedAt: isPremiumStatus ? new Date() : null,
      premiumTokens: isPremiumStatus && currentTokens === 0 ? 3 : currentTokens,
      premiumPlan: subscription.items.data[0]?.price?.nickname || 'monthly_trial'
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
      const usersSnapshot = await db.collection('users')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        console.error('No user found for subscription:', subscription.id);
        return;
      }
      
      userId = usersSnapshot.docs[0].id;
    }

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      isPremium: subscription.status === 'active' || subscription.status === 'trialing',
      subscriptionStatus: subscription.status,
      premiumPlan: subscription.items.data[0]?.price?.nickname || 'monthly_trial'
    });

    console.log(`Subscription ${subscription.id} updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription deleted:', subscription.id);
    
    // Find user by subscription ID
    const usersSnapshot = await db.collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('No user found for deleted subscription:', subscription.id);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({
      isPremium: false,
      subscriptionStatus: 'canceled',
      premiumCanceledAt: new Date()
    });

    console.log(`Subscription ${subscription.id} canceled for user ${userDoc.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing payment succeeded:', invoice.id);
    
    if (!invoice.subscription) {
      return; // Not a subscription payment
    }

    // Find user by subscription ID
    const usersSnapshot = await db.collection('users')
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
    const usersSnapshot = await db.collection('users')
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