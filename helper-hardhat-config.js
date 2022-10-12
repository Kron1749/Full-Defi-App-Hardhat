const networkConfig = {
    31337: {
        name: "localhost",
        subscriptionId: "10204",
        keepersUpdateInterval: "30",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "100000",
    },
    5: {
        name: "goerli",
        subscriptionId: "10204",
        keepersUpdateInterval: "30",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "100000",
    },
}

const VERIFICATION_BLOCK_CONFIRMATIONS = 5
const DECIMALS = "8" // Decimals in price
const INITIAL_ANSWER = "130000000000" // Initial price of ETH,in USD will be 1300
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    DECIMALS,
    INITIAL_ANSWER,
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
