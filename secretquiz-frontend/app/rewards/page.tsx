"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";

export default function RewardsPage() {
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
    getSubmission,
    getQuiz,
    isDeployed,
  } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [rewards, setRewards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    nftsCollected: 0,
    quizzesPassed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userAddress = accounts?.[0];

  useEffect(() => {
    if (!isDeployed || !userAddress) {
      setLoading(false);
      return;
    }

    const loadRewards = async () => {
      setLoading(true);
      setError("");

      try {
        const submissionIds = await getUserSubmissions(userAddress);
        const rewardData = [];
        let totalPoints = 0;
        let quizzesPassed = 0;

        for (const id of submissionIds) {
          try {
            const submission = await getSubmission(BigInt(id.toString()));
            const quiz = await getQuiz(submission.quizId);

            const reward = {
              submissionId: id.toString(),
              quizId: submission.quizId.toString(),
              quizTitle: quiz.title,
              rewardAmount: quiz.rewardAmount.toString(),
              hasClaimedReward: submission.hasClaimedReward,
              submittedAt: new Date(Number(submission.submittedAt) * 1000).toLocaleDateString(),
            };

            rewardData.push(reward);

            if (submission.hasClaimedReward) {
              totalPoints += Number(quiz.rewardAmount);
              quizzesPassed++;
            }
          } catch (err) {
            console.error(`Failed to load submission ${id}:`, err);
          }
        }

        setRewards(rewardData);
        setStats({
          totalPoints,
          nftsCollected: 0, // NFT functionality not implemented in basic contract
          quizzesPassed,
        });
      } catch (err: any) {
        console.error("Failed to load rewards:", err);
        setError(err.message || "Failed to load rewards");
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, [isDeployed, userAddress, getUserSubmissions, getSubmission, getQuiz]);

  // Note: Reward claiming is handled on the Results page after decryption
  // This page only displays reward history

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-8">
              <span className="mr-3">🎁</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Rewards Center
              </span>
            </h1>
            <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-2xl text-amber-700 dark:text-amber-300 font-medium">
              👛 Please connect your wallet to view your rewards
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
            <h1 className="text-5xl font-bold mb-8">
              <span className="mr-3">🎁</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Rewards Center
              </span>
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
              <span className="mr-3">🎁</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Rewards Center
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Track your points, NFTs, and quiz achievements
            </p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium max-w-2xl mx-auto">
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">🎁 Loading rewards...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 backdrop-blur-xl border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200">
                  <div className="text-6xl mb-4">💎</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats.totalPoints}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 font-semibold">Total Points Earned</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 backdrop-blur-xl border-2 border-cyan-300 dark:border-cyan-700 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200">
                  <div className="text-6xl mb-4">🖼️</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {stats.nftsCollected}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 font-semibold">NFTs Collected</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">(Coming Soon)</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-xl border-2 border-green-300 dark:border-green-700 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200">
                  <div className="text-6xl mb-4">🎯</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    {stats.quizzesPassed}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 font-semibold">Quizzes Passed</div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">🎁 Your Rewards</h2>

              <div className="space-y-6">
                {rewards.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="mb-6 text-6xl">🎁</div>
                    <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 font-medium">No rewards yet</p>
                    <a
                      href="/quizzes/"
                      className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                      📝 Take a Quiz
                    </a>
                  </div>
                ) : (
                  rewards.map((reward) => (
                    <div key={reward.submissionId} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-200">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{reward.quizTitle}</h3>
                          <p className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
                            🎁 {reward.rewardAmount} Points
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📅 Submitted: {reward.submittedAt}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {reward.hasClaimedReward ? (
                            <span className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold">
                              ✅ Claimed
                            </span>
                          ) : (
                            <>
                              <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-semibold">
                                🎯 Claimable
                              </span>
                              <a
                                href={`/results/${reward.submissionId}/`}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-block"
                              >
                                🎁 View & Claim
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
