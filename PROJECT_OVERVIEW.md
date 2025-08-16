# MirrorNetPro - Project Overview & Documentation

## 🎯 Project Summary

MirrorNetPro is a **social feedback and rating platform** where users create circles of relationships (Friends, Work, General, Family) and rate each other on personality traits. The platform includes premium features, self-assessments, and advanced rating capabilities.

## 🏗️ Architecture & Tech Stack

### **Frontend**
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons

### **Backend & Database**
- **Firebase/Firestore** for real-time database
- **Firebase Authentication** for user management
- **Firestore Security Rules** (user-based access control)

### **Key Dependencies**
- `next`: 15.4.6
- `react`: 18.x
- `firebase`: 10.x
- `tailwindcss`: 3.x
- `lucide-react`: Latest

## 🔑 Core Concepts

### **User Types**
- **Standard Users**: Can create 3 standard circles, rate circle members, take self-assessments
- **Premium Users**: All standard features + 3 premium tokens, trait customization, identity revelation, attraction ratings, family goals

### **Circle Types**

#### **Standard Circles** (Available to All Users)
1. **Friends** 👥 - Rate close friends on personality traits
2. **Work** 💼 - Professional feedback from colleagues  
3. **General** 🌐 - General impressions from broader network

#### **Assessment Circles** (Self-Assessment Only)
4. **Family** ❤️ - Self-assessment + premium users can create relationship goals
5. **Eco Rating** 🌱 - Environmental consciousness self-assessment

#### **Premium Circles**
6. **Attraction** ✨ - Premium-only romantic interest ratings (anonymous by default)

### **Key Features**

#### **Rating System**
- **5-trait rating** per circle (1-10 scale)
- **Anonymous by default** across all circles
- **Monthly performance tracking** with graphs
- **Real-time updates** via Firestore listeners

#### **Premium Features**
- **Trait Customization**: Modify standard circle traits (1 token cost)
- **Premium Tokens**: 3 tokens given on premium upgrade
- **Identity Revelation**: Reveal identity when rating in Attraction circle
- **Rate Anyone**: Rate any app user in Attraction (token cost)
- **Family Goals**: Create 30-day relationship improvement goals

#### **Self-Assessments**
- **Eco Assessment**: 15 questions across 5 eco traits
- **Family Assessment**: 15 questions across 5 family traits
- **Persistent scores** displayed on dashboard

## 📊 Database Schema

### **Core Collections**

#### **users**
```typescript
{
  uid: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  isPremium: boolean
  premiumTokens: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: string
  premiumActivatedAt?: Date
  premiumCanceledAt?: Date
  lastPaymentAt?: Date
  lastFailedPaymentAt?: Date
  createdAt: Date
  ecoAssessment?: { traitScores, overallScore, completedAt }
  familyAssessment?: { traitScores, overallScore, completedAt }
}
```

#### **userCircles** (Member Relationships)
```typescript
{
  ownerUid: string      // Circle owner
  memberUid: string     // Circle member
  circleId: string      // 'friends', 'work', 'general', 'family'
  status: string        // 'active', 'pending', 'removed'
  createdAt: Date
}
```

#### **ratings**
```typescript
{
  raterUid: string
  ratedUid: string
  circleId: string
  scores: Record<string, number>  // traitId -> score (1-10)
  isAnonymous: boolean
  createdAt: Date
}
```

#### **userCircleTraits** (Premium Trait Customization)
```typescript
{
  userId: string
  circleId: string
  traits: string[]      // Array of 5 trait IDs
  createdAt: Date
  updatedAt: Date
}
```

#### **familyGoals** (Premium Family Features)
```typescript
{
  title: string
  description: string
  createdBy: string
  participants: string[]
  status: 'pending' | 'active' | 'completed'
  createdAt: Date
  targetDate: Date
  tips: string[]
}
```

#### **notifications**
```typescript
{
  type: 'invitation' | 'reveal_request' | 'family_goal'
  fromUid: string
  toUid: string
  read: boolean
  createdAt: Date
  // Additional fields based on type
}
```

## 🎨 UI/UX Patterns

### **Design System**
- **Dark theme** with gray/purple color scheme
- **Gradient accents** for premium features
- **Card-based layout** for all major components
- **Consistent spacing** using Tailwind utilities

