const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../../utils/move-blocks")

async function updateData() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const stakingRewards = await ethers.getContract("StakingRewards")
    const stakingToken = await ethers.getContract("TestToken")
    const t1 = await ethers.getContract("TestToken1")
    const faucet = await ethers.getContract("Faucet")
    const txUpdateRewards = await stakingRewards.updateRewardsStats()
    await txUpdateRewards.wait(1)
    const token0 = await stakingToken.balanceOf(faucet.address)
    const token1 = await t1.balanceOf(faucet.address)
    const rewards = await stakingRewards.getRewards(deployer.address)
    const tokenStaked = await stakingRewards.getTokensStaked(deployer.address)
    const stakedRate = await stakingRewards.getStakedRate(deployer.address)
    const balanceOfUser = await stakingToken.balanceOf(deployer.address)
    const balanceOfContract = await stakingToken.balanceOf(stakingRewards.address)
    console.log(`Faucet balance token0 ${token0.toString()}`)
    console.log(`Faucet balance token1 ${token1.toString()}`)
    console.log(`Rewards ${rewards.toString()}`)
    console.log(`TokenStaked ${tokenStaked.toString()}`)
    console.log(`Staked Rate ${stakedRate.toString()}`)
    console.log(`Balance of user ${balanceOfUser.toString()}`)
    console.log(`Balance of contract ${balanceOfContract.toString()}`)

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

updateData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
