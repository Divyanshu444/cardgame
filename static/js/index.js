const drawcardBtn = document.querySelector('#drawCard');
drawcardBtn.addEventListener('click', drawCard);
var subBoard = document.querySelector('.board');
const actionButtons = document.querySelectorAll('.tag-container');
let isDraw = true;
let selectedForScore = document.getElementById('discardedPileCalculation')
const declareTheWinnerBTN = document.getElementById('declare-winner');
let restartButton = document.getElementById('restartGame');
const hasVisitedBefore = localStorage.getItem('visitedBefore');
const welcomeElement = document.querySelector('.welcome')
const alertMsg = document.querySelector('.alert');
const instruct = document.querySelector('.instruct');
let isDeclareWinner = null;
let calculateDiscardedCards = -1;

let discardFlag = false;
let declarewinnerbtnclicked = false;



function getCookieValue(cookieName) {
  const name = cookieName + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}

const socket = io.connect('http://localhost:5000/');

socket.on('connect', () => {
  //console.log('Connected to the server');
  const cookieValue = getCookieValue('user_id');
  socket.emit('cookie_message', { cookie: cookieValue });
});
socket.on('start_status', (data) => {
  if (data.start == 'wait') {
    actionButtons.forEach(button => {
      button.style.display = 'none';
    });
    instruct.innerHTML = `Wait Until 100 Users Join The Tournament. ${data.joinedPlayers} Have Joined`;
  } else if (data.start == 'true') {
    actionButtons.forEach(button => {
      button.display = 'block';
    });
  }
});
socket.on('disconnect', () => {
  //console.log('Disconnected from the server');
});

window.addEventListener('beforeunload', () => {
  localStorage.clear();
});
window.addEventListener('unload', () => {
  localStorage.clear();
});

window.addEventListener('DOMContentLoaded', () => {
  const hasVisitedBefore = localStorage.getItem('visitedBefore');
  const welcomeElement = document.querySelector('.welcome');

  if (!hasVisitedBefore) {
    localStorage.setItem('visitedBefore', true);
    welcomeElement.style.height = '110vh';
    //  welcomeElement.style.display = 'block';
    setTimeout(() => {
      welcomeElement.style.display = 'none';
    }, 5000);
  }
});
// Game Logic
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['h', 'd', 'c', 's'];
const scoreField = document.querySelector('.score');
let deck = [];
let playerHand = [];
let discardPile = [];
let selectedCards = [];
let gameStarted = false;

function initializeDeck() {
  deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const cardImage = `static/pics/cards/${rank}${suit.toLowerCase()}.png`;
      deck.push({ rank, suit, image: cardImage });
    }
  }
  shuffleDeck(deck);
}

function shuffleDeck(deck, times = 1) {
  for (let t = 0; t < times; t++) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
}

const discardPileContainer = document.getElementById('discard-pile');



function discardToPile(event) {
  event.preventDefault();

  discardSelectedCard();
}

function discardSelectedCard() {
  if (gameStarted != true) {
    alertMsg.innerHTML = ('You have to draw the first card to start the game.');
    return;
  } else {
    if (selectedCards.length === 1) {
      const index = selectedCards[0];
      const discardedCard = playerHand.splice(index, 1)[0];
      discardPile.push(discardedCard);
      selectedCards = [];
      renderPlayerHand();
      renderDiscardPile();
    } else {
      alertMsg.innerHTML = ('Please select only one card to discard.');
    }
  }
}

function dealCards() {
  playerHand = [];
  for (let i = 0; i < 10; i++) {
    playerHand.push(deck.pop());
  }
}

function renderPlayerHand() {
  const playerHandContainer = document.getElementById('player-hand');
  playerHandContainer.innerHTML = '';

  for (let i = 0; i < playerHand.length; i++) {
    const cardElement = document.createElement('img');
    cardElement.src = playerHand[i].image;
    cardElement.alt = `${playerHand[i].rank} ${playerHand[i].suit}`;
    cardElement.classList.add('card');

    cardElement.setAttribute('draggable', true);

    cardElement.addEventListener('dragstart', (event) => {

      event.dataTransfer.setData('text/plain', i.toString());
      // Set the custom drag image to the card being dragged
      const dragImage = new Image();
      dragImage.src = playerHand[i].image;
      dragImage.style.opacity = '1';
      event.dataTransfer.setDragImage(dragImage, 20, 20);
    });
    cardElement.addEventListener('mousedown', selectCard);

    if (selectedCards.includes(i)) {
      cardElement.classList.add('selected');
    }

    playerHandContainer.appendChild(cardElement);
  }
}



