const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("StakingRewards Tests",function(){
        let testToken,stakingRewards,deployer
        const AMOUNT_OF_REWARD_TOKEN= 1000
        const AMOUNT_TO_STAKE = 500
        beforeEach(async function(){
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            player = accounts[1]
            await deployments.fixture(["all"])
            testToken = await ethers.getContract("TestToken")
            stakingRewards = await ethers.getContract("StakingRewards")
            await testToken.transfer(stakingRewards.address,AMOUNT_OF_REWARD_TOKEN) // from deployer
            await testToken.transfer(player.address,AMOUNT_TO_STAKE) // from deployer
            const playerConnectedToTestToken = testToken.connect(player) // now our player could interacn with our token
            await playerConnectedToTestToken.increaseAllowance(stakingRewards.address,testToken.totalSupply()) // increase allowance for player to spend tokens
        })
        describe("Constructor",function(){
            it("Should be right owner,staking and reward tokens",async function(){
                const stakingToken = await stakingRewards.getStakingToken()
                const rewardToken = await stakingRewards.getRewardToken()
                const owner = await stakingRewards.getOwner()
                assert.equal(stakingToken,testToken.address)
                assert.equal(rewardToken,testToken.address)
                assert.equal(owner,deployer.address)
            })
            it("StakingRewards contract must have right amount of reward token and allowance",async function(){
                const amountOfRewardToken = await testToken.balanceOf(stakingRewards.address)
                const amountOfPlayerTokensForStake = await testToken.balanceOf(player.address)
                const amountOfTokensToSpend = await testToken.allowance(player.address,stakingRewards.address)
                const totalSupply = await testToken.totalSupply()
                assert.equal(amountOfRewardToken.toString(),AMOUNT_OF_REWARD_TOKEN.toString())
                assert.equal(amountOfTokensToSpend.toString(),totalSupply.toString())
                assert.equal(amountOfPlayerTokensForStake.toString(),AMOUNT_TO_STAKE.toString())
            })
        })
        describe("Staking",function(){
            it("Must stake first time and get proper values for struct",async function(){
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address
                await playerConnectedToStakingRewards.stakeTokens(1)
                const numberOfBlock = await ethers.provider.getBlockNumber();
                const block = await ethers.provider.getBlock(numberOfBlock);
                const timestamp = block.timestamp;
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(plAddress)
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                const finishStakingTime = await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                const duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                const startStakingTime = await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),1)
                assert.equal(rewards.toString(),0)
                assert.equal(stakedRate.toString(),0)
                assert.equal(finishStakingTime.toString(),0)
                assert.equal(duration.toString(),0)
                assert.equal(startStakingTime.toString(),timestamp)
            })
            it("Must stake tokens first time for N seconds and get proper reward",async function(){
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address

                //Stake 2 tokens,but not mine block
                await playerConnectedToStakingRewards.stakeTokens(2)
                const numberOfBlockBefore = await ethers.provider.getBlockNumber();
                const blockBefore = await ethers.provider.getBlock(numberOfBlockBefore);
                const timestampBefore = blockBefore.timestamp;

                //Mine block
                await network.provider.send("evm_increaseTime", [1])
                await network.provider.send("evm_mine")
                await playerConnectedToStakingRewards.updateRewardsStats()
                //Get timestamp of block
                const numberOfBlockAfter = await ethers.provider.getBlockNumber();
                const blockAfter = await ethers.provider.getBlock(numberOfBlockAfter);
                const timestampAfter = blockAfter.timestamp;



                //Declare variables
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(plAddress)
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                const finishStakingTime = await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                const startStakingTime = await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                duration = timestampAfter-timestampBefore

                // Assert
                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),2)
                assert.equal(rewards.toString(),4)
                assert.equal(stakedRate.toString(),2)
                assert.equal(finishStakingTime.toString(),timestampAfter)
                assert.equal(duration.toString(),duration)
                assert.equal(startStakingTime.toString(),timestampAfter)
            })
            it("Should stake more tokens and get proper rewards",async function(){

                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address

                //Staked for first time,but not mine block
                await playerConnectedToStakingRewards.stakeTokens(2)
                
                
                //mine block after first staking
                await network.provider.send("evm_increaseTime", [1])
                await network.provider.send("evm_mine")

               

                //Stake for second time,but not mine block
                await playerConnectedToStakingRewards.stakeTokens(2)
                
                const numberOfBlockStakedForSecondTime = await ethers.provider.getBlockNumber();
                const blockStakedForSecondTime = await ethers.provider.getBlock(numberOfBlockStakedForSecondTime);
                const timestampOfBlockMinedBeforeForSecondTime = blockStakedForSecondTime.timestamp;
                

                //mine block after second staking and wait for 2 seconds
                await network.provider.send("evm_increaseTime", [1])
                await network.provider.send("evm_mine")
                await playerConnectedToStakingRewards.updateRewardsStats()

                const numberOfBlockMinedAfterSecondStaked = await ethers.provider.getBlockNumber();
                const blockMinedAfterSecondStaked = await ethers.provider.getBlock(numberOfBlockMinedAfterSecondStaked);
                const timestampOfBlockMinedAfterSecondStaked = blockMinedAfterSecondStaked.timestamp;
                


     
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(plAddress)
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                const finishStakingTime = await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                const startStakingTime = await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                duration = timestampOfBlockMinedAfterSecondStaked-timestampOfBlockMinedBeforeForSecondTime

                //Assert
                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),4)
                assert.equal(rewards.toString(),12)
                assert.equal(stakedRate.toString(),4)
                assert.equal(finishStakingTime.toString(),timestampOfBlockMinedAfterSecondStaked)
                assert.equal(duration.toString(),duration)
                assert.equal(startStakingTime.toString(),timestampOfBlockMinedAfterSecondStaked)
            })
        })
})
