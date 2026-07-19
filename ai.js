const XiangqiAI=(()=>{
  const VALUES={G:100000,R:900,C:450,H:400,E:200,A:200,P:100};

  function initialPosition(){
    const pieces=[];
    const back=['R','H','E','A','G','A','E','H','R'];
    for(const color of ['black','red']){
      const home=color==='black'?0:9;
      back.forEach((type,col)=>pieces.push({type,color,row:home,col}));
      for(const col of [1,7])pieces.push({type:'C',color,row:color==='black'?2:7,col});
      for(const col of [0,2,4,6,8])pieces.push({type:'P',color,row:color==='black'?3:6,col});
    }
    return pieces;
  }

  function winner(pieces){
    if(!pieces.some(p=>p.type==='G'&&p.color==='red'))return 'black';
    if(!pieces.some(p=>p.type==='G'&&p.color==='black'))return 'red';
    return null;
  }

  function evaluate(pieces){
    const won=winner(pieces);
    if(won==='black')return 1000000;
    if(won==='red')return -1000000;
    return pieces.reduce((score,p)=>{
      let value=VALUES[p.type];
      if(p.type==='P'){
        const crossed=p.color==='black'?p.row>=5:p.row<=4;
        if(crossed)value+=35;
      }
      return score+(p.color==='black'?value:-value);
    },0);
  }

  function minimax(pieces,color,depth,alpha,beta){
    const won=winner(pieces);
    if(won||depth===0)return evaluate(pieces);
    const moves=XiangqiRules.allMoves(color,pieces);
    if(!moves.length)return color==='black'?-900000:900000;
    if(color==='black'){
      let best=-Infinity;
      for(const move of moves){
        best=Math.max(best,minimax(XiangqiRules.move(pieces,move.piece,move.to),'red',depth-1,alpha,beta));
        alpha=Math.max(alpha,best);
        if(beta<=alpha)break;
      }
      return best;
    }
    let best=Infinity;
    for(const move of moves){
      best=Math.min(best,minimax(XiangqiRules.move(pieces,move.piece,move.to),'black',depth-1,alpha,beta));
      beta=Math.min(beta,best);
      if(beta<=alpha)break;
    }
    return best;
  }

  function chooseMove(pieces,color='black',level='medium'){
    const moves=XiangqiRules.allMoves(color,pieces);
    if(!moves.length)return null;
    if(level==='easy')return moves[Math.floor(Math.random()*moves.length)];
    const depth=level==='hard'?2:1;
    let bestScore=color==='black'?-Infinity:Infinity;
    let choices=[];
    for(const move of moves){
      const next=XiangqiRules.move(pieces,move.piece,move.to);
      const score=minimax(next,color==='black'?'red':'black',depth,-Infinity,Infinity);
      const better=color==='black'?score>bestScore:score<bestScore;
      if(better){bestScore=score;choices=[move];}
      else if(score===bestScore)choices.push(move);
    }
    return choices[Math.floor(Math.random()*choices.length)];
  }

  return{initialPosition,winner,evaluate,chooseMove};
})();
