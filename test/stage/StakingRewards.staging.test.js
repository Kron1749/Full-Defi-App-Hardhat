const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("StakingRewards Tests", function () {
        let testToken, stakingRewards, deployer,deployerAd
          const AMOUNT_OF_REWARD_TOKEN = 1000
          const STAKE_RATIO = 1
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              testToken = await ethers.getContract("TestToken",deployer)
              stakingRewards = await ethers.getContract("StakingRewards",deployer)  
          }) 
          describe("Full Test",function(){
            it("Should stake tokens,more tokens,withdraw tokens,withdraw rewards",async function(){
              const initialStakedTokens = await stakingRewards.getTokensStaked(deployer)
              console.log(`InitialStakedTokens ${initialStakedTokens}`)  

              const initialBalance = await testToken.balanceOf(deployer)
              console.log(`InitialBalance ${initialBalance.toString()}`)  


              console.log("Let's transfer token to staking contract")  
              const txTransferToStakingRewards = await testToken.transfer(stakingRewards.address, AMOUNT_OF_REWARD_TOKEN)
              console.log("Let's wait...")
              await txTransferToStakingRewards.wait(1)
              console.log("Transfered tokens to staking contract")


              console.log("Increase allowance for stakingRewards")
              const txIncreaseAllowance = await testToken.increaseAllowance(
                stakingRewards.address,
                testToken.totalSupply()
                )
                console.log("Let's wait...")
              await txIncreaseAllowance.wait(1)  
              console.log("Increased allowance")

                const firstAmountToStake = 5
                const secondAmountToStake = 6
                const totalAmountToStake = firstAmountToStake+secondAmountToStake
                const firstStakeRatio = firstAmountToStake * STAKE_RATIO
                const secondStakeRatio = totalAmountToStake*STAKE_RATIO
                
                console.log("Let's stake tokens")
                const txStakeFirst = await stakingRewards.stakeTokens(firstAmountToStake)
                console.log("Waiting...")
                await txStakeFirst.wait(1)
                console.log("Tokens staked")
                const timeStampAfterFirstStake = await getTimeStamp(
                  await ethers.provider.getBlockNumber()
                )

                console.log("Let's stake second time")        
                const txStakeSecond = await stakingRewards.stakeTokens(secondAmountToStake)
                console.log("Waiting...")
                await txStakeSecond.wait(1)
                console.log("Tokens staked second time")
                const timestampAfterSecondStake = await getTimeStamp(
                  await ethers.provider.getBlockNumber()
                )
                const ditTimeStampFirstStake = (timestampAfterSecondStake-timeStampAfterFirstStake)
                const rewardAfterFirstStake = ditTimeStampFirstStake*firstStakeRatio

                console.log("Let's withdraw tokens")
                const txWithdrawTokens = await stakingRewards.withdrawTokens(totalAmountToStake)
                console.log("Waiting")
                await txWithdrawTokens.wait(1)
                console.log("Tokens withdrawed")
                const timestampAfterWithdraw = await getTimeStamp(
                  await ethers.provider.getBlockNumber()
                )
                const difTimeStampAfterSecondStake = (timestampAfterWithdraw-timestampAfterSecondStake)
                const rewardAfterSecondStake = difTimeStampAfterSecondStake*secondStakeRatio
                
                console.log("Let's get staked tokens left in contract")
                const tokensStakedLeft = await stakingRewards.getTokensStaked(deployer)  
                console.log(`Token Staked Left ${tokensStakedLeft}`)
                const rewardBy = await stakingRewards.getRewards(deployer)
                console.log(`Rewards not calculated ${rewardBy}`)
                console.log("Let's withdraw rewards")
                const txWithdrawRewards = await stakingRewards.withdrawRewards()
                console.log("Waiting...")
                await txWithdrawRewards.wait(1)
                console.log("Rewards withdrawed")

                const balance = await testToken.balanceOf(deployer)
                console.log(`Balance after operations ${balance.toString()}`)
                console.log(`Total rewards ${rewards.toString()}`)
                const totalRewardsCalculated = rewardAfterFirstStake+rewardAfterSecondStake 
                const balanceCalculated = initialBalance-AMOUNT_OF_REWARD_TOKEN+rewards
                assert.equal(rewardBy.toString(),totalRewardsCalculated.toString())
                assert.equal(tokensStakedLeft.toString(),initialStakedTokens.toString())
                assert.equal(balanceCalculated.toString(),balance.toString())
            })
          })
})

async function getTimeStamp(_block) {
    const block = await ethers.provider.getBlock(_block)
    const timestamp = block.timestamp
    return timestamp
}