### **Navigation**
- **Sidebar navigation** with circle icons
- **Breadcrumb patterns** for deep navigation
- **Premium badges** next to user names
- **Real-time notification popup**

### **Key Components**
- `<Avatar>` - Reusable avatar with placeholder fallback
- `<PremiumBadge>` - Crown icon for premium users
- `<RatingCard>` - Dashboard circle summary cards
- `<NotificationPopup>` - Toast-style notifications

## 🔒 Security & Access Control

### **Firestore Rules Patterns**
```javascript
// Users can only access their own data
allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;

// Circle members can rate each other
allow read: if request.auth.uid in resource.data.memberUids;

// Premium-only collections
allow write: if getUserData().isPremium == true;
```

### **Authentication Guards**
- **Client-side route protection** in layout components
- **Premium feature guards** throughout the application
- **Token validation** before premium actions

## 🚀 Key Features Implementation

### **Real-time Updates**
```typescript
// Dashboard stats with live member count updates
const unsubscribe = onSnapshot(membersQuery, () => {
  loadStats(); // Reload when members change
});
```

### **Trait Customization System**
```typescript
// Premium users can modify standard circle traits
// Preserves existing rating scores for unchanged traits
// Initializes new traits with score of 0
const batch = writeBatch(db);
ratings.forEach(rating => {
  const newScores = preserveExistingScores(rating.scores, newTraits);
  batch.update(ratingRef, { scores: newScores });
});
```

### **Search & Discovery**
```typescript
// Live search with debouncing
// Pagination support for large result sets
// Pre-selection of circle types via URL params
```

## 📱 Page Structure

### **Public Pages**
- `/` - Landing page with auth redirect

### **Dashboard Pages**
- `/dashboard` - Main dashboard with circle cards
- `/dashboard/search` - User search and invitation system
- `/dashboard/notifications` - Unified notification center
- `/dashboard/premium` - Premium subscription page
- `/dashboard/settings` - Testing/development utilities

### **Circle Management**
- `/dashboard/circle/[circleId]` - Circle details with member list
- `/dashboard/circle/[circleId]/modify-traits` - Premium trait customization
- `/dashboard/circle/family` - Special family circle page with goals

### **Rating System**
- `/dashboard/rate/[circleId]` - Member selection for rating
- `/dashboard/rate/[circleId]/[memberId]` - Actual rating interface
- `/dashboard/rate/attraction` - Special attraction rating page
- `/dashboard/rate/attraction/[memberId]` - Attraction rating form

### **Assessments**
- `/dashboard/eco-assessment` - Eco rating self-assessment
- `/dashboard/family-assessment` - Family self-assessment
- `/dashboard/attraction` - Premium attraction ratings view

## ⚙️ Configuration Files

### **Key Config Files**
- `tailwind.config.js` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration
- `firebase.config.js` - Firebase project configuration
- `tsconfig.json` - TypeScript configuration

### **Environment Variables**
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🎯 User Flows

### **Standard User Journey**
1. **Sign Up/Login** → Firebase Auth
2. **Dashboard** → See empty circle cards
3. **Search Users** → Find and invite friends to circles
4. **Rate Members** → Provide feedback on 5 traits per circle
5. **View Stats** → See aggregated scores and performance
6. **Take Assessments** → Complete Eco/Family self-assessments

### **Premium User Journey**
1. **Go Premium** → 30-day trial, €3.99/month
2. **Receive 3 Tokens** → Use for premium features
3. **Customize Traits** → Modify circle traits (1 token)
4. **Attraction Features** → Rate anyone, reveal identity
5. **Family Goals** → Create relationship improvement goals

## 🔧 Development Notes

### **Recent Major Changes**
1. **Removed Custom Circles** - Simplified to standard circles only
2. **Enhanced Trait Customization** - Premium users can modify standard circle traits
3. **Improved Member Counting** - Consistent across all pages
4. **Redesigned UI** - More user-friendly trait modification interface
5. **Added Avatar System** - Placeholder support for users without profile pictures
6. **Stripe Payment Integration** - Full subscription system with webhooks

### **Stripe Development Setup**

