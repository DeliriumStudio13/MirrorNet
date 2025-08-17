// Complete database wipe for production cleanup
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// All collections to delete
const COLLECTIONS_TO_DELETE = [
  'users',
  'ratings', 
  'userCircles',
  'userCircleTraits',
  'invitations',
  'revealRequests', 
  'familyGoals',
  'notifications',
  'customCircles',
  'customCircleMemberships',
  'assessments'
];

async function deleteCollection(collectionName) {
  console.log(`🗑️ Deleting ${collectionName} collection...`);
  
  const collectionRef = db.collection(collectionName);
  const batchSize = 500; // Firestore batch limit
  
  let query = collectionRef.limit(batchSize);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      break;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    totalDeleted += snapshot.docs.length;
    console.log(`  Deleted ${totalDeleted} documents from ${collectionName}`);
  }
  
  console.log(`✅ Finished deleting ${collectionName} (${totalDeleted} total documents)`);
}

async function deleteAllUsers() {
  console.log('🗑️ Deleting all users from Authentication...');
  
  let totalDeleted = 0;
  
  while (true) {
    const listResult = await auth.listUsers(1000);
    
    if (listResult.users.length === 0) {
      break;
    }
    
    const uids = listResult.users.map(user => user.uid);
    await auth.deleteUsers(uids);
    
    totalDeleted += uids.length;
    console.log(`  Deleted ${totalDeleted} users from Authentication`);
  }
  
  console.log(`✅ Finished deleting all users (${totalDeleted} total)`);
}

async function wipeDatabase() {
  console.log('🚨 COMPLETE DATABASE WIPE - PREPARING FOR PRODUCTION');
  console.log('⚠️ This will delete ALL data. Cannot be undone!');
  console.log('Press Ctrl+C to cancel, or wait 15 seconds to proceed...\n');
  
  // Wait 15 seconds
  for (let i = 15; i > 0; i--) {
    process.stdout.write(`\rCountdown: ${i} seconds... `);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n\n🧹 Starting complete wipe...\n');
  
  try {
    // Delete all Firestore collections
    for (const collection of COLLECTIONS_TO_DELETE) {
      await deleteCollection(collection);
    }
    
    // Delete all Authentication users
    await deleteAllUsers();
    
    console.log('\n🎉 DATABASE COMPLETELY WIPED!');
    console.log('✅ Ready for production deployment');
    console.log('📝 Remember to:');
    console.log('   - Deploy your production code');
    console.log('   - Update environment variables');
    console.log('   - Test user registration flow');
    
  } catch (error) {
    console.error('❌ Error during wipe:', error);
  }
}

// Run the wipe
wipeDatabase().catch(console.error);

module.exports = { wipeDatabase };

