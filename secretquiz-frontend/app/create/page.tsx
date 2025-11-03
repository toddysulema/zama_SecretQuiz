"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useSecretQuiz } from "@/hooks/useSecretQuiz";

export default function CreateQuizPage() {
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
  
  const { createQuiz, isDeployed } = useSecretQuiz({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [questions, setQuestions] = useState([{ 
    text: "", 
    answer: "", 
    type: 0, // 0=Fill-in-blank, 1=Single-choice
    options: ["", "", "", ""] // For single-choice questions
  }]);
  const [rewardAmount, setRewardAmount] = useState("");
  const [passThreshold, setPassThreshold] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { 
      text: "", 
      answer: "", 
      type: 0,
      options: ["", "", "", ""]
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: "text" | "answer" | "type", value: string | number) => {
    const updated = [...questions];
    if (field === "type") {
      updated[index].type = value as number;
      // Reset options when switching to single-choice
      if (value === 1 && updated[index].options.every(o => o === "")) {
        updated[index].options = ["", "", "", ""];
      }
    } else {
      updated[index][field] = value as string;
    }
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // 详细检查各个条件
    if (!ethersSigner) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isDeployed) {
      setError("Contract not deployed on this network");
      return;
    }

    if (!instance) {
      setError("FHEVM instance not ready, please wait...");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description");
      return;
    }

    if (questions.some(q => !q.text.trim() || !q.answer.trim())) {
      setError("Please fill in all questions and answers");
      return;
    }

    // Validate single-choice questions have options
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].type === 1) {
        if (questions[i].options.some(opt => !opt.trim())) {
          setError(`Question ${i + 1}: Please fill in all options for single-choice`);
          return;
        }
      }
    }

    if (!rewardAmount || !passThreshold) {
      setError("Please fill in reward amount and pass threshold");
      return;
    }

    setIsSubmitting(true);

    try {
      const questionTexts = questions.map(q => q.text);
      const questionTypes = questions.map(q => q.type);
      const questionOptions = questions.map(q => 
        q.type === 1 ? q.options.join("|") : ""
      );
      const answers = questions.map(q => BigInt(q.answer));

      await createQuiz({
        title,
        description,
        category,
        difficulty,
        questions: questionTexts,
        questionTypes,
        questionOptions,
        answers,
        rewardAmount: BigInt(rewardAmount),
        passThreshold: BigInt(passThreshold),
      });

      setSuccess(true);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory(0);
      setDifficulty(0);
      setQuestions([{ 
        text: "", 
        answer: "", 
        type: 0,
        options: ["", "", "", ""]
      }]);
      setRewardAmount("");
      setPassThreshold("");
    } catch (err: any) {
      console.error("Failed to create quiz:", err);
      setError(err.message || "Failed to create quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="mr-3">✨</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Create Quiz
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Design your encrypted knowledge challenge
            </p>
          </div>

          {/* 状态调试信息 */}
          <div className="mb-6 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">{ethersSigner ? "✅" : "❌"}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {ethersSigner ? "Connected" : "Not connected"}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">{isDeployed ? "✅" : "❌"}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isDeployed ? "Deployed" : "Not deployed"}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">{instance ? "✅" : "⏳"}</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">FHEVM</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {instance ? "Ready" : "Loading..."}
                </div>
              </div>
            </div>
          </div>
          
          {!isDeployed && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-xl text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ Contract not deployed on this network. Please deploy SecretQuiz contract first.
            </div>
          )}

          {!ethersSigner && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-xl text-amber-700 dark:text-amber-300 font-medium">
              👛 Please connect your wallet using the button in the top right corner.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-300 font-medium">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl text-green-700 dark:text-green-300 font-medium">
              🎉 Quiz created successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">📋 Quiz Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold mb-3 text-gray-700 dark:text-gray-200">Quiz Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., JavaScript Fundamentals"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-gray-700 dark:text-gray-200">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this quiz is about..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold mb-3 text-gray-700 dark:text-gray-200">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                      disabled={isSubmitting}
                    >
                      <option value={0}>💻 Technology</option>
                      <option value={1}>🔬 Science</option>
                      <option value={2}>💼 Business</option>
                      <option value={3}>✏️ Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-3 text-gray-700 dark:text-gray-200">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                      disabled={isSubmitting}
                    >
                      <option value={0}>🟢 Easy</option>
                      <option value={1}>🟡 Medium</option>
                      <option value={2}>🔴 Hard</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">❓ Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-slate-900 transition-all duration-200 disabled:opacity-50"
                >
                  ➕ Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        📝 Question {index + 1}
                      </h4>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Question Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(index, "type", Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                        disabled={isSubmitting}
                      >
                        <option value={0}>✏️ Fill-in-blank (enter a number)</option>
                        <option value={1}>☑️ Single-choice (select one option)</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(index, "text", e.target.value)}
                      placeholder="Enter your question here..."
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                      disabled={isSubmitting}
                    />

                    {q.type === 1 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Options</label>
                        {q.options.map((option, optIndex) => (
                          <input
                            key={optIndex}
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="w-full px-4 py-3 border border-input rounded-lg"
                            disabled={isSubmitting}
                          />
                        ))}
                        <p className="text-sm text-muted-foreground">
                          💡 Enter the option index (0-3) as the correct answer below
                        </p>
                      </div>
                    )}

                    <input
                      type="number"
                      value={q.answer}
                      onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                      placeholder={q.type === 1 ? "Correct option index (0-3)" : "Correct answer (number)"}
                      className="w-full px-4 py-3 border border-input rounded-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Reward Amount (Points)</label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3 border border-input rounded-lg"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Pass Threshold (Score)</label>
                <input
                  type="number"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-3 border border-input rounded-lg"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isDeployed || !ethersSigner || !instance}
              className="w-full px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? "🔄 Creating..." : !ethersSigner ? "👛 Connect Wallet First" : !isDeployed ? "⚠️ Contract Not Deployed" : !instance ? "⏳ FHEVM Loading..." : "🚀 Create Quiz"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
