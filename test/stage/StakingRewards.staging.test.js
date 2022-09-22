const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("StakingRewards Tests", function () {
          let testToken, stakingRewards, deployer
          const AMOUNT_OF_REWARD_TOKEN = 1000
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              testToken = await ethers.getContract("TestToken", deployer)
              stakingRewards = await ethers.getContract("StakingRewards", deployer)
          })
          describe("Full Test", function () {
              it("Should stake tokens,more tokens,withdraw tokens,withdraw rewards", async function () {
                  console.log("Let's transfer token to staking contract")
                  const txTransferToStakingRewards = await testToken.transfer(
                      stakingRewards.address,
                      AMOUNT_OF_REWARD_TOKEN
                  )
                  console.log("Let's wait...")
                  await txTransferToStakingRewards.wait(1)
                  console.log("Transfered tokens to staking contract")

                  const initialStakedTokens = await stakingRewards.getTokensStaked(deployer)
                  console.log(`InitialStakedTokens ${initialStakedTokens}`)

                  const initialBalance = await testToken.balanceOf(deployer)
                  console.log(`InitialBalance ${initialBalance.toString()}`)

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
                  const totalAmountToStake = firstAmountToStake + secondAmountToStake

                  console.log("Let's stake tokens")
                  const txStakeFirst = await stakingRewards.stakeTokens(firstAmountToStake)
                  console.log("Waiting...")
                  await txStakeFirst.wait(1)
                  console.log("Tokens staked")

                  console.log("Let's stake second time")
                  const txStakeSecond = await stakingRewards.stakeTokens(secondAmountToStake)
                  console.log("Waiting...")
                  await txStakeSecond.wait(1)
                  console.log("Tokens staked second time")

                  console.log("Let's withdraw tokens")
                  const txWithdrawTokens = await stakingRewards.withdrawTokens(totalAmountToStake)
                  console.log("Waiting")
                  await txWithdrawTokens.wait(1)
                  console.log("Tokens withdrawed")

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

                  const balanceAfter = await testToken.balanceOf(deployer)
                  console.log(`balanceAfter not calculated ${balanceAfter.toString()}`)
                  console.log(`Balance after operations ${balanceAfter.toString()}`)
                  const rewards = balanceAfter - initialBalance
                  console.log(`Rewards calculated ${rewards}`)
                  const balananceCalculated = parseInt(initialBalance, 10) + parseInt(rewards, 10)
                  console.log(`balananceCalculated ${balananceCalculated}`)
                  assert.equal(rewardBy.toString(), rewards.toString())
                  assert.equal(tokensStakedLeft.toString(), initialStakedTokens.toString())
                  assert.equal(balananceCalculated.toString(), balanceAfter.toString())
              })
          })
      })
