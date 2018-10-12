pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/token/BasicToken.sol';


contract TestToken is BasicToken {

    string public name;
    string public symbol;
    uint8 public decimals;

    function TestToken(string _name, string _symbol, uint8 _decimals, uint256 _totalSupply) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = totalSupply;
    }
}
