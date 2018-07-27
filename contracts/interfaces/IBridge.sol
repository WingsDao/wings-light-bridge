pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract IBridge is Ownable {

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

  // Manager
  modifier onlyManager {
    require(msg.sender == manager);
    _;
  }

  function transferManager(address _newManager) public onlyManager() {
    require(_newManager != address(0));
    manager = _newManager;
  }

  address public manager;
  //

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

  function getToken() public view returns (address);
  function changeToken(address _newToken) public;
  function setCrowdsaleGoal(uint256 _minimalGoal, uint256 _hardCap) public;
  function setCrowdsalePeriod(uint256 _startTimestamp, uint256 _endTimestamp) public;
  function notifySale(uint256 _amount, uint256 _ethAmount, uint256 _tokensAmount) public;
  function calculateRewards() public view returns (uint256, uint256);
  function finish() public;
  function withdraw() public;
  function stop() public;
  function start(uint256 _startTimestamp, uint256 _endTimestamp, address _fundingAddress) public;
  function isFailed() public view returns (bool);
  function isActive() public view returns (bool);
  function isSuccessful() public view returns (bool);

  function releaseTokens() public {}
  function deposit() public payable {}
}