function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();

  const data = event.dataTransfer.getData('text/plain');
  const draggedIndex = parseInt(data);
  const targetIndex = Array.from(event.target.parentNode.children).indexOf(event.target);

  const draggedCard = playerHand[draggedIndex];

  // Insert the dragged card at the target index
  playerHand.splice(draggedIndex, 1);
  playerHand.splice(targetIndex, 0, draggedCard);

  const initialOffset = event.clientX - event.target.getBoundingClientRect().left;

  let animationId;

  function animateDrop(timestamp) {
    const currentOffset = event.clientX - event.target.getBoundingClientRect().left;
    const offsetDiff = currentOffset - initialOffset;

    playerHands.style.transform = `translateX(${offsetDiff + 50}px)`;

    if (offsetDiff < 0) {
      animationId = requestAnimationFrame(animateDrop);
    } else {
      cancelAnimationFrame(animationId);
      playerHands.style.transition = 'transform 5s ease';
      playerHands.style.transform = '';
      renderPlayerHand();
    }
  }

  animationId = requestAnimationFrame(animateDrop);

}


const playerHands = document.getElementById('player-hand');

playerHands.addEventListener('dragover', allowDrop);
playerHands.addEventListener('drop', drop);


let touchStartIndex;

playerHands.addEventListener('touchstart', (event) => {
  const touchedCard = event.touches[0].target;
  touchStartIndex = Array.from(touchedCard.parentNode.children).indexOf(touchedCard);
});

playerHands.addEventListener('touchmove', (event) => {
  event.preventDefault();
});

playerHands.addEventListener('touchend', (event) => {
  const touchedCard = document.elementFromPoint(
    event.changedTouches[0].clientX,
    event.changedTouches[0].clientY
  );
  const touchEndIndex = Array.from(touchedCard.parentNode.children).indexOf(touchedCard);

  const temp = playerHand[touchStartIndex];
  playerHand[touchStartIndex] = playerHand[touchEndIndex];
  playerHand[touchEndIndex] = temp;

  renderPlayerHand();
});

function selectCard(event) {
  const clickedCard = event.target;
  const cardIndex = Array.from(clickedCard.parentNode.children).indexOf(clickedCard);

  // Clear the selected cards array and add the clicked card
  selectedCards = [cardIndex];

  renderPlayerHand();
}


function drawCard() {
  drawcardBtn.removeEventListener('click', drawCard);
  if (isDraw != true) {
    isDraw = true;
    checkControl(isDraw);
  }
  if (!gameStarted) {
    gameStarted = true;
    alertMsg.innerHTML = ('The game has started!');
  }
  declareTheWinnerBTN.addEventListener('click', declareRummy);
  discardPileContainer.addEventListener('dragover', allowDrop);
  discardPileContainer.addEventListener('drop', discardToPile);
  if (deck.length > 0) {
    const drawnCard = deck.pop();
    playerHand.push(drawnCard);
    renderPlayerHand();
  } else {
    drawcardBtn.removeEventListener('click', drawCard);
    drawcardBtn.style.backgroundImage = ('url("")')
    drawcardBtn.style.backgroundColor = 'green';
    alertMsg.innerHTML = ('The deck is empty.start new Game');//alpha
  }
}
declareTheWinnerBTN.style.display = 'none';

setTimeout(() => {
  declareTheWinnerBTN.style.display = 'block';
}, 90000)
function discardSelectedCard() {
  drawcardBtn.addEventListener('click', drawCard);
  if (isDraw != false) {
    isDraw = false;
    checkControl(isDraw);
  }
  if (gameStarted == true) {
    if (selectedCards.length === 1) {
      const index = selectedCards[0];
      const discardedCard = playerHand.splice(index, 1)[0];
      discardPile.push(discardedCard);
      drawcardBtn.addEventListener('click', drawCard);
      discardPileContainer.removeEventListener('dragover', allowDrop);
      discardPileContainer.removeEventListener('drop', discardToPile);
      declareTheWinnerBTN.removeEventListener('click', declareRummy);
      selectedCards = [];
      renderPlayerHand();
      renderDiscardPile();
    } else {
      alertMsg.innerHTML = ('Please select only one card to discard.');
    }
  } else {
    alertMsg.innerHTML = ('Start By Drawing A Card.')
  }
}

