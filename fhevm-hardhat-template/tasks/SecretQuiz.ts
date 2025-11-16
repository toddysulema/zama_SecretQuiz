import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the SecretQuiz contract
 *
 *   npx hardhat --network localhost deploy --tags SecretQuiz
 *
 * 3. Interact with the SecretQuiz contract
 *
 *   npx hardhat --network localhost task:quiz:create --title "Math Quiz" --description "Basic math" --questions "What is 2+2?" --answers "4"
 *   npx hardhat --network localhost task:quiz:list
 *   npx hardhat --network localhost task:quiz:submit --quizid 0 --answers "4"
 *   npx hardhat --network localhost task:quiz:decrypt --submissionid 0
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:address
 *   - npx hardhat --network sepolia task:quiz:address
 */
task("task:quiz:address", "Prints the SecretQuiz address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const secretQuiz = await deployments.get("SecretQuiz");

  console.log("SecretQuiz address is " + secretQuiz.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:create --title "Math Quiz" --description "Basic math" --questions "What is 2+2?,What is 10-5?" --answers "4,5" --reward 100 --threshold 150
 */
task("task:quiz:create", "Creates a new quiz with encrypted answers")
  .addOptionalParam("address", "Optionally specify the SecretQuiz contract address")
  .addParam("title", "Quiz title")
  .addParam("description", "Quiz description")
  .addParam("questions", "Comma-separated question texts")
  .addParam("answers", "Comma-separated answers (numbers)")
  .addOptionalParam("reward", "Reward amount", "100")
  .addOptionalParam("threshold", "Pass threshold", "50")
  .addOptionalParam("category", "Category (0-3)", "0")
  .addOptionalParam("difficulty", "Difficulty (0-2)", "0")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretQuizDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretQuiz");
    console.log(`SecretQuiz: ${SecretQuizDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretQuizContract = await ethers.getContractAt("SecretQuiz", SecretQuizDeployment.address);

    const questionTexts = taskArguments.questions.split(",").map((q: string) => q.trim());
    const answers = taskArguments.answers.split(",").map((a: string) => BigInt(a.trim()));

    if (questionTexts.length !== answers.length) {
      throw new Error("Number of questions and answers must match");
    }

    console.log(`Creating quiz with ${questionTexts.length} questions...`);

    // Encrypt answers
    const encryptedAnswers = [];
    const inputProofs = [];

    for (let i = 0; i < answers.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(SecretQuizDeployment.address, signers[0].address)
        .add64(answers[i])
        .encrypt();

      encryptedAnswers.push(encrypted.handles[0]);
      inputProofs.push(encrypted.inputProof);
    }

    const tx = await secretQuizContract.connect(signers[0]).createQuiz(
      taskArguments.title,
      taskArguments.description,
      parseInt(taskArguments.category),
      parseInt(taskArguments.difficulty),
      questionTexts,
      encryptedAnswers,
      inputProofs,
      BigInt(taskArguments.reward),
      BigInt(taskArguments.threshold)
    );

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const totalQuizzes = await secretQuizContract.getTotalQuizzes();
    const quizId = totalQuizzes - 1n;
    console.log(`Quiz created with ID: ${quizId}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:list
 */
task("task:quiz:list", "Lists all quizzes")
  .addOptionalParam("address", "Optionally specify the SecretQuiz contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretQuizDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretQuiz");
    console.log(`SecretQuiz: ${SecretQuizDeployment.address}`);

    const secretQuizContract = await ethers.getContractAt("SecretQuiz", SecretQuizDeployment.address);

    const totalQuizzes = await secretQuizContract.getTotalQuizzes();
    console.log(`Total quizzes: ${totalQuizzes}\n`);

    for (let i = 0n; i < totalQuizzes; i++) {
      const quiz = await secretQuizContract.getQuiz(i);
      console.log(`Quiz #${i}:`);
      console.log(`  Title: ${quiz.title}`);
      console.log(`  Description: ${quiz.description}`);
      console.log(`  Creator: ${quiz.creator}`);
      console.log(`  Questions: ${quiz.questionCount}`);
      console.log(`  Reward: ${quiz.rewardAmount}`);
      console.log(`  Active: ${quiz.isActive}`);
      console.log(`  Participants: ${quiz.participantCount}\n`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:submit --quizid 0 --answers "4,5"
 */
task("task:quiz:submit", "Submits encrypted answers to a quiz")
  .addOptionalParam("address", "Optionally specify the SecretQuiz contract address")
  .addParam("quizid", "Quiz ID")
  .addParam("answers", "Comma-separated answers (numbers)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretQuizDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretQuiz");
    console.log(`SecretQuiz: ${SecretQuizDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretQuizContract = await ethers.getContractAt("SecretQuiz", SecretQuizDeployment.address);

    const quizId = BigInt(taskArguments.quizid);
    const answers = taskArguments.answers.split(",").map((a: string) => BigInt(a.trim()));

    console.log(`Submitting answers to quiz #${quizId}...`);

    // Encrypt answers
    const encryptedAnswers = [];
    const inputProofs = [];

    for (let i = 0; i < answers.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(SecretQuizDeployment.address, signers[0].address)
        .add64(answers[i])
        .encrypt();

      encryptedAnswers.push(encrypted.handles[0]);
      inputProofs.push(encrypted.inputProof);
    }

    const tx = await secretQuizContract.connect(signers[0]).submitAnswers(
      quizId,
      encryptedAnswers,
      inputProofs
    );

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const totalSubmissions = await secretQuizContract.getTotalSubmissions();
    const submissionId = totalSubmissions - 1n;
    console.log(`Submission created with ID: ${submissionId}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:decrypt --submissionid 0
 */
task("task:quiz:decrypt", "Decrypts submission score")
  .addOptionalParam("address", "Optionally specify the SecretQuiz contract address")
  .addParam("submissionid", "Submission ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SecretQuizDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretQuiz");
    console.log(`SecretQuiz: ${SecretQuizDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretQuizContract = await ethers.getContractAt("SecretQuiz", SecretQuizDeployment.address);

    const submissionId = BigInt(taskArguments.submissionid);
    const submission = await secretQuizContract.getSubmission(submissionId);

    console.log(`Decrypting score for submission #${submissionId}...`);

    const encryptedScore = await secretQuizContract.getEncryptedScore(submissionId);
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedScore,
      SecretQuizDeployment.address,
      signers[0]
    );

    console.log(`Encrypted score: ${encryptedScore}`);
    console.log(`Decrypted score: ${decryptedScore}`);

    const quiz = await secretQuizContract.getQuiz(submission.quizId);
    const passed = decryptedScore >= quiz.passThreshold;
    console.log(`Pass threshold: ${quiz.passThreshold}`);
    console.log(`Result: ${passed ? "PASSED ✓" : "FAILED ✗"}`);

    if (passed && !submission.hasClaimedReward) {
      console.log(`\nYou can claim your reward of ${quiz.rewardAmount} points!`);
      console.log(`Run: npx hardhat --network localhost task:quiz:claim --submissionid ${submissionId} --score ${decryptedScore}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:quiz:claim --submissionid 0 --score 100
 */
task("task:quiz:claim", "Claims reward for passing a quiz")
  .addOptionalParam("address", "Optionally specify the SecretQuiz contract address")
  .addParam("submissionid", "Submission ID")
  .addParam("score", "Decrypted score")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretQuizDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretQuiz");
    console.log(`SecretQuiz: ${SecretQuizDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretQuizContract = await ethers.getContractAt("SecretQuiz", SecretQuizDeployment.address);

    const submissionId = BigInt(taskArguments.submissionid);
    const score = BigInt(taskArguments.score);

    // First allow decryption if not already done
    const submission = await secretQuizContract.getSubmission(submissionId);
    if (!submission.hasDecrypted) {
      console.log("Allowing decryption first...");
      const allowTx = await secretQuizContract.connect(signers[0]).allowResultDecryption(submissionId);
      await allowTx.wait();
    }

    console.log(`Claiming reward for submission #${submissionId}...`);

    const tx = await secretQuizContract.connect(signers[0]).claimReward(submissionId, score);

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const totalPoints = await secretQuizContract.userPoints(signers[0].address);
    console.log(`Your total points: ${totalPoints}`);
  });

