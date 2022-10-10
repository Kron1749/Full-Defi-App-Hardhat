const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")


module.exports = async({getNamedAccounts,deployments})=>{
    const { deploy} = deployments
    const { deployer } = await getNamedAccounts()
    const testToken0 = await ethers.getContract("TestToken")
    const testToken1 = await ethers.getContract("TestToken1")
    const args = [testToken0.address,testToken1.address]

    const Faucet = await deploy("Faucet",{
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // If we are on a testnet
        await verify(AMMSwap.address, args)
    }
}

module.exports.tags = ["all", "faucet"]