function isFullValidSets(arr) {
  if (arr.length !== 3) {
    return false; // There should be exactly 3 sub-arrays
  }
  let total_length = 0
  for (let i = 0; i < arr.length; i++) {
    const subArray = arr[i];
    total_length += subArray.length;

    if (!(subArray.length === 3 || subArray.length === 4)) {
      return false; // Each sub-array should have exactly 3 or 4 objects
    }
  }
  if (total_length < 10) {
    return false;  // If the hand contains less than 10 cards its not a valid full set.
  }

  return true; // All conditions are met
}

function removeCardsFromHand(sets, playerHand) {
  // Loop through each set
  for (const set of sets) {
    // Create a set of cards to remove based on rank and suit
    const cardsToRemove = new Set();
    for (const card of set) {
      cardsToRemove.add(JSON.stringify(card));
    }

    // Filter out cards from playerHand that are present in the set
    playerHand = playerHand.filter((card) => !cardsToRemove.has(JSON.stringify(card)));
  }

  // Return the updated playerHand
  return playerHand;
}

function getSetsAndRunsMelds(hand, inverse = false) {
  let meld = hand
  if (inverse) {
    const validSets = getValidSets(meld);
    //console.log('valid set', validSets);
    meld = removeCardsFromHand(validSets, meld);
    const validRuns = getValidRuns(meld);
    //console.log("valid runs", validRuns);
    meld = removeCardsFromHand(validRuns, meld);

  }
  else {
    const validRuns = getValidRuns(meld);
    //console.log("valid runs", validRuns);
    meld = removeCardsFromHand(validRuns, meld);
    const validSets = getValidSets(meld);
    //console.log('valid set', validSets);
    meld = removeCardsFromHand(validSets, meld)
  }
  return meld
}

function declareRummy() {

  if (discardFlag) {
    let meld_1 = getSetsAndRunsMelds(playerHand);
    let meld_2 = getSetsAndRunsMelds(playerHand, inverse = true);
    //console.log("meld_1", meld_1)
    //console.log("meld_2", meld_2)

    const checkOneCardUsedInBothMelds = (meld_1.length == 2 && meld_2.length == 3) || (meld_1.length == 3 && meld_2.length == 2)
    //checks if one card can be used in both sets and runs
    const checkTwoCardUsedInBothMelds = (meld_1.length == 2 && meld_2.length == 2)
    //checks if two cards can be used in both sets and runs
    const isWinnerHand = meld_1.length == 0 || meld_2.length == 0 || checkOneCardUsedInBothMelds || checkTwoCardUsedInBothMelds
    //console.log("isWinnerHand", isWinnerHand)
    // Check if there are exactly 10 valid sets and runs, or a mix of both
    // const isWinnerHand = validSets.length + validRuns.length === 10 || (validSets.length > 0 && validRuns.length > 0);
    // console.log('isWinnerHand', isWinnerHand);
    let validSets = getValidSets(playerHand);
    let isFullSets = isFullValidSets(validSets);
    // console.log('isFullSets', isFullSets);

    if (isWinnerHand || isFullSets) {
      isDeclareWinner = true;
    }
    else {
      isDeclareWinner = false;
    }
  }
  else {
    declarewinnerbtnclicked = true;
    alertMsg.innerHTML = 'Now Discard the 11th card.';

    declareTheWinnerBTN.style.display = 'block';
    declareTheWinnerBTN.removeEventListener('click', declareRummy);
    drawcardBtn.removeEventListener('click', drawCard);

  }

}

function isPureSet(cards) {
  const uniqueRanks = new Set(cards.map(card => card.rank));
  const uniqueSuits = new Set(cards.map(card => card.suit));

  return uniqueRanks.size === cards.length && uniqueSuits.size === cards.length;
}


