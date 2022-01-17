//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Raffle is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    Counters.Counter private _tokenIds;
    Counters.Counter public totalSupply;
    bool public saleIsActive = false;
    uint256 public rafflePrice = 0.08 ether; //0.08 ETH
    uint256[] public rafflesInPlay;

    constructor() ERC721("Raffle", "RFL") {}

    function changeContractState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    function mintRaffle(string memory tokenURI, uint256 numberOfRaffels)
        public
        payable
    {
        require(saleIsActive, "Sale must be active to mint Ape");
        require(
            rafflePrice.mul(numberOfRaffels) <= msg.value,
            "Ether value sent is not correct"
        );
        for (uint256 i = 0; i < numberOfRaffels; i++) {
            _tokenIds.increment();
            totalSupply.increment();

            uint256 newItemId = _tokenIds.current();
            _mint(msg.sender, newItemId);
            _setTokenURI(newItemId, tokenURI);
            rafflesInPlay.push(newItemId);
        }
    }

    function startRound() public onlyOwner {
        saleIsActive = true;
        totalSupply.reset();
        delete rafflesInPlay;
    }

    function _randomNumber(string memory nonce)
        private
        view
        onlyOwner
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, nonce)
                )
            ) % totalSupply.current();
    }

    function _remove(uint256 _index) private {
        require(_index < rafflesInPlay.length, "index out of bound");

        for (uint256 i = _index; i < rafflesInPlay.length - 1; i++) {
            rafflesInPlay[i] = rafflesInPlay[i + 1];
        }
        rafflesInPlay.pop();
    }

    function burn(string memory nonce, uint256 numberToBurn) public onlyOwner {
        require(!saleIsActive, "Sale is active, wait until it stops");
        require(totalSupply.current() > 1, "Supply is under 2 raffles");
        require(numberToBurn > 0, "Number to Burn is under 1 raffle");
        uint256 remaining = totalSupply.current() - numberToBurn;
        while (totalSupply.current() > remaining) {
            uint256 index = _randomNumber(nonce);
            uint256 raffleId = rafflesInPlay[index];
            _remove(index);
            _burn(raffleId);
            totalSupply.decrement();
        }
    }

    function giveWinnerTokenURI(uint256 tokenId, string memory tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, tokenURI);
    }

    function transferToWinner(address addr) public onlyOwner {}

    function setRafflePrice(uint256 price) public onlyOwner {
        rafflePrice = price;
    }

    receive() external payable {}
}
