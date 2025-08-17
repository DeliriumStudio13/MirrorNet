'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Leaf, ChevronLeft, ChevronRight, Check, RotateCcw, TrendingUp } from 'lucide-react';
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

interface EcoResult {
  overallScore: number;
  traitScores: Record<string, number>;
  completedAt: Date;
  answers: Record<string, number>;
}

const ecoQuestions: Question[] = [
  // Energy Questions (3 questions)
  {
    id: 'energy_1',
    trait: 'energy',
    text: 'How often do you turn off lights when leaving a room?',
    answers: [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 3 },
      { text: 'Sometimes', score: 5 },
      { text: 'Usually', score: 8 },
      { text: 'Always', score: 10 }
    ]
  },
  {
    id: 'energy_2', 
    trait: 'energy',
    text: 'Do you use energy-efficient appliances and LED bulbs?',
    answers: [
      { text: 'No, I use regular appliances', score: 1 },
      { text: 'Some energy-efficient items', score: 4 },
      { text: 'Many energy-efficient items', score: 7 },
      { text: 'Most appliances are energy-efficient', score: 9 },
      { text: 'All appliances are energy-efficient', score: 10 }
    ]
  },
  {
    id: 'energy_3',
    trait: 'energy',
    text: 'How do you manage heating and cooling in your home?',
    answers: [
      { text: 'Keep it on constantly at ideal temperature', score: 1 },
      { text: 'Adjust sometimes for comfort', score: 3 },
      { text: 'Set reasonable temperatures', score: 6 },
      { text: 'Use programmable thermostat efficiently', score: 8 },
      { text: 'Minimize use, layer clothes, use fans', score: 10 }
    ]
  },

  // Waste Questions (3 questions)
  {
    id: 'waste_1',
    trait: 'waste',
    text: 'How do you handle household waste and recycling?',
    answers: [
      { text: 'Throw everything in general trash', score: 1 },
      { text: 'Separate some recyclables occasionally', score: 3 },
      { text: 'Recycle regularly but not perfectly', score: 6 },
      { text: 'Careful recycling and some composting', score: 8 },
      { text: 'Comprehensive recycling, composting, minimal waste', score: 10 }
    ]
  },
  {
    id: 'waste_2',
    trait: 'waste',
    text: 'How often do you buy single-use items (plastic bottles, disposable cups, etc.)?',
    answers: [
      { text: 'Very frequently, for convenience', score: 1 },
      { text: 'Often, but sometimes use reusables', score: 3 },
      { text: 'Sometimes, trying to reduce', score: 5 },
      { text: 'Rarely, mostly use reusables', score: 8 },
      { text: 'Almost never, committed to reusables', score: 10 }
    ]
  },
  {
    id: 'waste_3',
    trait: 'waste',
    text: 'What do you do with items you no longer need?',
    answers: [
      { text: 'Usually throw them away', score: 1 },
      { text: 'Sometimes donate or give away', score: 4 },
      { text: 'Often donate or sell items', score: 6 },
      { text: 'Usually donate, sell, or repurpose', score: 8 },
      { text: 'Always find ways to reuse, donate, or recycle', score: 10 }
    ]
  },

  // Transport Questions (3 questions)
  {
    id: 'transport_1',
    trait: 'transport',
    text: 'What is your primary mode of transportation for daily activities?',
    answers: [
      { text: 'Personal car for everything', score: 1 },
      { text: 'Mostly car, occasional alternatives', score: 3 },
      { text: 'Mix of car and public transport/walking', score: 6 },
      { text: 'Mostly public transport, bike, or walk', score: 8 },
      { text: 'Always walk, bike, or public transport', score: 10 }
    ]
  },
  {
    id: 'transport_2',
    trait: 'transport',
    text: 'How do you approach longer distance travel (vacations, business trips)?',
    answers: [
      { text: 'Always fly or drive, convenience first', score: 1 },
      { text: 'Usually fly/drive, some consideration for environment', score: 3 },
      { text: 'Sometimes choose more sustainable options', score: 5 },
      { text: 'Often choose trains or offset carbon emissions', score: 7 },
      { text: 'Always choose most sustainable option available', score: 10 }
    ]
  },
  {
    id: 'transport_3',
    trait: 'transport',
    text: 'How often do you combine trips or carpool to reduce transportation impact?',
    answers: [
      { text: 'Never think about combining trips', score: 1 },
      { text: 'Occasionally combine errands', score: 4 },
      { text: 'Usually plan efficient routes', score: 6 },
      { text: 'Often carpool and combine trips', score: 8 },
      { text: 'Always optimize trips and share transportation', score: 10 }
    ]
  },

  // Consumption Questions (3 questions)
  {
    id: 'consumption_1',
    trait: 'consumption',
    text: 'How do you approach buying new products (clothes, electronics, furniture)?',
    answers: [
      { text: 'Buy new whenever I want something', score: 1 },
      { text: 'Usually buy new, sometimes consider if needed', score: 3 },
      { text: 'Think before buying, but still buy new often', score: 5 },
      { text: 'Often buy second-hand or only when needed', score: 7 },
      { text: 'Almost always buy used or avoid buying', score: 10 }
    ]
  },
  {
    id: 'consumption_2',
    trait: 'consumption',
    text: 'How do you choose the products you buy?',
    answers: [
      { text: 'Price and convenience are my main factors', score: 1 },
      { text: 'Consider quality but not environmental impact', score: 3 },
      { text: 'Sometimes look for eco-friendly options', score: 5 },
      { text: 'Often choose sustainable and ethical brands', score: 8 },
      { text: 'Always prioritize environmental and ethical impact', score: 10 }
    ]
  },
  {
    id: 'consumption_3',
    trait: 'consumption',
    text: 'How do you handle food consumption and waste?',
    answers: [
      { text: 'Buy whatever I want, often waste food', score: 1 },
      { text: 'Sometimes plan meals, occasional food waste', score: 3 },
      { text: 'Usually plan meals, try to minimize waste', score: 6 },
      { text: 'Careful meal planning, rarely waste food', score: 8 },
      { text: 'Zero waste approach, compost, buy local/organic', score: 10 }
    ]
  },

  // Water Questions (3 questions)
  {
    id: 'water_1',
    trait: 'water',
    text: 'How long are your typical showers?',
    answers: [
      { text: 'Long showers (15+ minutes), very relaxing', score: 1 },
      { text: 'Moderately long (10-15 minutes)', score: 3 },
      { text: 'Average length (5-10 minutes)', score: 6 },
      { text: 'Short showers (3-5 minutes)', score: 8 },
      { text: 'Very short showers (under 3 minutes)', score: 10 }
    ]
  },
  {
    id: 'water_2',
    trait: 'water',
    text: 'How do you use water for daily activities (brushing teeth, washing dishes)?',
    answers: [
      { text: 'Leave water running throughout activities', score: 1 },
      { text: 'Sometimes turn off water, but often forget', score: 3 },
      { text: 'Usually turn off water when not needed', score: 6 },
      { text: 'Always turn off water when not actively using', score: 8 },
      { text: 'Minimize water use and collect/reuse water', score: 10 }
    ]
  },
  {
    id: 'water_3',
    trait: 'water',
    text: 'Do you have water-saving practices in your home?',
    answers: [
      { text: 'No special water-saving measures', score: 1 },
      { text: 'Some awareness but no specific practices', score: 3 },
      { text: 'A few water-saving practices', score: 5 },
      { text: 'Many water-saving devices and practices', score: 8 },
      { text: 'Comprehensive water conservation system', score: 10 }
    ]
  }
];

