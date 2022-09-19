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

                // Initial values
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address
                const amountOfStakedTokens = 5
                const stakedRatio = amountOfStakedTokens*1 // 1 is rate per 1 token

                //Stake tokens and get when this token was staked
                await playerConnectedToStakingRewards.stakeTokens(amountOfStakedTokens)
                const numberOfBlockBefore = await ethers.provider.getBlockNumber();
                const blockBefore = await ethers.provider.getBlock(numberOfBlockBefore);
                const timestampBeforeMine = blockBefore.timestamp;

                //Wait for 7 seconds and get timestamp after wait
                await network.provider.send("evm_increaseTime", [7])
                await network.provider.send("evm_mine")
                const numberOfBlockAfterMine = await ethers.provider.getBlockNumber();
                const blockAfterMine = await ethers.provider.getBlock(numberOfBlockAfterMine);
                const timestampAfterMine = blockAfterMine.timestamp;
                const difMine = timestampAfterMine-timestampBeforeMine 

                // Update rewards and get
                await playerConnectedToStakingRewards.updateRewardsStats()
                const numberOfBlockAfter = await ethers.provider.getBlockNumber();
                const blockAfter = await ethers.provider.getBlock(numberOfBlockAfter);
                const timestampAfterUpdateRewards = blockAfter.timestamp;
                const difUpdateRewards = timestampAfterUpdateRewards-timestampAfterMine
                const constRewardsByCalculating = (difUpdateRewards+difMine)*1*amountOfStakedTokens// 1 is rate per staked token

                //Declare variables
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(plAddress)
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                const finishStakingTime = await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                const startStakingTime = await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                duration = timestampAfterUpdateRewards-timestampAfterMine
                
                // Assert
                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),amountOfStakedTokens)
                assert.equal(rewards.toString(),constRewardsByCalculating)
                assert.equal(stakedRate.toString(),stakedRatio)
                assert.equal(finishStakingTime.toString(),timestampAfterUpdateRewards)
                assert.equal(duration.toString(),duration)
                assert.equal(startStakingTime.toString(),timestampAfterUpdateRewards)
            })
            it("Should stake more tokens and get proper rewards",async function(){

                //Initial values
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address
                const firstAmountOfStakedTokens = 6
                const secondAmountOfStakedTokens = 5
                const allAmountOfStakedTokens = firstAmountOfStakedTokens+secondAmountOfStakedTokens
                const firstStakedRatio = firstAmountOfStakedTokens*1
                const secondStakedRatio = allAmountOfStakedTokens*1

                //Stake tokensfirst time and get when this token was staked
                const numberOfBlockBeforeMineFirstTime = await ethers.provider.getBlockNumber();
                const blockBeforeFirstTime = await ethers.provider.getBlock(numberOfBlockBeforeMineFirstTime);
                const timestampBeforeMineFirstTime = blockBeforeFirstTime.timestamp;

                await playerConnectedToStakingRewards.stakeTokens(firstAmountOfStakedTokens)

                 //Wait for N seconds and get timestamp after wait
                 await network.provider.send("evm_increaseTime", [1])
                 await network.provider.send("evm_mine")
                 const numberOfBlockAfterMineFirstTime = await ethers.provider.getBlockNumber();
                 const blockAfterMineFirstTime = await ethers.provider.getBlock(numberOfBlockAfterMineFirstTime);
                 const timestampAfterMineFirstTime = blockAfterMineFirstTime.timestamp;
                 const difMineFirstTime = timestampAfterMineFirstTime-timestampBeforeMineFirstTime
                 const rewardByCalculatingFirst = difMineFirstTime*firstStakedRatio

                //Stake tokens second time and get when this token was staked
                await playerConnectedToStakingRewards.stakeTokens(secondAmountOfStakedTokens)
                const numberOfBlockBeforeSecondTime = await ethers.provider.getBlockNumber();
                const blockBeforeSecondTime = await ethers.provider.getBlock(numberOfBlockBeforeSecondTime);
                const timestampBeforeMineSecondTime = blockBeforeSecondTime.timestamp;

                 //Wait for N seconds and get timestamp after wait
                 await network.provider.send("evm_increaseTime", [2])
                 await network.provider.send("evm_mine")
                 const numberOfBlockAfterMineSecondTime = await ethers.provider.getBlockNumber();
                 const blockAfterMineSecondTime = await ethers.provider.getBlock(numberOfBlockAfterMineSecondTime);
                 const timestampAfterMineSecondTime = blockAfterMineSecondTime.timestamp;
                 const difMineSecondTime = timestampAfterMineSecondTime-timestampBeforeMineSecondTime
                 const rewardByCalculatingSecond = (difMineSecondTime*secondStakedRatio)
                 console.log(difMineSecondTime)
                 console.log(rewardByCalculatingSecond)


                 // Update rewards and get
                await playerConnectedToStakingRewards.updateRewardsStats()
                const numberOfBlockAfter = await ethers.provider.getBlockNumber();
                const blockAfter = await ethers.provider.getBlock(numberOfBlockAfter);
                const timestampAfterUpdateRewards = blockAfter.timestamp;
                const difUpdateRewards = timestampAfterUpdateRewards-timestampAfterMineSecondTime
                const rewardAfterUpdating = difUpdateRewards*secondStakedRatio
                const rewardByCalculating = rewardByCalculatingFirst+rewardByCalculatingSecond+rewardAfterUpdating


                //Assert
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(plAddress)
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                const finishStakingTime = await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                const startStakingTime = await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                duration = timestampAfterUpdateRewards-timestampAfterMineSecondTime

                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),allAmountOfStakedTokens)
                assert.equal(rewards.toString(),rewardByCalculating)
                assert.equal(stakedRate.toString(),secondStakedRatio)
                assert.equal(finishStakingTime.toString(),timestampAfterUpdateRewards)
                assert.equal(duration.toString(),duration)
                assert.equal(startStakingTime.toString(),timestampAfterUpdateRewards)
            })
        })
})
