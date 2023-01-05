const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    }
}
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000
const developmentChains = ["hardhat", "localhost"]
module.exports = { networkConfig, developmentChains, DECIMALS, INITIAL_ANSWER }