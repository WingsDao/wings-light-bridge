pragma solidity 0.4.18;


import './wings/Manageable.sol';
import './wings/Ownable.sol';


/*
  Crowdsale contracts interface
*/
contract ICrowdsaleProcessor is Ownable, Manageable {
  modifier whenCrowdsaleAlive() {
    require(isActive());
    _;
  }

  modifier whenCrowdsaleFailed() {
    require(isFailed());
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

  modifier hasBeenStopped() {
    require(stopped);
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

  // Minimal acceptable hard cap
  uint256 constant public MIN_HARD_CAP = 1 ether;

  // Minimal acceptable duration of crowdsale
  uint256 constant public MIN_CROWDSALE_TIME = 3 days;

  // Maximal acceptable duration of crowdsale
  uint256 constant public MAX_CROWDSALE_TIME = 50 days;

  // Becomes true when timeframe is assigned
  bool public started;

  // Becomes true if cancelled by owner
  bool public stopped;

  // Total collected Ethereum: must be updated every time tokens has been sold
  uint256 public totalCollected;

  // Total amount of project's token sold: must be updated every time tokens has been sold
  uint256 public totalSold;

  // Crowdsale minimal goal, must be greater or equal to Forecasting min amount
  uint256 public minimalGoal;

  // Crowdsale hard cap, must be less or equal to Forecasting max amount
  uint256 public hardCap;

  // Crowdsale duration in seconds.
  // Accepted range is MIN_CROWDSALE_TIME..MAX_CROWDSALE_TIME.
  uint256 public duration;

  // Start timestamp of crowdsale, absolute UTC time
  uint256 public startTimestamp;

  // End timestamp of crowdsale, absolute UTC time
  uint256 public endTimestamp;

  // Allows to transfer some ETH into the contract without selling tokens
  function deposit() public payable {}

  // Returns address of crowdsale token, must be ERC20 compilant
  function getToken() public view returns (address);

  // Transfers ETH rewards amount (if ETH rewards is configured) to Forecasting contract
  function mintETHRewards(address _contract, uint256 _amount) public onlyManager();

  // Mints token Rewards to Forecasting contract
  function mintTokenRewards(address _contract, uint256 _amount) public onlyManager();

  // Releases tokens (transfers crowdsale token from mintable to transferrable state)
  function releaseTokens() public onlyManager() hasntStopped() whenCrowdsaleSuccessful();

  // Stops crowdsale. Called by CrowdsaleController, the latter is called by owner.
  // Crowdsale may be stopped any time before it finishes.
  function stop() public onlyManager() hasntStopped();

  // Validates parameters and starts crowdsale
  function start(uint256 _startTimestamp, uint256 _endTimestamp, address _fundingAddress)
    public onlyManager() hasntStarted() hasntStopped();

  // Is crowdsale failed (completed, but minimal goal wasn't reached)
  function isFailed() public view returns (bool);

  // Is crowdsale active (i.e. the token can be sold)
  function isActive() public view returns (bool);

  // Is crowdsale completed successfully
  function isSuccessful() public view returns (bool);
}
