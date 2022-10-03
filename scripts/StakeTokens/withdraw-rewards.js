const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../../utils/move-blocks")

async function withdrawRewards() {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    const stakingRewards = await ethers.getContract("StakingRewards")
    const stakingToken = await ethers.getContract("TestToken")
    const txAllowance = await stakingToken.increaseAllowance(
        stakingRewards.address,
        stakingToken.totalSupply()
    )
    await txAllowance.wait(1)
    const rewards = await stakingRewards.getRewards(deployer.address)
    console.log(rewards.toString())
    const txWithdrawRewards = await stakingRewards.withdrawRewards()
    await txWithdrawRewards.wait(1)
    console.log("Rewards Withdraw")

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

withdrawRewards()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
