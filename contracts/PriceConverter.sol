// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function GetLastestPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        AggregatorV3Interface Price = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = Price.latestRoundData();
        return uint256(price * 10000000000);
    }

    function GetValueInDollar(uint256 ethAmount, AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        uint256 valuePrice = GetLastestPrice(priceFeed);
        uint256 amountInDollars = (valuePrice * ethAmount) / 1000000000000000000;
        return amountInDollars;
    }
}