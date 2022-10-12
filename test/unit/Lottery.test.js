const { expect, assert } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains,networkConfig} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", async () => {
        let lottery
        let deployer
        let accounts
        let VRFCoordinatorV2Mock
        let lotteryEntranceFee
        let interval
        let player
        let mockV3Aggregator
        // const sendValue = ethers.utils.parseEther("1")
        const chainId = network.config.chainId
        beforeEach(async()=>{
            accounts = await ethers.getSigners() // On local network will get 10 fake accounts
            deployer = (await getNamedAccounts()).deployer
            player = accounts[1]
            await deployments.fixture(["mocks", "lottery"])
            VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
            lotteryContract = await ethers.getContract("Lottery") // Will get the recent deployment
            lottery = lotteryContract.connect(player)
            lotteryEntranceFee = await lottery.getMinimumValue()
            interval = await lottery.getInterval()
        })
        describe("Constructor",async()=>{
            it("Should correct initialize all values",async()=>{
                const ethUsdAggregator = await ethers.getContract("MockV3Aggregator")
                ethUsdPriceFeedAddress = ethUsdAggregator.address
                const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
                vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
                const vrfCoord = (await lottery.getVrfCoordinator()).toString()
                const priceFeed = (await lottery.getPriceFeed()).toString()
                const callbackGasLimit = (await lottery.getCallBackGasLimit()).toString()
                const owner = (await lottery.getOwner()).toString()
                const subscriptionId = (await lottery.getSubscription()).toString()
                const gasLane = (await lottery.gasLane()).toString()
                const interval = (await lottery.getInterval()).toString()
                const counter = (await lottery.getCounter()).toString()
                const raffleState = (await lottery.getLotteryState()).toString()
                assert.equal(vrfCoord,vrfCoordinatorV2Address)
                assert.equal(priceFeed,ethUsdPriceFeedAddress)
                assert.equal(callbackGasLimit,networkConfig[chainId]["callbackGasLimit"])
                assert.equal(owner,deployer)
                assert.equal(subscriptionId,"1")
                assert.equal(gasLane,networkConfig[chainId]["gasLane"])
                assert.equal(interval,networkConfig[chainId]["keepersUpdateInterval"])
                assert.equal(counter,"0")
                assert.equal(raffleState,"0")
            })
        })
    })