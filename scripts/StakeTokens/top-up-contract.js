const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../../utils/move-blocks")

async function topUpContract() {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    const stakingRewards = await ethers.getContract("StakingRewards")
    const faucet = await ethers.getContract("Faucet")
    const stakingToken = await ethers.getContract("TestToken")
    const t1 = await ethers.getContract("TestToken1")
    const topUpContract = await stakingToken.transfer(stakingRewards.address, 1000000) // from deployer
    await topUpContract.wait(1)
    console.log("Contract Top Up")
    const increaseAllowanceToken0 = await stakingToken.increaseAllowance(faucet.address,10000000000)
    await increaseAllowanceToken0.wait(1)
    console.log("Allowance increased token0")
    const increaseAllowanceToken1 = await t1.increaseAllowance(faucet.address,10000000000)
    await increaseAllowanceToken1.wait(1)
    console.log("Allowance increased token1")
    const topUpFaucet = await faucet.topUpFaucet(50000)
    await topUpFaucet.wait(1)
    console.log("Faucet Top Up")


    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

topUpContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
