// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken1 is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("TestToken1", "T1") {
        _mint(msg.sender, initialSupply);
    }
}