const playerData = document.getElementById('player-data');
let markedBoard = [];
//for restarting game
let defaultBoardNode;
let currentBoardNode;
let isMarkAnimationRun = false; 
let board = [];
let boardLeft = 0;
//for removing all click listener
let boardClickController = new AbortController();
let turn = 'x';
const player = {
    x: {
        name: '',
        nodeDisplayer: document.getElementById('player1-score'),
        score: 0
    },
    o: {
        name: '',
        nodeDisplayer: document.getElementById('player2-score'),
        score: 0
    }
}

playerData.addEventListener('submit', evt => {
    const menu = document.getElementById('menu');
    const game = document.getElementById('game');
    evt.preventDefault();
    const data = Object.fromEntries(new FormData(playerData));
    init(data);
    menu.classList.add('hide');
    game.classList.remove('hide');
});
function isIndexValid(i, j) {
    const isValid = typeof markedBoard[i] !== 'undefined' && typeof markedBoard[i][j] !== 'undefined';
    return isValid;
}
function displayWin(turn) { 
    const winPage = document.getElementById('win-page');
    const markDisplayer = document.getElementById('winner-mark');
    const resultText = document.getElementById('result-text');
    if(turn == 'o'){
        markDisplayer.appendChild(createOMark());  
    }
    else if(turn === 'x'){
        markDisplayer.appendChild(createXMark());  
    }
    resultText.innerText = 'Win';
    winPage.classList.remove('hide');
    console.log(JSON.stringify(winPage.getAttribute('className')));
}
function displayTie() { 
    const winPage = document.getElementById('win-page');
    const markDisplayer = document.getElementById('winner-mark');
    const resultText = document.getElementById('result-text');
    markDisplayer.appendChild(createXMark());
    markDisplayer.appendChild(createOMark());
    resultText.innerText = 'Tie';
    winPage.classList.remove('hide');
}
function addLine(track) {
    const svg = document.getElementById('line');
    const lineType = track.lineType;
    console.log(track);
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    console.log(board[track.collEnd]);
    console.log(board[0][0] === board[track.collStart][track.rowEnd])
    const rect = board[track.collStart][track.rowStart].getBoundingClientRect();
    const rect2 = board[track.collEnd][track.rowEnd].getBoundingClientRect();
    let svgPoint, svgPoint2;
    if (lineType === 'horizontal') {
        svgPoint = toSVGPoint(svg, rect.left, rect.top + rect.height / 2);
        svgPoint2 = toSVGPoint(svg, rect2.right, rect2.top + rect.height / 2)
    }
    if (lineType === 'vertical') {
        svgPoint = toSVGPoint(svg, rect.left + rect.width / 2, rect.top);
        svgPoint2 = toSVGPoint(svg, rect2.right - rect2.width / 2, rect2.bottom);
    }
    if (lineType === 'diagonalLeft') {
        console.log(rect.top, rect.bottom);
        svgPoint = toSVGPoint(svg, rect.left, rect.top);
        svgPoint2 = toSVGPoint(svg, rect2.right, rect2.bottom);
    }
    if (lineType === 'diagonalRight') {
        svgPoint2 = toSVGPoint(svg, rect.right, rect.top);
        svgPoint = toSVGPoint(svg, rect2.left, rect2.bottom);
    }
    path.setAttribute('d', `M${svgPoint.x} ${svgPoint.y} L${svgPoint2.x} ${svgPoint2.y}`);
    path.setAttribute('stroke', 'red');
    path.setAttribute('stroke-linecap', 'square');
    path.setAttribute('stroke-width', '3');
    path.style.setProperty('--length',path.getTotalLength());
    svg.appendChild(path);
}
function getWinLine(track, collPos, rowPos) {
    let minRow = Infinity;
    let maxRow = -Infinity;
    let minColl = Infinity;
    let maxColl = -Infinity;
    let minRowIndex = 0, maxRowIndex = 0;
    let minCollIndex = 0, maxCollIndex = 0;
    for (let i = 0; i < track.length; i++) {
        if (track[i][0] < minColl) {
            minColl = track[i][0];
            minCollIndex = i;
        }
        if (track[i][0] > maxColl) {
            maxColl = track[i][0];
            maxCollIndex = i;
        }
        if (track[i][1] > maxRow) {
            maxRow = track[i][1];
            maxRowIndex = i;
        }
        if (track[i][1] < minRow) {
            minRow = track[i][1];
            minRowIndex = i;
        }
    }
    //horizontal
    if (track[maxCollIndex][0] === track[minCollIndex][0]) {
        return {
            rowStart: track[minRowIndex][1] + rowPos,
            collStart: collPos,
            rowEnd: track[maxRowIndex][1] + rowPos,
            collEnd: collPos,
            lineType: 'horizontal'
        };
    }
    //vertical
    if (track[maxRowIndex][1] === track[minRowIndex][1]) {
        return {
            rowStart: rowPos,
            collStart: track[minCollIndex][0] + collPos,
            rowEnd: rowPos,
            collEnd: track[maxCollIndex][0] + collPos,
            lineType: 'vertical'
        };
    }
    //diagonal from left
    if (track[maxRowIndex][1] > track[minRowIndex][1] && track[maxRowIndex][0] > track[minRowIndex][0]) {
        return {
            rowStart: track[minRowIndex][1] + rowPos,
            collStart: track[minRowIndex][0] + collPos,
            rowEnd: track[maxRowIndex][1] + rowPos,
            collEnd: track[maxRowIndex][0] + collPos,
            lineType: 'diagonalLeft'
        };
    }
    //diagonal from right
    if (track[maxRowIndex][0] < track[minRowIndex][0] && track[maxRowIndex][1] > track[minRowIndex][1]) {
        return {
            rowStart: track[maxRowIndex][1] + rowPos,
            collStart: track[maxRowIndex][0] + collPos,
            rowEnd: track[minRowIndex][1] + rowPos,
            collEnd: track[minRowIndex][0] + collPos,
            lineType: 'diagonalRight'
        };
    }
}
function toSVGPoint(svg, x, y) {
    const point = new DOMPoint(x, y);
    return point.matrixTransform(svg.getScreenCTM().inverse());
}
function removeBoardClickListener(){
    boardClickController.abort();
}
function handlerPlaced(collPos, rowPos, turn) {
    let isWin = false;
    const track = [
        [
            [-2, 0],
            [-1, 0],
            [0, 0]
        ],
        [
            [2, 0],
            [1, 0],
            [0, 0]
        ],
        [
            [0, -2],
            [0, -1],
            [0, 0]
        ],
        [
            [0, 2],
            [0, 1],
            [0, 0]
        ],
        [
            [2, -2],
            [1, -1],
            [0, 0]
        ],
        [
            [-2, 2],
            [-1, 1],
            [0, 0]
        ],
        [
            [-2, -2],
            [-1, -1],
            [0, 0]
        ],
        [
            [2, 2],
            [1, 1],
            [0, 0]
        ],
        [

            [-1, 0],
            [0, 0],
            [1, 0]
        ], [
            [0, -1],
            [0, 0],
            [0, 1]
        ], [
            [-1, -1],
            [0, 0],
            [1, 1]
        ], [
            [-1, 1],
            [0, 0],
            [1, -1]
        ]];
    let winIndex;
    let winBoard = [];
    boardLeft -= 1;
    for (let i = 0; i < track.length; i++) {
        for (let j = 0; j < 3; j++) {
            const currentRowPos = rowPos + track[i][j][1];
            const currentCollPos = collPos + track[i][j][0];
            if (!isIndexValid(currentRowPos, currentCollPos) || markedBoard[currentCollPos][currentRowPos] !== turn) {
                isWin = false;
                winBoard = [];
                break;
            }
            else {
                winIndex = i;
                winBoard.push([currentRowPos, currentCollPos]);
                isWin = true;
            }
        }
        if (isWin) {
            addLine(getWinLine(track[winIndex], collPos, rowPos));
            displayWin(turn);
            console.log(player);
            player[turn].score += 1;
            //remove all click event listener from child
            removeBoardClickListener();
            return;
        }

    }
    if (boardLeft === 0) {
        displayTie();
    }
}
function setAttributes(element,attributes,ns = null){
    Object.keys(attributes).map((key) => element.setAttributeNS(ns,key,attributes[key]));
}
function setToDefault(){
    const winPage = document.getElementById('win-page');
    const transitionEndhandler = (evt) => {
        if(winPage.classList.contains('hide')){
            document.getElementById('winner-mark').innerHTML = '';
        }
        evt.target.removeEventListener('transitionend',transitionEndhandler);
    }
    winPage.addEventListener('transitionend',transitionEndhandler);
    winPage.classList.add('hide');
    board = [];
    boardLeft = 0;
    markedBoard = [];
    const newGameNode = defaultBoardNode.cloneNode(true);
    boardClickController = new AbortController();
    currentBoardNode.parentElement.replaceChild(newGameNode,currentBoardNode);
    currentBoardNode = newGameNode;
}
function createOMark(){
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    setAttributes(svg,{
        preserveAspectRatio: 'none',
        viewBox: '0 0 50 50'
    });
    const radius = 15;
    const circle = document.createElementNS(ns,'circle');
    setAttributes(circle,{
        cx: '25',
        cy: '25',
        r: radius,
        stroke: '#00FFFF',
        'stroke-width': "3px",
        fill: 'transparent',
    });
    circle.style.setProperty('--length',2 * Math.PI * 20);
    svg.appendChild(circle);
    return svg;
}
function createXMark(){
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    setAttributes(svg,{
        preserveAspectRatio: 'none',
        viewBox: '0 0 100 100'
    });
    const path = document.createElementNS(ns,'path');
    svg.appendChild(path);
    setAttributes(path,{
        vectorEffect:"non-scaling-stroke",
        stroke: '#00FFFF',
        'stroke-width': "5px",
        fill: 'transparent',
        d: "M 20 20 L 80 80 M 80 20 L 20 80"
    });
    path.style.setProperty('--length',path.getTotalLength());
    return svg;
}
function placeMark(collPos, rowPos, turn) {
    markedBoard[collPos][rowPos] = turn;
    const markWrapper = board[collPos][rowPos];
    let mark; 
    if (turn === 'o') {
        mark = createOMark();
    }
    if(turn === 'x'){
        mark = createXMark();
    }
    markWrapper.appendChild(mark);
    //make board cant be clicked when mark animation run
    isMarkAnimationRun = true;
    mark.addEventListener('animationend',() => {
        isMarkAnimationRun = false;
    });
}
function toggleTurn() {
    const turnDisplayer = document.getElementById('turn-displayer');
    if (turn === 'x') {
        turn = 'o';
    }
    else {
        turn = 'x';
    }
    turnDisplayer.innerText = `${turn.toUpperCase()} turn`;
}
function startGame() {
    const boardWrapper = document.getElementById('board');
    player['x'].nodeDisplayer.innerText = player['x'].score;
    player['o'].nodeDisplayer.innerText = player['o'].score;
    const clickHandler = (i,j) => {
        return function handler(evt){
          console.log('run');
          if(isMarkAnimationRun){
              return;
          }
          placeMark(i, j, turn, board[i][j]);
          handlerPlaced(i, j, turn);
          toggleTurn();
          evt.target.removeEventListener('click',handler);
        }
    }
    //create 3 * 3 board
    for (let i = 0; i < 3; i++) {
        console.log(i);
        const coll = document.createElement('div');
        markedBoard.push([]);
        board.push([]);
        for (let j = 0; j < 3; j++) {
            boardLeft += 1;
            markedBoard[i].push(null);
            const node = document.createElement('div');
            coll.appendChild(node);
            board[i].push(node);
            node.addEventListener('click', clickHandler(i,j),{
                signal: boardClickController.signal
            });
        };
        boardWrapper.appendChild(coll);
    };
}
function setPageToHome(){
    const game = document.getElementById('game');
    //the menu is the home
    const menu = document.getElementById('menu');
    menu.classList.remove('hide');
    game.classList.add('hide');
    setToDefault();
}
function restartGame() {
    setToDefault();
    startGame();
}
function init({ player1, player2 }) {
    const boardWrapper = document.getElementById('board-wrapper');
    const gamePlayer1Name = document.getElementById('player1-name');
    const gamePlayer2Name = document.getElementById('player2-name');
    gamePlayer1Name.innerText = `${player1}(x)`;
    gamePlayer2Name.innerText = `${player2}(o)`;
    player.x.name = player1;
    player.o.name = player2;
    defaultBoardNode = boardWrapper.cloneNode(true);
    currentBoardNode = boardWrapper;
    document.getElementById('restart-btn').addEventListener('click',() => restartGame());
    document.getElementById('home-btn').addEventListener('click',() => setPageToHome());
    startGame();
}