import { auth } from '@/lib/firebase';

export async function createCheckoutSession() {
  try {
    console.log('Starting checkout process...');
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('Not authenticated');
    }

    console.log('Getting Firebase token...');
    const token = await user.getIdToken();
    
    console.log('Sending request to create-checkout endpoint...');
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}) // Add empty body to ensure proper POST request
    });

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    let data;
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      console.error('Checkout error response:', {
        status: response.status,
        data: data
      });
      throw new Error(data.error || `Failed to create checkout session: ${response.status}`);
    }

    if (!data.url) {
      console.error('No checkout URL in response:', data);
      throw new Error('No checkout URL returned');
    }

    console.log('Redirecting to checkout:', data.url);
    window.location.assign(data.url);
  } catch (error) {
    console.error('Checkout error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function createPortalSession() {
  try {
    console.log('Starting portal session creation...');
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('Not authenticated');
    }

    console.log('Getting Firebase token...');
    const token = await user.getIdToken();

    console.log('Sending request to create-portal endpoint...');
    const response = await fetch('/api/stripe/create-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // No need to send token in body since it's in Authorization header
      body: JSON.stringify({}),
    });

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    let data;
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Invalid response format from server: ${responseText}`);
    }

    if (!response.ok) {
      console.error('Portal error response:', {
        status: response.status,
        data: data
      });
      throw new Error(data.error || data.details || `Failed to create portal session: ${response.status}`);
    }

    if (!data.url) {
      console.error('No portal URL in response:', data);
      throw new Error('No portal URL returned');
    }

    console.log('Redirecting to portal:', data.url);
    window.location.assign(data.url);
  } catch (error: any) {
    console.error('Portal error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response // If available from server
    });
    throw new Error(`Portal error: ${error.message}`);
  }
}