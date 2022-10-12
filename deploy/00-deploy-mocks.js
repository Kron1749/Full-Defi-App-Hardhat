const { network } = require("hardhat")

const BASE_FEE = "250000000000000000"
const GAS_PRICE_LINK = 1e9
const DECIMALS = "8" // Decimals in price
const INITIAL_PRICE = "130000000000" // Initial price of eth

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
    }
}

module.exports.tags = ["all", "mocks"]
