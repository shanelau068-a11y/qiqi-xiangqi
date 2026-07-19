const XiangqiAI=(()=>{
  const VALUES={G:100000,R:950,C:500,H:430,E:210,A:210,P:100};

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

  function pieceScore(p){
    let value=VALUES[p.type];
    const center=4-Math.abs(4-p.col);
    if(p.type==='P'){
      const advance=p.color==='black'?p.row:9-p.row;
      value+=advance*9+(advance>=5?45:0)+center*3;
    }else if(p.type==='H')value+=center*8+(p.row>=2&&p.row<=7?18:0);
    else if(p.type==='C')value+=center*4;
    else if(p.type==='R')value+=center*2;
    return value;
  }

  function evaluate(pieces){
    const won=winner(pieces);
    if(won==='black')return 1000000;
    if(won==='red')return -1000000;
    let score=pieces.reduce((total,p)=>total+(p.color==='black'?pieceScore(p):-pieceScore(p)),0);
    if(XiangqiRules.inCheck('red',pieces))score+=70;
    if(XiangqiRules.inCheck('black',pieces))score-=70;
    return score;
  }

  function orderedChildren(color,pieces){
    return XiangqiRules.allMoves(color,pieces).map(move=>{
      const captured=XiangqiRules.at(pieces,move.to.row,move.to.col);
      const next=XiangqiRules.move(pieces,move.piece,move.to);
      let order=(captured?VALUES[captured.type]*20-VALUES[move.piece.type]:0);
      if(XiangqiRules.inCheck(color==='black'?'red':'black',next))order+=4000;
      if(move.piece.type==='P')order+=30;
      order+=4-Math.abs(4-move.to.col);
      return{...move,next,order};
    }).sort((a,b)=>b.order-a.order);
  }

  let deadline=0,nodeLimit=0,nodes=0,aborted=false;
  function shouldStop(){
    nodes++;
    if(nodes>nodeLimit||(nodes&255)===0&&performance.now()>deadline)aborted=true;
    return aborted;
  }

  function quiescence(pieces,color,alpha,beta,depth){
    if(shouldStop())return evaluate(pieces);
    const stand=evaluate(pieces);
    if(depth===0)return stand;
    const captures=orderedChildren(color,pieces).filter(child=>XiangqiRules.at(pieces,child.to.row,child.to.col));
    if(!captures.length)return stand;
    if(color==='black'){
      let best=stand;if(best>=beta)return best;alpha=Math.max(alpha,best);
      for(const child of captures){best=Math.max(best,quiescence(child.next,'red',alpha,beta,depth-1));if(aborted||best>=beta)break;alpha=Math.max(alpha,best);}
      return best;
    }
    let best=stand;if(best<=alpha)return best;beta=Math.min(beta,best);
    for(const child of captures){best=Math.min(best,quiescence(child.next,'black',alpha,beta,depth-1));if(aborted||best<=alpha)break;beta=Math.min(beta,best);}
    return best;
  }

  function minimax(pieces,color,depth,alpha,beta){
    if(shouldStop())return evaluate(pieces);
    const won=winner(pieces);
    if(won)return evaluate(pieces);
    if(depth===0)return quiescence(pieces,color,alpha,beta,2);
    const children=orderedChildren(color,pieces);
    if(!children.length)return color==='black'?-900000:900000;
    if(color==='black'){
      let best=-Infinity;
      for(const child of children){
        best=Math.max(best,minimax(child.next,'red',depth-1,alpha,beta));
        if(aborted)return best;
        alpha=Math.max(alpha,best);if(beta<=alpha)break;
      }
      return best;
    }
    let best=Infinity;
    for(const child of children){
      best=Math.min(best,minimax(child.next,'black',depth-1,alpha,beta));
      if(aborted)return best;
      beta=Math.min(beta,best);if(beta<=alpha)break;
    }
    return best;
  }

  function rootSearch(pieces,color,depth){
    const children=orderedChildren(color,pieces);
    let bestScore=color==='black'?-Infinity:Infinity,best=[];
    let alpha=-Infinity,beta=Infinity;
    for(const child of children){
      const score=minimax(child.next,color==='black'?'red':'black',depth-1,alpha,beta);
      if(aborted)break;
      const better=color==='black'?score>bestScore:score<bestScore;
      if(better){bestScore=score;best=[child];}
      else if(score===bestScore)best.push(child);
      if(color==='black')alpha=Math.max(alpha,bestScore);else beta=Math.min(beta,bestScore);
    }
    return best.length?best[Math.floor(Math.random()*best.length)]:null;
  }

  function chooseMove(pieces,color='black',level='medium'){
    const moves=XiangqiRules.allMoves(color,pieces);
    if(!moves.length)return null;
    if(level==='easy'){
      const captures=moves.filter(m=>XiangqiRules.at(pieces,m.to.row,m.to.col));
      const pool=captures.length&&Math.random()>.45?captures:moves;
      return pool[Math.floor(Math.random()*pool.length)];
    }
    const config=level==='hard'?{depth:4,ms:4800,nodes:850000}:{depth:3,ms:1800,nodes:300000};
    deadline=performance.now()+config.ms;nodeLimit=config.nodes;nodes=0;
    let completed=null;
    for(let depth=1;depth<=config.depth;depth++){
      aborted=false;
      const result=rootSearch(pieces,color,depth);
      if(!aborted&&result)completed=result;
      if(aborted)break;
    }
    return completed||moves[0];
  }

  return{initialPosition,winner,evaluate,chooseMove};
})();
