"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useState, RefObject } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { SecretQuizABI } from "@/abi/SecretQuizABI";
import { SecretQuizAddresses } from "@/abi/SecretQuizAddresses";

function getSecretQuizByChainId(chainId: number | undefined) {
  if (!chainId) {
    return { abi: SecretQuizABI };
  }

  const entry = SecretQuizAddresses[chainId.toString() as keyof typeof SecretQuizAddresses];

  if (!entry || entry.address === ethers.ZeroAddress) {
    return { abi: SecretQuizABI, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId,
    abi: SecretQuizABI,
  };
}

export const useSecretQuiz = (parameters: {
  instance: FhevmInstance | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const {
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [contract, setContract] = useState<ethers.Contract | undefined>(undefined);
  const [isDeployed, setIsDeployed] = useState(false);

  // Setup contract
  useEffect(() => {
    const contractInfo = getSecretQuizByChainId(chainId);

    if (!contractInfo.address || contractInfo.address === ethers.ZeroAddress) {
      setContract(undefined);
      setIsDeployed(false);
      return;
    }

    if (!ethersReadonlyProvider) {
      setContract(undefined);
      setIsDeployed(false);
      return;
    }

    const c = new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      ethersReadonlyProvider
    );

    setContract(c);
    setIsDeployed(true);
  }, [chainId, ethersReadonlyProvider]);

  const createQuiz = useCallback(
    async (params: {
      title: string;
      description: string;
      category: number;
      difficulty: number;
      questions: string[];
      questionTypes: number[];
      questionOptions: string[];
      answers: bigint[];
      rewardAmount: bigint;
      passThreshold: bigint;
    }) => {
      if (!instance || !ethersSigner || !contract || !chainId) {
        throw new Error("Not ready");
      }

      if (!sameChain.current?.(chainId) || !sameSigner.current?.(ethersSigner)) {
        throw new Error("Chain or signer changed");
      }

      const userAddress = await ethersSigner.getAddress();
      const { questions, questionTypes, questionOptions, answers, ...rest } = params;

      // Encrypt answers
      const encryptedAnswers = [];
      const inputProofs = [];

      for (const answer of answers) {
        const input = instance.createEncryptedInput(contract.target as string, userAddress);
        input.add64(BigInt(answer));
        const encrypted = await input.encrypt();
        encryptedAnswers.push(encrypted.handles[0]);
        inputProofs.push(encrypted.inputProof);
      }

      const contractWithSigner = contract.connect(ethersSigner) as any;
      const tx = await contractWithSigner.createQuiz(
        rest.title,
        rest.description,
        rest.category,
        rest.difficulty,
        questions,
        questionTypes,
        questionOptions,
        encryptedAnswers,
        inputProofs,
        rest.rewardAmount,
        rest.passThreshold
      );

      return tx.wait();
    },
    [instance, ethersSigner, contract, chainId, sameChain, sameSigner]
  );

  const submitAnswers = useCallback(
    async (quizId: bigint, answers: bigint[]) => {
      if (!instance || !ethersSigner || !contract || !chainId) {
        throw new Error("Not ready");
      }

      if (!sameChain.current?.(chainId) || !sameSigner.current?.(ethersSigner)) {
        throw new Error("Chain or signer changed");
      }

      const userAddress = await ethersSigner.getAddress();
      const encryptedAnswers = [];
      const inputProofs = [];

      for (const answer of answers) {
        const input = instance.createEncryptedInput(contract.target as string, userAddress);
        input.add64(BigInt(answer));
        const encrypted = await input.encrypt();
        encryptedAnswers.push(encrypted.handles[0]);
        inputProofs.push(encrypted.inputProof);
      }

      const contractWithSigner = contract.connect(ethersSigner) as any;
      const tx = await contractWithSigner.submitAnswers(
        quizId,
        encryptedAnswers,
        inputProofs
      );

      return tx.wait();
    },
    [instance, ethersSigner, contract, chainId, sameChain, sameSigner]
  );

  const getQuiz = useCallback(
    async (quizId: bigint) => {
      if (!contract) {
        throw new Error("Contract not ready");
      }

      return (contract as any).getQuiz(quizId);
    },
    [contract]
  );

  const getTotalQuizzes = useCallback(async () => {
    if (!contract) {
      return 0n;
    }

    try {
      return await (contract as any).getTotalQuizzes();
    } catch {
      return 0n;
    }
  }, [contract]);

  const getUserSubmissions = useCallback(
    async (userAddress: string) => {
      if (!contract) return [];
      try {
        return await (contract as any).getUserSubmissions(userAddress);
      } catch {
        return [];
      }
    },
    [contract]
  );

  const getCreatorQuizzes = useCallback(
    async (creatorAddress: string) => {
      if (!contract) return [];
      try {
        return await (contract as any).getCreatorQuizzes(creatorAddress);
      } catch {
        return [];
      }
    },
    [contract]
  );

  const getSubmission = useCallback(
    async (submissionId: bigint) => {
      if (!contract) throw new Error("Contract not ready");
      return await (contract as any).getSubmission(submissionId);
    },
    [contract]
  );

  const claimReward = useCallback(
    async (submissionId: bigint, decryptedScore: number) => {
      if (!ethersSigner || !contract) throw new Error("Not ready");
      const contractWithSigner = contract.connect(ethersSigner) as any;
      const tx = await contractWithSigner.claimReward(submissionId, decryptedScore);
      return tx.wait();
    },
    [contract, ethersSigner]
  );

  const allowResultDecryption = useCallback(
    async (submissionId: bigint) => {
      if (!ethersSigner || !contract) throw new Error("Not ready");
      const contractWithSigner = contract.connect(ethersSigner) as any;
      const tx = await contractWithSigner.allowResultDecryption(submissionId);
      return tx.wait();
    },
    [contract, ethersSigner]
  );

  const getQuestion = useCallback(
    async (quizId: bigint, questionIndex: number) => {
      if (!contract) throw new Error("Contract not ready");
      return await (contract as any).getQuestion(quizId, questionIndex);
    },
    [contract]
  );

  const getEncryptedScore = useCallback(
    async (submissionId: bigint) => {
      if (!contract) throw new Error("Contract not ready");
      return await (contract as any).getEncryptedScore(submissionId);
    },
    [contract]
  );

  return {
    contract,
    isDeployed,
    createQuiz,
    submitAnswers,
    getQuiz,
    getTotalQuizzes,
    getUserSubmissions,
    getCreatorQuizzes,
    getSubmission,
    claimReward,
    allowResultDecryption,
    getQuestion,
    getEncryptedScore,
  };
};

