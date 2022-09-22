const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function topUpContract(){
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    const stakingRewards = await ethers.getContract("StakingRewards")
    const stakingToken = await ethers.getContract("TestToken")
    const topUpContract = await stakingToken.transfer(stakingRewards.address, 1000000) // from deployer
    await topUpContract.wait(1)
    console.log("Contract toped up")

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