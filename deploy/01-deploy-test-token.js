const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy} = deployments
    const { deployer } = await getNamedAccounts()

    const args = [100000000000]

    const testToken = await deploy("TestToken", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    const testToken1 = await deploy("TestToken1", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })


    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(testToken.address, args)
        await verify(testToken1.address, args)
    }
}

module.exports.tags = ["all", "testtoken"]
