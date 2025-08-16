'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight, Check, RotateCcw, TrendingUp, Crown, Users } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface Question {
  id: string;
  text: string;
  trait: string;
  answers: {
    text: string;
    score: number;
  }[];
}

interface FamilyResult {
  overallScore: number;
  traitScores: Record<string, number>;
  completedAt: Date;
  answers: Record<string, number>;
}

const familyQuestions: Question[] = [
  // Caring Questions (3 questions)
  {
    id: 'caring_1',
    trait: 'caring',
    text: 'How often do you show genuine concern for your family members\' wellbeing?',
    answers: [
      { text: 'Rarely think about their needs', score: 1 },
      { text: 'Sometimes show concern when asked', score: 3 },
      { text: 'Often check in on family members', score: 6 },
      { text: 'Regularly show care and concern', score: 8 },
      { text: 'Always prioritize their wellbeing', score: 10 }
    ]
  },
  {
    id: 'caring_2', 
    trait: 'caring',
    text: 'When a family member is going through a difficult time, how do you respond?',
    answers: [
      { text: 'I prefer to stay out of their problems', score: 1 },
      { text: 'I offer help only if they ask directly', score: 4 },
      { text: 'I check in and offer basic support', score: 6 },
      { text: 'I actively help and provide emotional support', score: 8 },
      { text: 'I drop everything to be there for them', score: 10 }
    ]
  },
  {
    id: 'caring_3',
    trait: 'caring',
    text: 'How do you express care and affection to your family?',
    answers: [
      { text: 'I rarely express affection openly', score: 1 },
      { text: 'I show care mainly through actions, not words', score: 4 },
      { text: 'I express care when the moment feels right', score: 6 },
      { text: 'I regularly tell them I care about them', score: 8 },
      { text: 'I constantly show love through words and actions', score: 10 }
    ]
  },

  // Respectful Questions (3 questions)
  {
    id: 'respectful_1',
    trait: 'respectfulFamily',
    text: 'How do you handle disagreements with family members?',
    answers: [
      { text: 'I often raise my voice or interrupt them', score: 1 },
      { text: 'I sometimes get defensive or dismissive', score: 3 },
      { text: 'I try to stay calm but sometimes slip', score: 6 },
      { text: 'I usually listen and respond respectfully', score: 8 },
      { text: 'I always listen carefully and speak kindly', score: 10 }
    ]
  },
  {
    id: 'respectful_2',
    trait: 'respectfulFamily',
    text: 'Do you respect your family members\' personal boundaries and privacy?',
    answers: [
      { text: 'I often invade their privacy or ignore boundaries', score: 1 },
      { text: 'I sometimes cross boundaries without thinking', score: 3 },
      { text: 'I usually respect boundaries but occasionally slip', score: 5 },
      { text: 'I consistently respect their personal space', score: 8 },
      { text: 'I always honor their boundaries and privacy', score: 10 }
    ]
  },
  {
    id: 'respectful_3',
    trait: 'respectfulFamily',
    text: 'How do you treat family members\' opinions and decisions?',
    answers: [
      { text: 'I often dismiss or criticize their views', score: 1 },
      { text: 'I sometimes judge their choices openly', score: 3 },
      { text: 'I try to be understanding but sometimes judge', score: 5 },
      { text: 'I usually respect their right to different opinions', score: 8 },
      { text: 'I always honor their autonomy and choices', score: 10 }
    ]
  },

  // Dependable Questions (3 questions)
  {
    id: 'dependable_1',
    trait: 'dependableFamily',
    text: 'When you make promises or commitments to family, how often do you follow through?',
    answers: [
      { text: 'I often forget or change my mind', score: 1 },
      { text: 'I follow through about half the time', score: 3 },
      { text: 'I usually keep my word but sometimes fail', score: 6 },
      { text: 'I almost always follow through on commitments', score: 8 },
      { text: 'I never make promises I can\'t keep', score: 10 }
    ]
  },
  {
    id: 'dependable_2',
    trait: 'dependableFamily',
    text: 'How reliable are you when family members need your help?',
    answers: [
      { text: 'I\'m often unavailable or unreliable', score: 1 },
      { text: 'I help when it\'s convenient for me', score: 3 },
      { text: 'I try to help but sometimes let them down', score: 5 },
      { text: 'I\'m usually there when they need me', score: 8 },
      { text: 'I\'m always available and reliable for family', score: 10 }
    ]
  },
  {
    id: 'dependable_3',
    trait: 'dependableFamily',
    text: 'Do you maintain consistency in your relationships with family members?',
    answers: [
      { text: 'My mood often affects how I treat them', score: 1 },
      { text: 'I\'m sometimes unpredictable in my behavior', score: 3 },
      { text: 'I try to be consistent but have ups and downs', score: 5 },
      { text: 'I maintain steady, reliable relationships', score: 8 },
      { text: 'I\'m consistently loving and supportive', score: 10 }
    ]
  },

  // Loving Questions (3 questions)
  {
    id: 'loving_1',
    trait: 'loving',
    text: 'How openly do you express love to your family members?',
    answers: [
      { text: 'I rarely say "I love you" or show affection', score: 1 },
      { text: 'I express love occasionally, usually on special occasions', score: 3 },
      { text: 'I show love regularly but not daily', score: 6 },
      { text: 'I express love frequently through words and actions', score: 8 },
      { text: 'I tell them I love them every chance I get', score: 10 }
    ]
  },
  {
    id: 'loving_2',
    trait: 'loving',
    text: 'How do you make family members feel valued and cherished?',
    answers: [
      { text: 'I rarely make special efforts to show they matter', score: 1 },
      { text: 'I occasionally do something special for them', score: 3 },
      { text: 'I sometimes go out of my way to show I care', score: 6 },
      { text: 'I regularly make them feel special and valued', score: 8 },
      { text: 'I constantly show them how much they mean to me', score: 10 }
    ]
  },
  {
    id: 'loving_3',
    trait: 'loving',
    text: 'How do you handle moments of conflict while maintaining love?',
    answers: [
      { text: 'Conflicts often damage my feelings toward them', score: 1 },
      { text: 'I sometimes withhold affection when upset', score: 3 },
      { text: 'I try to separate issues from my love for them', score: 6 },
      { text: 'I consistently show love even during disagreements', score: 8 },
      { text: 'My love for them never wavers, regardless of conflicts', score: 10 }
    ]
  },

  // Protective Questions (3 questions)
  {
    id: 'protective_1',
    trait: 'protective',
    text: 'How do you stand up for your family members when they\'re being criticized or attacked?',
    answers: [
      { text: 'I rarely defend them or get involved', score: 1 },
      { text: 'I sometimes support them if it\'s not too difficult', score: 3 },
      { text: 'I usually defend them when I\'m present', score: 6 },
      { text: 'I consistently stand up for family members', score: 8 },
      { text: 'I always fiercely defend and protect my family', score: 10 }
    ]
  },
  {
    id: 'protective_2',
    trait: 'protective',
    text: 'How do you help keep your family members safe from harm or bad influences?',
    answers: [
      { text: 'I don\'t really monitor or worry about their safety', score: 1 },
      { text: 'I occasionally warn them about obvious dangers', score: 3 },
      { text: 'I try to guide them away from harmful situations', score: 6 },
      { text: 'I actively work to shield them from negative influences', score: 8 },
      { text: 'I constantly watch out for their physical and emotional safety', score: 10 }
    ]
  },
  {
    id: 'protective_3',
    trait: 'protective',
    text: 'How do you support family members\' emotional and mental wellbeing?',
    answers: [
      { text: 'I don\'t really pay attention to their emotional state', score: 1 },
      { text: 'I notice when they\'re upset but don\'t always act', score: 3 },
      { text: 'I try to help when I see they\'re struggling', score: 6 },
      { text: 'I actively monitor and support their mental health', score: 8 },
      { text: 'I\'m always vigilant about protecting their emotional wellbeing', score: 10 }
    ]
  }
];