export default function EcoAssessmentPage() {
  const { user } = useAuthContext();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<EcoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingResult, setExistingResult] = useState<EcoResult | null>(null);

  useEffect(() => {
    // Check if user has existing eco assessment
    async function checkExistingAssessment() {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.ecoAssessment) {
            setExistingResult(userData.ecoAssessment);
          }
        }
      } catch (error) {
        console.error('Error checking existing assessment:', error);
      }
    }

    checkExistingAssessment();
  }, [user?.uid]);

  const handleAnswer = (score: number) => {
    const questionId = ecoQuestions[currentQuestion].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: score
    }));

    if (currentQuestion < ecoQuestions.length - 1) {
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
    ['energy', 'waste', 'transport', 'consumption', 'water'].forEach(trait => {
      traitScores[trait] = 0;
      traitQuestionCounts[trait] = 0;
    });

    // Sum scores by trait
    ecoQuestions.forEach(question => {
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

    const result: EcoResult = {
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
          ecoAssessment: result,
          ecoAssessmentUpdatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving eco assessment:', error);
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
    if (score < 3) return 'Needs Improvement';
    if (score < 5) return 'Getting Started';
    if (score < 7) return 'Good Progress';
    if (score < 9) return 'Excellent';
    return 'Eco Champion';
  };

  const progressPercentage = ((currentQuestion + 1) / ecoQuestions.length) * 100;
  const currentQ = ecoQuestions[currentQuestion];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Calculating your eco rating...</p>
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Eco Assessment Complete!</h1>
          <p className="text-gray-400">Here are your environmental consciousness results</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Your Eco Rating</h2>
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
            {Object.entries(result.traitScores).map(([trait, score]) => (
              <div key={trait} className="bg-gray-700 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold mb-1 ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-white text-sm font-medium capitalize mb-2">{trait}</div>
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
            ))}
          </div>
        </div>

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
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
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
            <Leaf className="h-8 w-8 text-green-500" />
            Eco Assessment
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              BETA
            </span>
          </h1>
          <p className="text-gray-400 mt-2">
            Answer honestly to get your environmental consciousness rating
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
                <strong>Previous Assessment Found:</strong> You completed an eco assessment on{' '}
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
          <span>Question {currentQuestion + 1} of {ecoQuestions.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-600 to-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-xl p-8 mb-8">
        <div className="text-center mb-8">
          <div className="text-sm text-green-400 font-medium mb-2 uppercase tracking-wide">
            {currentQ.trait} - Question {ecoQuestions.filter(q => q.trait === currentQ.trait).findIndex(q => q.id === currentQ.id) + 1} of 3
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
              className="w-full text-left p-4 rounded-lg border border-gray-700 hover:border-green-500 hover:bg-gray-700 transition-all duration-200 group"
            >
              <span className="text-white group-hover:text-green-400 transition-colors">
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
          {Object.keys(answers).length} of {ecoQuestions.length} answered
        </div>

        <button
          onClick={() => setCurrentQuestion(prev => Math.min(ecoQuestions.length - 1, prev + 1))}
          disabled={currentQuestion === ecoQuestions.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
