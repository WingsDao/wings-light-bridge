pragma solidity ^0.4.23;


import 'zeppelin-solidity/contracts/token/ERC20/BasicToken.sol';


contract DefaultToken is BasicToken {

  string public name;
  string public symbol;
  uint8 public decimals;

  constructor(string _name, string _symbol, uint8 _decimals) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
