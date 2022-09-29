/**
    1. Add 2 tokens what to swap
    2. Create swap function
    3. Create add liquadity function
    4. Create remove liquadity function

 */

 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract AMMSWAP {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint public balance0;
    uint public balance1;

    uint public totalSupply;
    mapping(address=>uint256) public balanceOf;

    constructor(address _token0,address _token1){
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function _mint(address _to,uint _amount) private {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
    }

    function _burn(address _from,uint _amount) private {
        balanceOf[_from] -= _amount;
        totalSupply -= _amount;
    }

    function _updateBalances(uint256 _reserve0,uint256 _reserve1) private {
        balance0 = _reserve0;
        balance1 = _reserve1;
    }

    function swap(address _tokenIn,uint256 _amountIn) external returns(uint256 amountOut) {
        require(_tokenIn == address(token0) || _tokenIn == address(token1),"Invalid address");
        require(_amountIn > 0, "Amount in = 0");
        bool isToken0 = _tokenIn == address(token0);

        // Get what tokens are
        (IERC20 tokenIn,IERC20 tokenOut,uint256 balanceIn,uint256 balanceOut) = isToken0 ? (token0,token1,balance0,balance1) : (token1,token0,balance1,balance0);

        tokenIn.transferFrom(msg.sender,address(this),_amountIn);

        uint256 amountInWithFee = (_amountIn * 997)/1000;
        // By formula ydx/(x+dx)=dy - amountOut
        amountOut = (balanceOut*amountInWithFee)/(balanceIn+amountInWithFee);
        //Transfer token out to sender
        tokenOut.transfer(msg.sender,amountOut);

        // Update balances
        _updateBalances(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );

    }

    function addLiquidity(uint256 _amount0,uint256 _amount1) external returns(uint256 shares) {
        // Send token0 and token1
        token0.transferFrom(msg.sender, address(this), _amount0);
        token1.transferFrom(msg.sender,address(this), _amount1);

        // dy/dx = X/Y this formula must be right
        if(balance0>0 || balance1 >0 ) {
            require(balance0*_amount1==balance1*_amount0,"Price is not equal, dy/dx != X/Y");
        }
 
        // Mint shares
        // f(x,y) = sqrt(XY) value of liquadity
        // s = dx/x*T=dy/y*T
        if(totalSupply==0) {
            shares = _sqrt(_amount0*_amount1);
        } else {
            shares = _min(
                (_amount0*totalSupply)/balance0,
                (_amount1*totalSupply)/balance1
            );
        }
        require(shares>0,"shares=0");
        _mint(msg.sender,shares);

        // Update balances
        _updateBalances(token0.balanceOf(address(this)), token1.balanceOf(address(this)));
    }

    function removeLiquidity(uint256 _shares) external  returns(uint256 amount0,uint256 amount1){
        // calculate amount0 and amount1 to withdraw
        // dx = s/T*Y
        // dy = s/T*Y
        uint256 bal0 = token0.balanceOf(address(this));
        uint256 bal1 = token1.balanceOf(address(this));

        amount0 = (_shares*bal0)/totalSupply;
        amount1 = (_shares*bal1)/totalSupply;
        require(amount0>0 && amount1>0,"Amount0 or amount1 is < 0");
        // Burn shares
        _burn(msg.sender, _shares);
        // Update balances
        _updateBalances(bal0-amount0, bal1-amount1);
        // Transfer tokens to msg.sender
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
        
    }

    // This is from uniswap
    function _sqrt(uint y) private pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint x, uint y) private pure returns (uint) {
        return x <= y ? x : y;
    }
}