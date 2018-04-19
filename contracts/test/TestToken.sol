pragma solidity 0.4.19;


import 'zeppelin-solidity/contracts/token/BasicToken.sol';


contract TestToken is BasicToken {

  string public name = "Very Test Token";
  string public symbol = "VTT";
  uint8 public decimals = 18;

  function TestToken(uint256 _totalSupply) {
    totalSupply = _totalSupply;
    balances[msg.sender] = totalSupply;
  }
}
