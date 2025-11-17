"use client";

import { Shield, Lock, Award } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <Navbar />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm">
            🔐 Powered by FHEVM
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            SecretQuiz
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white mb-4">
            Your Answers, Forever Private
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Prove your knowledge without revealing your answers using fully homomorphic encryption on the blockchain.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/quizzes/"
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span>🎯 Start Quiz</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="/create/"
              className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl font-semibold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-slate-900 transition-all duration-200"
            >
              ✨ Create Quiz
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          <div className="group text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Fully Private</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Answers and results completely encrypted using FHE technology
            </p>
          </div>

          <div className="group text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Verifiable</h3>
            <p className="text-gray-600 dark:text-gray-300">
              On-chain automatic verification, no trust needed
            </p>
          </div>

          <div className="group text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Rewarding</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get rewards instantly when you pass the quiz
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32 max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">How It Works</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-16">Get started in 4 simple steps</p>
          <div className="space-y-8">
            <div className="flex gap-6 items-start bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Connect Wallet</h4>
                <p className="text-gray-600 dark:text-gray-300">Connect your Web3 wallet (MetaMask) to get started with SecretQuiz</p>
              </div>
              <div className="text-4xl">👛</div>
            </div>
            <div className="flex gap-6 items-start bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Choose Quiz</h4>
                <p className="text-gray-600 dark:text-gray-300">Browse available quizzes and select one that interests you</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
            <div className="flex gap-6 items-start bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Submit Encrypted Answers</h4>
                <p className="text-gray-600 dark:text-gray-300">Your answers are encrypted using FHE before being submitted on-chain</p>
              </div>
              <div className="text-4xl">🔐</div>
            </div>
            <div className="flex gap-6 items-start bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Get Rewards</h4>
                <p className="text-gray-600 dark:text-gray-300">Decrypt your score and claim rewards if you pass the quiz</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 SecretQuiz - Privacy-Preserving Knowledge Quiz Platform</p>
        </div>
      </footer>
    </div>
  );
}

