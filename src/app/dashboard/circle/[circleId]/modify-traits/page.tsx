'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  standardCircles, 
  getTraitsForCircle,
  getAvailableTraitsForCircle,
  getAlternativeTraitsForCircle,
  getTraitsByIds,
  getAllCategories
} from '@/lib/traits-library';
import { 
  ArrowLeft, 
  Crown,
  Check, 
  X,
  Search,
  Edit3
} from 'lucide-react';
import Link from 'next/link';

interface SelectedTraits {
  [traitId: string]: boolean;
}

export default function ModifyTraitsPage() {
  const { circleId } = useParams();
  const { user } = useAuthContext();
  const router = useRouter();
  
  // State
  const [selectedTraits, setSelectedTraits] = useState<SelectedTraits>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTraits, setCurrentTraits] = useState<string[]>([]);
  
  const circle = standardCircles[circleId as keyof typeof standardCircles];
  const allTraits = getAvailableTraitsForCircle(circleId as string);
  
  // Check if this is a modifiable circle
  const isModifiable = circleId === 'friends' || circleId === 'work' || circleId === 'general';

  useEffect(() => {
    async function loadCurrentTraits() {
      if (!user?.uid || !circle || !isModifiable) {
        router.push('/dashboard');
        return;
      }

      if (!user.isPremium) {
        router.push('/dashboard/premium');
        return;
      }

      try {
        // Load user's custom traits for this circle if they exist
        const customTraitsDoc = await getDoc(doc(db, 'userCircleTraits', `${user.uid}_${circleId}`));
        
        if (customTraitsDoc.exists()) {
          const data = customTraitsDoc.data();
          setCurrentTraits(data.traits || []);
          
          // Set selected traits
          const selected: SelectedTraits = {};
          data.traits.forEach((traitId: string) => {
            selected[traitId] = true;
          });
          setSelectedTraits(selected);
        } else {
          // Use default traits
          const defaultTraits = getTraitsForCircle(circleId as string);
          const traitIds = defaultTraits.map(t => t.id);
          setCurrentTraits(traitIds);
          
          const selected: SelectedTraits = {};
          traitIds.forEach(id => {
            selected[id] = true;
          });
          setSelectedTraits(selected);
        }
      } catch (error) {
        console.error('Error loading traits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentTraits();
  }, [user, circleId, circle, isModifiable, router]);

  const selectedTraitsArray = Object.keys(selectedTraits).filter(id => selectedTraits[id]);
  const selectedTraitObjects = getTraitsByIds(selectedTraitsArray);

  const handleTraitToggle = (traitId: string) => {
    const newSelectedTraits = { ...selectedTraits };
    
    if (newSelectedTraits[traitId]) {
      delete newSelectedTraits[traitId];
    } else {
      // Limit to 5 traits
      if (selectedTraitsArray.length >= 5) {
        return;
      }
      newSelectedTraits[traitId] = true;
    }
    
    setSelectedTraits(newSelectedTraits);
  };

  const filteredTraits = allTraits.filter(trait => {
    const matchesSearch = searchTerm === '' || 
      trait.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trait.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleSaveTraits = async () => {
    if (!user?.uid || selectedTraitsArray.length !== 5) return;
    
    setSaving(true);
    try {
      // Check if user has tokens
      if ((user.premiumTokens || 0) < 1) {
        alert('You need at least 1 token to modify circle traits.');
        return;
      }

      // Save custom traits for this user and circle
      const traitDocRef = doc(db, 'userCircleTraits', `${user.uid}_${circleId}`);
      const existingTraitsDoc = await getDoc(traitDocRef);
      
      if (existingTraitsDoc.exists()) {
        // Update existing traits document
        await updateDoc(traitDocRef, {
          traits: selectedTraitsArray,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new traits document
        await setDoc(traitDocRef, {
          userId: user.uid,
          circleId: circleId,
          traits: selectedTraitsArray,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      
      // Get existing ratings that use the old traits
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('ratedUid', '==', user.uid),
        where('circleId', '==', circleId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      
      // Create a batch for updating ratings
      const batch = writeBatch(db);
      
      // PERSISTENT RATING SYSTEM: Preserve ALL historical trait scores forever
      // This allows users to switch traits and revert back without losing ratings
      ratingsSnapshot.docs.forEach(ratingDoc => {
        const rating = ratingDoc.data();
        const existingScores = rating.scores || {};
        const updatedScores = { ...existingScores }; // Preserve ALL existing scores
        
        // Only add NEW traits that don't have scores yet (initialize with 0)
        selectedTraitsArray.forEach(traitId => {
          if (!updatedScores.hasOwnProperty(traitId)) {
            updatedScores[traitId] = 0; // New trait, needs rating
          }
        });
        
        // Update the rating (preserving all historical scores)
        // Note: Only currently selected traits will be shown/averaged in UI
        batch.update(doc(db, 'ratings', ratingDoc.id), {
          scores: updatedScores,
          updatedAt: serverTimestamp()
        });
      });
      
      // Commit all rating updates
      await batch.commit();

      // Consume token
      await updateDoc(doc(db, 'users', user.uid), {
        premiumTokens: (user.premiumTokens || 0) - 1
      });

      router.push(`/dashboard/circle/${circleId}`);
      
    } catch (error) {
      console.error('Error saving traits:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!circle || !isModifiable) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Circle</h1>
          <p className="text-gray-400 mb-4">This circle cannot be modified.</p>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-8 text-center">
          <Crown className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Premium Feature</h1>
          <p className="text-gray-300 mb-6">Modifying circle traits is available to premium members only.</p>
          <Link
            href="/dashboard/premium"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Premium
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Get suggested alternative traits
  const alternativeTraits = getAlternativeTraitsForCircle(circleId as string);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/circle/${circleId}`}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Edit3 className="h-6 w-6 text-purple-400" />
            Customize {circle.name} Circle
          </h1>
          <p className="text-gray-400">Choose 5 traits that best represent what matters in your {circle.name.toLowerCase()} relationships</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-300">Selection Progress</span>
          <span className="text-sm text-purple-300">{selectedTraitsArray.length}/5 traits selected</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(selectedTraitsArray.length / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Trait Columns */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left Column - Standard Traits */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Standard {circle.name} Traits
          </h3>
          <p className="text-xs text-gray-400 mb-4">Default traits for {circle.name.toLowerCase()} relationships</p>
          
          <div className="space-y-2">
            {getTraitsForCircle(circleId as string).map(trait => {
              const isSelected = selectedTraits[trait.id];
              const canSelect = selectedTraitsArray.length < 5 || isSelected;
              
              return (
                <div 
                  key={trait.id} 
                  onClick={() => canSelect && handleTraitToggle(trait.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : canSelect
                      ? 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-400/40'
                      : 'bg-blue-500/10 border border-blue-500/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${isSelected ? 'text-purple-300' : 'text-blue-300'}`}>
                        {trait.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{trait.description}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : canSelect ? (
                        <div className="w-5 h-5 border-2 border-blue-400 rounded-full hover:border-blue-300 transition-colors"></div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full opacity-30"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Alternative Traits */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            Alternative {circle.name} Traits
          </h3>
          <p className="text-xs text-gray-400 mb-4">Optional traits you can use instead</p>
          
          <div className="space-y-2">
            {alternativeTraits.map(trait => {
              const isSelected = selectedTraits[trait.id];
              const canSelect = selectedTraitsArray.length < 5 || isSelected;
              
              return (
                <div 
                  key={trait.id} 
                  onClick={() => canSelect && handleTraitToggle(trait.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : canSelect
                      ? 'bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-400/40'
                      : 'bg-yellow-500/10 border border-yellow-500/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${isSelected ? 'text-purple-300' : 'text-yellow-300'}`}>
                        {trait.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{trait.description}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : canSelect ? (
                        <div className="w-5 h-5 border-2 border-yellow-400 rounded-full hover:border-yellow-300 transition-colors"></div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full opacity-30"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {alternativeTraits.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No alternative traits available for this circle</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Area Below */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Selected Traits */}
        <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            Your New Selection ({selectedTraitsArray.length}/5)
          </h3>
          
          {selectedTraitsArray.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm italic">Select 5 traits from the columns above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {selectedTraitObjects.map((trait, index) => (
                <div
                  key={trait.id}
                  className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-purple-300 text-sm">{trait.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-7">{trait.description}</p>
                  </div>
                  <button
                    onClick={() => handleTraitToggle(trait.id)}
                    className="text-purple-400 hover:text-red-400 transition-colors p-1 rounded"
                    title="Remove trait"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {/* Remaining slots */}
              {Array.from({ length: 5 - selectedTraitsArray.length }).map((_, index) => (
                <div key={index} className="border-2 border-dashed border-gray-600 rounded-lg p-3 flex items-center gap-2">
                  <span className="w-5 h-5 border border-gray-600 text-gray-600 text-xs rounded-full flex items-center justify-center">
                    {selectedTraitsArray.length + index + 1}
                  </span>
                  <span className="text-gray-500 text-sm italic">Select a trait</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Cost & Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white text-sm">Cost: 1 Token</h4>
                <p className="text-xs text-gray-400">You have {user?.premiumTokens || 0} tokens</p>
              </div>
              <Crown className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="font-semibold text-blue-300 text-sm mb-2">How it works:</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Choose exactly 5 traits</li>
              <li>• Mix standard and alternative traits</li>
              <li>• <strong className="text-green-300">All ratings are preserved forever</strong></li>
              <li>• Switch back anytime - old scores return</li>
              <li>• New traits start with 0 scores</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8">
        <Link
          href={`/dashboard/circle/${circleId}`}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Circle
        </Link>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedTraits({});
              setSearchTerm('');
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Clear Selection
          </button>
          
          <button
            onClick={handleSaveTraits}
            disabled={saving || selectedTraitsArray.length !== 5 || (user?.premiumTokens || 0) < 1}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save New Traits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
