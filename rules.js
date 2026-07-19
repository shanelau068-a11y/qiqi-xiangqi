const XiangqiRules=(()=>{
  const inBoard=(r,c)=>r>=0&&r<10&&c>=0&&c<9;
  const palace=(color,r,c)=>c>=3&&c<=5&&(color==='red'?r>=7&&r<=9:r>=0&&r<=2);
  const at=(pieces,r,c)=>pieces.find(p=>p.row===r&&p.col===c);
  const clearLine=(pieces,a,b)=>{
    let count=0;
    if(a.row===b.row){for(let c=Math.min(a.col,b.col)+1;c<Math.max(a.col,b.col);c++)if(at(pieces,a.row,c))count++;}
    else if(a.col===b.col){for(let r=Math.min(a.row,b.row)+1;r<Math.max(a.row,b.row);r++)if(at(pieces,r,a.col))count++;}
    else return -1;
    return count;
  };
  function pseudoMoves(piece,pieces){
    const out=[];const add=(r,c)=>{if(!inBoard(r,c))return;const hit=at(pieces,r,c);if(!hit||hit.color!==piece.color)out.push({row:r,col:c,capture:!!hit});};
    const r=piece.row,c=piece.col;
    if(piece.type==='R'||piece.type==='C'){
      for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]])for(let n=1;n<10;n++){const nr=r+dr*n,nc=c+dc*n;if(!inBoard(nr,nc))break;const hit=at(pieces,nr,nc),screens=clearLine(pieces,piece,{row:nr,col:nc});if(piece.type==='R'){if(!hit)add(nr,nc);else{if(hit.color!==piece.color)add(nr,nc);break;}}else if(!hit&&screens===0)add(nr,nc);else if(hit&&screens===1){if(hit.color!==piece.color)add(nr,nc);break;}else if(hit&&screens>1)break;}
    }else if(piece.type==='H')for(const[dr,dc,lr,lc]of[[2,1,1,0],[2,-1,1,0],[-2,1,-1,0],[-2,-1,-1,0],[1,2,0,1],[-1,2,0,1],[1,-2,0,-1],[-1,-2,0,-1]]){if(!at(pieces,r+lr,c+lc))add(r+dr,c+dc);}
    else if(piece.type==='E')for(const[dr,dc]of[[2,2],[2,-2],[-2,2],[-2,-2]]){const nr=r+dr,nc=c+dc;if(!at(pieces,r+dr/2,c+dc/2)&&(piece.color==='red'?nr>=5:nr<=4))add(nr,nc);}
    else if(piece.type==='A')for(const[dr,dc]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const nr=r+dr,nc=c+dc;if(palace(piece.color,nr,nc))add(nr,nc);}
    else if(piece.type==='G'){
      for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc;if(palace(piece.color,nr,nc))add(nr,nc);}
      const enemy=pieces.find(p=>p.type==='G'&&p.color!==piece.color);if(enemy&&enemy.col===c&&clearLine(pieces,piece,enemy)===0)add(enemy.row,enemy.col);
    }else if(piece.type==='P'){
      const forward=piece.color==='red'?-1:1;add(r+forward,c);const crossed=piece.color==='red'?r<=4:r>=5;if(crossed){add(r,c-1);add(r,c+1);}
    }
    return out;
  }
  const move=(pieces,piece,to)=>pieces.filter(p=>!(p.row===to.row&&p.col===to.col)).map(p=>p===piece?{...p,row:to.row,col:to.col}:p);
  function inCheck(color,pieces){const general=pieces.find(p=>p.type==='G'&&p.color===color);if(!general)return true;return pieces.some(p=>p.color!==color&&pseudoMoves(p,pieces).some(m=>m.row===general.row&&m.col===general.col));}
  function legalMoves(piece,pieces){return pseudoMoves(piece,pieces).filter(to=>!inCheck(piece.color,move(pieces,piece,to)));}
  return{legalMoves,move,at};
})();
