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
    uint256 public constant rafflePrice = 0.08 ether; //0.08 ETH

    constructor() ERC721("Raffle", "RFL") {}

    function changeContractState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    function mintRaffle(
        string memory tokenURI,
        uint256 numberOfRaffels
    ) public payable {
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
        }
    }

    function startRound() public onlyOwner {
        saleIsActive = true;
        totalSupply.reset();
    }

    function burn(string memory nonce, uint256 numberToBurn) public view onlyOwner returns (uint256) {
        require(!saleIsActive, "Sale is active, wait until it stops");
        require(totalSupply.current() > 1, "Supply is under 2 raffles");
        require(numberToBurn > 1, "Number to Burn is under 1 raffle");
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, nonce)
                )
            ) % totalSupply.current();
    }
}
