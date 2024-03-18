const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

//global variables
const cellSize = 100;
const cellGap = 3;
const winningScore = 100;

const controlsBar = {
    width: canvas.width,
    height: cellSize
}
const mouse = {
    x: undefined,
    y: undefined,
    width: 0.1,
    height: 0.1,
}
const resourceAmounts = [20, 30, 40];

const gameGrid = [];
const defenders = [];
const ghosts = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

let enemiesInterval = 600;
let numberOfResources = 1000;
let frame = 0;
let gameOver = false;
let score = 0;

//Import assets
const background = new Image();
background.src = "assets/background.png";
const topBar = new Image();
topBar.src = "assets/topBar.png";
const resource = new Image();
resource.src = "assets/resource.png";
const defenderSprite = new Image();
defenderSprite.src = "assets/defenderTank.png";
const enemySprite = new Image();
enemySprite.src = "assets/enemyTank.png";


//Handles input from mouse movement and clicks
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function(e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
})
canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
})
canvas.addEventListener('click', function(){
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if(gridPositionY < cellSize) return;
    for(let i = 0; i < defenders.length; i++){
        if(defenders[i].position === gridPositionX && defenders[i].y === gridPositionY) 
        return;
    }
    let defenderCost = 100;
    if(numberOfResources >= defenderCost){
        defenders.push(new Defender(gridPositionX,gridPositionY));
        ghosts.push(new Ghost(gridPositionX,gridPositionY))
        numberOfResources -= defenderCost;
    }
})
window.addEventListener('resize', function(){
    canvasPosition = canvas.getBoundingClientRect();
})

/*
 * Classes for the entities in the game
 */
class Cell {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if(mouse.x && mouse.y && collision(this,mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
class Projectiles{
    constructor(x,y){
        this.x = x + cellSize - cellGap;
        this.y = y + 20;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }
    update(){
        this.x += this.speed;
    }
    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}
class Ghost {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
    }
    draw() {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'blue';
        ctx.drawImage(defenderSprite, 0, 72, cellSize, 71.3, this.x + cellSize/4, this.y + cellSize/4, cellSize/2, cellSize/2);
        ctx.globalAlpha = 1.0;
    }
}
class Defender {
    constructor(x,y){
        this.x = -cellSize;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.position = x;
        this.speed = 1;
        this.timer = 0;
        this.frameCount = 0;
        this.frame = 0;
    }
    draw() {
        ctx.drawImage(defenderSprite, 0, 72 * this.frame, cellSize, 71, this.x, this.y, cellSize, cellSize);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health), this.x + this.width/4, this.y + this.height/2);
        this.debugText();
    }
    update(){
        if(this.x < this.position){
            this.x += this.speed;
            if(this.frameCount < 401){
                this.frameCount+=5;
                if(this.frameCount % 100 === 0){
                    this.frame = this.frameCount/100;
                }
            } else {
                this.frameCount = 0;
                this.frame = 0;
            }
        } else {
            this.frame = 0;
        }
        if(this.shooting && this.x + cellSize > 0){
            this.timer++;
            if(this.timer % 100 === 0){
                projectiles.push(new Projectiles(this.x, this.y));
            }
        } else {
            this.timer = 0;
        }
    }
    debugText(){
        ctx.fillText("Speed: " + Math.floor(this.speed), this.x, this.y);

    }
}
class Enemy {
    constructor(verticalPosition){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.frame = 0;
        this.frameCount = 0;
    }
    update(){
        this.x -= this.movement;
        if(this.frameCount < 401){
            this.frameCount+=5;
            if(this.frameCount % 100 === 0){
                this.frame = this.frameCount/100;
            }
        } else {
            this.frameCount = 0;
            this.frame = 0;
        }
    }
    draw(){
        ctx.drawImage(enemySprite, 0, 72 * this.frame, cellSize, 71, this.x, this.y, cellSize, cellSize);
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health), this.x + this.width/4, this.y + this.height/2);
        this.debugText();
    }
    debugText(){
        var movementRounded = Math.round(this.movement * 100) / 100
        var speedRounded = Math.round(this.speed * 100) / 100
        ctx.fillText("movement: " + movementRounded + "/ Speed: " + speedRounded, this.x, this.y);

    }
}
class Resource{
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.random(Math.random() * 5) + 1) * cellSize + cellSize/4;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount  = resourceAmounts[Math.floor(Math.random() * resourceAmounts.length)];
    }
    draw(){
        ctx.drawImage(resource, this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(this.amount, this.x + this.width/4, this.y + this.height/2);
    }
}

