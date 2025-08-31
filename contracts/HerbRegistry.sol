// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HerbRegistry {
    struct Event {
        uint256 timestamp;
        string actor;
        string data;
    }

    struct Batch {
        bytes32 batchId;      // <-- use bytes32 key
        address owner;
        string metadataURI;
        Event[] events;
    }

    mapping(bytes32 => Batch) private batches;
    bytes32[] public batchIds;

    event BatchCreated(bytes32 batchId, address owner, string metadataURI);
    event BatchUpdated(bytes32 batchId, string actor, string data);

    function createBatch(string calldata batchIdStr, address owner, string calldata metadataURI) external {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        require(batches[batchId].owner == address(0), "batch exists");
        Batch storage b = batches[batchId];
        b.batchId = batchId;
        b.owner = owner;
        b.metadataURI = metadataURI;
        batchIds.push(batchId);
        emit BatchCreated(batchId, owner, metadataURI);
    }

    function addEvent(string calldata batchIdStr, string calldata actor, string calldata data) external {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        require(batches[batchId].owner != address(0), "batch missing");
        Batch storage b = batches[batchId];
        b.events.push(Event(block.timestamp, actor, data));
        emit BatchUpdated(batchId, actor, data);
    }

    function getBatchOwner(string calldata batchIdStr) external view returns (address) {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        return batches[batchId].owner;
    }

    function getBatchMetadata(string calldata batchIdStr) external view returns (string memory) {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        return batches[batchId].metadataURI;
    }
}
