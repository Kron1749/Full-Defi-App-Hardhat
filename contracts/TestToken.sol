// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("TestToke", "TT") {
        _mint(msg.sender, initialSupply);
    }

    mapping(address => bool) stakeHolders;
    mapping(address => uint256) stakeSize;
    uint256 totalStake;

    function addStakeHolder(address _stakeHolder) public {
        if (!stakeHolders[_stakeHolder]) {
            stakeHolders[_stakeHolder] = true;
        }
    }

    function removeStakeHolder(address _stakeHolder) public {
        if (stakeHolders[_stakeHolder]) {
            stakeHolders[_stakeHolder] = false;
        }
    }

    function getStakeOf(address _stakeHolder) public view returns (uint256) {
        return stakeSize[_stakeHolder];
    }

    function getTotalStake() public view returns (uint256) {
        return totalStake;
    }
}
