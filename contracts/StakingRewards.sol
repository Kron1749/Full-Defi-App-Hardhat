
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error StakingRewards__YouCantStakeZeroToken();
error StakingRewards__YouDontHaveEnoughBalance();
error StakingRewards__YouCantWithdrawZeroRewards();
error StakingRewards__DontHaveEnoughTokensToStake();
error StakingRewards__ContractDontHaveEnoughRewardBalance();
error StakingRewards__YouCantWithdrawZeroTokens();

contract StakingRewards {

    struct Staker {
        bool isStaking;
        uint256 tokensStaked;
        uint256 rewards;
        uint256 stakedRate;
        uint256 startStakingTime;
        uint256 finishedStakingTime;
        uint256 duration;
    }

    event TokensStake(address indexed account, uint256 indexed amount);
    event TokensWithdraw(address indexed account, uint256 indexed amount);
    event RewardWithdraw(address indexed account, uint256 indexed amount);

    IERC20 private immutable i_stakingToken;
    IERC20 private immutable i_rewardsToken;
    mapping(address => Staker) private s_stakers;

    address private s_owner;
    uint256 public constant REWARD_FOR_ONE_TOKEN_STAKED = 1;    

    modifier updateRewards(address _account) {
        if (!s_stakers[msg.sender].isStaking) {
            s_stakers[_account].startStakingTime = block.timestamp;
        } else {
            s_stakers[_account].stakedRate =
                s_stakers[_account].tokensStaked *
                REWARD_FOR_ONE_TOKEN_STAKED;
            s_stakers[_account].finishedStakingTime = block.timestamp;
            s_stakers[_account].duration =
                s_stakers[_account].finishedStakingTime -
                s_stakers[_account].startStakingTime;
            s_stakers[_account].rewards += (s_stakers[_account].stakedRate *
                s_stakers[_account].duration);
            s_stakers[_account].startStakingTime = block.timestamp;
        }
        _;
    }

        constructor(address _stakingToken, address _rewardsToken) {
        s_owner = msg.sender;
        i_stakingToken = IERC20(_stakingToken);
        i_rewardsToken = IERC20(_rewardsToken);
    }

    function stakeTokens(uint256 _amount) external payable updateRewards(msg.sender) {
        if (_amount <= 0) {
            revert StakingRewards__YouCantStakeZeroToken();
        }
        if (i_stakingToken.balanceOf(msg.sender) < _amount) {
            revert StakingRewards__DontHaveEnoughTokensToStake();
        }
        s_stakers[msg.sender].tokensStaked += _amount;
        i_stakingToken.transferFrom(msg.sender, address(this), _amount);
        s_stakers[msg.sender].isStaking = true;
        emit TokensStake(msg.sender, _amount);
    }

    function withdrawTokens(uint256 _amount) external payable updateRewards(msg.sender) {
        if (_amount <= 0) {
            revert StakingRewards__YouCantWithdrawZeroTokens();
        }
        if (s_stakers[msg.sender].tokensStaked < _amount) {
            revert StakingRewards__YouDontHaveEnoughBalance();
        }
        s_stakers[msg.sender].tokensStaked -= _amount;
        i_stakingToken.transfer(msg.sender, _amount);
        emit TokensWithdraw(msg.sender, _amount);
    }

    function withdrawRewards() external payable updateRewards(msg.sender) {
        if (s_stakers[msg.sender].rewards == 0) {
            revert StakingRewards__YouCantWithdrawZeroRewards();
        }
        uint256 reward = s_stakers[msg.sender].rewards;
        if (i_rewardsToken.balanceOf(address(this)) < reward) {
            revert StakingRewards__ContractDontHaveEnoughRewardBalance();
        }
        s_stakers[msg.sender].rewards = 0;
        i_rewardsToken.transfer(msg.sender, reward);
        emit RewardWithdraw(msg.sender, reward);
    }

    function updateRewardsStats() external updateRewards(msg.sender) {}

    function getIsStaking(address _account) public view returns (bool) {
        return s_stakers[_account].isStaking;
    }

    function getTokensStaked(address _account) public view returns (uint256) {
        return s_stakers[_account].tokensStaked;
    }

    function getRewards(address _account) public view returns (uint256) {
        return s_stakers[_account].rewards;
    }

    function getStakedRate(address _account) public view returns (uint256) {
        return s_stakers[_account].stakedRate;
    }

    function getStartStakingTime(address _account) public view returns (uint256) {
        return s_stakers[_account].startStakingTime;
    }

    function getFinishedStakingTime(address _account) public view returns (uint256) {
        return s_stakers[_account].finishedStakingTime;
    }

    function getDuration(address _account) public view returns (uint256) {
        return s_stakers[_account].duration;
    }

    function getStakingToken() public view returns (address) {
        return address(i_stakingToken);
    }

    function getRewardToken() public view returns (address) {
        return address(i_rewardsToken);
    }

    function getOwner() public view returns (address) {
        return s_owner;
    }

}
