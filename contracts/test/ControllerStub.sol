pragma solidity ^0.4.18;


import "../interfaces/IWingsController.sol";


// Minimal crowdsale token for custom contracts
contract ControllerStub is IWingsController {

  function ControllerStub(uint256 _ethRewardPart, uint256 _tokenRewardPart) public {
    ethRewardPart = _ethRewardPart;
    tokenRewardPart = _tokenRewardPart;
  }

  function fitCollectedValueIntoRange(uint256 _totalCollected) public view returns (uint256) {
    return _totalCollected;
  }

  function() public payable {
  }
}
