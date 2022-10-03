const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../../utils/move-blocks")

async function addLiquidity() {
    const token0 = await ethers.getContract("TestToken")
    const token1 = await ethers.getContract("TestToken1")
    const ammSwap = await ethers.getContract("AMMSwap")
    const txAllowanceToken0 = await token0.increaseAllowance(ammSwap.address, token0.totalSupply())
    await txAllowanceToken0.wait(1)
    const txAllowanceToken1 = await token1.increaseAllowance(ammSwap.address, token1.totalSupply())
    await txAllowanceToken1.wait(1)
    const addLiquidity = await ammSwap.addLiquidity(10000, 10000)
    await addLiquidity.wait(1)

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

addLiquidity()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
