import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SecretQuiz, SecretQuiz__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  creator: HardhatEthersSigner;
  participant: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SecretQuiz")) as SecretQuiz__factory;
  const secretQuizContract = (await factory.deploy()) as SecretQuiz;
  const secretQuizContractAddress = await secretQuizContract.getAddress();

  return { secretQuizContract, secretQuizContractAddress };
}

describe("SecretQuiz", function () {
  let signers: Signers;
  let secretQuizContract: SecretQuiz;
  let secretQuizContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], creator: ethSigners[1], participant: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }
    // Setup test environment

    ({ secretQuizContract, secretQuizContractAddress } = await deployFixture());
  });

  describe("Quiz Creation", function () {
    it("should create a quiz with encrypted answers", async function () {
      const title = "Math Quiz";
      const description = "Basic math questions";
      const category = 0; // Technology
      const difficulty = 0; // Easy
      const questionTexts = ["What is 2 + 2?", "What is 10 - 5?"];
      const rewardAmount = 100n;
      const passThreshold = 150n; // Need 150/200 points to pass

      // Encrypt correct answers: 4 and 5
      const answer1 = 4n;
      const answer2 = 5n;

      const encryptedAnswer1 = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(answer1)
        .encrypt();

      const encryptedAnswer2 = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(answer2)
        .encrypt();

      const tx = await secretQuizContract.connect(signers.creator).createQuiz(
        title,
        description,
        category,
        difficulty,
        questionTexts,
        [0, 0], // questionTypes: both fill-in-blank
        ["", ""], // questionOptions: empty for fill-in questions
        [encryptedAnswer1.handles[0], encryptedAnswer2.handles[0]],
        [encryptedAnswer1.inputProof, encryptedAnswer2.inputProof],
        rewardAmount,
        passThreshold
      );

      await tx.wait();

      const quiz = await secretQuizContract.getQuiz(0);
      expect(quiz.creator).to.eq(signers.creator.address);
      expect(quiz.title).to.eq(title);
      expect(quiz.questionCount).to.eq(2);
      expect(quiz.isActive).to.eq(true);
      expect(quiz.rewardAmount).to.eq(rewardAmount);
    });

    it("should fail to create quiz with mismatched arrays", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await expect(
        secretQuizContract.connect(signers.creator).createQuiz(
          "Test",
          "Description",
          0,
          0,
          ["Question 1", "Question 2"],
          [0, 0], // questionTypes
          ["", ""], // questionOptions
          [encryptedAnswer.handles[0]], // Only 1 answer but 2 questions
          [encryptedAnswer.inputProof],
          100n,
          50n
        )
      ).to.be.revertedWith("Questions and answers length mismatch");
    });
  });

  describe("Answer Submission", function () {
    let quizId: number;

    beforeEach(async function () {
      // Create a quiz first
      const questionTexts = ["What is 2 + 2?"];
      const correctAnswer = 4n;

      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(correctAnswer)
        .encrypt();

      const tx = await secretQuizContract.connect(signers.creator).createQuiz(
        "Math Quiz",
        "Basic math",
        0,
        0,
        questionTexts,
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      await tx.wait();
      quizId = 0;
    });

    it("should submit encrypted answers and calculate score", async function () {
      // User submits correct answer: 4
      const userAnswer = 4n;

      const encryptedUserAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(userAnswer)
        .encrypt();

      const tx = await secretQuizContract.connect(signers.participant).submitAnswers(
        quizId,
        [encryptedUserAnswer.handles[0]],
        [encryptedUserAnswer.inputProof]
      );

      await tx.wait();

      const submission = await secretQuizContract.getSubmission(0);
      expect(submission.participant).to.eq(signers.participant.address);
      expect(submission.quizId).to.eq(quizId);

      // Decrypt score
      const encryptedScore = await secretQuizContract.getEncryptedScore(0);
      const decryptedScore = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedScore,
        secretQuizContractAddress,
        signers.participant
      );

      // Correct answer = 100 points
      expect(decryptedScore).to.eq(100n);
    });

    it("should calculate zero score for wrong answer", async function () {
      // User submits wrong answer: 5 (correct is 4)
      const userAnswer = 5n;

      const encryptedUserAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(userAnswer)
        .encrypt();

      const tx = await secretQuizContract.connect(signers.participant).submitAnswers(
        quizId,
        [encryptedUserAnswer.handles[0]],
        [encryptedUserAnswer.inputProof]
      );

      await tx.wait();

      // Decrypt score
      const encryptedScore = await secretQuizContract.getEncryptedScore(0);
      const decryptedScore = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedScore,
        secretQuizContractAddress,
        signers.participant
      );

      // Wrong answer = 0 points
      expect(decryptedScore).to.eq(0n);
    });

    it("should prevent duplicate submissions", async function () {
      const userAnswer = 4n;

      const encryptedUserAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(userAnswer)
        .encrypt();

      // First submission
      await secretQuizContract.connect(signers.participant).submitAnswers(
        quizId,
        [encryptedUserAnswer.handles[0]],
        [encryptedUserAnswer.inputProof]
      );

      // Second submission should fail
      const encryptedUserAnswer2 = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(userAnswer)
        .encrypt();

      await expect(
        secretQuizContract.connect(signers.participant).submitAnswers(
          quizId,
          [encryptedUserAnswer2.handles[0]],
          [encryptedUserAnswer2.inputProof]
        )
      ).to.be.revertedWith("Already submitted");
    });
  });

  describe("Result Decryption", function () {
    it("should allow user to decrypt their own results", async function () {
      // Create quiz
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      // Submit answer
      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      // Allow decryption
      const tx = await secretQuizContract.connect(signers.participant).allowResultDecryption(0);
      await tx.wait();

      const submission = await secretQuizContract.getSubmission(0);
      expect(submission.hasDecrypted).to.eq(true);
    });

    it("should prevent non-owner from allowing decryption", async function () {
      // Create and submit quiz
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      // Try to allow decryption from different user
      await expect(
        secretQuizContract.connect(signers.creator).allowResultDecryption(0)
      ).to.be.revertedWith("Not your submission");
    });
  });

  describe("Reward Claiming", function () {
    it("should allow claiming reward for passing score", async function () {
      // Create quiz with passThreshold = 80
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n, // reward amount
        80n // pass threshold
      );

      // Submit correct answer (100 points)
      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      // Allow decryption
      await secretQuizContract.connect(signers.participant).allowResultDecryption(0);

      // Decrypt score
      const encryptedScore = await secretQuizContract.getEncryptedScore(0);
      const decryptedScore = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedScore,
        secretQuizContractAddress,
        signers.participant
      );

      // Claim reward
      const tx = await secretQuizContract.connect(signers.participant).claimReward(0, decryptedScore);
      await tx.wait();

      const points = await secretQuizContract.userPoints(signers.participant.address);
      expect(points).to.eq(100n);
    });

    it("should prevent claiming reward without decryption", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      // Try to claim without decryption
      await expect(
        secretQuizContract.connect(signers.participant).claimReward(0, 100n)
      ).to.be.revertedWith("Must decrypt first");
    });

    it("should prevent claiming reward for failing score", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n // pass threshold
      );

      // Submit wrong answer (0 points)
      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(99n) // Wrong answer
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      await secretQuizContract.connect(signers.participant).allowResultDecryption(0);

      // Try to claim with score below threshold
      await expect(
        secretQuizContract.connect(signers.participant).claimReward(0, 0n)
      ).to.be.revertedWith("Score below threshold");
    });
  });

  describe("Quiz Management", function () {
    it("should end quiz (creator only)", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      const tx = await secretQuizContract.connect(signers.creator).endQuiz(0);
      await tx.wait();

      const quiz = await secretQuizContract.getQuiz(0);
      expect(quiz.isActive).to.eq(false);
    });

    it("should prevent non-creator from ending quiz", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      await expect(
        secretQuizContract.connect(signers.participant).endQuiz(0)
      ).to.be.revertedWith("Not quiz creator");
    });
  });

  describe("View Functions", function () {
    it("should get user submissions", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      const userAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.participant.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.participant).submitAnswers(
        0,
        [userAnswer.handles[0]],
        [userAnswer.inputProof]
      );

      const submissions = await secretQuizContract.getUserSubmissions(signers.participant.address);
      expect(submissions.length).to.eq(1);
      expect(submissions[0]).to.eq(0n);
    });

    it("should get creator quizzes", async function () {
      const encryptedAnswer = await fhevm
        .createEncryptedInput(secretQuizContractAddress, signers.creator.address)
        .add64(42n)
        .encrypt();

      await secretQuizContract.connect(signers.creator).createQuiz(
        "Test Quiz",
        "Description",
        0,
        0,
        ["Question"],
        [0], // questionTypes
        [""], // questionOptions
        [encryptedAnswer.handles[0]],
        [encryptedAnswer.inputProof],
        100n,
        80n
      );

      const quizzes = await secretQuizContract.getCreatorQuizzes(signers.creator.address);
      expect(quizzes.length).to.eq(1);
      expect(quizzes[0]).to.eq(0n);
    });
  });
});

