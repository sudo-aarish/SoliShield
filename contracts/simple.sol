// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SecureCounter {

    address public owner;
    uint256 private count;

    event CountUpdated(address indexed updatedBy, uint256 newCount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function increment() public onlyOwner {
        count += 1;
        emit CountUpdated(msg.sender, count);
    }

    function decrement() public onlyOwner {
        require(count > 0, "Count cannot go below zero");
        count -= 1;
        emit CountUpdated(msg.sender, count);
    }

    function reset() public onlyOwner {
        count = 0;
        emit CountUpdated(msg.sender, 0);
    }

    function getCount() public view returns (uint256) {
        return count;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}