/*
 * Various functions for handling the game logic
 */

function createGrid() {
    for(let y = cellSize; y < canvas.height; y += cellSize){
        for(let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
}
function handleGameGrid(){
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}
//Generates defenders
function handleDefenders(){
    for(let i = 0; i < defenders.length; i++){
        ghosts[i].draw();
        defenders[i].draw();
        defenders[i].update();
        defenders[i].speed = 1;
        if(enemyPositions.indexOf(defenders[i].y) !== -1){
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for(let j = 0; j < enemies.length; j++){
                enemies[j].movement = enemies[j].speed;
            if(defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
                defenders[i].speed = 0;
            }
            if(defenders[i] && defenders[i].health <= 0){
                defenders.splice(i,1);
                ghosts.splice(i,1);
                i--;
            }
        }
    }
}
//Generates enemies
function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if(enemies[i].x < 0){
            gameOver = true;
        }
        if(enemies[i].health <= 0){
            let gainedResources = enemies[i].maxHealth/10;
            numberOfResources += gainedResources;
            score += gainedResources;
            enemyPositions.splice(enemyPositions.indexOf(enemies[i].y),1);
            enemies.splice(i,1);
            i--;
        }
    }
    if(frame % enemiesInterval === 0 && score < winningScore){
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        if(enemiesInterval > 120){
            enemiesInterval -=50;
        }
    }
}
//Creates projectiles for defenders
function handleProjectiles(){
    for(let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();
        for(let j = 0; j < enemies.length; j++){
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i,1);
                i--;
            }
        }
        if(projectiles[i] && projectiles[i].x > canvas.width - cellSize){
            projectiles.splice(i,1);
            i--;
        }
    }
}
//Generates resources on the game board
function handleResources(){
    if(frame % 500 === 0 && score < winningScore){
        resources.push(new Resource());
    }
    for(let i = 0; i < resources.length; i++){
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            numberOfResources += resources[i].amount;
            resources.splice(i,1);
            i--;
        }
    }
}
//Displays the background and top bar
function handleGameStatus(){
    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('Score: ' + score, cellSize/2, cellSize/4);
    ctx.fillText('Resources: ' + numberOfResources, cellSize/2, cellSize/2);
    ctx.fillText('To Win: 100', cellSize/2, cellSize);

    if(gameOver){
        ctx.textAlign = "center";
        ctx.fillStyle = 'white';
        ctx.font = '90px Arial';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.textAlign = "start";
    }
    
    if(score >= winningScore && enemies.length === 0){
        ctx.globalAlpha = 0.2;
        ctx.rect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,5)";
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'white';
        ctx.font = '90px Arial';
        ctx.textAlign = "center";
        ctx.fillText('LEVEL COMPLETE', canvas.width/2, canvas.height/2);
        ctx.font = '30px Arial';
        ctx.fillText('You win with ' + score + ' points!', canvas.width/2, canvas.height/2 + cellSize/2);
        ctx.textAlign = "start";
    }
}

//Function for collision detection
function collision(first, second){
    if(!(first.x > second.x + second.width || 
        first.x + first.width < second.x ||
        first.y > second.y + second.height || 
        first.y + first.height < second.y)){
        return true;
    };
    return false;
}

//This function runs the game loop and calls other functions
function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0, controlsBar.width, controlsBar.height);
    ctx.drawImage(topBar, 0, 300, controlsBar.width, controlsBar.height, 30, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleProjectiles();
    handleEnemies();
    handleResources();
    handleGameStatus();
    frame++;
    if(!gameOver) requestAnimationFrame(animate);
}

createGrid();
animate();