// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";
import "erc721a/contracts/ERC721A.sol";

contract TicketV4 is ERC721A, Ownable, PullPayment {
    // Round stage enum
    enum Stage {
        MINT,
        BURN,
        END
    }

    using Counters for Counters.Counter;
    using SafeMath for uint256;
    mapping(uint256 => string) public winnerTokenURI;
    Counters.Counter private _tokenIds;
    uint256 public ticketPrice = 0.08 ether;
    uint256[] public ticketsInPlay;
    uint256 public prizeMoney;
    string public commonMetaData;
    string public winnerMetaData;
    uint256 public currentBlockStamp;
    uint256 public timeInterval = 2 days;
    Stage currentStage;

    constructor() ERC721A("Ticket", "TCK") {
        currentStage = Stage.MINT;
        currentBlockStamp = block.timestamp;
    }

    /** OWNER */

    function run(uint256 _salt, uint256 _nonce) public onlyOwner {
        require(
            block.timestamp > currentBlockStamp + timeInterval,
            "It is not yet available to run"
        );

        currentBlockStamp = block.timestamp;

        if (currentStage == Stage.MINT || currentStage == Stage.BURN) {
            currentStage = Stage.BURN;
            if (totalSupply() >= 20) {
                if (totalSupply() % 2 == 0) {
                    burn(_salt, _nonce, totalSupply() / 2);
                } else {
                    uint256 numberToBurn = (totalSupply() - 1);
                    burn(_salt, _nonce, (numberToBurn / 2) + 1);
                }
            } else if (totalSupply() > 10) {
                burn(_salt, _nonce, totalSupply() - 10);
            } else {
                if (totalSupply() == 0) {
                    currentStage = Stage.MINT;
                } else if (totalSupply() == 1) {
                    transferToWinner();
                    winnerTokenURI[ticketsInPlay[0]] = winnerMetaData;
                    currentStage = Stage.END;
                } else {
                    burn(_salt, _nonce, 1);
                }
            }
        }
    }

    function setMetaData(string memory tURI) public onlyOwner {
        commonMetaData = tURI;
    }

    function setWinnerMetaData(string memory tURI) public onlyOwner {
        winnerMetaData = tURI;
    }

    function startRound() public onlyOwner {
        require(currentStage == Stage.END, "You will have to wait for the round to end");
        currentStage = Stage.MINT;
        delete ticketsInPlay;
        prizeMoney = 0;
    }

    function burn(
        uint256 _salt,
        uint256 _nonce,
        uint256 numberToBurn
    ) private onlyOwner{
        require(totalSupply() > 1, "Supply is under 2 tickets");
        require(numberToBurn > 0, "Number to Burn is under 1 ticket");
        uint256 remaining = totalSupply() - numberToBurn;
        while (totalSupply() > remaining) {
            uint256 index = _randomNumber(_nonce, _salt);
            uint256 ticketId = ticketsInPlay[index];
            _remove(index);
            _burn(ticketId);
        }
        if (totalSupply() == 1) {
            transferToWinner();
            winnerTokenURI[ticketsInPlay[0]] = winnerMetaData;
            currentStage = Stage.END;
        }
    }

    function transferToWinner() public payable onlyOwner {
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

    function withdrawPayments(address payable payee)
        public
        virtual
        override
        onlyOwner
    {
        super.withdrawPayments(payee);
    }

    function setTimeInterval(uint256 interval) public onlyOwner {
        currentBlockStamp = block.timestamp;
        timeInterval = interval;
    }

    /** END OWNER */

    /** PUBLIC */

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI query for nonexistent token"
        );

        string memory _tokenURI = winnerTokenURI[tokenId];

        // If the tokenId is not a winner, return common metadata.
        if (bytes(_tokenURI).length == 0) {
            return commonMetaData;
        }

        //else return winner metadata.
        return _tokenURI;
    }

    function mintTicket(uint256 numberOfTickets) public payable {
        require(
            currentStage == Stage.MINT,
            "Mint phase is not available, wait until it opens"
        );
        require(numberOfTickets > 0, "Mint number must be above 0");
        require(
            ticketPrice.mul(numberOfTickets) <= msg.value,
            "Ether value sent is not correct"
        );
        for (uint256 i = 0; i < numberOfTickets; i++) {
            ticketsInPlay.push(_tokenIds.current());
            _tokenIds.increment();
        }
        _safeMint(msg.sender, numberOfTickets);
        prizeMoney += ticketPrice.mul(numberOfTickets);
    }

    function getTicketsInPlaySize() public view returns (uint256) {
        return ticketsInPlay.length;
    }

    function getCurrentStage() public view returns (Stage) {
        return currentStage;
    }

    /** END PUBLIC */

    /** PRIVATE */

    function _randomNumber(uint256 _nonce, uint256 _salt)
        private
        view
        onlyOwner
        returns (uint256)
    {
        bytes memory buffer = new bytes(32);
        uint256 tmp = block.timestamp + _nonce + _salt;
        assembly {
            mstore(add(buffer, 32), tmp)
        }
        return uint256(keccak256(buffer)) % totalSupply();
    }

    function _remove(uint256 _index) private {
        require(_index < ticketsInPlay.length, "index out of bound");
        ticketsInPlay[_index] = ticketsInPlay[ticketsInPlay.length - 1];
        ticketsInPlay.pop();
    }

    /** END PRIVATE */

    receive() external payable {}
}
