//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";

contract Ticket is ERC721URIStorage, Ownable, PullPayment {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    Counters.Counter private _tokenIds;
    Counters.Counter public totalSupply;
    bool public saleIsActive = false;
    uint256 public ticketPrice = 0.08 ether; //0.08 ETH
    uint256[] public ticketsInPlay;
    uint256 public prizeMoney;
    string commonMetaData;

    constructor() ERC721("Ticket", "TCK") {}

    function changeContractState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    function setMetaData(string memory tokenURI) public onlyOwner {
        commonMetaData = tokenURI;
    }

    function mintTicket(uint256 numberOfTickets) public payable {
        require(saleIsActive, "Sale must be active to mint Raffle Ticket");
        require(numberOfTickets > 0, "Mint number must be above 0");
        require(
            ticketPrice.mul(numberOfTickets) <= msg.value,
            "Ether value sent is not correct"
        );
        for (uint256 i = 0; i < numberOfTickets; i++) {
            _tokenIds.increment();
            totalSupply.increment();

            uint256 newItemId = _tokenIds.current();
            _mint(msg.sender, newItemId);
            _setTokenURI(newItemId, commonMetaData);
            ticketsInPlay.push(newItemId);
        }
        prizeMoney += ticketPrice.mul(numberOfTickets);
    }

    function startRound() public onlyOwner {
        saleIsActive = true;
        totalSupply.reset();
        delete ticketsInPlay;
        prizeMoney = 0;
    }

    function _randomNumber(uint256 _nonce, uint256 _salt)
        private
        view
        onlyOwner
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, _nonce, _salt)
                )
            ) % totalSupply.current();
    }

    function _remove(uint256 _index) private {
        require(_index < ticketsInPlay.length, "index out of bound");
        ticketsInPlay[_index] = ticketsInPlay[ticketsInPlay.length - 1];
        ticketsInPlay.pop();
    }

    function burn(uint256 _salt, uint256 _nonce, uint256 numberToBurn) public onlyOwner {
        require(!saleIsActive, "Sale is active, wait until it stops");
        require(totalSupply.current() > 1, "Supply is under 2 tickets");
        require(numberToBurn > 0, "Number to Burn is under 1 ticket");
        uint256 remaining = totalSupply.current() - numberToBurn;
        while (totalSupply.current() > remaining) {
            uint256 index = _randomNumber(_nonce, _salt);
            uint256 ticketId = ticketsInPlay[index];
            _remove(index);
            _burn(ticketId);
            totalSupply.decrement();
        }
    }

    function giveWinnerTokenURI(uint256 tokenId, string memory tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, tokenURI);
    }

    function transferToWinner() public payable onlyOwner {
        require(!saleIsActive, "Sale is active, wait until it stops");
        require(
            ticketsInPlay.length == 1,
            "There is more than 1 ticket left to win"
        );
        address winner = ownerOf(ticketsInPlay[0]);
        (bool success, ) = winner.call{value: prizeMoney}("");
        require(success, "Failed to send Ether");
        prizeMoney = 0 ether;
    }

    function setTicketPrice(uint256 price) public onlyOwner {
        ticketPrice = price;
    }

    function getTicketsInPlaySize() public view returns (uint256 count) {
        return ticketsInPlay.length;
    }

    function withdrawPayments(address payable payee)
        public
        virtual
        override
        onlyOwner
    {
        super.withdrawPayments(payee);
    }

    receive() external payable {}
}
