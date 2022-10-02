const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("AMMSwap Tests", function () {
          let testToken0, testToken1, AMMSwap, deployer
          const AMOUNT = 100
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              //   await deployments.fixture(["all"])
              testToken0 = await ethers.getContract("TestToken", deployer)
              testToken1 = await ethers.getContract("TestToken1", deployer)
              AMMSwap = await ethers.getContract("AMMSwap", deployer)
          })
          describe("AMMSwap staging test", function () {
              it("Should add liquidity,swap,withdraw liquidity", async function () {
                  const txAddIncreaseAllowanceToken0 = await testToken0.increaseAllowance(
                      AMMSwap.address,
                      AMOUNT * AMOUNT
                  )
                  await txAddIncreaseAllowanceToken0.wait(1)
                  const txAddIncreaseAllowanceToken1 = await testToken1.increaseAllowance(
                      AMMSwap.address,
                      AMOUNT * AMOUNT
                  )
                  await txAddIncreaseAllowanceToken1.wait(1)
                  //Adding liquidity

                  const initialShares = await AMMSwap.getBalanceOfShares(deployer)
                  const initialTotalSupply = await AMMSwap.getTotalSupply()
                  console.log("Let's add liquidiity2")
                  const txAddLiquidity = await AMMSwap.addLiquidity(AMOUNT, AMOUNT)
                  await txAddLiquidity.wait(1)
                  console.log("Liquidity added")

                  const balanceOfToken0FromContract = await AMMSwap.getBalanceOfToken0()
                  const balanceOfToken0 = await testToken0.balanceOf(AMMSwap.address)
                  const balanceOfToken1FromContract = await AMMSwap.getBalanceOfToken1()
                  const balanceOfToken1 = await testToken1.balanceOf(AMMSwap.address)
                  const shares = await AMMSwap.getBalanceOfShares(deployer)
                  const totalSupply = await AMMSwap.getTotalSupply()
                  assert.equal(balanceOfToken0FromContract.toString(), balanceOfToken0.toString())
                  assert.equal(balanceOfToken1FromContract.toString(), balanceOfToken1.toString())
                  assert.equal(initialShares.toNumber() + AMOUNT, shares.toNumber())
                  assert.equal(initialTotalSupply.toNumber() + AMOUNT, totalSupply.toString())

                  //Swapping tokens
                  const txSwap = await AMMSwap.swap(testToken0.address, AMOUNT / 4)
                  await txSwap.wait(1)
                  console.log("Swapped")

                  const amountInWithFee = ((AMOUNT / 4) * 997) / 1000
                  const fee = AMOUNT / 4 - amountInWithFee
                  const balanceOfToken0AfterCalculated =
                      balanceOfToken0.toNumber() + AMOUNT / 4 - Math.ceil(fee)
                  const balanceOfToken1AfterCalculated = Math.ceil(
                      balanceOfToken1.toNumber() -
                          (AMOUNT * amountInWithFee) / (AMOUNT + amountInWithFee)
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

                  //Withdrawing liquidity
                  const liquidityRemove = await AMMSwap.removeLiquidity(shares)
                  await liquidityRemove.wait(1)
                  console.log("Liquidity removed")
                  const sharesLiquidity = await AMMSwap.getBalanceOfShares(deployer)
                  const totalSupplyLiquidity = await AMMSwap.getTotalSupply()
                  const balanceOfToken0Liquidity = await AMMSwap.getBalanceOfToken0()
                  const balanceOfToken1Liquidity = await AMMSwap.getBalanceOfToken1()
                  assert.equal(totalSupplyLiquidity.toString(), 0)
                  assert.equal(sharesLiquidity.toString(), 0)
                  assert.equal(balanceOfToken0Liquidity.toString(), 0)
                  assert.equal(balanceOfToken1Liquidity.toString(), 0)
              })
          })
      })
