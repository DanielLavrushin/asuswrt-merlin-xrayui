import{c as K}from"./chunk-AEOMTBSW-Bw5Al3Ps.js";import{d as U}from"./wardley-RL74JXVD-BCRCBASE-CbnrXPNQ.js";import{l as X,a as Z,s as _,e as ee,n as te,h as ae,m as l,p as S,q as ie,L as le,aO as re,aP as se,aQ as L,aR as oe,b as ne,o as pe,aS as de,z as ce}from"./mermaid.esm.min-BvnOemOa.js";import"./chunk-H3VCZNTA-9liDfoS-.js";import"./app-DDYAilKQ.js";var ue=ce.pie,v={sections:new Map,showData:!1},g=v.sections,y=v.showData,he=structuredClone(ue),ge=l(()=>structuredClone(he),"getConfig"),me=l(()=>{g=new Map,y=v.showData,pe()},"clear"),fe=l(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);g.has(e)||(g.set(e,a),S.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),xe=l(()=>g,"getSections"),$e=l(e=>{y=e},"setShowData"),we=l(()=>y,"getShowData"),P={getConfig:ge,clear:me,setDiagramTitle:ae,getDiagramTitle:te,setAccTitle:ee,getAccTitle:_,setAccDescription:Z,getAccDescription:X,addSection:fe,getSections:xe,setShowData:$e,getShowData:we},Se=l((e,a)=>{K(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ve={parse:l(async e=>{let a=await U("pie",e);S.debug(a),Se(a,P)},"parse")},ye=l(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),Te=ye,De=l(e=>{let a=[...e.values()].reduce((r,s)=>r+s,0),T=[...e.entries()].map(([r,s])=>({label:r,value:s})).filter(r=>r.value/a*100>=1);return de().value(r=>r.value).sort(null)(T)},"createPieArcs"),be=l((e,a,T,r)=>{S.debug(`rendering pie chart
`+e);let s=r.db,D=ie(),b=le(s.getConfig(),D.pie),C=40,o=18,c=4,p=450,d=p,m=re(a),n=m.append("g");n.attr("transform","translate("+d/2+","+p/2+")");let{themeVariables:i}=D,[k]=se(i.pieOuterStrokeWidth);k??=2;let A=b.textPosition,u=Math.min(d,p)/2-C,W=L().innerRadius(0).outerRadius(u),E=L().innerRadius(u*A).outerRadius(u*A);n.append("circle").attr("cx",0).attr("cy",0).attr("r",u+k/2).attr("class","pieOuterCircle");let h=s.getSections(),q=De(h),j=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12],f=0;h.forEach(t=>{f+=t});let O=q.filter(t=>(t.data.value/f*100).toFixed(0)!=="0"),x=oe(j).domain([...h.keys()]);n.selectAll("mySlices").data(O).enter().append("path").attr("d",W).attr("fill",t=>x(t.data.label)).attr("class","pieCircle"),n.selectAll("mySlices").data(O).enter().append("text").text(t=>(t.data.value/f*100).toFixed(0)+"%").attr("transform",t=>"translate("+E.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let G=n.append("text").text(s.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),R=[...h.entries()].map(([t,w])=>({label:t,value:w})),$=n.selectAll(".legend").data(R).enter().append("g").attr("class","legend").attr("transform",(t,w)=>{let B=o+c,Y=B*R.length/2,I=12*o,J=w*B-Y;return"translate("+I+","+J+")"});$.append("rect").attr("width",o).attr("height",o).style("fill",t=>x(t.label)).style("stroke",t=>x(t.label)),$.append("text").attr("x",o+c).attr("y",o-c).text(t=>s.getShowData()?`${t.label} [${t.value}]`:t.label);let H=Math.max(...$.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),N=d+C+o+c+H,z=G.node()?.getBoundingClientRect().width??0,Q=d/2-z/2,V=d/2+z/2,M=Math.min(0,Q),F=Math.max(N,V)-M;m.attr("viewBox",`${M} 0 ${F} ${p}`),ne(m,p,F,b.useMaxWidth)},"draw"),Ce={draw:be},Me={parser:ve,db:P,renderer:Ce,styles:Te};export{Me as diagram};
