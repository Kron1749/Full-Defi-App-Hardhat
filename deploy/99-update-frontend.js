const { ethers, network } = require("hardhat")
const fs = require("fs")
const FRONT_END_TEST_TOKEN_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/TestToken/contractAddressesTestToken.json"
const FRONT_END_TEST_TOKEN_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/TestToken/abiTestToken.json"
const FRONT_END_STAKING_REWARDS_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/StakingRewards/contractAddressesStakingRewards.json"
const FRONT_END_STAKING_REWARDS_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/StakingRewards/abiStakingRewards.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END == true) {
        console.log("Updating front end")
        updateContractAddressesTestToken()
        updateAbiTestToken()
        updateContractAddressesStakingRewards()
        updateABIStakingRewards()
    }
}

async function updateContractAddressesTestToken() {
    const testToken = await ethers.getContract("TestToken")
    const chainId = network.config.chainId.toString()
    const currentTestTokenAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_TEST_TOKEN_ADDRESSES, "utf8")
    )
    if (chainId in currentTestTokenAddresses) {
        if (!currentTestTokenAddresses[chainId].includes(testToken.address)) {
            currentTestTokenAddresses[chainId].push(testToken.address)
        }
    }
    {
        currentTestTokenAddresses[chainId] = [testToken.address]
    }
    fs.writeFileSync(FRONT_END_TEST_TOKEN_ADDRESSES, JSON.stringify(currentTestTokenAddresses))
}

async function updateAbiTestToken() {
    const testToken = await ethers.getContract("TestToken")
    fs.writeFileSync(
        FRONT_END_TEST_TOKEN_ABI_FILE,
        testToken.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddressesStakingRewards() {
    const stakingRewards = await ethers.getContract("StakingRewards")
    const chainId = network.config.chainId.toString()
    const currentStakingRewardsAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_STAKING_REWARDS_ADDRESSES, "utf8")
    )
    if (chainId in currentStakingRewardsAddresses) {
        if (!currentStakingRewardsAddresses[chainId].includes(stakingRewards.address)) {
            currentStakingRewardsAddresses[chainId].push(stakingRewards.address)
        }
    }
    {
        currentStakingRewardsAddresses[chainId] = [stakingRewards.address]
    }
    fs.writeFileSync(
        FRONT_END_STAKING_REWARDS_ADDRESSES,
        JSON.stringify(currentStakingRewardsAddresses)
    )
}

async function updateABIStakingRewards() {
    const stakingRewards = await ethers.getContract("StakingRewards")
    fs.writeFileSync(
        FRONT_END_STAKING_REWARDS_ABI_FILE,
        stakingRewards.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ["all", "frontend"]
