const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy} = deployments
    const { deployer } = await getNamedAccounts()
    const testToken = await ethers.getContract("TestToken")
    const args = [testToken.address,testToken.address]

    const stakingRewards = await deploy("StakingRewards",{
        from: deployer,
        args: args,
        log:true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // If we are on a testnet
        await verify(stakingRewards.address, args)
    }
}

module.exports.tags = ["all", "stakingreward"]
