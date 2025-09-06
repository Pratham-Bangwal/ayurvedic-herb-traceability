// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract HerbRegistry {
    struct Event {
        uint256 timestamp;
        string actor;
        string data;
    }

    struct Batch {
        bytes32 batchId;
        address owner;
        string metadataURI;
        Event[] events;
    }

    mapping(bytes32 => Batch) private batches;
    bytes32[] public batchIds;

    event BatchCreated(bytes32 indexed batchId, address indexed owner, string metadataURI);
    event BatchUpdated(bytes32 indexed batchId, string actor, string data);
    event OwnershipTransferred(bytes32 indexed batchId, address indexed from, address indexed to);

    modifier onlyOwner(bytes32 batchId) {
        require(batches[batchId].owner == msg.sender, "Not batch owner");
        _;
    }

    function createBatch(string calldata batchIdStr, string calldata metadataURI) external {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        require(batches[batchId].owner == address(0), "Batch already exists");

        Batch storage b = batches[batchId];
        b.batchId = batchId;
        b.owner = msg.sender;
        b.metadataURI = metadataURI;
        batchIds.push(batchId);

        emit BatchCreated(batchId, msg.sender, metadataURI);
    }

    function addEvent(string calldata batchIdStr, string calldata actor, string calldata data)
        external
        onlyOwner(keccak256(abi.encodePacked(batchIdStr)))
    {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        Batch storage b = batches[batchId];
        b.events.push(Event(block.timestamp, actor, data));

        emit BatchUpdated(batchId, actor, data);
    }

    function transferOwnership(string calldata batchIdStr, address newOwner)
        external
        onlyOwner(keccak256(abi.encodePacked(batchIdStr)))
    {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        require(newOwner != address(0), "Invalid new owner");

        address prevOwner = batches[batchId].owner;
        batches[batchId].owner = newOwner;

        emit OwnershipTransferred(batchId, prevOwner, newOwner);
    }

    function getBatchOwner(string calldata batchIdStr) external view returns (address) {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        return batches[batchId].owner;
    }

    function getBatchMetadata(string calldata batchIdStr) external view returns (string memory) {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        return batches[batchId].metadataURI;
    }

    function getBatchEvents(string calldata batchIdStr) external view returns (Event[] memory) {
        bytes32 batchId = keccak256(abi.encodePacked(batchIdStr));
        return batches[batchId].events;
    }
}
