const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("AMMSwap Tests", function () {
          let testToken0, testToken1, AMMSwap, deployer, player
          const AMOUNT = 100
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              testToken0 = await ethers.getContract("TestToken")
              testToken1 = await ethers.getContract("TestToken1")
              AMMSwap = await ethers.getContract("AMMSwap")
          })
          describe("Constructor", function () {
              it("Should properly set tokens addresses", async function () {
                  const token0 = await AMMSwap.getAddressToken0()
                  const token1 = await AMMSwap.getAddressToken1()
                  const owner = await AMMSwap.getOwner()
                  assert.equal(token0, testToken0.address)
                  assert.equal(token1, testToken1.address)
                  assert.equal(owner, deployer.address)
              })
          })

          describe("Add Liquidity", function () {
              it("Should not add if allowance for both tokens is too low", async function () {
                  await expect(AMMSwap.addLiquidity(AMOUNT, AMOUNT)).to.be.revertedWith(
                      "AMMSwap__NotEnoughAllowance"
                  )
              })
              it("Should not if allowance for second token is low", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  await expect(AMMSwap.addLiquidity(AMOUNT, AMOUNT)).to.be.revertedWith(
                      "AMMSwap__NotEnoughAllowance"
                  )
              })
              it("Should not if allowance for first tokens is low", async function () {
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT)
                  await expect(AMMSwap.addLiquidity(AMOUNT, AMOUNT)).to.be.revertedWith(
                      "AMMSwap__NotEnoughAllowance"
                  )
              })
              it("Should not add if shares <=0", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT)
                  //Adding for first time
                  await expect(AMMSwap.addLiquidity(AMOUNT, 0)).to.be.revertedWith(
                      "AMMSwap__SharesIsZero"
                  )
              })
              it("Should not add if formula is not right", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT * 2)
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT * 2)
                  //Adding for first time to update balances
                  await AMMSwap.addLiquidity(AMOUNT, AMOUNT)
                  //Adding for first time with different amounts
                  await expect(AMMSwap.addLiquidity(AMOUNT, AMOUNT - 1)).to.be.revertedWith(
                      "AMMSwap__PriceIsNotEqual"
                  )
              })
              it("Should properly add liquadity", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT)
                  expect(await AMMSwap.addLiquidity(AMOUNT, AMOUNT)).to.emit("LiquidityAdded")
                  const balanceOfToken0FromContract = await AMMSwap.getBalanceOfToken0()
                  const balanceOfToken0 = await testToken0.balanceOf(AMMSwap.address)
                  const balanceOfToken1FromContract = await AMMSwap.getBalanceOfToken1()
                  const balanceOfToken1 = await testToken1.balanceOf(AMMSwap.address)
                  const shares = await AMMSwap.getBalanceOfShares(deployer.address)
                  const totalSupply = await AMMSwap.getTotalSupply()
                  assert.equal(balanceOfToken0FromContract.toString(), balanceOfToken0.toString())
                  assert.equal(balanceOfToken1FromContract.toString(), balanceOfToken1.toString())
                  assert.equal(shares.toString(), AMOUNT.toString())
                  assert.equal(totalSupply.toString(), AMOUNT.toString())
              })
          })
          describe("Swap", function () {
              it("Should not swap if address is invalid", async function () {
                  await expect(AMMSwap.swap(deployer.address, 100)).to.be.revertedWith(
                      "AMMSwap__InvalidAddress"
                  )
              })

              it("Should not swap if amountIn <=0", async function () {
                  await expect(AMMSwap.swap(testToken0.address, 0)).to.be.revertedWith(
                      "AMMSwap__AmountIsLessThanZero"
                  )
              })
              it("Should not swap if not enough allowance", async function () {
                  await expect(AMMSwap.swap(testToken0.address, 100)).to.be.revertedWith(
                      "AMMSwap__NotEnoughAllowance"
                  )
              })
              it("Should not swap if not enough user tokens ", async function () {
                  const balanceOfToken0 = await testToken0.balanceOf(deployer.address)
                  const balanceToStake = balanceOfToken0 + 1
                  await testToken0.increaseAllowance(AMMSwap.address, balanceToStake)
                  await expect(
                      AMMSwap.swap(testToken0.address, balanceToStake)
                  ).to.be.revertedWith("AMMSwap__NotEnoughBalanceOfAccout")
              })
              it("Should not swap if not enough contract tokens", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  const totalSupply = await AMMSwap.getTotalSupply()
                  const blOfShares = await AMMSwap.getBalanceOfShares(deployer.address)
                  await AMMSwap.updateBalancesByOwner(
                      0,
                      10000,
                      totalSupply,
                      blOfShares,
                      deployer.address
                  )
                  await expect(AMMSwap.swap(testToken0.address, AMOUNT)).to.be.revertedWith(
                      "AMMSwap__NotEnoughBalanceOfContract"
                  )
              })
              it("Should properly swap tokens", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT)
                  expect(await AMMSwap.addLiquidity(AMOUNT / 2, AMOUNT / 2)).to.emit(
                      "LiquidityAdded"
                  )
                  const amountOfToken0Before = await testToken0.balanceOf(AMMSwap.address)
                  const amountOfToken1Before = await testToken1.balanceOf(AMMSwap.address)
                  expect(await AMMSwap.swap(testToken0.address, AMOUNT / 4)).to.emit(
                      "TokensSwaped"
                  )
                  const amountInWithFee = ((AMOUNT / 4) * 997) / 1000
                  const fee = AMOUNT / 4 - amountInWithFee
                  const balanceOfToken0AfterCalculated =
                      amountOfToken0Before.toNumber() + AMOUNT / 4 - Math.ceil(fee)
                  const balanceOfToken1AfterCalculated = Math.ceil(
                      amountOfToken1Before.toNumber() -
                          ((AMOUNT / 2) * amountInWithFee) / (AMOUNT / 2 + amountInWithFee)
                  )

                  const balanceOfToken0FromContractAfter = await AMMSwap.getBalanceOfToken0()
                  const balanceOfToken0After = await testToken0.balanceOf(AMMSwap.address)
                  const balanceOfToken1FromContractAfter = await AMMSwap.getBalanceOfToken1()
                  const balanceOfToken1After = await testToken1.balanceOf(AMMSwap.address)

                  assert.equal(
                      balanceOfToken0FromContractAfter.toString(),
                      balanceOfToken0After.toString()
                  )
                  assert.equal(
                      balanceOfToken1FromContractAfter.toString(),
                      balanceOfToken1After.toString()
                  )
                  assert.equal(
                      balanceOfToken0AfterCalculated.toString(),
                      balanceOfToken0After.toString()
                  )
                  assert.equal(
                      balanceOfToken1AfterCalculated.toString(),
                      balanceOfToken1After.toString()
                  )
              })
          })

          describe("Remove Liquidity", function () {
              it("Should not remove if shares 0", async function () {
                  await expect(AMMSwap.removeLiquidity(0)).to.be.revertedWith(
                      "AMMSwap__SharesIsZero"
                  )
              })
              it("Should not remove if user don't have enough shares", async function () {
                  await expect(AMMSwap.removeLiquidity(100)).to.be.revertedWith(
                      "AMMSwap__UserDontHaveEnoughShares"
                  )
              })
              it("Should not remove if total supply is <= 0", async function () {
                  await AMMSwap.updateBalancesByOwner(0, 0, 0, 10, deployer.address)
                  await expect(AMMSwap.removeLiquidity(2)).to.be.revertedWith(
                      "AMMSwap__BalanceOfTotalSupplyIsZero"
                  )
              })
              it("Should not remove if balanceOfToken0 is 0", async function () {
                  await AMMSwap.updateBalancesByOwner(0, 0, 50, 10, deployer.address)
                  await expect(AMMSwap.removeLiquidity(2)).to.be.revertedWith(
                      "AMMSwap__BalanceOfToken0IsZero"
                  )
              })

              it("Should not remove if balanceOfToken1 is 0", async function () {
                  await AMMSwap.updateBalancesByOwner(0, 0, 50, 10, deployer.address)
                  await testToken0.transfer(AMMSwap.address, 10)
                  await expect(AMMSwap.removeLiquidity(2)).to.be.revertedWith(
                      "AMMSwap__BalanceOfToken1IsZero"
                  )
              })
              it("Should propely withdraw liquadity", async function () {
                  await testToken0.increaseAllowance(AMMSwap.address, AMOUNT)
                  await testToken1.increaseAllowance(AMMSwap.address, AMOUNT)
                  expect(await AMMSwap.addLiquidity(AMOUNT, AMOUNT)).to.emit("LiquidityAdded")
                  expect(await AMMSwap.removeLiquidity(AMOUNT / 2)).to.emit("LiquidityRemoved")
                  const shares = await AMMSwap.getBalanceOfShares(deployer.address)
                  const totalSupply = await AMMSwap.getTotalSupply()
                  const balanceOfToken0 = await AMMSwap.getBalanceOfToken0()
                  const balanceOfToken1 = await AMMSwap.getBalanceOfToken1()
                  assert.equal(totalSupply.toString(), AMOUNT / 2)
                  assert.equal(shares.toString(), AMOUNT / 2)
                  assert.equal(balanceOfToken0.toString(), AMOUNT / 2)
                  assert.equal(balanceOfToken1.toString(), AMOUNT / 2)
              })
          })

          describe("Other", function () {
              it("Should not updateBalanceIfNotOwner", async function () {
                  const playerConnectedToAMMSwap = AMMSwap.connect(player)
                  await expect(
                      playerConnectedToAMMSwap.updateBalancesByOwner(1, 2, 3, 4, deployer.address)
                  ).to.be.revertedWith("AMMSwap__NotOwner")
              })
          })
      })
