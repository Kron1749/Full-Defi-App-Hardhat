/*

    1. Stake tokens
        1.0 Update rewards for staking
        1.1 Deposit tokens to contract
        1.2 Update how much tokens stake
    2. Withdraw tokens
        2.0 Update rewards for staking
        2.1 Update how much tokens stake
        2.2 Withdraw tokens from contract
    3. Update rewards for token staking
        3.1 Calculate rewards
            3.1.1 Get how much tokens staked
            3.1.2 Get rate for tokens staked = tokensStaked*rateForOneToken
            3.1.3 Get how long(duration) was token staked(in seconds)
                3.1.3.1 Get the start staking time
                3.1.3.2 getTime when staking was updated(were add more tokens or withdraw)
            3.1.4 NewRewards = duration*stakeRate
        3.2 Add this rewards to user rewards
    4. Withdraw rewards
        4.1 Transfer reward token from contract

    
    

*/


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract StakingRewards {
    IERC20 public immutable i_stakingToken;
    IERC20 public immutable i_rewardsToken;

    address public owner;
    uint256 public constant REWARD_FOR_ONE_TOKEN_STAKED = 1;

    constructor(address _stakingToken,address _rewardsToken) {
        owner = msg.sender;
        i_stakingToken = IERC20(_stakingToken);
        i_rewardsToken = IERC20(_rewardsToken);
    }

    struct Staker {
        bool isStaking;
        uint256 tokensStaked;
        uint256 rewards;
        uint256 stakedRate;
        uint256 startStakingTime;
        uint256 finishedStakingTime;
        uint256 duration;
    }

    mapping(address=>Staker) private stakers;

    modifier onlyOwner() {
        require(msg.sender == owner, "not authorized");
        _;
    }

    modifier updateRewards(address _account){
        if(!stakers[msg.sender].isStaking) {
            stakers[_account].startStakingTime = block.timestamp;
        } else {
            stakers[_account].stakedRate = stakers[_account].tokensStaked*REWARD_FOR_ONE_TOKEN_STAKED;
            stakers[_account].finishedStakingTime = block.timestamp;
            stakers[_account].duration = stakers[_account].finishedStakingTime - stakers[_account].startStakingTime;
            stakers[_account].rewards += (stakers[_account].stakedRate*stakers[_account].duration);
            stakers[_account].startStakingTime = block.timestamp;
        }    
        _;
    }


    function stakeTokens(uint256 _amount) external updateRewards(msg.sender) {
        require(_amount > 0, "amount = 0");
        stakers[msg.sender].tokensStaked += _amount;
        i_stakingToken.transfer(msg.sender, _amount);
        stakers[msg.sender].isStaking = true;
    }

    function withdrawTokens(uint256 _amount) external updateRewards(msg.sender) {
        require(_amount > 0, "amount = 0");
        stakers[msg.sender].tokensStaked -= _amount;
        i_stakingToken.transfer(msg.sender, _amount);
    }

    function withdrawRewards() external updateRewards(msg.sender){
        uint reward = stakers[msg.sender].rewards;
        if (reward > 0) {
            stakers[msg.sender].rewards = 0;
            i_rewardsToken.transfer(msg.sender, reward);
        }
    }

    function getIsStaking(address _account) public view returns(bool) {
        return stakers[_account].isStaking;
    }

    function getTokensStaked(address _account) public view returns(uint256) {
        return stakers[_account].tokensStaked;
    }

    function getRewards(address _account) public view returns(uint256) {
        return stakers[_account].rewards;
    }

    function getStakedRate(address _account) public view returns(uint256) {
        return stakers[_account].stakedRate;
    }

    function getStartStakingTime(address _account) public view returns(uint256) {
        return stakers[_account].startStakingTime;
    }

    function getFinishedStakingTime(address _account) public view returns(uint256) {
        return stakers[_account].finishedStakingTime;
    }

    function getDuration(address _account) public view returns(uint256) {
        return stakers[_account].duration;
    }

    


}