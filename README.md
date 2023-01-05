# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Solidity Style Guide
```solidity
// SPDX-License-Identifier:  MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

/** @title a contract for crowd funding
 *  @author Abhik B
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our libraries
 */

contract FundMe {
    //Type Declarations
    using PriceConverter for uint256;

    //State Variables
    uint256 public constant MINIMUM_USD = 50 * 10 ** 16;
    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;
    address public immutable i_owner;
    AggregatorV3Interface public pricefeed;

    // Events

    //Modifiers
    modifier onlyOwner() {
        // require(msg.sender==i_owner,"Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //Functions

    // Constructors
    constructor(address pricefeedAddress) {
        i_owner = msg.sender;
        pricefeed = AggregatorV3Interface(pricefeedAddress);
    }

    // recieve & fallback
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    //external

    //public

    /**
     * @notice This function funds this contract
     * @dev This implements price feeds as our libraries
     */
    function fund() public payable {
        require(
            msg.value.getConversionRate(pricefeed) >= MINIMUM_USD,
            "Didn't send enough money"
        );
        addressToAmountFunded[msg.sender] += msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);
        payable(msg.sender).transfer(address(this).balance);
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send Failed");
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failed");
    }
    //internal

    //private

    //view/pure
}

```