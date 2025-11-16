"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";

export default function MyQuizzesPage() {
  const [activeTab, setActiveTab] = useState<"submissions" | "created">("submissions");
  
  const { provider, chainId, accounts } = useMetaMask();
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
  
  const {
    getUserSubmissions,
    getCreatorQuizzes,
    getQuiz,
    getSubmission,
    isDeployed,
  } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [createdQuizzes, setCreatedQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userAddress = accounts?.[0];

  useEffect(() => {
    if (!isDeployed || !userAddress) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        // Load user submissions
        const submissionIds = await getUserSubmissions(userAddress);
        const submissionData = [];
        for (const id of submissionIds) {
          try {
            const submission = await getSubmission(BigInt(id.toString()));
            const quiz = await getQuiz(submission.quizId);
            submissionData.push({
              id: id.toString(),
              quizId: submission.quizId.toString(),
              quizTitle: quiz.title,
              submittedAt: new Date(Number(submission.submittedAt) * 1000).toLocaleDateString(),
              hasClaimedReward: submission.hasClaimedReward,
            });
          } catch (err) {
            console.error(`Failed to load submission ${id}:`, err);
          }
        }
        setSubmissions(submissionData);

        // Load created quizzes
        const quizIds = await getCreatorQuizzes(userAddress);
        const quizData = [];
        for (const id of quizIds) {
          try {
            const quiz = await getQuiz(BigInt(id.toString()));
            quizData.push({
              id: id.toString(),
              title: quiz.title,
              description: quiz.description,
              isActive: quiz.isActive,
              participantCount: quiz.participantCount.toString(),
              createdAt: new Date(Number(quiz.createdAt) * 1000).toLocaleDateString(),
            });
          } catch (err) {
            console.error(`Failed to load quiz ${id}:`, err);
          }
        }
        setCreatedQuizzes(quizData);
      } catch (err: any) {
        console.error("Failed to load data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isDeployed, userAddress, getUserSubmissions, getCreatorQuizzes, getQuiz, getSubmission]);

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              📊 My Quizzes
            </h1>
            <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-2xl text-amber-700 dark:text-amber-300 font-medium">
              👛 Please connect your wallet to view your quizzes
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isDeployed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-8">
              📊 My Quizzes
            </h1>
            <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-2xl text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ Contract not deployed on this network
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="mr-3">📊</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                My Quizzes
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Track your quiz submissions and creations
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium max-w-2xl mx-auto">
              ❌ {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-xl">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 ${
                activeTab === "submissions"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              📝 My Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab("created")}
              className={`flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 ${
                activeTab === "created"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              ✨ My Created ({createdQuizzes.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">🔍 Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === "submissions" && (
                <div className="space-y-6">
                  {submissions.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="mb-6 text-6xl">📋</div>
                      <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 font-medium">No submissions yet</p>
                      <a
                        href="/quizzes/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
                      >
                        📝 Browse Quizzes
                      </a>
                    </div>
                  ) : (
                    submissions.map((submission) => (
                      <div key={submission.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-200">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{submission.quizTitle}</h3>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            📅 Submitted: {submission.submittedAt}
                          </span>
                          <span className={`px-4 py-2 rounded-lg font-semibold ${
                            submission.hasClaimedReward
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}>
                            {submission.hasClaimedReward ? "✅ Reward Claimed" : "📤 Submitted"}
                          </span>
                        </div>
                        <a
                          href={`/results/${submission.id}/`}
                          className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          📊 View Results
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "created" && (
                <div className="space-y-6">
                  {createdQuizzes.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="mb-6 text-6xl">✨</div>
                      <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 font-medium">You haven't created any quizzes yet</p>
                      <a
                        href="/create/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
                      >
                        ✨ Create Your First Quiz
                      </a>
                    </div>
                  ) : (
                    createdQuizzes.map((quiz) => (
                      <div key={quiz.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-200">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{quiz.description}</p>
                          </div>
                          <span className={`shrink-0 px-4 py-2 text-sm rounded-lg font-semibold ${
                            quiz.isActive
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}>
                            {quiz.isActive ? "✅ Active" : "⏹️ Ended"}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <span className="font-medium">📅 Created: {quiz.createdAt}</span>
                          <span className="font-medium">👥 Participants: {quiz.participantCount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
