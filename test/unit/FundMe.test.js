const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require('../../helper-hardhat.config')

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
        let fundMe, deployer, mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1")
        beforeEach(async function () {
            // const { deployer } = await getNamedAccounts()
            deployer = (await getNamedAccounts()).deployer
            // const accounts = await ethers.getSigners()
            // const accountZero = accounts[0]
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
        })

        describe("constructor", async () => {
            it("sets the aggregator addresses correctly", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })


        describe("fund", async () => {
            it("Fails if you don't send enough ETH", async function () {
                await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough money");
            })
            it("Updates the amount funded data structure", async function () {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddressToAmountFunded(deployer)
                assert.equal(response.toString(), sendValue.toString())
            })
            it("Adds funder to array of s_funders", async function () {
                await fundMe.fund({ value: sendValue })
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })

        describe("withdraw", async () => {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue })
            })

            it("withdraw ETH from a single founder", async function () {
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                const transactionResponse = await fundMe.withdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(),
                    endingDeployerBalance.add(gasCost).toString())

            })

            it("allows us to withdraw with multiple s_funders", async () => {
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                const transactionResponse = await fundMe.withdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(),
                    endingDeployerBalance.add(gasCost).toString())
                await expect(fundMe.getFunder(0)).to.be.reverted;
            })

            it("allows only the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const attackerConnectedContract = await fundMe.connect(accounts[1])
                expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
                    "FundMe__NotOwner"
                );
            })

            it("allows us to withdraw cheaper with multiple s_funders", async () => {
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                const transactionResponse = await fundMe.cheapWithdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(),
                    endingDeployerBalance.add(gasCost).toString())
                await expect(fundMe.getFunder(0)).to.be.reverted;
            })
        })
    })