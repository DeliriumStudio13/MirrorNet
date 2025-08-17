// Production cleanup script for test users
const admin = require('firebase-admin');

// Initialize Firebase Admin (make sure you have service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'mirrornet-xoott',
      // Add your service account credentials here
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Test user patterns to identify and delete
const TEST_PATTERNS = [
  'test',
  'test1', 
  'test2',
  'demo',
  'example',
  'sample',
  // Add more patterns as needed
];

async function findTestUsers() {
  console.log('🔍 Finding test users...');
  
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const testUsers = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Check if user matches test patterns
      const isTestUser = TEST_PATTERNS.some(pattern => {
        const firstName = userData.firstName?.toLowerCase() || '';
        const lastName = userData.lastName?.toLowerCase() || '';
        const email = userData.email?.toLowerCase() || '';
        
        return firstName.includes(pattern) || 
               lastName.includes(pattern) || 
               email.includes(pattern);
      });
      
      if (isTestUser) {
        testUsers.push({
          uid: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        });
      }
    });
    
    console.log(`📋 Found ${testUsers.length} test users:`);
    testUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    return testUsers;
  } catch (error) {
    console.error('❌ Error finding test users:', error);
    return [];
  }
}

async function deleteUserData(uid) {
  console.log(`🗑️ Deleting data for user ${uid}...`);
  
  const batch = db.batch();
  
  try {
    // 1. Delete user document
    batch.delete(db.collection('users').doc(uid));
    
    // 2. Delete ratings where user is rater
    const raterRatings = await db.collection('ratings')
      .where('raterUid', '==', uid)
      .get();
    raterRatings.forEach(doc => batch.delete(doc.ref));
    
    // 3. Delete ratings where user is rated
    const ratedRatings = await db.collection('ratings')
      .where('ratedUid', '==', uid)
      .get();
    ratedRatings.forEach(doc => batch.delete(doc.ref));
    
    // 4. Delete user circles where user is owner
    const ownerCircles = await db.collection('userCircles')
      .where('ownerUid', '==', uid)
      .get();
    ownerCircles.forEach(doc => batch.delete(doc.ref));
    
    // 5. Delete user circles where user is member
    const memberCircles = await db.collection('userCircles')
      .where('memberUid', '==', uid)
      .get();
    memberCircles.forEach(doc => batch.delete(doc.ref));
    
    // 6. Delete invitations from user
    const fromInvitations = await db.collection('invitations')
      .where('fromUid', '==', uid)
      .get();
    fromInvitations.forEach(doc => batch.delete(doc.ref));
    
    // 7. Delete invitations to user
    const toInvitations = await db.collection('invitations')
      .where('toUid', '==', uid)
      .get();
    toInvitations.forEach(doc => batch.delete(doc.ref));
    
    // 8. Delete reveal requests from user
    const fromRevealRequests = await db.collection('revealRequests')
      .where('fromUid', '==', uid)
      .get();
    fromRevealRequests.forEach(doc => batch.delete(doc.ref));
    
    // 9. Delete reveal requests to user
    const toRevealRequests = await db.collection('revealRequests')
      .where('toUid', '==', uid)
      .get();
    toRevealRequests.forEach(doc => batch.delete(doc.ref));
    
    // 10. Delete custom circles created by user
    const customCircles = await db.collection('customCircles')
      .where('ownerUid', '==', uid)
      .get();
    customCircles.forEach(doc => batch.delete(doc.ref));
    
    // 11. Delete custom circle memberships
    const customMemberships = await db.collection('customCircleMemberships')
      .where('memberUid', '==', uid)
      .get();
    customMemberships.forEach(doc => batch.delete(doc.ref));
    
    // 12. Delete family goals
    const familyGoals = await db.collection('familyGoals')
      .where('createdBy', '==', uid)
      .get();
    familyGoals.forEach(doc => batch.delete(doc.ref));
    
    // 13. Delete notifications
    const notifications = await db.collection('notifications')
      .where('toUid', '==', uid)
      .get();
    notifications.forEach(doc => batch.delete(doc.ref));
    
    const notificationsFrom = await db.collection('notifications')
      .where('fromUid', '==', uid)
      .get();
    notificationsFrom.forEach(doc => batch.delete(doc.ref));
    
    // 14. Delete assessments
    const assessments = await db.collection('assessments')
      .where('userId', '==', uid)
      .get();
    assessments.forEach(doc => batch.delete(doc.ref));
    
    // Commit all deletions
    await batch.commit();
    
    // 15. Delete from Firebase Auth
    await auth.deleteUser(uid);
    
    console.log(`✅ Successfully deleted user ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting user ${uid}:`, error);
    return false;
  }
}

async function cleanupTestUsers() {
  console.log('🧹 Starting test user cleanup...');
  
  const testUsers = await findTestUsers();
  
  if (testUsers.length === 0) {
    console.log('✅ No test users found. Database is clean!');
    return;
  }
  
  console.log(`⚠️ About to delete ${testUsers.length} test users. This cannot be undone!`);
  console.log('Press Ctrl+C to cancel, or wait 10 seconds to proceed...');
  
  // Wait 10 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  let deletedCount = 0;
  
  for (const user of testUsers) {
    const success = await deleteUserData(user.uid);
    if (success) {
      deletedCount++;
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount}/${testUsers.length} test users.`);
}

// Run the cleanup
cleanupTestUsers().catch(console.error);

module.exports = { findTestUsers, deleteUserData, cleanupTestUsers };

