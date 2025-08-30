// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HerbRegistry {
    struct HerbBatch {
        string batchId; // external unique batch identifier
        bytes32 metadataHash; // hash of JSON metadata stored off-chain/IPFS
        address farmer;
        uint256 harvestedAt;
        address currentOwner;
    }

    mapping(string => HerbBatch) private batches;
    event BatchRegistered(string batchId, address indexed farmer, bytes32 metadataHash);
    event OwnershipTransferred(string batchId, address indexed from, address indexed to);

    function registerBatch(string calldata batchId, bytes32 metadataHash, uint256 harvestedAt) external {
        require(bytes(batches[batchId].batchId).length == 0, "Batch exists");
        HerbBatch memory b = HerbBatch({
            batchId: batchId,
            metadataHash: metadataHash,
            farmer: msg.sender,
            harvestedAt: harvestedAt,
            currentOwner: msg.sender
        });
        batches[batchId] = b;
        emit BatchRegistered(batchId, msg.sender, metadataHash);
    }

    function transferOwnership(string calldata batchId, address newOwner) external {
        HerbBatch storage b = batches[batchId];
        require(bytes(b.batchId).length != 0, "Not found");
        require(msg.sender == b.currentOwner, "Not owner");
        address prev = b.currentOwner;
        b.currentOwner = newOwner;
        emit OwnershipTransferred(batchId, prev, newOwner);
    }

    function getBatch(string calldata batchId) external view returns (HerbBatch memory) {
        require(bytes(batches[batchId].batchId).length != 0, "Not found");
        return batches[batchId];
    }
}
