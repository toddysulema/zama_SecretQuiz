"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";

interface QuizData {
  id: number;
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

const CATEGORY_NAMES = ["Technology", "Science", "Business", "Custom"];
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard"];

export default function QuizzesPage() {
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
  
  const { getTotalQuizzes, getQuiz, isDeployed } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isDeployed) {
      setLoading(false);
      return;
    }

    const loadQuizzes = async () => {
      setLoading(true);
      setError("");
      
      try {
        const total = await getTotalQuizzes();
        const totalNum = Number(total);
        
        if (totalNum === 0) {
          setQuizzes([]);
          setLoading(false);
          return;
        }

        const quizData: QuizData[] = [];
        for (let i = 0; i < totalNum; i++) {
          try {
            const quiz = await getQuiz(BigInt(i));
            quizData.push({
              id: i,
              creator: quiz.creator,
              title: quiz.title,
              description: quiz.description,
              category: quiz.category,
              difficulty: quiz.difficulty,
              questionCount: quiz.questionCount,
              rewardAmount: quiz.rewardAmount,
              passThreshold: quiz.passThreshold,
              isActive: quiz.isActive,
              createdAt: quiz.createdAt,
              participantCount: quiz.participantCount,
            });
          } catch (err) {
            console.error(`Failed to load quiz ${i}:`, err);
          }
        }
        
        setQuizzes(quizData);
      } catch (err: any) {
        console.error("Failed to load quizzes:", err);
        setError(err.message || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [isDeployed, getTotalQuizzes, getQuiz]);

  if (!isDeployed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              📝 Available Quizzes
            </h1>
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-2xl text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ Contract not deployed on this network. Please deploy SecretQuiz contract first.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="mr-3">📝</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Available Quizzes
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose a quiz and test your knowledge privately
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium max-w-2xl mx-auto">
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 font-medium">🔍 Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-6 text-6xl">📚</div>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 font-medium">No quizzes available yet</p>
              <a
                href="/create/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                ✨ Create First Quiz
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${
                    !quiz.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                    {!quiz.isActive && (
                      <span className="shrink-0 ml-2 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-semibold">
                        ⏹️ Ended
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-5 line-clamp-2 min-h-[3rem]">{quiz.description}</p>
                  
                  <div className="space-y-2.5 text-sm mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        📂 Category:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{CATEGORY_NAMES[quiz.category]}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        📊 Difficulty:
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded ${
                        quiz.difficulty === 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                        quiz.difficulty === 1 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}>
                        {DIFFICULTY_NAMES[quiz.difficulty]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        ❓ Questions:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{quiz.questionCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        🎁 Reward:
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{quiz.rewardAmount.toString()} Points</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        👥 Participants:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{quiz.participantCount.toString()}</span>
                    </div>
                  </div>

                  {quiz.isActive ? (
                    <a
                      href={`/quiz/${quiz.id}/`}
                      className="block w-full text-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                      🚀 Take Quiz
                    </a>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                    >
                      ⏹️ Quiz Ended
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
