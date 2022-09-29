const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")


const AMOUNT_TO_STAKE = 5

async function withdrawTokens(){
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const stakingRewards = await ethers.getContract("StakingRewards")
    const stakingToken = await ethers.getContract("TestToken")
    // const txAllowance = await stakingToken.withdrawTokens(stakingRewards.address,stakingToken.totalSupply())
    // await txAllowance.wait(1)
    const txWithdrawTokens = await stakingRewards.withdrawTokens(AMOUNT_TO_STAKE)
    await txWithdrawTokens.wait(1)
    const tokenStaked = await stakingRewards.getTokensStaked(deployer.address )
    console.log(`Tokens Staked ${tokenStaked.toString()}`)

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

withdrawTokens()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })