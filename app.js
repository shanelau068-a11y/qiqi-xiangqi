const PIECE_TEXT={red:{G:'帅',A:'仕',E:'相',H:'马',R:'车',C:'炮',P:'兵'},black:{G:'将',A:'士',E:'象',H:'马',R:'车',C:'炮',P:'卒'}};
const puzzles=window.QIQI_PUZZLES||[];
const $=id=>document.getElementById(id);
const layer=$('piece-layer'),board=$('board'),canvas=$('board-lines'),ctx=canvas.getContext('2d');
let mode='puzzle';
let current=Math.min(Number(localStorage.getItem('qiqi-xiangqi-level')||0),Math.max(0,puzzles.length-1));
let solved=new Set(JSON.parse(localStorage.getItem('qiqi-xiangqi-solved')||'[]'));
let pieces=[],selected=null,targets=[],passed=false,hintStep=0,turn='red',aiThinking=false,gameOver=false,lastMove=null;
let soundEnabled=localStorage.getItem('qiqi-xiangqi-sound')!=='off',audioContext=null;

function pct(row,col){return{left:`${4+col*11.5}%`,top:`${4+row*10.22}%`};}
function clonePieces(items){return items.map((p,i)=>({...p,uid:`p${i}`}));}
function sameFrom(piece,m){return piece.col===m.fromCol&&piece.row===m.fromRow;}
function sameSquare(a,b){return a&&b&&a.row===b.row&&a.col===b.col;}
function moveCount(p){return p.movesToMate||Math.ceil(p.solution.length/2);}
function countText(n){return['零','一','二','三','四','五','六','七','八','九','十'][n]||n;}

function drawBoard(){
  const dpr=devicePixelRatio||1,w=board.clientWidth,h=board.clientHeight;
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#5c2b19';ctx.lineWidth=1.25;
  const x0=w*.04,y0=h*.04,x1=w*.96,y1=h*.96,dx=(x1-x0)/8,dy=(y1-y0)/9;
  for(let r=0;r<10;r++){ctx.beginPath();ctx.moveTo(x0,y0+r*dy);ctx.lineTo(x1,y0+r*dy);ctx.stroke();}
  for(let c=0;c<9;c++){ctx.beginPath();ctx.moveTo(x0+c*dx,y0);ctx.lineTo(x0+c*dx,y0+4*dy);ctx.moveTo(x0+c*dx,y0+5*dy);ctx.lineTo(x0+c*dx,y1);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x0+3*dx,y0);ctx.lineTo(x0+5*dx,y0+2*dy);ctx.moveTo(x0+5*dx,y0);ctx.lineTo(x0+3*dx,y0+2*dy);ctx.moveTo(x0+3*dx,y1);ctx.lineTo(x0+5*dx,y1-2*dy);ctx.moveTo(x0+5*dx,y1);ctx.lineTo(x0+3*dx,y1-2*dy);ctx.stroke();
}

function renderBoard(){
  layer.innerHTML='';drawBoard();
  const answer=mode==='puzzle'&&puzzles[current]?.solution[0];
  if(lastMove){
    for(const name of ['from','to']){
      const mark=document.createElement('span');mark.className=`last-square ${name}`;Object.assign(mark.style,pct(lastMove[name].row,lastMove[name].col));layer.append(mark);
    }
  }
  for(const piece of pieces){
    const b=document.createElement('button');b.type='button';b.className=`piece ${piece.color}${selected?.uid===piece.uid?' selected':''}`;
    if(answer&&hintStep>=2&&sameFrom(piece,answer))b.classList.add('hinted');
    if(lastMove&&sameSquare(piece,lastMove.to))b.classList.add('last-moved');
    Object.assign(b.style,pct(piece.row,piece.col));b.textContent=PIECE_TEXT[piece.color][piece.type];
    b.setAttribute('aria-label',`${piece.color==='red'?'红':'黑'}${b.textContent}`);b.addEventListener('click',()=>selectPiece(piece));layer.append(b);
  }
  for(const to of targets){
    const b=document.createElement('button');b.type='button';b.className=`target${to.capture?' capture':''}`;Object.assign(b.style,pct(to.row,to.col));
    b.setAttribute('aria-label',`走到第${to.col+1}列第${to.row+1}行`);b.addEventListener('click',()=>play(to));layer.append(b);
  }
}

function renderPuzzle(){
  if(!puzzles.length){$('message').textContent='题库载入失败，请刷新页面。';return;}
  const p=puzzles[current],steps=moveCount(p);
  $('level-label').textContent=`第 ${current+1} / ${puzzles.length} 关`;$('score-label').textContent=`🏅 ${solved.size}`;
  $('progress-bar').style.width=`${Math.max(2,(solved.size/puzzles.length)*100)}%`;
  $('level-tag').textContent=`第 ${Math.floor(current/20)+1} 章 · ${countText(steps)}步杀`;
  $('puzzle-title').textContent=`红方先走 · ${countText(steps)}步杀 · 第 ${current+1} 题`;
  $('puzzle-text').textContent='找出红方连续进攻的最佳第一手。';
  $('tip-text').textContent='先观察黑将的逃路，再找将军、封路和双重攻击的组合。';renderBoard();
}

function renderAI(){
  $('level-tag').textContent='人机对弈 · 你执红棋';
  $('puzzle-title').textContent=gameOver?'本局结束':aiThinking?'电脑正在思考…':turn==='red'?'轮到齐齐走棋':'轮到电脑走棋';
  $('puzzle-text').textContent='黄色虚线是起点，发光黄圈是刚才的落点。';
  $('tip-text').textContent='开局先出马、炮，尽快把车开出来，同时注意保护自己的帅。';renderBoard();
}

function render(){mode==='puzzle'?renderPuzzle():renderAI();}

function ensureAudio(){
  if(!soundEnabled)return null;
  const AudioClass=window.AudioContext||window.webkitAudioContext;if(!AudioClass)return null;
  if(!audioContext)audioContext=new AudioClass();if(audioContext.state==='suspended')audioContext.resume();return audioContext;
}
function beep(frequency,start,duration,type='sine',volume=.05){
  const audio=ensureAudio();if(!audio)return;
  const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=type;oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(volume,audio.currentTime+start);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+start+duration);
  oscillator.connect(gain).connect(audio.destination);oscillator.start(audio.currentTime+start);oscillator.stop(audio.currentTime+start+duration);
}
function playSound(kind){
  if(!soundEnabled)return;
  if(kind==='capture'){beep(190,0,.11,'square',.07);beep(120,.07,.14,'triangle',.05);}
  else if(kind==='win'){[523,659,784,1047].forEach((f,i)=>beep(f,i*.09,.18,'sine',.045));}
  else if(kind==='lose'){[330,247,196].forEach((f,i)=>beep(f,i*.11,.2,'triangle',.045));}
  else{beep(520,0,.055,'triangle',.045);beep(390,.045,.07,'triangle',.035);}
}
function updateSoundButton(){$('sound-toggle').textContent=soundEnabled?'🔊 声音开':'🔇 声音关';$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));}

function rememberMove(piece,to,captured,actor){
  lastMove={from:{row:piece.row,col:piece.col},to:{row:to.row,col:to.col},type:piece.type,color:piece.color,captured:captured?.type,actor};
  const who=actor==='computer'?'电脑':'齐齐',name=`${piece.color==='red'?'红':'黑'}${PIECE_TEXT[piece.color][piece.type]}`;
  const capture=captured?`，吃掉${PIECE_TEXT[captured.color][captured.type]}`:'';
  $('last-move').textContent=`${who}刚走：${name}，第 ${piece.col+1} 列第 ${piece.row+1} 行 → 第 ${to.col+1} 列第 ${to.row+1} 行${capture}`;
  $('last-move').classList.remove('hidden');
}
function clearLastMove(){lastMove=null;$('last-move').classList.add('hidden');$('last-move').textContent='';}

function selectPiece(piece){
  if(mode==='puzzle'){if(passed||piece.color!=='red')return;}
  else if(gameOver||aiThinking||turn!=='red'||piece.color!=='red')return;
  selected=piece;targets=XiangqiRules.legalMoves(piece,pieces);$('message').className='message';$('message').textContent=`已选择${PIECE_TEXT.red[piece.type]}，请选择落点。`;render();
}
function play(to){if(mode==='puzzle')playPuzzle(to);else playHuman(to);}

function playPuzzle(to){
  const answer=puzzles[current].solution[0],correct=selected&&sameFrom(selected,answer)&&to.col===answer.toCol&&to.row===answer.toRow;
  if(correct){
    const captured=XiangqiRules.at(pieces,to.row,to.col);rememberMove(selected,to,captured,'human');pieces=XiangqiRules.move(pieces,selected,to);playSound(captured?'capture':'move');
    selected=null;targets=[];passed=true;solved.add(current);localStorage.setItem('qiqi-xiangqi-solved',JSON.stringify([...solved]));localStorage.setItem('qiqi-xiangqi-level',String(current));
    $('message').className='message success';$('message').textContent='漂亮！找到了最佳第一手，闯关成功！';$('next-button').disabled=false;render();
  }else{$('message').className='message error';$('message').textContent='这一步不是题目的最佳进攻，再观察一下黑将的逃路。';selected=null;targets=[];render();}
}

function finishIfNeeded(){
  const winner=XiangqiAI.winner(pieces);
  if(winner){gameOver=true;$('message').className=`message ${winner==='red'?'success':'error'}`;$('message').textContent=winner==='red'?'齐齐获胜！真棒！':'电脑获胜，再来一局吧！';playSound(winner==='red'?'win':'lose');return true;}
  const moves=XiangqiRules.allMoves(turn,pieces);
  if(!moves.length){const humanWon=turn==='black';gameOver=true;$('message').className=`message ${humanWon?'success':'error'}`;$('message').textContent=humanWon?'电脑无棋可走，齐齐获胜！':'红方无棋可走，电脑获胜。';playSound(humanWon?'win':'lose');return true;}
  return false;
}

function playHuman(to){
  if(!selected)return;
  const captured=XiangqiRules.at(pieces,to.row,to.col);rememberMove(selected,to,captured,'human');pieces=XiangqiRules.move(pieces,selected,to);playSound(captured?'capture':'move');
  selected=null;targets=[];turn='black';aiThinking=true;$('message').className='message';$('message').textContent='电脑正在认真思考…';render();
  if(finishIfNeeded()){aiThinking=false;render();return;}setTimeout(playComputer,180);
}
function playComputer(){
  const move=XiangqiAI.chooseMove(pieces,'black',$('ai-level').value);aiThinking=false;
  if(!move){gameOver=true;$('message').className='message success';$('message').textContent='电脑无棋可走，齐齐获胜！';playSound('win');render();return;}
  const captured=XiangqiRules.at(pieces,move.to.row,move.to.col);rememberMove(move.piece,move.to,captured,'computer');pieces=XiangqiRules.move(pieces,move.piece,move.to);playSound(captured?'capture':'move');turn='red';
  if(!finishIfNeeded()){$('message').className='message';$('message').textContent=`电脑走了${PIECE_TEXT.black[move.piece.type]}，黄色标记显示刚才的走法。`;}
  render();
}

function resetPuzzle(){
  pieces=clonePieces(puzzles[current]?.pieces||[]);selected=null;targets=[];passed=false;hintStep=0;clearLastMove();$('next-button').disabled=true;
  $('message').className='message';$('message').textContent='轮到红方，请找出最佳第一手。';render();
}
function newGame(){
  pieces=clonePieces(XiangqiAI.initialPosition());selected=null;targets=[];turn='red';aiThinking=false;gameOver=false;clearLastMove();
  $('message').className='message';$('message').textContent='新对局开始，齐齐执红棋先走。';render();
}
function setMode(next){
  mode=next;$('puzzle-mode').classList.toggle('active',next==='puzzle');$('ai-mode').classList.toggle('active',next==='ai');
  $('progress-card').classList.toggle('hidden',next==='ai');$('puzzle-actions').classList.toggle('hidden',next==='ai');$('ai-actions').classList.toggle('hidden',next==='puzzle');
  $('reset-progress').classList.toggle('hidden',next==='ai');next==='puzzle'?resetPuzzle():newGame();
}

$('hint-button').addEventListener('click',()=>{hintStep=Math.min(3,hintStep+1);const m=puzzles[current].solution[0],p=pieces.find(x=>sameFrom(x,m));if(hintStep===1)$('message').textContent=`提示：第一手要用“${PIECE_TEXT.red[p.type]}”。`;else if(hintStep===2)$('message').textContent='提示：发光的棋子就是关键棋子。';else $('message').textContent=`答案方向：走到第 ${m.toCol+1} 列、第 ${m.toRow+1} 行。`;render();});
$('retry-button').addEventListener('click',resetPuzzle);
$('next-button').addEventListener('click',()=>{current=(current+1)%puzzles.length;localStorage.setItem('qiqi-xiangqi-level',String(current));resetPuzzle();});
$('new-game').addEventListener('click',newGame);
$('puzzle-mode').addEventListener('click',()=>setMode('puzzle'));
$('ai-mode').addEventListener('click',()=>setMode('ai'));
$('sound-toggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;localStorage.setItem('qiqi-xiangqi-sound',soundEnabled?'on':'off');updateSoundButton();if(soundEnabled)playSound('move');});
$('reset-progress').addEventListener('click',()=>{if(confirm('确定清空齐齐的全部闯关记录吗？')){solved=new Set();current=0;localStorage.removeItem('qiqi-xiangqi-solved');localStorage.setItem('qiqi-xiangqi-level','0');resetPuzzle();}});
addEventListener('resize',drawBoard);updateSoundButton();resetPuzzle();
