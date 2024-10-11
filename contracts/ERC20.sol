// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract DLToken {
    string public tokenName;
    string public tokenSymbol;
    uint256 public totalSupply;
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allow;

    constructor(string memory _name, string memory _symbol) {
        tokenName = _name;
        tokenSymbol = _symbol;
        owner = msg.sender;
        mint(1_000_000, owner);
    }

    event Transfer(address indexed sender, address indexed receiver, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    function getTokenName() external view returns (string memory) {
        return tokenName;
    }

    function getSymbol() external view returns (string memory) {
        return tokenSymbol;
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }

    function decimal() external pure returns (uint8) {
        return 18;
    }

    function balanceOf(address _address) external view returns (uint256) {
        return balances[_address];
    }

    function transfer(address _receiver, uint256 _amountOfToken) external {
        require(_receiver != address(0), "Address is not allowed");
        require(_amountOfToken <= balances[msg.sender], "Insufficient balance");

        uint256 burnAmount = (_amountOfToken * 5) / 100;
        uint256 transferAmount = _amountOfToken - burnAmount;

        balances[msg.sender] -= _amountOfToken;
        balances[_receiver] += transferAmount;
        burn(address(0), burnAmount);

        emit Transfer(msg.sender, _receiver, transferAmount);
    }

    function approve(address _delegate, uint256 _amountOfToken) external {
        require(balances[msg.sender] >= _amountOfToken, "Insufficient balance");
        allow[msg.sender][_delegate] = _amountOfToken;
        emit Approval(msg.sender, _delegate, _amountOfToken);
    }

    function allowance(address _owner, address _delegate) external view returns (uint256) {
        return allow[_owner][_delegate];
    }

    function transferFrom(address _owner, address _buyer, uint256 _amountOfToken) external {
        require(_owner != address(0) && _buyer != address(0), "Invalid address");
        require(_amountOfToken <= balances[_owner], "Insufficient balance");
        require(_amountOfToken <= allow[_owner][msg.sender], "Insufficient allowance");

        uint256 burnAmount = (_amountOfToken * 5) / 100;
        uint256 transferAmount = _amountOfToken - burnAmount;

        balances[_owner] -= _amountOfToken;
        allow[_owner][msg.sender] -= _amountOfToken;
        balances[_buyer] += transferAmount;
        burn(address(0), burnAmount);

        emit Transfer(_owner, _buyer, transferAmount);
    }

    function burn(address _address, uint256 _amount) internal {
        balances[_address] -= _amount;
        totalSupply -= _amount;
        emit Transfer(_address, address(0), _amount);
    }

    function mint(uint256 _amount, address _addr) internal {
        uint256 actualSupply = _amount * (10 ** 18);
        balances[_addr] += actualSupply;
        totalSupply += actualSupply;
        emit Transfer(address(0), _addr, actualSupply);
    }
}