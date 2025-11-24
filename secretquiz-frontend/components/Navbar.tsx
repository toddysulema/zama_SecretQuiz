"use client";

import Link from "next/link";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { formatAddress, getChainName } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { isConnected, accounts, chainId, connect } = useMetaMask();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              🔐 SecretQuiz
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
              Home
            </Link>
            <Link href="/quizzes/" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
              📝 Quizzes
            </Link>
            <Link href="/my-quizzes/" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
              📊 My Quizzes
            </Link>
            <Link href="/create/" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
              ✨ Create
            </Link>
            <Link href="/rewards/" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
              🎁 Rewards
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center gap-3">
            {chainId && (
              <div className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                🌐 {getChainName(chainId)}
              </div>
            )}
            {isConnected && accounts && accounts[0] ? (
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg font-mono text-sm border border-indigo-500/20">
                👛 {formatAddress(accounts[0])}
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/quizzes/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              📝 Quizzes
            </Link>
            <Link
              href="/my-quizzes/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              📊 My Quizzes
            </Link>
            <Link
              href="/create/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              ✨ Create
            </Link>
            <Link
              href="/rewards/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              🎁 Rewards
            </Link>
            <div className="pt-4 space-y-3">
              {chainId && (
                <div className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 text-center">
                  🌐 {getChainName(chainId)}
                </div>
              )}
              {isConnected && accounts && accounts[0] ? (
                <div className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg font-mono text-sm border border-indigo-500/20 text-center">
                  👛 {formatAddress(accounts[0])}
                </div>
              ) : (
                <button
                  onClick={() => {
                    connect();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

