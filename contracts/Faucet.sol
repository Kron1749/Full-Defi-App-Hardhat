
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


error Faucet__NotEnoughAllowanceToken0();
error Faucet__NotEnoughAllowanceToken1();

contract Faucet {
    uint256 public AMOUNT_TO_TRANSFER = 10000;
    
    IERC20 private immutable i_token0;
    IERC20 private immutable i_token1;
    address private s_owner;
    uint256 private s_balanceOfToken0;
    uint256 private s_balanceOfToken1;

    constructor(address _token0, address _token1) {
        s_owner = msg.sender;
        i_token0 = IERC20(_token0);
        i_token1 = IERC20(_token1);
    }

    function faucet() external {
        s_balanceOfToken0 -= AMOUNT_TO_TRANSFER;
        s_balanceOfToken1 -= AMOUNT_TO_TRANSFER;
        i_token0.transfer(msg.sender, AMOUNT_TO_TRANSFER);
        i_token1.transfer(msg.sender, AMOUNT_TO_TRANSFER);
    }

    function topUpFaucet(uint256 _amount) external  {
        if(i_token0.allowance(msg.sender, address(this))<_amount) {
            revert Faucet__NotEnoughAllowanceToken0();
        }
        if(i_token1.allowance(msg.sender, address(this))<_amount) {
            revert Faucet__NotEnoughAllowanceToken0();
        }
        i_token0.transferFrom(msg.sender, address(this), _amount);
        s_balanceOfToken0 += AMOUNT_TO_TRANSFER;
        i_token1.transferFrom(msg.sender, address(this), _amount);
        s_balanceOfToken1 += AMOUNT_TO_TRANSFER;
    }
}