export default function FamilyAssessmentPage() {
  const { user } = useAuthContext();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<FamilyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingResult, setExistingResult] = useState<FamilyResult | null>(null);

  useEffect(() => {
    // Check if user has existing family assessment
    async function checkExistingAssessment() {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.familyAssessment) {
            setExistingResult(userData.familyAssessment);
          }
        }
      } catch (error) {
        console.error('Error checking existing assessment:', error);
      }
    }

    checkExistingAssessment();
  }, [user?.uid]);

  const handleAnswer = (score: number) => {
    const questionId = familyQuestions[currentQuestion].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: score
    }));

    if (currentQuestion < familyQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Assessment complete
      calculateResults();
    }
  };

  const calculateResults = async () => {
    setLoading(true);
    
    // Calculate trait scores
    const traitScores: Record<string, number> = {};
    const traitQuestionCounts: Record<string, number> = {};
    
    // Initialize trait totals
    ['caring', 'respectfulFamily', 'dependableFamily', 'loving', 'protective'].forEach(trait => {
      traitScores[trait] = 0;
      traitQuestionCounts[trait] = 0;
    });

    // Sum scores by trait
    familyQuestions.forEach(question => {
      const answerScore = answers[question.id] || 0;
      traitScores[question.trait] += answerScore;
      traitQuestionCounts[question.trait]++;
    });

    // Calculate averages
    Object.keys(traitScores).forEach(trait => {
      traitScores[trait] = traitScores[trait] / traitQuestionCounts[trait];
    });

    // Calculate overall score
    const overallScore = Object.values(traitScores).reduce((sum, score) => sum + score, 0) / Object.keys(traitScores).length;

    const result: FamilyResult = {
      overallScore: Number(overallScore.toFixed(1)),
      traitScores: Object.fromEntries(
        Object.entries(traitScores).map(([trait, score]) => [trait, Number(score.toFixed(1))])
      ),
      completedAt: new Date(),
      answers
    };

    setResult(result);
    setIsComplete(true);

    // Save to database
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          familyAssessment: result,
          familyAssessmentUpdatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving family assessment:', error);
      }
    }

    setLoading(false);
  };

  const restartAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    setResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-400';
    if (score < 7) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getScoreLabel = (score: number) => {
    if (score < 3) return 'Needs Attention';
    if (score < 5) return 'Room for Growth';
    if (score < 7) return 'Good Foundation';
    if (score < 9) return 'Strong Relationships';
    return 'Exceptional Family Bond';
  };

  const progressPercentage = ((currentQuestion + 1) / familyQuestions.length) * 100;
  const currentQ = familyQuestions[currentQuestion];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Calculating your family relationship rating...</p>
        </div>
      </div>
    );
  }

  if (isComplete && result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors block mb-4"
          >
            ← Back to Dashboard
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Family Assessment Complete!</h1>
          <p className="text-gray-400">Here are your family relationship results</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Your Family Rating</h2>
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.overallScore)}`}>
            {result.overallScore}
          </div>
          <div className="text-lg text-gray-300 mb-4">{getScoreLabel(result.overallScore)}</div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                result.overallScore < 4 
                  ? 'bg-gradient-to-r from-red-600 to-red-400'
                  : result.overallScore < 7
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                    : 'bg-gradient-to-r from-green-600 to-green-400'
              }`}
              style={{ width: `${(result.overallScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm">
            Completed on {formatDate(result.completedAt)}
          </p>
        </div>

        {/* Trait Breakdown */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Trait Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(result.traitScores).map(([trait, score]) => {
              const traitNames: Record<string, string> = {
                caring: 'Caring',
                respectfulFamily: 'Respectful', 
                dependableFamily: 'Dependable',
                loving: 'Loving',
                protective: 'Protective'
              };
              
              return (
                <div key={trait} className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${getScoreColor(score)}`}>
                    {score}
                  </div>
                  <div className="text-white text-sm font-medium mb-2">{traitNames[trait]}</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${
                        score < 4 
                          ? 'bg-red-400'
                          : score < 7
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                      }`}
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Goals CTA */}
        {user?.isPremium && (
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Crown className="h-8 w-8 text-purple-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Premium Feature: Relationship Goals</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Invite a family member to work together on a 30-day relationship improvement goal. 
                  Get actionable tips and track progress together!
                </p>
                <Link 
                  href="/dashboard/family-goals"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Start Family Goal
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={restartAssessment}
            className="flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Assessment
          </button>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            View Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors block mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            Family Assessment
          </h1>
          <p className="text-gray-400 mt-2">
            Reflect on your family relationships honestly
          </p>
        </div>
      </div>

      {/* Existing Assessment Notice */}
      {existingResult && !isComplete && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-300 text-sm">
                <strong>Previous Assessment Found:</strong> You completed a family assessment on{' '}
                {formatDate(existingResult.completedAt, 'a previous date')} with a score of{' '}
                <span className={getScoreColor(existingResult.overallScore)}>
                  {existingResult.overallScore}
                </span>. 
                Taking this assessment again will replace your previous results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {currentQuestion + 1} of {familyQuestions.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-600 to-pink-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-xl p-8 mb-8">
        <div className="text-center mb-8">
          <div className="text-sm text-red-400 font-medium mb-2 uppercase tracking-wide">
            {currentQ.trait.replace('Family', '')} - Question {familyQuestions.filter(q => q.trait === currentQ.trait).findIndex(q => q.id === currentQ.id) + 1} of 3
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            {currentQ.text}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQ.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(answer.score)}
              className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-red-500 hover:bg-gray-700 transition-all duration-200 group"
            >
              <span className="text-white group-hover:text-red-400 transition-colors">
                {answer.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        
        <div className="text-gray-400 text-sm">
          {Object.keys(answers).length} of {familyQuestions.length} answered
        </div>

        <button
          onClick={() => setCurrentQuestion(prev => Math.min(familyQuestions.length - 1, prev + 1))}
          disabled={currentQuestion === familyQuestions.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
