pragma solidity ^0.4.23;


import "../IWingsController.sol";


// Minimal crowdsale token for custom contracts
contract ControllerStub is IWingsController {

  constructor(uint256 _ethRewardPart, uint256 _tokenRewardPart) {
    ethRewardPart = _ethRewardPart;
    tokenRewardPart = _tokenRewardPart;
  }

  function fitCollectedValueIntoRange(uint256 _totalCollected) public view returns (uint256) {
    return _totalCollected;
  }

  function() public payable {
  }
}
