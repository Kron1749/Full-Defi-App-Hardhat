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

error StakingRewards__YouCantStakeZeroToken();
error StakingRewards__YouDontHaveEnoughBalance();
error StakingRewards__YouCantWithdrawZeroRewards();


contract StakingRewards {
    IERC20 private immutable i_stakingToken;
    IERC20 private immutable i_rewardsToken;

    address private s_owner;
    uint256 public constant REWARD_FOR_ONE_TOKEN_STAKED = 1;

    // uint256 private s_amount_of_stakingToken;
    // uint256 private s_amount_of_rewardToken;

    constructor(address _stakingToken,address _rewardsToken) {
        s_owner = msg.sender;
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

    mapping(address=>Staker) private s_stakers;

    modifier onlyOwner() {
        require(msg.sender == s_owner, "not authorized");
        _;
    }

    modifier updateRewards(address _account){
        if(!s_stakers[msg.sender].isStaking) {
            s_stakers[_account].startStakingTime = block.timestamp;
        } else {
            s_stakers[_account].stakedRate = s_stakers[_account].tokensStaked*REWARD_FOR_ONE_TOKEN_STAKED;
            s_stakers[_account].finishedStakingTime = block.timestamp;
            s_stakers[_account].duration = s_stakers[_account].finishedStakingTime - s_stakers[_account].startStakingTime;
            s_stakers[_account].rewards += (s_stakers[_account].stakedRate*s_stakers[_account].duration);
            s_stakers[_account].startStakingTime = block.timestamp;
        }    
        _;
    }


    function stakeTokens(uint256 _amount) payable external updateRewards(msg.sender) {
        if(_amount<0) {revert StakingRewards__YouCantStakeZeroToken();}
        
        s_stakers[msg.sender].tokensStaked += _amount;
        // s_amount_of_stakingToken += _amount;
        i_stakingToken.transfer(msg.sender, _amount);
        s_stakers[msg.sender].isStaking = true;
    }

    function withdrawTokens(uint256 _amount) payable external updateRewards(msg.sender) {
        if(_amount<0) {revert StakingRewards__YouCantStakeZeroToken();}
        if(s_stakers[msg.sender].tokensStaked <= _amount) {revert StakingRewards__YouDontHaveEnoughBalance();}
        require(_amount > 0, "amount = 0");
        s_stakers[msg.sender].tokensStaked -= _amount;
        // s_amount_of_stakingToken -= _amount;
        i_stakingToken.transfer(msg.sender, _amount);
    }

    function withdrawRewards() payable external updateRewards(msg.sender){
        if(s_stakers[msg.sender].rewards==0) {revert StakingRewards__YouCantWithdrawZeroRewards();}
        uint reward = s_stakers[msg.sender].rewards;
        if (reward > 0) {
            s_stakers[msg.sender].rewards = 0;
            i_rewardsToken.transfer(msg.sender, reward);
        }
        // s_amount_of_rewardToken -= reward;
    }

    function updateRewardsStats() external updateRewards(msg.sender){

    }

    function supplyWithRewardToken(uint256 _amount) public {

    }

    function getIsStaking(address _account) public view returns(bool) {
        return s_stakers[_account].isStaking;
    }

    function getTokensStaked(address _account) public view returns(uint256) {
        return s_stakers[_account].tokensStaked;
    }

    function getRewards(address _account) public view returns(uint256) {
        return s_stakers[_account].rewards;
    }

    function getStakedRate(address _account) public view returns(uint256) {
        return s_stakers[_account].stakedRate;
    }

    function getStartStakingTime(address _account) public view returns(uint256) {
        return s_stakers[_account].startStakingTime;
    }

    function getFinishedStakingTime(address _account) public view returns(uint256) {
        return s_stakers[_account].finishedStakingTime;
    }

    function getDuration(address _account) public view returns(uint256) {
        return s_stakers[_account].duration;
    }

    function getStakingToken() public view returns(address){
        return address(i_stakingToken);
    }

    function getRewardToken() public view returns(address) {
        return address(i_rewardsToken);
    }

    function getOwner() public view returns(address) {
        return s_owner;
    }

    // function getAmountOfStakingTokens() public view returns(uint256) {
    //     return s_amount_of_stakingToken;
    // }

    // function getAmountOfRewardTokens() public view returns(uint256) {
    //     return s_amount_of_rewardToken;
    // }

    


}