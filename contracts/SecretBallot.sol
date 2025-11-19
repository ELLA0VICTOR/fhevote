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
        bool exists; // NEW: Track if poll exists
    }
    
    mapping(uint => Poll) public polls;
    uint public pollCount;
    
    event PollCreated(uint indexed pollId, string question, address indexed creator, uint256 endTime);
    event VoteCast(uint indexed pollId, address indexed voter);
    event PollClosed(uint indexed pollId);
    event ResultsSubmitted(uint indexed pollId, uint256[] results);
    event PollDeleted(uint indexed pollId, address indexed creator); // NEW EVENT
    
    function createPoll(
        string memory question,
        string[] memory options,
        uint256 durationHours
    ) external returns (uint) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= 2 && options.length <= 5, "2-5 options required");
        
        uint pollId = pollCount++;
        Poll storage poll = polls[pollId];
        poll.question = question;
        poll.options = options;
        poll.creator = msg.sender;
        poll.endTime = block.timestamp + (durationHours * 1 hours);
        poll.isActive = true;
        poll.exists = true; // NEW: Mark as existing
        
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
        require(poll.exists, "Poll does not exist"); // NEW: Check existence
        require(poll.isActive, "Poll not active");
        require(block.timestamp < poll.endTime, "Poll ended");
        require(!poll.hasVoted[msg.sender], "Already voted");
        
        // Convert external encrypted input to usable ciphertext
        euint8 option = FHE.fromExternal(encryptedOption, inputProof);
        
        // CRITICAL FIX: Use FHE.select with pre-encrypted comparison values
        // We compare the encrypted option with encrypted index values
        for (uint i = 0; i < poll.options.length; i++) {
            // Convert plaintext index to encrypted euint8 FIRST
            euint8 encryptedIndex = FHE.asEuint8(uint8(i));
            
            // Now compare two encrypted values
            ebool isMatch = FHE.eq(option, encryptedIndex);
            
            // Increment: if match, add 1, else add 0
            euint32 increment = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
            poll.voteCounts[i] = FHE.add(poll.voteCounts[i], increment);
            FHE.allowThis(poll.voteCounts[i]);
        }
        
        poll.hasVoted[msg.sender] = true;
        emit VoteCast(pollId, msg.sender);
    }
    
    function closePoll(uint pollId) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist"); // NEW: Check existence
        require(msg.sender == poll.creator, "Only creator can close");
        require(block.timestamp >= poll.endTime, "Poll not ended yet");
        require(poll.isActive, "Already closed");
        
        // Mark all vote counts for public decryption (v0.9 method)
        for (uint i = 0; i < poll.options.length; i++) {
            FHE.makePubliclyDecryptable(poll.voteCounts[i]);
        }
        
        poll.isActive = false;
        emit PollClosed(pollId);
    }
    
    // NEW: Delete poll function
    function deletePoll(uint pollId) external {
        Poll storage poll = polls[pollId];
        require(poll.exists, "Poll does not exist");
        require(msg.sender == poll.creator, "Only creator can delete");
        
        // Mark poll as deleted
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
        require(poll.exists, "Poll does not exist"); // NEW: Check existence
        require(!poll.isActive, "Poll still active");
        require(poll.finalResults.length == 0, "Results already submitted");
        require(decryptedResults.length == poll.options.length, "Invalid results length");
        
        // Build handles array for verification
        bytes32[] memory cts = new bytes32[](poll.options.length);
        for (uint i = 0; i < poll.options.length; i++) {
            cts[i] = FHE.toBytes32(poll.voteCounts[i]);
        }
        
        // Verify decryption proof from KMS (v0.9 method)
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
        require(poll.exists, "Poll does not exist"); // NEW: Check existence
        return (poll.question, poll.options, poll.creator, poll.endTime, poll.isActive);
    }
    
    function getVoteCount(uint pollId, uint optionIndex) external view returns (bytes32) {
        require(polls[pollId].exists, "Poll does not exist"); // NEW: Check existence
        require(optionIndex < polls[pollId].options.length, "Invalid option");
        // Return as bytes32 handle for decryption
        return FHE.toBytes32(polls[pollId].voteCounts[optionIndex]);
    }
    
    function getFinalResults(uint pollId) external view returns (uint256[] memory) {
        require(polls[pollId].exists, "Poll does not exist"); // NEW: Check existence
        return polls[pollId].finalResults;
    }
    
    function hasVoted(uint pollId, address voter) external view returns (bool) {
        require(polls[pollId].exists, "Poll does not exist"); // NEW: Check existence
        return polls[pollId].hasVoted[voter];
    }
    
    function getActivePollIds() external view returns (uint[] memory) {
        uint activeCount = 0;
        for (uint i = 0; i < pollCount; i++) {
            // NEW: Check exists flag
            if (polls[i].exists && polls[i].isActive && block.timestamp < polls[i].endTime) {
                activeCount++;
            }
        }
        
        uint[] memory activeIds = new uint[](activeCount);
        uint index = 0;
        for (uint i = 0; i < pollCount; i++) {
            // NEW: Check exists flag and time-based expiry
            if (polls[i].exists && polls[i].isActive && block.timestamp < polls[i].endTime) {
                activeIds[index] = i;
                index++;
            }
        }
        
        return activeIds;
    }
    
    // NEW: Helper to check if poll exists
    function pollExists(uint pollId) external view returns (bool) {
        return polls[pollId].exists;
    }
}