function isPureRun(cards) {
  return isConsecutive(cards);
}

function getValidSets(hand) {
  const groupedByRank = groupCardsByRank(hand);
  return groupedByRank.filter(group => group.length >= 3);
}

function getValidRuns(hand) {
  const groupedBySuit = groupCardsBySuit(hand);
  const validRuns = [];

  for (const suitGroup of groupedBySuit) {
    suitGroup.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank));
    for (let i = 0; i <= suitGroup.length - 3; i++) {
      const run = suitGroup.slice(i, i + 3);
      if (isConsecutive(run) && run.length > 2) {
        validRuns.push(run);
      }
    }
  }

  // Check if any valid runs were found
  if (validRuns.length > 0) {
    return validRuns;
  } else {
    return [];
  }
}

function isConsecutive(cards) {
  const sortedRanks = cards.map(card => ranks.indexOf(card.rank)).sort((a, b) => a - b);
  // console.log("sorted ranks", sortedRanks);

  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
      return false;
    }
  }
  return true;
}

function groupCardsByRank(cards) {
  const groupedByRank = {};

  for (const card of cards) {
    if (!groupedByRank[card.rank]) {
      groupedByRank[card.rank] = [];
    }
    groupedByRank[card.rank].push(card);
  }

  return Object.values(groupedByRank);
}
function groupCardsBySuit(cards) {
  const groupedBySuit = {};

  for (const card of cards) {
    if (!groupedBySuit[card.suit]) {
      groupedBySuit[card.suit] = [];
    }
    groupedBySuit[card.suit].push(card);
  }

  return Object.values(groupedBySuit);
}


function renderDiscardPile() {
  const discardPileContainer = document.getElementById('discard-pile');
  discardPileContainer.innerHTML = '';
  calculateDiscardedCards += 1;
  for (const card of discardPile) {
    const cardElement = document.createElement('img');
    cardElement.src = card.image;
    cardElement.alt = `${card.rank} ${card.suit}`;
    cardElement.classList.add('card');
    while (discardPileContainer.firstChild) {
      discardPileContainer.removeChild(discardPileContainer.firstChild)
    }
    discardPileContainer.appendChild(cardElement);
  }
  selectedForScore.innerHTML = calculateDiscardedCards;
  if (declarewinnerbtnclicked == true) {
    discardFlag = true;
    declareRummy();
  }
  if (isDeclareWinner == true) {
    sendScore(calculateDiscardedCards);
    alertMsg.innerHTML = 'Congrats You Won.Start new a Game.'
    drawcardBtn.removeEventListener('click', drawCard);//gama
    discardPileContainer.removeEventListener('dragover', allowDrop);
    discardPileContainer.removeEventListener('drop', discardToPile);
    restartButton.addEventListener('click', restartGame);
  } else if (isDeclareWinner == false) {
    restartButton.addEventListener('click', restartGame);
    drawcardBtn.removeEventListener('click', drawCard);//gama
    discardPileContainer.removeEventListener('dragover', allowDrop);
    discardPileContainer.removeEventListener('drop', discardToPile);
    alertMsg.innerHTML = ('Sorry you have no Winner Hand.Please restart the Game');
  }
}
function getSelectedCards() {
  return selectedCards.map(index => playerHand[index]);
}


// Initialize the game
initializeDeck();
dealCards();
renderPlayerHand();
renderDiscardPile();

// Checking User Rank Every time and updating leaderboard
const user_id = getCookieValue('user_id')
function sendScore(data) {
  const query = '/currentRank?data=' + encodeURIComponent(JSON.stringify({ playerId: user_id, playerScore: data }));
  fetch(query)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      form_rank_frames(data);
      //console.log(data)
    })
    .catch(error => {
      console.error('Error during fetch:', error);
    });
}

