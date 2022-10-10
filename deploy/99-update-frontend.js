const { ethers, network } = require("hardhat")
const fs = require("fs")

const FRONT_END_FAUCET_ADDRESSES = "../full-defi-app-hardhat-frontend/Constants/Faucet/contractAddressesFaucet.json"
const FRONT_ENF_FAUCET_ABI_FILE = "../full-defi-app-hardhat-frontend/Constants/Faucet/abiFaucet.json"

const FRONT_END_TEST_TOKEN0_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/TestToken0/contractAddressesTestToken0.json"
const FRONT_END_TEST_TOKEN0_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/TestToken0/abiTestToken0.json"

const FRONT_END_TEST_TOKEN1_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/TestToken1/contractAddressesTestToken1.json"
const FRONT_END_TEST_TOKEN1_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/TestToken1/abiTestToken1.json"

const FRONT_END_AMM_SWAP_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/AMMSwap/contractAddressesAMMSwap.json"
const FRONT_END_AMM_SWAP_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/AMMSwap/abiAMMSwap.json"

const FRONT_END_STAKING_REWARDS_ADDRESSES =
    "../full-defi-app-hardhat-frontend/Constants/StakingRewards/contractAddressesStakingRewards.json"
const FRONT_END_STAKING_REWARDS_ABI_FILE =
    "../full-defi-app-hardhat-frontend/Constants/StakingRewards/abiStakingRewards.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END == 2) {
        console.log("Updating front end")
        await updateContractAddressesTestToken0()
        await updateAbiTestToken0()
        await updateContractAddressesTestToken1()
        await updateAbiTestToken1()
        await updateContractAddressesStakingRewards()
        await updateABIStakingRewards()
        await updateContractAddressesAMMSwap()
        await updateABIAMMSwap()
        await updateContractAddressesFaucet()
        await updateAbiFaucet()
        console.log("Updated")
    }
}

async function updateContractAddressesFaucet() {
    const faucet = await ethers.getContract("Faucet")
    const chainId = network.config.chainId.toString()
    const currentFaucetAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_FAUCET_ADDRESSES, "utf8")
    )

    if (chainId in currentFaucetAddresses) {
        if (!currentFaucetAddresses[chainId].includes(faucet.address)) {
            currentFaucetAddresses[chainId].push(faucet.address)
        }
    } else {
        currentFaucetAddresses[chainId] = [faucet.address]
    }

    fs.writeFileSync(FRONT_END_FAUCET_ADDRESSES, JSON.stringify(currentFaucetAddresses))
}

async function updateAbiFaucet() {
    const faucet = await ethers.getContract("Faucet")
    fs.writeFileSync(
        FRONT_ENF_FAUCET_ABI_FILE,
        faucet.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddressesTestToken0() {
    const testToken = await ethers.getContract("TestToken")
    const chainId = network.config.chainId.toString()
    const currentTestTokenAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_TEST_TOKEN0_ADDRESSES, "utf8")
    )

    if (chainId in currentTestTokenAddresses) {
        if (!currentTestTokenAddresses[chainId].includes(testToken.address)) {
            currentTestTokenAddresses[chainId].push(testToken.address)
        }
    } else {
        currentTestTokenAddresses[chainId] = [testToken.address]
    }

    fs.writeFileSync(FRONT_END_TEST_TOKEN0_ADDRESSES, JSON.stringify(currentTestTokenAddresses))
}

async function updateAbiTestToken0() {
    const testToken = await ethers.getContract("TestToken")
    fs.writeFileSync(
        FRONT_END_TEST_TOKEN0_ABI_FILE,
        testToken.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddressesTestToken1() {
    const testToken1 = await ethers.getContract("TestToken1")
    const chainId = network.config.chainId.toString()
    const currentTestTokenAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_TEST_TOKEN1_ADDRESSES, "utf8")
    )

    if (chainId in currentTestTokenAddresses) {
        if (!currentTestTokenAddresses[chainId].includes(testToken1.address)) {
            currentTestTokenAddresses[chainId].push(testToken1.address)
        }
    } else {
        currentTestTokenAddresses[chainId] = [testToken1.address]
    }

    fs.writeFileSync(FRONT_END_TEST_TOKEN1_ADDRESSES, JSON.stringify(currentTestTokenAddresses))
}

async function updateAbiTestToken1() {
    const testToken = await ethers.getContract("TestToken")
    fs.writeFileSync(
        FRONT_END_TEST_TOKEN1_ABI_FILE,
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
    } else {
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

async function updateContractAddressesAMMSwap() {
    const AMMSwap = await ethers.getContract("AMMSwap")
    const chainId = network.config.chainId.toString()
    const currentAMMSwapAddresses = JSON.parse(
        fs.readFileSync(FRONT_END_AMM_SWAP_ADDRESSES, "utf8")
    )
    if (chainId in currentAMMSwapAddresses) {
        if (!currentAMMSwapAddresses[chainId].includes(AMMSwap.address)) {
            currentAMMSwapAddresses[chainId].push(AMMSwap.address)
        }
    } else {
        currentAMMSwapAddresses[chainId] = [AMMSwap.address]
    }
    fs.writeFileSync(FRONT_END_AMM_SWAP_ADDRESSES, JSON.stringify(currentAMMSwapAddresses))
}

async function updateABIAMMSwap() {
    const AMMSwap = await ethers.getContract("AMMSwap")
    fs.writeFileSync(
        FRONT_END_AMM_SWAP_ABI_FILE,
        AMMSwap.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ["all", "frontend"]
