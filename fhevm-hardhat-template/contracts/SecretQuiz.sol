// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretQuiz - Privacy-Preserving Knowledge Quiz Platform
/// @author SecretQuiz Team
/// @notice Encrypted quiz system where answers and scores remain private
/// @dev Uses FHEVM for fully homomorphic encryption
contract SecretQuiz is ZamaEthereumConfig {
    /// @notice Quiz structure
    struct Quiz {
        address creator;
        string title;
        string description;
        uint8 category; // 0=Technology, 1=Science, 2=Business, 3=Custom
        uint8 difficulty; // 0=Easy, 1=Medium, 2=Hard
        uint8 questionCount;
        uint64 rewardAmount; // Points reward
        uint64 passThreshold; // Minimum score to pass
        bool isActive;
        uint256 createdAt;
        uint256 participantCount;
    }

    /// @notice User submission structure
    struct Submission {
        address participant;
        uint256 quizId;
        euint64 encryptedScore;
        uint256 submittedAt;
        bool hasDecrypted;
        bool hasClaimedReward;
    }

    /// @notice Question structure (stored encrypted)
    struct Question {
        string questionText;
        euint64 encryptedAnswer; // Encrypted correct answer
        uint8 questionType; // 0=Fill-in-blank, 1=Single-choice
        string options; // For single-choice: options separated by "|" (e.g., "A|B|C|D")
    }

    // State variables
    uint256 private _nextQuizId;
    uint256 private _nextSubmissionId;

    mapping(uint256 => Quiz) public quizzes;
    mapping(uint256 => mapping(uint256 => Question)) private _questions; // quizId => questionIndex => Question
    mapping(uint256 => Submission) public submissions;
    mapping(address => uint256[]) private _userSubmissions;
    mapping(address => uint256[]) private _creatorQuizzes;
    mapping(address => uint64) public userPoints; // Public points balance
    mapping(bytes32 => bool) private _submissionExists; // hash(quizId, participant) => exists

    // Events
    event QuizCreated(uint256 indexed quizId, address indexed creator, string title);
    event QuizEnded(uint256 indexed quizId);
    event AnswersSubmitted(uint256 indexed submissionId, uint256 indexed quizId, address indexed participant);
    event ResultDecrypted(uint256 indexed submissionId, address indexed participant);
    event RewardClaimed(uint256 indexed submissionId, address indexed participant, uint64 amount);

    /// @notice Creates a new quiz with encrypted answers
    /// @param title Quiz title
    /// @param description Quiz description
    /// @param category Quiz category
    /// @param difficulty Quiz difficulty
    /// @param questionTexts Array of question texts
    /// @param questionTypes Array of question types (0=Fill-in, 1=Single-choice)
    /// @param questionOptions Array of options (for single-choice, pipe-separated; empty for fill-in)
    /// @param encryptedAnswers Array of encrypted answers (externalEuint64)
    /// @param inputProofs Array of input proofs for answers
    /// @param rewardAmount Reward amount in points
    /// @param passThreshold Minimum score to pass
    function createQuiz(
        string calldata title,
        string calldata description,
        uint8 category,
        uint8 difficulty,
        string[] calldata questionTexts,
        uint8[] calldata questionTypes,
        string[] calldata questionOptions,
        externalEuint64[] calldata encryptedAnswers,
        bytes[] calldata inputProofs,
        uint64 rewardAmount,
        uint64 passThreshold
    ) external returns (uint256) {
        require(questionTexts.length > 0, "At least one question required");
        require(questionTexts.length == questionTypes.length, "Questions and types length mismatch");
        require(questionTexts.length == questionOptions.length, "Questions and options length mismatch");
        require(questionTexts.length == encryptedAnswers.length, "Questions and answers length mismatch");
        require(questionTexts.length == inputProofs.length, "Questions and proofs length mismatch");
        require(category <= 3, "Invalid category");
        require(difficulty <= 2, "Invalid difficulty");

        uint256 quizId = _nextQuizId++;

        quizzes[quizId] = Quiz({
            creator: msg.sender,
            title: title,
            description: description,
            category: category,
            difficulty: difficulty,
            questionCount: uint8(questionTexts.length),
            rewardAmount: rewardAmount,
            passThreshold: passThreshold,
            isActive: true,
            createdAt: block.timestamp,
            participantCount: 0
        });

        // Store encrypted questions
        for (uint256 i = 0; i < questionTexts.length; i++) {
            require(questionTypes[i] <= 1, "Invalid question type");
            euint64 encAnswer = FHE.fromExternal(encryptedAnswers[i], inputProofs[i]);
            FHE.allowThis(encAnswer);
            
            _questions[quizId][i] = Question({
                questionText: questionTexts[i],
                encryptedAnswer: encAnswer,
                questionType: questionTypes[i],
                options: questionOptions[i]
            });
        }

        _creatorQuizzes[msg.sender].push(quizId);

        emit QuizCreated(quizId, msg.sender, title);

        return quizId;
    }

    /// @notice Submits encrypted answers for a quiz
    /// @param quizId Quiz ID
    /// @param encryptedUserAnswers Array of encrypted user answers (externalEuint64)
    /// @param inputProofs Array of input proofs for user answers
    function submitAnswers(
        uint256 quizId,
        externalEuint64[] calldata encryptedUserAnswers,
        bytes[] calldata inputProofs
    ) external returns (uint256) {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.creator != address(0), "Quiz does not exist");
        require(quiz.isActive, "Quiz is not active");
        require(encryptedUserAnswers.length == quiz.questionCount, "Answer count mismatch");
        require(encryptedUserAnswers.length == inputProofs.length, "Answers and proofs length mismatch");

        bytes32 submissionKey = keccak256(abi.encodePacked(quizId, msg.sender));
        require(!_submissionExists[submissionKey], "Already submitted");

        // Calculate encrypted score
        euint64 totalScore = FHE.asEuint64(0);

        for (uint256 i = 0; i < encryptedUserAnswers.length; i++) {
            euint64 userAnswer = FHE.fromExternal(encryptedUserAnswers[i], inputProofs[i]);
            euint64 correctAnswer = _questions[quizId][i].encryptedAnswer;

            // Compare: isCorrect = (userAnswer == correctAnswer)
            ebool isCorrect = FHE.eq(userAnswer, correctAnswer);

            // Award points: if correct then pointsPerQuestion else 0
            uint64 pointsPerQuestion = 100; // Fixed 100 points per question
            euint64 questionScore = FHE.select(isCorrect, FHE.asEuint64(pointsPerQuestion), FHE.asEuint64(0));

            totalScore = FHE.add(totalScore, questionScore);
        }

        // Allow contract and user to decrypt
        FHE.allowThis(totalScore);
        FHE.allow(totalScore, msg.sender);

        uint256 submissionId = _nextSubmissionId++;

        submissions[submissionId] = Submission({
            participant: msg.sender,
            quizId: quizId,
            encryptedScore: totalScore,
            submittedAt: block.timestamp,
            hasDecrypted: false,
            hasClaimedReward: false
        });

        _userSubmissions[msg.sender].push(submissionId);
        _submissionExists[submissionKey] = true;
        quiz.participantCount++;

        emit AnswersSubmitted(submissionId, quizId, msg.sender);

        return submissionId;
    }

    /// @notice Allows user to decrypt their own score
    /// @param submissionId Submission ID
    function allowResultDecryption(uint256 submissionId) external {
        Submission storage submission = submissions[submissionId];
        require(submission.participant == msg.sender, "Not your submission");
        require(!submission.hasDecrypted, "Already allowed decryption");

        FHE.allow(submission.encryptedScore, msg.sender);
        submission.hasDecrypted = true;

        emit ResultDecrypted(submissionId, msg.sender);
    }

    /// @notice Claims reward for passing a quiz
    /// @param submissionId Submission ID
    /// @param decryptedScore Decrypted score (verified off-chain)
    function claimReward(uint256 submissionId, uint64 decryptedScore) external {
        Submission storage submission = submissions[submissionId];
        Quiz storage quiz = quizzes[submission.quizId];

        require(submission.participant == msg.sender, "Not your submission");
        require(submission.hasDecrypted, "Must decrypt first");
        require(!submission.hasClaimedReward, "Reward already claimed");
        require(decryptedScore >= quiz.passThreshold, "Score below threshold");

        submission.hasClaimedReward = true;
        userPoints[msg.sender] += quiz.rewardAmount;

        emit RewardClaimed(submissionId, msg.sender, quiz.rewardAmount);
    }

    /// @notice Ends a quiz (only creator)
    /// @param quizId Quiz ID
    function endQuiz(uint256 quizId) external {
        Quiz storage quiz = quizzes[quizId];
        require(quiz.creator == msg.sender, "Not quiz creator");
        require(quiz.isActive, "Quiz already ended");

        quiz.isActive = false;

        emit QuizEnded(quizId);
    }

    // View functions

    /// @notice Gets quiz details
    /// @param quizId Quiz ID
    function getQuiz(uint256 quizId) external view returns (Quiz memory) {
        return quizzes[quizId];
    }

    /// @notice Gets question text (answer remains encrypted)
    /// @param quizId Quiz ID
    /// @param questionIndex Question index
    function getQuestion(uint256 quizId, uint256 questionIndex) external view returns (
        string memory questionText,
        uint8 questionType,
        string memory options
    ) {
        require(questionIndex < quizzes[quizId].questionCount, "Invalid question index");
        Question storage q = _questions[quizId][questionIndex];
        return (q.questionText, q.questionType, q.options);
    }

    /// @notice Gets user submission
    /// @param submissionId Submission ID
    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    /// @notice Gets all submission IDs for a user
    /// @param user User address
    function getUserSubmissions(address user) external view returns (uint256[] memory) {
        return _userSubmissions[user];
    }

    /// @notice Gets all quiz IDs created by a user
    /// @param creator Creator address
    function getCreatorQuizzes(address creator) external view returns (uint256[] memory) {
        return _creatorQuizzes[creator];
    }

    /// @notice Gets total number of quizzes
    function getTotalQuizzes() external view returns (uint256) {
        return _nextQuizId;
    }

    /// @notice Gets total number of submissions
    function getTotalSubmissions() external view returns (uint256) {
        return _nextSubmissionId;
    }

    /// @notice Gets encrypted score (for decryption)
    /// @param submissionId Submission ID
    function getEncryptedScore(uint256 submissionId) external view returns (euint64) {
        return submissions[submissionId].encryptedScore;
    }

    /// @notice Checks if user has submitted to a quiz
    /// @param quizId Quiz ID
    /// @param user User address
    function hasSubmitted(uint256 quizId, address user) external view returns (bool) {
        bytes32 submissionKey = keccak256(abi.encodePacked(quizId, user));
        return _submissionExists[submissionKey];
    }
}

