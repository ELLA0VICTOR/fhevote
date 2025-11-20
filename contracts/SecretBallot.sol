// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, externalEuint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract SecretBallot is ZamaEthereumConfig {
    struct Poll {
        string question;
        string[] options;
        mapping(uint => euint32) voteCounts;
        mapping(address => bool) hasVoted;
        address creator;
        uint256 endTime;
        bool isActive;
        uint256[] finalResults;
        bool exists;
    }
    
    mapping(uint => Poll) public polls;
    uint public pollCount;
    
    event PollCreated(uint indexed pollId, string question, address indexed creator, uint256 endTime);
    event VoteCast(uint indexed pollId, address indexed voter);
    event PollClosed(uint indexed pollId);
    event ResultsSubmitted(uint indexed pollId, uint256[] results);
    event PollDeleted(uint indexed pollId, address indexed creator);
    
    /**
     * ✅ UPDATED: Now accepts durationMinutes instead of durationHours
     * This allows for flexible poll durations including 1-minute demos
     */
    function createPoll(
        string memory question,
        string[] memory options,
        uint256 durationMinutes
    ) external returns (uint) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= 2 && options.length <= 5, "2-5 options required");
        require(durationMinutes >= 1, "Duration must be at least 1 minute");
        
        uint pollId = pollCount++;
        Poll storage poll = polls[pollId];
        poll.question = question;
        poll.options = options;
        poll.creator = msg.sender;
        
        // Convert minutes to seconds for endTime calculation
        poll.endTime = block.timestamp + (durationMinutes * 60);
        poll.isActive = true;
        poll.exists = true;
        
        // Initialize encrypted vote counts to zero
        for (uint i = 0; i < options.length; i++) {
            poll.voteCounts[i] = FHE.asEuint32(0);
            FHE.allowThis(poll.voteCounts[i]);
        }
        
        emit PollCreated(pollId, question, msg.sender, poll.endTime);
        return pollId;
    }
    
    function vote(
        uint pollId,
        externalEuint8 encryptedOption,
        bytes calldata inputProof
    ) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(poll.isActive, "Poll not active");
        require(block.timestamp < poll.endTime, "Poll ended");
        require(!poll.hasVoted[msg.sender], "Already voted");
        
        euint8 option = FHE.fromExternal(encryptedOption, inputProof);
        
        for (uint i = 0; i < poll.options.length; i++) {
            euint8 encryptedIndex = FHE.asEuint8(uint8(i));
            ebool isMatch = FHE.eq(option, encryptedIndex);
            euint32 increment = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
            poll.voteCounts[i] = FHE.add(poll.voteCounts[i], increment);
            FHE.allowThis(poll.voteCounts[i]);
        }
        
        poll.hasVoted[msg.sender] = true;
        emit VoteCast(pollId, msg.sender);
    }
    
    function closePoll(uint pollId) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(msg.sender == poll.creator, "Only creator can close");
        require(block.timestamp >= poll.endTime, "Poll not ended yet");
        require(poll.isActive, "Already closed");
        
        for (uint i = 0; i < poll.options.length; i++) {
            FHE.makePubliclyDecryptable(poll.voteCounts[i]);
        }
        
        poll.isActive = false;
        emit PollClosed(pollId);
    }
    
    function deletePoll(uint pollId) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(msg.sender == poll.creator, "Only creator can delete");
        
        poll.exists = false;
        poll.isActive = false;
        
        emit PollDeleted(pollId, msg.sender);
    }
    
    function submitResults(
        uint pollId,
        uint256[] memory decryptedResults,
        bytes memory proof
    ) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(!poll.isActive, "Poll still active");
        require(poll.finalResults.length == 0, "Results already submitted");
        require(decryptedResults.length == poll.options.length, "Invalid results length");
        
        bytes32[] memory cts = new bytes32[](poll.options.length);
        for (uint i = 0; i < poll.options.length; i++) {
            cts[i] = FHE.toBytes32(poll.voteCounts[i]);
        }
        
        bytes memory abiEncoded = abi.encode(decryptedResults);
        FHE.checkSignatures(cts, abiEncoded, proof);
        
        poll.finalResults = decryptedResults;
        emit ResultsSubmitted(pollId, decryptedResults);
    }
    
    // View functions
    function getPoll(uint pollId) external view returns (
        string memory question,
        string[] memory options,
        address creator,
        uint256 endTime,
        bool isActive
    ) {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        return (poll.question, poll.options, poll.creator, poll.endTime, poll.isActive);
    }
    
    function getVoteCount(uint pollId, uint optionIndex) external view returns (bytes32) {
        require(polls[pollId].exists, "Poll does not exist");
        require(optionIndex < polls[pollId].options.length, "Invalid option");
        return FHE.toBytes32(polls[pollId].voteCounts[optionIndex]);
    }
    
    function getFinalResults(uint pollId) external view returns (uint256[] memory) {
        require(polls[pollId].exists, "Poll does not exist");
        return polls[pollId].finalResults;
    }
    
    function hasVoted(uint pollId, address voter) external view returns (bool) {
        require(polls[pollId].exists, "Poll does not exist");
        return polls[pollId].hasVoted[voter];
    }
    
    /**
     * ✅ NEW: Get ALL existing polls (active + ended + closed)
     * Frontend will handle filtering/sorting
     */
    function getAllPollIds() external view returns (uint[] memory) {
        uint existingCount = 0;
        for (uint i = 0; i < pollCount; i++) {
            if (polls[i].exists) {
                existingCount++;
            }
        }
        
        uint[] memory existingIds = new uint[](existingCount);
        uint index = 0;
        for (uint i = 0; i < pollCount; i++) {
            if (polls[i].exists) {
                existingIds[index] = i;
                index++;
            }
        }
        
        return existingIds;
    }
    
    /**
     * Get only currently active (not expired) polls
     */
    function getActivePollIds() external view returns (uint[] memory) {
        uint activeCount = 0;
        for (uint i = 0; i < pollCount; i++) {
            if (polls[i].exists && polls[i].isActive && block.timestamp < polls[i].endTime) {
                activeCount++;
            }
        }
        
        uint[] memory activeIds = new uint[](activeCount);
        uint index = 0;
        for (uint i = 0; i < pollCount; i++) {
            if (polls[i].exists && polls[i].isActive && block.timestamp < polls[i].endTime) {
                activeIds[index] = i;
                index++;
            }
        }
        
        return activeIds;
    }
    
    function pollExists(uint pollId) external view returns (bool) {
        return polls[pollId].exists;
    }
}