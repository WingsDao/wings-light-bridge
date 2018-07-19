pragma solidity ^0.4.23;


import 'zeppelin-solidity/contracts/token/BasicToken.sol';


contract TestToken is BasicToken {

  string public name;
  string public symbol;
  uint8 public decimals;

  constructor(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    totalSupply = _totalSupply;
    balances[msg.sender] = totalSupply;
  }
}