function form_rank_frames(data) {
  console.log(data)
  const leaderBoard = document.querySelector('.right-main');

  while (leaderBoard.firstChild) {
    leaderBoard.removeChild(leaderBoard.firstChild);
  }

  for (let i = 0; i <= data.score.length; i++) {
    // console.log(data.score[i].username, data.score[i].rank, data.score[i].score)
    const main_rank_frame = document.createElement('div');
    const name_frame = document.createElement('div');
    const rank_frame = document.createElement('div');
    const country_frame = document.createElement('div');

    main_rank_frame.classList.add('main-rank-frame');
    name_frame.classList.add('user-name');
    rank_frame.classList.add('user-rank');
    country_frame.classList.add('user-country');

    name_frame.innerHTML = data.score[i].username;

    rank_frame.innerHTML = i + 1;


    if (data.score[i].score == -1) {
      country_frame.innerHTML = 0;
    } else {
      country_frame.innerHTML = data.score[i].score;
    }

    main_rank_frame.appendChild(rank_frame);
    main_rank_frame.appendChild(name_frame);
    main_rank_frame.appendChild(country_frame);

    leaderBoard.appendChild(main_rank_frame);
  }
}
sendScore(0)

// Sending user comment to the server
function sendComment() {
  const commentText = document.querySelector('.comment-text').value;
  const userId = getCookieValue('user_id');
  const query = '/comment?data=' + encodeURIComponent(JSON.stringify({ text: commentText, player: userId }));

  fetch(query)
    .then(response => response.json())
    .then(data => {
      alert(data.status);
    })
    .catch(err => {
      //console.log(err);
    });
}
function checkControl(flag) {
  if (flag == true) {
    alertMsg.innerHTML = ''
  } else if (flag == false) {
    alertMsg.innerHTML = ''
  }
}
setTimeout(function () {
  restartButton.addEventListener('click', restartGame);
}, 90000);
//restartButton.addEventListener('click',restartGame);

function restartGame() {
  deck = [];
  playerHand = [];
  discardPile = [];
  selectedCards = [];
  gameStarted = false;
  isDraw = false;
  isDeclareWinner = false;
  calculateDiscardedCards = -1;
  discardFlag = false;
  declarewinnerbtnclicked = false;


  // Initialize the deck and deal cards
  initializeDeck();
  dealCards();
  // Render the initial state of the game
  renderPlayerHand();
  renderDiscardPile();
  isDeclareWinner = null;
  alertMsg.innerHTML = '';

  // Add any additional setup code here
  drawcardBtn.style.backgroundImage = ('url("static/pics/cards/back card big FUN icon.png")')
  //drawcardBtn.style.backgroundColor = 'green';
  // Add any event listeners that need to be re-attached
  drawcardBtn.addEventListener('click', drawCard);
  discardPileContainer.addEventListener('dragover', allowDrop);
  discardPileContainer.addEventListener('drop', discardToPile);
  declareTheWinnerBTN.addEventListener('click', declareRummy);
  restartButton.removeEventListener('click', restartGame);
  setTimeout(function () {
    restartButton.addEventListener('click', restartGame);
  }, 90000);
  declareTheWinnerBTN.style.display = 'none';
  setTimeout(() => {
    declareTheWinnerBTN.style.display = 'block';
  }, 90000)
  // renderDiscardPile();
}
window.addEventListener('beforeunload', function () {
  document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
});

// Modal



document.getElementById('open-modal-button').addEventListener('click', function () {
  document.getElementById('modal-container').style.display = 'flex';
});

document.getElementById('close-modal').addEventListener('click', function () {
  document.getElementById('modal-container').style.display = 'none';
});





/////////////////////////////////////////////////////////////////////////
// function openRulesPopup() {
//   // Define the rules content
//   var rulesContent = `
//       <html>
//       <head>
//           <title>Rules</title>
//           <style>
//               /* Add your custom CSS styles for the popup */
//               body {
//                   font-family: Arial, sans-serif;
//                   padding: 20px;
//               }
//               h1 {
//                   font-size: 24px;
//               }
//               /* Add more styles as needed */
//           </style>
//       </head>
//       <body>
//           <h1>Rules</h1>
//           <p>1. Rule 1</p>
//           <p>2. Rule 2</p>
//           <p>3. Rule 3</p>
//           <!-- Add more rules as needed -->
//       </body>
//       </html>
//   `;

//   // Open a new window with the rules content
//   var popup = window.open("", "RulesPopup", "width=600,height=400");
//   popup.document.write(rulesContent);
// }
/////////////////////////////////////////////////////////////////////////////////