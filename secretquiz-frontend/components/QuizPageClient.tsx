"use client";

import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";

const CATEGORY_NAMES = ["Technology", "Science", "Business", "Custom"];
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard"];

interface QuizData {
  creator: string;
  title: string;
  description: string;
  category: number;
  difficulty: number;
  questionCount: number;
  rewardAmount: bigint;
  passThreshold: bigint;
  isActive: boolean;
  createdAt: bigint;
  participantCount: bigint;
}

interface QuestionData {
  text: string;
  type: number;
  options: string[];
}

export function QuizPageClient({ quizId }: { quizId: string }) {
  const { provider, chainId } = useMetaMask();
  const { instance } = useFhevm({ 
    provider, 
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" }
  });
  const { ethersSigner, ethersReadonlyProvider } = useMetaMaskEthersSigner();
  
  // Store latest values in refs to avoid stale closure
  const chainIdRef = useRef(chainId);
  const ethersSignerRef = useRef(ethersSigner);
  
  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);
  
  useEffect(() => {
    ethersSignerRef.current = ethersSigner;
  }, [ethersSigner]);
  
  const sameChain = useRef((c: number | undefined) => c === chainIdRef.current);
  const sameSigner = useRef((s: any) => s === ethersSignerRef.current);
  
  const { getQuiz, getQuestion, submitAnswers, isDeployed } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load quiz and questions
  useEffect(() => {
    const loadQuiz = async () => {
      // Wait for contract to be ready
      if (!isDeployed || !getQuiz || !getQuestion) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const quizData = await getQuiz(BigInt(quizId));
        setQuiz(quizData);

        const loadedQuestions: QuestionData[] = [];
        for (let i = 0; i < Number(quizData.questionCount); i++) {
          const questionResult = await getQuestion(BigInt(quizId), i);
          // getQuestion returns [questionText, questionType, options]
          const [questionText, questionType, options] = questionResult;
          loadedQuestions.push({
            text: questionText,
            type: Number(questionType),
            options: options ? options.split("|") : []
          });
        }
        setQuestions(loadedQuestions);
      } catch (err: any) {
        console.error("Failed to load quiz:", err);
        setError("Failed to load quiz: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, isDeployed, getQuiz, getQuestion]);

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: value });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!instance || !ethersSigner || !quiz) {
      alert("Please connect wallet and ensure FHEVM is ready.");
      return;
    }

    // Check all questions answered
    for (let i = 0; i < questions.length; i++) {
      if (!answers[i] || answers[i].trim() === "") {
        alert(`Please answer all questions. Question ${i + 1} is unanswered.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const answerValues = questions.map((_, idx) => BigInt(answers[idx]));
      await submitAnswers(BigInt(quizId), answerValues);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/my-quizzes/";
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit answers:", err);
      setError("Failed to submit answers: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">📚 Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 text-6xl">❌</div>
            <p className="text-2xl text-red-600 dark:text-red-400 font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 text-6xl">🔍</div>
            <p className="text-2xl text-gray-600 dark:text-gray-300 font-medium">Quiz not found.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 text-8xl animate-bounce">✅</div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
              Answers Submitted Successfully!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">🔄 Redirecting to My Quizzes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Quiz Header */}
          <div className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {quiz.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">{quiz.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold">
                📂 {CATEGORY_NAMES[quiz.category]}
              </span>
              <span className={`px-4 py-2 rounded-lg font-semibold ${
                quiz.difficulty === 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                quiz.difficulty === 1 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}>
                📊 {DIFFICULTY_NAMES[quiz.difficulty]}
              </span>
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold">
                🎁 {Number(quiz.rewardAmount)} Points
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Progress: Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl mb-6">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold text-sm mb-4">
                ❓ Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {questions[currentQuestionIndex].text}
              </h2>
            </div>
            
            {questions[currentQuestionIndex].type === 0 ? (
              // Fill-in-blank question
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  ✏️ Your Answer:
                </label>
                <input
                  type="number"
                  placeholder="Enter a numeric value"
                  value={answers[currentQuestionIndex] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                  disabled={submitting}
                />
              </div>
            ) : (
              // Single-choice question
              <div className="space-y-3 mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  ☑️ Select one option:
                </label>
                {questions[currentQuestionIndex].options.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => !submitting && handleAnswerChange(idx.toString())}
                    className={`group p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      answers[currentQuestionIndex] === idx.toString()
                        ? 'border-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg scale-[1.02]'
                        : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-[1.01]'
                    } ${submitting ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        answers[currentQuestionIndex] === idx.toString()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || submitting}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1 || submitting}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ml-auto font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "🔄 Submitting..." : "🚀 Submit Answers"}
              </button>
            </div>
          </div>

          {/* Answer Summary */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Answer Summary</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  className={`aspect-square rounded-xl font-bold text-sm transition-all duration-200 ${
                    idx === currentQuestionIndex
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110"
                      : answers[idx]
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-500 hover:scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105"
                  }`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              <span className="font-semibold text-green-600 dark:text-green-400">{Object.values(answers).filter(a => a).length}</span> of {questions.length} answered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

