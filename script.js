const playerData = document.getElementById('player-data');
const menu = document.getElementById('menu');
const markedBoard = [];
const board = [];
let boardLeft = 0;
const boardWrapper = document.getElementById('board');
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
    evt.preventDefault();
    const data = Object.fromEntries(new FormData(playerData));
    startGame();
    menu.classList.add('hide');
});
function isIndexValid(i, j) {
    const isValid = typeof markedBoard[i] !== 'undefined' && typeof markedBoard[i][j] !== 'undefined';
    return isValid;
}
function displayWin() { }
function displayTie() { }
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
    console.log(path);
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
            displayWin();
            console.log(player);
            player[turn].score += 1;
            player[turn].nodeDisplayer.innerText = player[turn].score;
            //remove all click event listener from child
            const clonedBoard = boardWrapper.cloneNode(true);
            boardWrapper.replaceWith(clonedBoard);
            return;
        }

    }
    if (boardLeft === 0) {
        displayTie();
    }
}
function placeMark(collPos, rowPos, turn, node) {
    markedBoard[collPos][rowPos] = turn;
    const markWrapper = board[collPos][rowPos];
    if (turn === 'o') {
        markWrapper.innerHTML = `
        <svg  xmlns="http://www.w3.org/200.svg" preserveAspectRatio="none" viewbox="0 0 50 50">
           <circle cx="50%" cy="50%" r="20" stroke="#00FFFF" stroke-width="5" fill="transparent"  /> 
        </svg>`;
    }
    if(turn === 'x'){
        markWrapper.innerHTML = `
        <svg xmln"http://www.w3.org/2000/svg" viewbox="0 0 100 100" preserveAspectRatio="none">
          <path stroke="#00FFFF" d="M 20 20 L 80 80 M 80 20 20 80" stroke-width="13"/>
       </svg>`
    }
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
    const addBoardClickListener = (i, j) => {
        const clickHandler = () => {
            placeMark(i, j, turn, board[i][j]);
            handlerPlaced(i, j, turn);
            toggleTurn();
        }
        board[i][j].addEventListener('click', clickHandler, { once: true });
    };
    //create 3 * 3 board
    for (let i = 0; i < 3; i++) {
        const coll = document.createElement('div');
        markedBoard.push([]);
        board.push([]);
        for (let j = 0; j < 3; j++) {
            boardLeft += 1;
            markedBoard[i].push(null);
            const node = document.createElement('div');
            coll.appendChild(node);
            board[i].push(node);
            addBoardClickListener(i, j);
        };
        boardWrapper.appendChild(coll);
    };
}
function init({ player1, player2 }) {
    const gamePlayer1Name = document.getElementById('player1-name');
    const gamePlayer2Name = document.getElementById('player2-name');
    gamePlayer1Name.innerText = `${player1}(x)`;
    gamePlayer2Name.innerText = `${player2}(o)`;
    player.x.name = player1;
    player.o.name = player2;
    startGame();
}
init({ player1: 'hello', player2: 'world' });