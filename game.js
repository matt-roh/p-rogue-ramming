game_start=function(size,handle)
{
  let gameTable=document.getElementById("game-table");
  gameTable.querySelectorAll('*').forEach(child => child.remove());
  if(size<2)
  {
    alert("Size must be at least 2");
    return;
  }
  for(let i=1;i<=size;i++)
  {
    let newRow=document.createElement('tr');
    for(let j=1;j<=size;j++)
    {
      let no=Math.floor(Math.random()*10000)+1000

      let newTd=document.createElement('td');
      newTd.id="td-"+i+"-"+j;
      newTd.style.borderTop="3px solid #000";
      newTd.style.borderBottom="3px solid #000";
      newTd.style.borderLeft="3px solid #000";
      newTd.style.borderRight="3px solid #000";
      
      vport=document.documentElement.clientHeight-150;
      si=Math.min((vport/size)>>0,75);
      newTd.style.width=si+"px";
      newTd.style.height=si+"px";
      newTd.style.textAlign="center";
      newTd.style.visibility="hidden";

      let newA=document.createElement('a');
      newA.textContent=""+no;
      newA.style.color="green";
      newA.href="https://boj.kr/"+no;
      newA.style.textDecorationLine="none";
      newA.target="_blank";
      newA.style.visibility="hidden";
      newTd.appendChild(newA);

      newRow.appendChild(newTd);
    }
    gameTable.appendChild(newRow);
  }
  edges=[]
  dsu=[] // (i,j) -> (i-1)*size+(j-1)
  maps=function(i,j)
  {
    return (i-1)*size+(j-1);
  };
  unmaps=function(x)
  {
    return [((x/size)>>0)+1,x%size+1];
  };
  for(let i=0;i<size*size;i++)dsu.push(i);
  find=function(i)
  {
    while(dsu[i]!=i)i=dsu[i]=dsu[dsu[i]];
    return i;
  };
  unite=function(i,j)
  {
    i=find(i);
    j=find(j);
    if(i!=j)
    {
      dsu[j]=i;
      return true;
    }
    else return false;
  };
  for(let i=1;i<=size;i++)
  {
    for(let j=1;j<size;j++)
    {
      edges.push([Math.random(),maps(i,j),maps(i,j+1)]);
    }
  }
  for(let i=1;i<size;i++)
  {
    for(let j=1;j<=size;j++)
    {
      edges.push([Math.random(),maps(i,j),maps(i+1,j)]);
    }
  }
  edges.sort();

  degs=[]
  for(let i=0;i<size*size;i++)degs.push(0);
  chosenEdges=[]
  adj=[]
  for(let i=0;i<size*size;i++)
  {
    adj.push([]);
  }
  
  for(let e of edges)
  {
    let u=e[1],v=e[2];
    if(unite(u,v))
    {
      const[ui,uj]=unmaps(u);
      const[vi,vj]=unmaps(v);
      degs[u]++;
      degs[v]++;
      adj[u].push(v);
      adj[v].push(u);
      let cell1=document.getElementById("td-"+ui+"-"+uj);
      let cell2=document.getElementById("td-"+vi+"-"+vj);
      if(ui+1==vi)
      {
        cell1.style.borderBottom="none";
        cell2.style.borderTop="none";
      }
      else
      {
        cell1.style.borderRight="none";
        cell2.style.borderLeft="none";
      }
    }
  }
  farthest=function(xi,xj)
  {
    let x=maps(xi,xj);
    dist=[]
    for(let i=0;i<size*size;i++)
    {
      dist.push(size*size+10);
    }
    dist[x]=0;
    stk=[x];
    while(stk.length>0)
    {
      let v=stk.pop();
      for(let w of adj[v])
      {
        if(dist[w]>size*size)
        {
          dist[w]=dist[v]+1;
          stk.push(w);
        }
      }
    }
    let d=0,m=x;
    for(let i=0;i<size*size;i++)
    {
      if(dist[i]>d)
      {
        d=dist[i];
        m=i;
      }
    }
    return unmaps(m);
  };
  const[dui,duj]=farthest(1,1);
  const[dvi,dvj]=farthest(dui,duj);
  let diamu=document.getElementById("td-"+dui+"-"+duj);
  diamu.style.backgroundColor="yellow";
  let diamv=document.getElementById("td-"+dvi+"-"+dvj);
  diamv.style.backgroundColor="magenta";

  enabled=[]
  for(let i=1;i<=size*size;i++)enabled.push(false);
  enabled[maps(dui,duj)]=true;
  diamv.style.visibility="visible";
  diamu.children[0].style.visibility="visible";
  diamu.style.visibility="visible";

  let onclick_cell=function(i,j,event)
  {
    let ij=maps(i,j);
    let curij=document.getElementById("td-"+i+"-"+j);

    event.preventDefault();

    if(!enabled[ij])
    {
      
      return;
    }
    curij.style.visibility="visible";
    curij.children[0].style.backgroundColor="#00000000";

    for(let nei of adj[ij])
    {
      const[neii,neij]=unmaps(nei);
      let neiTd=document.getElementById("td-"+neii+"-"+neij);
      if(enabled[nei])continue;
      enabled[nei]=true;
      neiTd.children[0].style.visibility="visible";
      neiTd.children[0].style.backgroundColor="orange";
    }
  };

  // setup onclick on each cell of the grid
  for(let i=1;i<=size;i++)
  {
    for(let j=1;j<=size;j++)
    {
      let gij=document.getElementById("td-"+i+"-"+j);
      gij.children[0].addEventListener('click',onclick_cell.bind(null,i,j));
    }
  }
};

window.onload=function()
{
  const urlParams=new URLSearchParams(window.location.search);
  let sz=urlParams.get('size');
  let handle="";
  game_start(sz,handle);
};