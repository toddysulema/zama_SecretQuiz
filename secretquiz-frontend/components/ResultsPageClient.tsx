"use client";

import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

const CATEGORY_NAMES = ["Technology", "Science", "Business", "Custom"];
const DIFFICULTY_NAMES = ["Easy", "Medium", "Hard"];

interface SubmissionData {
  participant: string;
  quizId: bigint;
  encryptedScore: any;
  submittedAt: bigint;
  hasDecrypted: boolean;
  hasClaimedReward: boolean;
}

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

export function ResultsPageClient({ submissionId }: { submissionId: string }) {
  const { provider, chainId, accounts } = useMetaMask();
  const { instance } = useFhevm({ 
    provider, 
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" }
  });
  const { ethersSigner, ethersReadonlyProvider } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  
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
    getSubmission, 
    getQuiz, 
    allowResultDecryption, 
    getEncryptedScore,
    claimReward,
    contract,
    isDeployed 
  } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [decryptedScore, setDecryptedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load submission and quiz data
  useEffect(() => {
    const loadData = async () => {
      if (!isDeployed || !getSubmission || !getQuiz) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const submissionData = await getSubmission(BigInt(submissionId));
        setSubmission(submissionData);

        const quizData = await getQuiz(submissionData.quizId);
        setQuiz(quizData);
      } catch (err: any) {
        console.error("Failed to load submission:", err);
        setError("Failed to load submission: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionId, isDeployed, getSubmission, getQuiz]);

  const handleDecrypt = async () => {
    if (!instance || !ethersSigner || !submission || !contract || !accounts || accounts.length === 0) {
      alert("Please connect wallet and ensure FHEVM is ready.");
      return;
    }

    setDecrypting(true);
    setError(null);
    try {
      const userAddress = accounts[0];
      
      // Step 1: Allow decryption (if not already allowed)
      if (!submission.hasDecrypted) {
        console.log("Allowing result decryption...");
        await allowResultDecryption(BigInt(submissionId));
      }

      // Step 2: Get encrypted score
      const encryptedScore = await getEncryptedScore(BigInt(submissionId));
      console.log("Encrypted score:", encryptedScore);

      // Step 3: Create/load decryption signature
      const contractAddress = contract.target as string;
      console.log("Loading or creating decryption signature...");
      const decryptionSig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress as `0x${string}`],
        ethersSigner,
        storage
      );

      if (!decryptionSig) {
        throw new Error("Failed to create decryption signature");
      }

      // Step 4: Decrypt the score using userDecrypt
      console.log("Decrypting score...");
      const decryptedResults = await instance.userDecrypt(
        [{ handle: encryptedScore, contractAddress }],
        decryptionSig.privateKey,
        decryptionSig.publicKey,
        decryptionSig.signature,
        decryptionSig.contractAddresses,
        decryptionSig.userAddress,
        decryptionSig.startTimestamp,
        decryptionSig.durationDays
      );
      const scoreValue = Number(decryptedResults[encryptedScore]);
      
      setDecryptedScore(scoreValue);
      console.log("Decrypted score:", scoreValue);
    } catch (err: any) {
      console.error("Failed to decrypt results:", err);
      setError("Failed to decrypt results: " + err.message);
    } finally {
      setDecrypting(false);
    }
  };

  const handleClaimReward = async () => {
    if (!ethersSigner || !submission) {
      alert("Please connect wallet.");
      return;
    }

    if (decryptedScore === null) {
      alert("Please decrypt results first.");
      return;
    }

    if (quiz && decryptedScore < Number(quiz.passThreshold)) {
      alert(`Your score (${decryptedScore}) is below the passing threshold (${Number(quiz.passThreshold)}). Cannot claim reward.`);
      return;
    }

    setClaiming(true);
    setError(null);
    try {
      await claimReward(BigInt(submissionId), decryptedScore);
      alert("Reward claimed successfully!");
      // Reload submission data
      const updatedSubmission = await getSubmission(BigInt(submissionId));
      setSubmission(updatedSubmission);
    } catch (err: any) {
      console.error("Failed to claim reward:", err);
      setError("Failed to claim reward: " + err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">📊 Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !submission) {
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

  if (!submission || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 text-6xl">🔍</div>
            <p className="text-2xl text-gray-600 dark:text-gray-300 font-medium">Submission not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const submittedDate = new Date(Number(submission.submittedAt) * 1000).toLocaleDateString();
  const isPassed = decryptedScore !== null && quiz && decryptedScore >= Number(quiz.passThreshold);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="mr-3">📊</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Quiz Results
              </span>
            </h1>
          </div>
          
          {/* Quiz Info */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{quiz.title}</h2>
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
                ❓ {quiz.questionCount} Questions
              </span>
            </div>
          </div>
          
          {/* Submission Info */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📝 Submission #{submissionId}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Status:</span>
                <span className={`px-4 py-1.5 rounded-lg font-semibold ${
                  submission.hasClaimedReward 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                }`}>
                  {submission.hasClaimedReward ? "✅ Reward Claimed" : "📤 Submitted"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Submitted At:</span>
                <span className="font-semibold text-gray-900 dark:text-white">📅 {submittedDate}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Pass Threshold:</span>
                <span className="font-semibold text-gray-900 dark:text-white">🎯 {Number(quiz.passThreshold)} correct answers</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Reward:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">🎁 {Number(quiz.rewardAmount)} Points</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Decryption / Results */}
          {decryptedScore === null ? (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-indigo-300 dark:border-indigo-700 rounded-2xl p-12 shadow-xl">
              <div className="text-center">
                <div className="mb-6 text-6xl">🔒</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Results Are Encrypted
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                  Your results are protected by FHEVM encryption. Click below to decrypt and view your score.
                </p>
                <button 
                  onClick={handleDecrypt}
                  disabled={decrypting}
                  className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {decrypting ? "🔄 Decrypting..." : "🔓 Decrypt Results"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={`backdrop-blur-xl border-2 rounded-2xl p-12 shadow-2xl mb-6 ${
                isPassed 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-500'
              }`}>
                <div className="text-center">
                  <div className={`mb-6 text-8xl animate-bounce ${isPassed ? '' : 'animate-pulse'}`}>
                    {isPassed ? '🎉' : '💪'}
                  </div>
                  <h3 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
                    {decryptedScore} Correct
                  </h3>
                  <p className="text-2xl text-gray-600 dark:text-gray-300 mb-6">
                    out of {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
                  </p>
                  <div className={`inline-block px-8 py-4 rounded-2xl font-bold text-2xl ${
                    isPassed 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-red-600 text-white shadow-lg'
                  }`}>
                    {isPassed ? '✅ Passed!' : '❌ Did Not Pass'}
                  </div>
                </div>
              </div>

              {isPassed && !submission.hasClaimedReward && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-xl border-2 border-indigo-500 rounded-2xl p-12 shadow-xl mb-6">
                  <div className="text-center">
                    <div className="mb-6 text-6xl">🎁</div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      Congratulations!
                    </h3>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                      You passed the quiz and can claim your reward.
                    </p>
                    <button 
                      onClick={handleClaimReward}
                      disabled={claiming}
                      className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claiming ? "🔄 Claiming..." : `🎁 Claim ${Number(quiz.rewardAmount)} Points`}
                    </button>
                  </div>
                </div>
              )}

              {submission.hasClaimedReward && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-8 text-center shadow-xl">
                  <div className="mb-4 text-5xl">✅</div>
                  <p className="text-green-700 dark:text-green-300 font-bold text-xl">Reward Already Claimed</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


