pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/DetailedERC20.sol';

import './IWingsController.sol';


contract IBridge is Ownable {

    using SafeMath for uint256;

    event CROWDSALE_START(uint256 startTimestamp, uint256 endTimestamp, address fundingAddress);
    event CUSTOM_CROWDSALE_TOKEN_ADDED(address token, uint8 decimals);
    event CUSTOM_CROWDSALE_GOAL_ADDED(uint256 minimalGoal, uint256 hardCap);
    event CUSTOM_CROWDSALE_PERIOD_ADDED(uint256 startTimestamp, uint256 endTimestamp);
    event CUSTOM_CROWDSALE_RESULT(uint256 totalCollected, uint256 totalCollectedETH, uint256 totalSold);
    event CUSTOM_CROWDSALE_FINISH();

    modifier whenCrowdsaleAlive() {
        require(isActive());
        _;
    }

    modifier whenCrowdsaleSuccessful() {
        require(isSuccessful());
        _;
    }

    modifier hasntStopped() {
        require(!stopped);
        _;
    }

    modifier hasntStarted() {
        require(!started);
        _;
    }

    modifier hasBeenStarted() {
        require(started);
        _;
    }

    modifier onlyManager {
        require(msg.sender == manager);
        _;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == owner || msg.sender == manager);
        _;
    }

    modifier uncompleted() {
        require(!completed);
        _;
    }

    address public manager;

    bool public started;
    bool public stopped;

    // Total collected forecast question currency
    uint256 public totalCollected;

    // Total collected Ether
    uint256 public totalCollectedETH;

    // Total amount of project's token sold: must be updated every time tokens has been sold
    uint256 public totalSold;

    // Crowdsale goals
    uint256 public minimalGoal;
    uint256 public hardCap;

    // Crowdsale time frame
    uint256 public startTimestamp;
    uint256 public endTimestamp;

    // crowdsale token must be ERC20-compliant
    DetailedERC20 token;

    // crowdsale status
    bool completed;
    bool failed;

    // whether sale results were communicated to crowdsale controller or not
    bool notifiedSale;

    function transferManager(address _newManager) public onlyManager() {
        require(_newManager != address(0));
        manager = _newManager;
    }

    function getToken() public view returns (address);
    function changeToken(address _newToken) public;
    function setCrowdsaleGoal(uint256 _minimalGoal, uint256 _hardCap) public;
    function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public;
    function notifySale(uint256 _amount, uint256 _ethAmount, uint256 _tokensAmount) public;
    function calculateRewards() public view returns (uint256, uint256);
    function finish() public;
    function withdraw(uint256 _ethAmount, uint256 _tokenAmount) public;
    function stop() public;
    function start(uint256 _startTimestamp, uint256 _endTimestamp, address _fundingAddress) public;
    function isFailed() public view returns (bool);
    function isActive() public view returns (bool);
    function isSuccessful() public view returns (bool);

    function releaseTokens() public {}
    function deposit() public payable {}
}
