pragma solidity 0.4.18;


import "./ICrowdsaleProcessor.sol";


// Basic crowdsale implementation both for regualt and 3rdparty Crowdsale contracts
contract BasicCrowdsale is ICrowdsaleProcessor {
  event CROWDSALE_START(uint256 startTimestamp, uint256 endTimestamp, address fundingAddress);

  // Where to transfer collected ETH
  address public fundingAddress;

  // Ctor.
  function BasicCrowdsale(
    address _owner,
    address _manager
  )
    public
  {
    owner = _owner;
    manager = _manager;
  }

  // called by CrowdsaleController to transfer reward part of ETH
  // collected by successful crowdsale to Forecasting contract.
  // This call is made upon closing successful crowdfunding process
  // iff agreed ETH reward part is not zero
  function mintETHRewards(
    address _contract,  // Forecasting contract
    uint256 _amount     // agreed part of totalCollected which is intended for rewards
  )
    public
    onlyManager() // manager is CrowdsaleController instance
  {
    require(_contract.call.value(_amount)());
  }

  // cancels crowdsale
  function stop() public onlyManager() hasntStopped()  {
    // we can stop only not started and not completed crowdsale
    if (started) {
      require(!isFailed());
      require(!isSuccessful());
    }
    stopped = true;
  }

  // called by CrowdsaleController to setup start and end time of crowdfunding process
  // as well as funding address (where to transfer ETH upon successful crowdsale)
  function start(
    uint256 _startTimestamp,
    uint256 _endTimestamp,
    address _fundingAddress
  )
    public
    onlyManager()   // manager is CrowdsaleController instance
    hasntStarted()  // not yet started
    hasntStopped()  // crowdsale wasn't cancelled
  {
    require(_fundingAddress != address(0));

    // start time must not be earlier than current time
    require(_startTimestamp >= block.timestamp);

    // range must be sane
    require(_endTimestamp > _startTimestamp);
    duration = _endTimestamp - _startTimestamp;

    // duration must fit constraints
    require(duration >= MIN_CROWDSALE_TIME && duration <= MAX_CROWDSALE_TIME);

    startTimestamp = _startTimestamp;
    endTimestamp = _endTimestamp;
    fundingAddress = _fundingAddress;

    // now crowdsale is considered started, even if the current time is before startTimestamp
    started = true;

    CROWDSALE_START(_startTimestamp, _endTimestamp, _fundingAddress);
  }

  // must return true if crowdsale is over, but it failed
  function isFailed()
    public
    constant
    returns(bool)
  {
    return (
      // it was started
      started &&

      // crowdsale period has finished
      block.timestamp >= endTimestamp &&

      // but collected ETH is below the required minimum
      totalCollected < minimalGoal
    );
  }

  // must return true if crowdsale is active (i.e. the token can be bought)
  function isActive()
    public
    constant
    returns(bool)
  {
    return (
      // it was started
      started &&

      // hard cap wasn't reached yet
      totalCollected < hardCap &&

      // and current time is within the crowdfunding period
      block.timestamp >= startTimestamp &&
      block.timestamp < endTimestamp
    );
  }

  // must return true if crowdsale completed successfully
  function isSuccessful()
    public
    constant
    returns(bool)
  {
    return (
      // either the hard cap is collected
      totalCollected >= hardCap ||

      // ...or the crowdfunding period is over, but the minimum has been reached
      (block.timestamp >= endTimestamp && totalCollected >= minimalGoal)
    );
  }
}
