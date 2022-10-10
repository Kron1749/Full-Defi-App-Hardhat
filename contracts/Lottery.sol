/**
    1. Enter the lotter
        1.1 Minimum value to enter
            1.1.1 Value in eth,that equal 10 dollars
                1.1.1.1 Create contract to get price(openzeppelin)
        1.2 When enter deployer receive some fee
            1.2.1 Players transfer some eth to deployer balance
        1.3 As much as user send value as much the chance to win he will get 
            1.3.1 Calcalute chance for win = (all_value)/player_value * 100
                1.3.1.1 Use randomness(openzeppelin)
        1.4 When user sent value it will will get in staking
    2. Wait for results
        2.1 Results will be each 4 hours
            2.1.1 Need to get from openzeppelin
    3. End of Lottery
        3.1 Winner receive all rewards
        3.2 Other users get rewards from staking
 */

 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "./PriceConverter.sol";

error Lottery__NotEnoughEth();


contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    using PriceConverter for uint256;
    enum LotteryState {
        OPEN,
        CALCULATING
    }
    
    //Chainlink variables
    AggregatorV3Interface private immutable  i_priceFeed;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId; 
    uint32 private immutable i_callbackGasLimit; 
    bytes32 private immutable i_gasLane; 
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //Lottery variables 
    address payable[] private s_players;
    address private immutable i_owner;
    mapping(address => uint256) private s_chanceOfWin;
    uint256 public constant MINIMUM_AMOUNT = 10*10**18; // in use need to convert to eth
    uint256 private immutable i_interval;
    uint256 public counter; // How much lotteries passed
    uint256 private s_lastTimeStamp;
    LotteryState private s_lotteryState;
    address private s_recentWinner;


    constructor(address priceFeed,address vrfCoordinatorV2,uint64 subscriptionId,
        uint32 callbackGasLimit,
        bytes32 gasLane,uint256 interval) {
        i_owner = msg.sender;
        i_priceFeed = AggregatorV3Interface(priceFeed);
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
        counter = 0;
        s_lotteryState = LotteryState.OPEN;
    }

    function enterLottery() external {
        if(msg.value.GetValueInDollar(i_priceFeed)<MINIMUM_AMOUNT) {
            revert Lottery__NotEnoughEth();
        }
        uint256 amountToEnterWithFee = (msg.value * 997) / 1000; //Todo this in way,need to upgrade
        uint256 fee = msg.value - amountToEnterWithFee;
        s_chanceOfWin[msg.sender] = (address(this).balance * msg.value)/100; //Todo this in way,upgrade
        s_players.push(payable(msg.sender));
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval); // check if time passed
        bool has_Players = s_players.length > 0; // check if have players
        bool lotteryState = LotteryState.OPEN == s_lotteryState; // check if lottery is open
        bool hasBalance = address(this).balance > 0; // check if lottery has balance
        upkeepNeeded = (timePassed && has_Players && lotteryState && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        s_lotteryState = LotteryState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 winnerIndex = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner; //updating recent_winner
        s_players = new address payable[](0); // creating new array of players
        s_lotteryState = LotteryState.OPEN; // updating lottery state
        s_lastTimeStamp = block.timestamp; //updating timestamp
        payable(recentWinner).transfer(address(this).balance); //transfer amount
    }
}