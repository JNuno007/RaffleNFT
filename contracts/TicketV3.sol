//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";

contract TicketV3 is ERC1155, Ownable, PullPayment {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    enum Stage {
        MINT,
        BURN,
        END
    }

    struct Player {
        uint256 pID;
        address addr;
        uint256 quantity;
        bool exists;
    }

    uint256 public constant TICKET = 0;

    mapping(uint256 => string) public prizeTokenURI;
    mapping(uint256 => Player) public playersInGame;
    mapping(uint256 => Player) ticketsToBeBurned;
    mapping(address => uint256) public tokensInGame;
    Counters.Counter private _tokenIds;
    Counters.Counter private _prizeTokenIds;
    uint256 public totalSupply;
    uint256 public ticketPrice;
    uint256[] public ticketsInPlay;
    uint256 public prizeMoney;
    string commonMetaData;
    string winnerMetaData;
    uint256 currentBlockStamp;
    uint256 timeInterval;
    Stage currentStage;

    constructor() ERC1155("") {
        currentStage = Stage.MINT;
        currentBlockStamp = block.timestamp;
        ticketPrice = 0.08 ether;
        timeInterval = 2 days;
    }

    /** Owner */

    function setMetaData(string memory tURI) public onlyOwner {
        commonMetaData = tURI;
    }

    function setWinnerMetaData(string memory tURI) public onlyOwner {
        winnerMetaData = tURI;
    }

    function startRound() public onlyOwner {
        require(currentStage == Stage.END, "SR1");
        currentStage = Stage.MINT;
        totalSupply = 0;
        delete ticketsInPlay;
        prizeMoney = 0;
    }

    function transferToWinner(address winner) public payable onlyOwner {
        require(ticketsInPlay.length == 1, "TCA1");
        (bool success, ) = winner.call{value: prizeMoney}("");
        _burn(winner, TICKET, 1);
        require(success, "TCA2");
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

    function burn(
        uint256 _salt,
        uint256 _nonce,
        uint256 numberToBurn
    ) private onlyOwner {
        require(totalSupply > 1);
        require(numberToBurn > 0);
        uint256 remaining = totalSupply - numberToBurn;
        uint256[] storage tokenIdsToBurn;
        while (totalSupply > remaining) {
            uint256 index = _randomNumber(_nonce, _salt);
            _addTicketsToBeBurned(
                ticketsInPlay[index],
                playersInGame[ticketsInPlay[index]].addr
            );
            tokenIdsToBurn = _addTokenIdsToBurn(
                tokenIdsToBurn,
                ticketsInPlay[index]
            );
            _remove(index);
            totalSupply -= 1;
        }
        //Burn Batch
        tokenIdsToBurn = _burnTickets(tokenIdsToBurn);
        if (totalSupply == 1) {
            playersInGame[ticketsInPlay[0]].quantity -= 1;
            transferToWinner(playersInGame[ticketsInPlay[0]].addr);
            _prizeTokenIds.increment();
            prizeTokenURI[_prizeTokenIds.current()] = winnerMetaData;
            _mint(
                playersInGame[ticketsInPlay[0]].addr,
                _prizeTokenIds.current(),
                1,
                ""
            );
            currentStage = Stage.END;
        }
    }

    function run(uint256 _salt, uint256 _nonce) public onlyOwner {
        require(block.timestamp > currentBlockStamp + timeInterval, "RUN");

        currentBlockStamp = block.timestamp;

        if (currentStage == Stage.MINT || currentStage == Stage.BURN) {
            currentStage = Stage.BURN;
            if (totalSupply >= 20) {
                if (totalSupply >= 220) {
                    if (totalSupply % 2 == 0) {
                        burn(_salt, _nonce, 200);
                    }
                } else {
                    if (totalSupply % 2 == 0) {
                        burn(_salt, _nonce, totalSupply / 2);
                    } else {
                        burn(_salt, _nonce, ((totalSupply - 1) / 2) + 1);
                    }
                }
            } else if (totalSupply > 10) {
                burn(_salt, _nonce, totalSupply - 10);
            } else {
                if (totalSupply == 0) {
                    currentStage = Stage.MINT;
                } else if (totalSupply == 1) {
                    playersInGame[ticketsInPlay[0]].quantity -= 1;
                    transferToWinner(playersInGame[ticketsInPlay[0]].addr);
                    _prizeTokenIds.increment();
                    prizeTokenURI[_prizeTokenIds.current()] = winnerMetaData;
                    _mint(
                        playersInGame[ticketsInPlay[0]].addr,
                        _prizeTokenIds.current(),
                        1,
                        ""
                    );
                    currentStage = Stage.END;
                } else {
                    burn(_salt, _nonce, 1);
                }
            }
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ST1"
        );

        playersInGame[tokensInGame[msg.sender]].quantity -= amount;
        _removeTickets(tokensInGame[msg.sender], amount);

        if (tokensInGame[to] == 0) {
            _tokenIds.increment();
            tokensInGame[to] = _tokenIds.current();
            playersInGame[_tokenIds.current()] = Player(
                _tokenIds.current(),
                to,
                amount,
                true
            );
            _addTickets(_tokenIds.current(), amount);
        } else {
            playersInGame[tokensInGame[to]].quantity += amount;
            _addTickets(tokensInGame[to], amount);
        }

        _safeTransferFrom(from, to, id, amount, data);
    }

    function addPrize(address addr, string memory tURI) public onlyOwner {
        _prizeTokenIds.increment();
        prizeTokenURI[_prizeTokenIds.current()] = tURI;
        _mint(addr, _prizeTokenIds.current(), 1, "");
    }

    /** END Owner */

    /** PUBLIC */

    function uri(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (bytes(prizeTokenURI[tokenId]).length == 0) {
            return commonMetaData;
        }

        return prizeTokenURI[tokenId];
    }

    function mintTicket(uint256 numberOfTickets) public payable {
        require(currentStage == Stage.MINT, "MNT1");
        require(numberOfTickets > 0, "MNT2");
        require(numberOfTickets < 100, "MNT3");
        require(ticketPrice.mul(numberOfTickets) <= msg.value, "MNT4");
        _mint(msg.sender, TICKET, numberOfTickets, "");

        if (tokensInGame[msg.sender] == 0) {
            _tokenIds.increment();
            tokensInGame[msg.sender] = _tokenIds.current();
            playersInGame[_tokenIds.current()] = Player(
                _tokenIds.current(),
                msg.sender,
                numberOfTickets,
                true
            );
            _addTickets(_tokenIds.current(), numberOfTickets);
        } else {
            playersInGame[tokensInGame[msg.sender]].quantity += numberOfTickets;
            _addTickets(tokensInGame[msg.sender], numberOfTickets);
        }
        totalSupply += numberOfTickets;
        prizeMoney += ticketPrice.mul(numberOfTickets);
    }

    function getCurrentStage() public view returns (Stage) {
        return currentStage;
    }

    function getTicketsInPlaySize() public view returns (uint256) {
        return ticketsInPlay.length;
    }

    /** END PUBLIC */

    /** PRIVATE */

    function _remove(uint256 _index) private {
        require(_index < ticketsInPlay.length, "RM1");
        ticketsInPlay[_index] = ticketsInPlay[ticketsInPlay.length - 1];
        ticketsInPlay.pop();
    }

    function _removeTickets(uint256 ticketId, uint256 amount) private {
        uint256[] memory positions = new uint256[](amount);
        uint256 j;
        for (uint256 i = 0; i < ticketsInPlay.length; i++) {
            if (ticketsInPlay[i] == ticketId && j < amount) {
                positions[j] = i;
                j++;
            }
        }

        for (uint256 y = 0; y < positions.length; y++) {
            _remove(positions[y]);
        }
    }

    function _addTickets(uint256 tokenId, uint256 numberOfTickets) private {
        for (uint256 i = 0; i < numberOfTickets; i++) {
            ticketsInPlay.push(tokenId);
        }
    }

    function _addTicketsToBeBurned(uint256 ticketId, address addr) private {
        if (!ticketsToBeBurned[ticketId].exists) {
            ticketsToBeBurned[ticketId] = Player(ticketId, addr, 1, true);
        } else {
            ticketsToBeBurned[ticketId].quantity += 1;
        }
    }

    function _tokenExists(uint256[] storage list, uint256 ticketId)
        private
        view
        returns (bool)
    {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == ticketId) {
                return true;
            }
        }
        return false;
    }

    function _addTokenIdsToBurn(uint256[] storage list, uint256 ticketId)
        private
        returns (uint256[] storage newList)
    {
        if (!_tokenExists(list, ticketId)) {
            list.push(ticketId);
        }
        return list;
    }

    function _burnTickets(uint256[] storage list)
        private
        returns (uint256[] storage newList)
    {
        for (uint256 i = 0; i < list.length; i++) {
            _burn(
                ticketsToBeBurned[list[i]].addr,
                TICKET,
                ticketsToBeBurned[list[i]].quantity
            );
            playersInGame[list[i]].quantity -= ticketsToBeBurned[list[i]]
                .quantity;
        }
        return list;
    }

    function _randomNumber(uint256 _nonce, uint256 _salt)
        internal
        view
        onlyOwner
        returns (uint256)
    {
        bytes memory buffer = new bytes(32);
        uint256 tmp = block.timestamp + _nonce + _salt;
        assembly {
            mstore(add(buffer, 32), tmp)
        }
        return uint256(keccak256(buffer)) % totalSupply;
    }

    /** END PRIVATE */

    receive() external payable {}
}