#### **Local Development Workflow**
1. **Start Next.js**: `npm run dev` (runs on http://localhost:3000)
2. **Start ngrok**: `ngrok http 3000` (creates public HTTPS tunnel)
3. **Update Stripe webhook URL** with new ngrok URL when ngrok restarts
4. **Test payments** using Stripe test cards

#### **ngrok Configuration**
- **Purpose**: Creates public HTTPS endpoint for Stripe webhooks during development
- **URL Pattern**: `https://[random].ngrok-free.app`
- **Important**: ngrok URL changes each restart, requiring webhook URL update in Stripe
- **Free Plan Limitation**: Only 1 simultaneous session allowed

#### **Stripe Webhook Setup**
```bash
# Webhook endpoint (update with current ngrok URL)
https://[ngrok-url].ngrok-free.app/api/stripe/webhook

# Required webhook events:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

#### **Key Files Created**
- `src/lib/stripe.ts` - Stripe SDK configuration
- `src/lib/firebase-admin.ts` - Server-side Firebase Admin SDK
- `src/app/api/stripe/create-checkout/route.ts` - Checkout session creation
- `src/app/api/stripe/webhook/route.ts` - Webhook event handling
- `src/app/dashboard/premium/actions.ts` - Client-side checkout action
- `src/config/serviceAccount.json` - Firebase Admin credentials

#### **Development Workflow Issues & Solutions**
- **Port conflicts**: Kill all node processes if Next.js can't start on port 3000
- **ngrok session limits**: Only one free session allowed, kill existing before restart
- **Webhook URL updates**: Must update Stripe webhook endpoint when ngrok restarts
- **Environment variables**: Restart dev server after adding new env vars
- **Trial subscriptions**: Webhook handles both "active" and "trialing" status as premium

### **Known Technical Debt**
- Some traits library still contains unused custom circle categories
- Console logging can be cleaned up in production
- Some Firestore indexes may need optimization

### **Testing Considerations**
- Premium status toggle in `/dashboard/settings` for development
- Token reset functionality for testing premium features
- Real-time listener cleanup important for performance
- **Stripe Test Cards**: Use `4242 4242 4242 4242` for successful payments

## 📞 API Integration Points

### **Implemented Integrations**
- **Stripe** for payment processing (premium subscriptions) ✅
  - Custom Stripe integration with checkout sessions
  - Webhook handling for subscription events
  - 30-day free trial with €3.99/month pricing
  - Automatic user premium status updates
  - **Development Setup**: Uses ngrok for webhook testing (see Development Notes)

### **Planned Integrations**
- **Email services** for notifications (optional)
- **Push notifications** for mobile (future consideration)

### **Current External Dependencies**
- **Firebase services** (Auth, Firestore, Storage)
- **Stripe API** (checkout, subscriptions, webhooks)
- **Next.js API routes** (Stripe integration)

## 🚨 Important Implementation Details

### **Memory Management**
```typescript
// Always clean up Firestore listeners
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  return () => unsubscribe();
}, []);
```

### **State Management**
- **AuthContext** for user authentication state
- **NotificationContext** for real-time notifications
- **Local state** with useState/useEffect patterns

### **Error Handling**
- **Try-catch blocks** around all Firestore operations
- **User-friendly error messages** with fallback states
- **Loading states** for all async operations

## 📋 Future Roadmap

### **Immediate Priorities**
1. **Stripe Customer Portal** for subscription management
2. **Mobile Responsiveness** improvements
3. **Performance Optimization** for large datasets
4. **Email Notifications** system

### **Feature Enhancements**
1. **Advanced Analytics** for circle performance
2. **Goal Tracking** expansion beyond family
3. **Social Features** like circle recommendations
4. **API Development** for third-party integrations

---

## 🤝 Handoff Notes

This project is production-ready with a solid foundation. The architecture is scalable, the UI is polished, and the core features are fully functional. The codebase follows React/Next.js best practices with TypeScript for type safety.

**Key areas for continued development:**
- Payment integration (Stripe)
- Mobile app development
- Advanced analytics
- Performance optimization for scale

The database schema is well-designed and the real-time features work reliably. The premium system is implemented and ready for monetization once payment processing is integrated.
