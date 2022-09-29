const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)     ? describe.skip
: describe("AMMSwap Tests", function () {
    let testToken0,testToken1,AMMSwap,deployer
    beforeEach(async function(){
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["all"])
        testToken0 = await ethers.getContract("TestToken")
        testToken1 = await ethers.getContract("TestToken1")
        AMMSwap = await ethers.getContract("AMMSwap")
    })
    describe("Constructor",function(){
        it("Should properyl set tokens addresses",async function(){
            const token0 = await AMMSwap.getAddressToken0()
            const token1 = await AMMSwap.getAddressToken1()
            assert.equal(token0,testToken0.address)
            assert.equal(token1,testToken1.address)
        })
    })

    describe("Add Liquidity",function() {
        it("Should not add if allowance for both tokens is too low",async function(){
            await expect(AMMSwap.addLiquidity(100,100)).to.be.revertedWith("AMMSWAP_NotEnoughAllowance")
        })
        it("Should not if allowance for first token is low",async function(){

        })
        it("Should not if allowance for second tokens is low",async function(){
            
        })
        it("Should not add if formula is not right",async function(){

        })
        it("Should not add if shares <=0",async function() {

        })
        it("Shoudl properly add liquadity",async function(){

        })
    })
    describe("Swap",function(){
        it("Should not swap if address is illegal",async function(){
            await expect(AMMSwap.swap)
        })

        it("Should not swap if allowanc is too low",async function(){

        })
        it("Should swap properly",async function(){

        })

    })
    
    describe("Remove Liquidity",function(){

    })
})