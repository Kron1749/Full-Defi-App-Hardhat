const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("StakingRewards Tests", function () {
          let testToken, stakingRewards, deployer
          const AMOUNT_OF_REWARD_TOKEN = 1000
          const AMOUNT_TO_STAKE = 500
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              testToken = await ethers.getContract("TestToken")
              stakingRewards = await ethers.getContract("StakingRewards")
              await testToken.transfer(stakingRewards.address, AMOUNT_OF_REWARD_TOKEN) // from deployer
              await testToken.transfer(player.address, AMOUNT_TO_STAKE) // from deployer
              const playerConnectedToTestToken = testToken.connect(player) // now our player could interacn with our token
              await playerConnectedToTestToken.increaseAllowance(
                  stakingRewards.address,
                  testToken.totalSupply()
              ) // increase allowance for player to spend tokens
          })
          describe("Constructor", function () {
              it("Should be right owner,staking and reward tokens", async function () {
                  const stakingToken = await stakingRewards.getStakingToken()
                  const rewardToken = await stakingRewards.getRewardToken()
                  const owner = await stakingRewards.getOwner()
                  assert.equal(stakingToken, testToken.address)
                  assert.equal(rewardToken, testToken.address)
                  assert.equal(owner, deployer.address)
              })
              it("StakingRewards contract must have right amount of reward token and allowance", async function () {
                  const amountOfRewardToken = await testToken.balanceOf(stakingRewards.address)
                  const amountOfPlayerTokensForStake = await testToken.balanceOf(player.address)
                  const amountOfTokensToSpend = await testToken.allowance(
                      player.address,
                      stakingRewards.address
                  )
                  const totalSupply = await testToken.totalSupply()
                  assert.equal(amountOfRewardToken.toString(), AMOUNT_OF_REWARD_TOKEN.toString())
                  assert.equal(amountOfTokensToSpend.toString(), totalSupply.toString())
                  assert.equal(amountOfPlayerTokensForStake.toString(), AMOUNT_TO_STAKE.toString())
              })
          })
          describe("Stake tokens", function () {
              it("Must stake first time and get proper values for struct", async function () {
                  const playerConnectedToStakingRewards = stakingRewards.connect(player)
                  const plAddress = player.address
                  expect(await playerConnectedToStakingRewards.stakeTokens(1)).to.emit("TokensStake")
                  const timestamp = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                  const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(
                      plAddress
                  )
                  const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                  const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                  const finishStakingTime =
                      await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                  const duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                  const startStakingTime =
                      await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                  assert.equal(isStaking, true)
                  assert.equal(tokensStaked.toString(), 1)
                  assert.equal(rewards.toString(), 0)
                  assert.equal(stakedRate.toString(), 0)
                  assert.equal(finishStakingTime.toString(), 0)
                  assert.equal(duration.toString(), 0)
                  assert.equal(startStakingTime.toString(), timestamp)
              })
              it("Must stake tokens first time for N seconds and get proper reward", async function () {
                  // Initial values
                  const playerConnectedToStakingRewards = stakingRewards.connect(player)
                  const plAddress = player.address
                  const amountOfStakedTokens = 5
                  const stakedRatio = amountOfStakedTokens * 1 // 1 is rate per 1 token

                  //Stake tokens and get when this token was staked
                  expect(await playerConnectedToStakingRewards.stakeTokens(amountOfStakedTokens)).to.emit("TokensStake")
                  const timestampBeforeMine = await getTimeStamp(await ethers.provider.getBlockNumber())

                  //Wait for 7 seconds and get timestamp after wait
                  await network.provider.send("evm_increaseTime", [7])
                  await network.provider.send("evm_mine")
                  const timestampAfterMine = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const difMine = timestampAfterMine - timestampBeforeMine

                  // Update rewards and get
                  await playerConnectedToStakingRewards.updateRewardsStats()
                  const timestampAfterUpdateRewards = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const difUpdateRewards = timestampAfterUpdateRewards - timestampAfterMine
                  const constRewardsByCalculating =
                      (difUpdateRewards + difMine) * 1 * amountOfStakedTokens // 1 is rate per staked token

                  //Declare variables
                  const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                  const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(
                      plAddress
                  )
                  const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                  const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                  const finishStakingTime =
                      await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                  let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                  const startStakingTime =
                      await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                  duration = timestampAfterUpdateRewards - timestampAfterMine

                  // Assert
                  assert.equal(isStaking, true)
                  assert.equal(tokensStaked.toString(), amountOfStakedTokens)
                  assert.equal(rewards.toString(), constRewardsByCalculating)
                  assert.equal(stakedRate.toString(), stakedRatio)
                  assert.equal(finishStakingTime.toString(), timestampAfterUpdateRewards)
                  assert.equal(duration.toString(), duration)
                  assert.equal(startStakingTime.toString(), timestampAfterUpdateRewards)
              })
              it("Should stake more tokens and get proper rewards", async function () {
                  //Initial values
                  const playerConnectedToStakingRewards = stakingRewards.connect(player)
                  const plAddress = player.address
                  const firstAmountOfStakedTokens = 6
                  const secondAmountOfStakedTokens = 5
                  const allAmountOfStakedTokens =
                      firstAmountOfStakedTokens + secondAmountOfStakedTokens
                  const firstStakedRatio = firstAmountOfStakedTokens * 1
                  const secondStakedRatio = allAmountOfStakedTokens * 1

                  //Stake tokensfirst time and get when this token was staked
                  const timestampBeforeMineFirstTime = await getTimeStamp(await ethers.provider.getBlockNumber())

                  expect(await playerConnectedToStakingRewards.stakeTokens(firstAmountOfStakedTokens)).to.emit("TokensStake")

                  //Wait for N seconds and get timestamp after wait
                  await network.provider.send("evm_increaseTime", [1])
                  await network.provider.send("evm_mine")
                  const timestampAfterMineFirstTime = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const difMineFirstTime =
                      timestampAfterMineFirstTime - timestampBeforeMineFirstTime
                  const rewardByCalculatingFirst = difMineFirstTime * firstStakedRatio

                  //Stake tokens second time and get when this token was staked
                  expect(await playerConnectedToStakingRewards.stakeTokens(secondAmountOfStakedTokens)).to.emit("TokensStake")
                  const timestampBeforeMineSecondTime = await getTimeStamp(await ethers.provider.getBlockNumber())

                  //Wait for N seconds and get timestamp after wait
                  await network.provider.send("evm_increaseTime", [2])
                  await network.provider.send("evm_mine")
                  const timestampAfterMineSecondTime = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const difMineSecondTime =
                      timestampAfterMineSecondTime - timestampBeforeMineSecondTime
                  const rewardByCalculatingSecond = difMineSecondTime * secondStakedRatio

                  // Update rewards and get
                  await playerConnectedToStakingRewards.updateRewardsStats()
                  const timestampAfterUpdateRewards = await getTimeStamp(await ethers.provider.getBlockNumber())
                  const difUpdateRewards =
                      timestampAfterUpdateRewards - timestampAfterMineSecondTime
                  const rewardAfterUpdating = difUpdateRewards * secondStakedRatio
                  const rewardByCalculating =
                      rewardByCalculatingFirst + rewardByCalculatingSecond + rewardAfterUpdating

                  //Assert
                  const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                  const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(
                      plAddress
                  )
                  const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                  const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                  const finishStakingTime =
                      await playerConnectedToStakingRewards.getFinishedStakingTime(plAddress)
                  let duration = await playerConnectedToStakingRewards.getDuration(plAddress)
                  const startStakingTime =
                      await playerConnectedToStakingRewards.getStartStakingTime(plAddress)
                  duration = timestampAfterUpdateRewards - timestampAfterMineSecondTime

                  assert.equal(isStaking, true)
                  assert.equal(tokensStaked.toString(), allAmountOfStakedTokens)
                  assert.equal(rewards.toString(), rewardByCalculating)
                  assert.equal(stakedRate.toString(), secondStakedRatio)
                  assert.equal(finishStakingTime.toString(), timestampAfterUpdateRewards)
                  assert.equal(duration.toString(), duration)
                  assert.equal(startStakingTime.toString(), timestampAfterUpdateRewards)
              })
              it("Should not stake tokens if amount < 0", async function () {
                  await expect(stakingRewards.stakeTokens(0)).to.be.revertedWith(
                      "StakingRewards__YouCantStakeZeroToken"
                  )
              })
              it("Should not stake if user don't have enough tokens to stake", async function () {
                  const playerConnectedToStakingRewards = stakingRewards.connect(player)
                  await expect(
                      playerConnectedToStakingRewards.stakeTokens(501)
                  ).to.be.revertedWith("StakingRewards__DontHaveEnoughTokensToStake")
              })
          })
          describe("Withdraw tokens",function(){
            it("Should properly stake tokens and withdraw",async function(){
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                const plAddress = player.address
                const tokensToStake = 10
                const tokensToWithdraw = 6
                const tokensLeft = tokensToStake-tokensToWithdraw
                const firstStakedRatio = tokensToStake *1
                const withdrawRatio = tokensLeft*1

                expect(await playerConnectedToStakingRewards.stakeTokens(tokensToStake)).to.emit("TokensStake")
                const timeStampAfterStaking = await getTimeStamp(await ethers.provider.getBlockNumber())

                expect(await playerConnectedToStakingRewards.withdrawTokens(tokensToWithdraw)).to.emit("TokensWithdraw")
                const timeStampAfterWithdrawing = await getTimeStamp(await ethers.provider.getBlockNumber())
                const rewardAfterStaking = (timeStampAfterWithdrawing-timeStampAfterStaking)*firstStakedRatio

                await playerConnectedToStakingRewards.updateRewardsStats()
                const timestampAfterRewardUpdating = await getTimeStamp(await ethers.provider.getBlockNumber())
                const rewardAfterWithdrawingTokens = (timestampAfterRewardUpdating-timeStampAfterWithdrawing)*withdrawRatio

                const rewardsCalculated = rewardAfterStaking+rewardAfterWithdrawingTokens
                const isStaking = await playerConnectedToStakingRewards.getIsStaking(plAddress)
                const tokensStaked = await playerConnectedToStakingRewards.getTokensStaked(
                      plAddress
                  )
                const rewards = await playerConnectedToStakingRewards.getRewards(plAddress)
                const stakedRate = await playerConnectedToStakingRewards.getStakedRate(plAddress)
                assert.equal(isStaking,true)
                assert.equal(tokensStaked.toString(),tokensLeft)
                assert.equal(rewards.toString(),rewardsCalculated)
                assert.equal(stakedRate.toString(),withdrawRatio)

            })
            it("Should not withdraw if amout for withdraw < 0",async function(){
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                await expect(playerConnectedToStakingRewards.withdrawTokens(0)).to.be.revertedWith("StakingRewards__YouCantWithdrawZeroOrLessTokens")
            })
            it("Should not withdraw if user don't have enough tokens",async function(){
                const playerConnectedToStakingRewards = stakingRewards.connect(player)
                await playerConnectedToStakingRewards.stakeTokens(5)
                await expect(playerConnectedToStakingRewards.withdrawTokens(6)).to.be.revertedWith("StakingRewards__YouDontHaveEnoughBalance")
            })
          })
          describe("Witdraw rewards",function(){
            
          })
      })

      async function getTimeStamp(_block) {
                    const block = await ethers.provider.getBlock(_block)
                  const timestamp = block.timestamp
                  return timestamp
      } 
