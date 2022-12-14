// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error AMMSwap__InvalidAddress();
error AMMSwap__AmountIsLessThanZero();
error AMMSwap__NotEnoughAllowance();
error AMMSwap__PriceIsNotEqual();
error AMMSwap__SharesIsZero();
error AMMSwap__BalanceOfToken0IsZero();
error AMMSwap__BalanceOfToken1IsZero();
error AMMSwap__BalanceOfTotalSupplyIsZero();
error AMMSwap__NotEnoughBalanceOfAccout();
error AMMSwap__NotOwner();
error AMMSwap__NotEnoughBalanceOfContract();
error AMMSwap__UserDontHaveEnoughShares();

contract AMMSwap {
    event TokensSwaped(
        address indexed token0,
        address indexed token1,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(uint256 indexed amount0, uint256 indexed amount1, uint256 indexed shares);
    event LiquidityRemoved(
        uint256 indexed shares,
        uint256 indexed amount0,
        uint256 indexed amount1
    );

    IERC20 public immutable i_token0;

    IERC20 public immutable i_token1;

    uint256 private s_balance0;
    uint256 private s_balance1;

    address private s_owner;
    uint256 private s_totalSupply;
    mapping(address => uint256) private s_balanceOf;

    modifier onlyOwner() {
        if (s_owner != msg.sender) {
            revert AMMSwap__NotOwner();
        }
        _;
    }

    constructor(address _token0, address _token1) {
        s_owner = msg.sender;
        i_token0 = IERC20(_token0);
        i_token1 = IERC20(_token1);
    }

    function swap(address _tokenIn, uint256 _amountIn) external returns (uint256 amountOut) {
        if (_tokenIn != address(i_token0) && _tokenIn != address(i_token1)) {
            revert AMMSwap__InvalidAddress();
        }
        if (_amountIn <= 0) {
            revert AMMSwap__AmountIsLessThanZero();
        }
        bool isToken0 = _tokenIn == address(i_token0);

        (IERC20 tokenIn, IERC20 tokenOut, uint256 balanceIn, uint256 balanceOut) = isToken0
            ? (i_token0, i_token1, s_balance0, s_balance1)
            : (i_token1, i_token0, s_balance1, s_balance0);

        if (tokenIn.allowance(msg.sender, address(this)) < _amountIn) {
            revert AMMSwap__NotEnoughAllowance();
        }
        if (tokenIn.balanceOf(msg.sender) < _amountIn) {
            revert AMMSwap__NotEnoughBalanceOfAccout();
        }
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        uint256 fee = _amountIn - amountInWithFee;
        amountOut = (balanceOut * amountInWithFee) / (balanceIn + amountInWithFee);
        if (tokenOut.balanceOf(address(this)) < amountOut) {
            revert AMMSwap__NotEnoughBalanceOfContract();
        }
        tokenOut.transfer(msg.sender, amountOut);
        tokenIn.transfer(s_owner, fee);

        _updateBalances(i_token0.balanceOf(address(this)), i_token1.balanceOf(address(this)));
        emit TokensSwaped(address(tokenIn), address(tokenOut), _amountIn, amountOut);
    }

    function addLiquidity(uint256 _amount0, uint256 _amount1) external returns (uint256 shares) {
        if (
            i_token0.allowance(msg.sender, address(this)) < _amount0 ||
            i_token1.allowance(msg.sender, address(this)) < _amount1
        ) {
            revert AMMSwap__NotEnoughAllowance();
        }
        i_token0.transferFrom(msg.sender, address(this), _amount0);
        i_token1.transferFrom(msg.sender, address(this), _amount1);

        if (s_balance0 > 0 || s_balance1 > 0) {
            if (s_balance0 * _amount1 != s_balance1 * _amount0) {
                revert AMMSwap__PriceIsNotEqual();
            }
        }

        if (s_totalSupply == 0) {
            shares = _sqrt(_amount0 * _amount1);
        } else {
            shares = _min(
                (_amount0 * s_totalSupply) / s_balance0,
                (_amount1 * s_totalSupply) / s_balance1
            );
        }
        if (shares <= 0) {
            revert AMMSwap__SharesIsZero();
        }
        _mint(msg.sender, shares);

        _updateBalances(i_token0.balanceOf(address(this)), i_token1.balanceOf(address(this)));
        emit LiquidityAdded(_amount0, _amount1, shares);
    }

    function removeLiquidity(uint256 _shares) external returns (uint256 amount0, uint256 amount1) {
        if (_shares == 0) {
            revert AMMSwap__SharesIsZero();
        }
        if (s_balanceOf[msg.sender] < _shares) {
            revert AMMSwap__UserDontHaveEnoughShares();
        }
        if (s_totalSupply <= 0) {
            revert AMMSwap__BalanceOfTotalSupplyIsZero();
        }

        uint256 bal0 = i_token0.balanceOf(address(this));
        if (bal0 <= 0) {
            revert AMMSwap__BalanceOfToken0IsZero();
        }
        uint256 bal1 = i_token1.balanceOf(address(this));
        if (bal1 <= 0) {
            revert AMMSwap__BalanceOfToken1IsZero();
        }

        amount0 = (_shares * bal0) / s_totalSupply;
        amount1 = (_shares * bal1) / s_totalSupply;

        _burn(msg.sender, _shares);
        _updateBalances(bal0 - amount0, bal1 - amount1);
        i_token0.transfer(msg.sender, amount0);
        i_token1.transfer(msg.sender, amount1);
        emit LiquidityRemoved(_shares, amount0, amount1);
    }

    function _updateBalances(uint256 _reserve0, uint256 _reserve1) private {
        s_balance0 = _reserve0;
        s_balance1 = _reserve1;
    }

    function _mint(address _to, uint256 _amount) private {
        s_balanceOf[_to] += _amount;
        s_totalSupply += _amount;
    }

    function _burn(address _from, uint256 _amount) private {
        s_balanceOf[_from] -= _amount;
        s_totalSupply -= _amount;
    }

    function updateBalancesByOwner(
        uint256 balance0,
        uint256 balance1,
        uint256 totalSupply,
        uint256 shares,
        address user
    ) public onlyOwner {
        s_balance0 = balance0;
        s_balance1 = balance1;
        s_totalSupply = totalSupply;
        s_balanceOf[user] = shares;
    }

    function getTotalSupply() public view returns (uint256) {
        return s_totalSupply;
    }

    function getBalanceOfShares(address _user) public view returns (uint256) {
        return s_balanceOf[_user];
    }

    function getBalanceOfToken0() public view returns (uint256) {
        return s_balance0;
    }

    function getBalanceOfToken1() public view returns (uint256) {
        return s_balance1;
    }

    function getAddressToken0() public view returns (address) {
        return address(i_token0);
    }

    function getAddressToken1() public view returns (address) {
        return address(i_token1);
    }

    function getOwner() public view returns (address) {
        return s_owner;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}
