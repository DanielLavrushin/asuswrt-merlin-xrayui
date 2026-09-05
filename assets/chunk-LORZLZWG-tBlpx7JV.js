import{m as h,p as w,a2 as H,v as W,s as L,a7 as I,o as J,b as K,w as P}from"./mermaid.esm.min-ebj79acB.js";var N="",M="",A="",D=[],v=new Map,F=h(e=>K(e,P()),"sanitizeText"),y=h(e=>{switch(e.type){case"terminal":return{...e,value:F(e.value)};case"nonterminal":return{...e,name:F(e.name)};case"sequence":return{...e,elements:e.elements.map(y)};case"choice":return{...e,alternatives:e.alternatives.map(y)};case"optional":return{...e,element:y(e.element)};case"repetition":return{...e,element:y(e.element),separator:e.separator?y(e.separator):void 0};case"special":return{...e,text:F(e.text)}}},"sanitizeAstNode"),Q=h(()=>{N="",M="",A="",D.length=0,v.clear(),L(),w.debug("[Railroad] Database cleared")},"clear"),q=h(e=>{N=F(e),w.debug("[Railroad] Title set:",e)},"setTitle"),V=h(()=>N,"getTitle"),X=h(e=>{let i={...e,name:F(e.name),definition:y(e.definition),comment:e.comment?F(e.comment):void 0};w.debug("[Railroad] Adding rule:",i.name),v.has(i.name)&&w.warn(`[Railroad] Rule '${i.name}' is already defined. Overwriting.`),D.push(i),v.set(i.name,i)},"addRule"),Z=h(()=>D,"getRules"),Y=h(e=>v.get(e),"getRule"),_=h(e=>{M=F(e).replace(/^\s+/g,""),w.debug("[Railroad] Accessibility title set:",e)},"setAccTitle"),ee=h(()=>M,"getAccTitle"),te=h(e=>{A=F(e).replace(/\n\s+/g,`
`),w.debug("[Railroad] Accessibility description set:",e)},"setAccDescription"),re=h(()=>A,"getAccDescription"),ie=q,ae=V,ne={clear:Q,setTitle:q,getTitle:V,addRule:X,getRules:Z,getRule:Y,setAccTitle:_,getAccTitle:ee,setAccDescription:te,getAccDescription:re,setDiagramTitle:ie,getDiagramTitle:ae},T={compactMode:!1,padding:10,verticalSeparation:8,horizontalSeparation:10,arcRadius:10,fontSize:14,fontFamily:"monospace",terminalFill:"#FFFFC0",terminalStroke:"#000000",terminalTextColor:"#000000",nonTerminalFill:"#FFFFFF",nonTerminalStroke:"#000000",nonTerminalTextColor:"#000000",lineColor:"#000000",strokeWidth:2,markerFill:"#000000",commentFill:"#E8E8E8",commentStroke:"#888888",commentTextColor:"#666666",specialFill:"#F0E0FF",specialStroke:"#8800CC",ruleNameColor:"#000066",showMarkers:!0,markerRadius:5},oe=/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i,le=/^[\w "',.-]+$/,se=new Set(["compactMode","padding","verticalSeparation","horizontalSeparation","arcRadius","fontSize","fontFamily","terminalFill","terminalStroke","terminalTextColor","nonTerminalFill","nonTerminalStroke","nonTerminalTextColor","lineColor","strokeWidth","markerFill","commentFill","commentStroke","commentTextColor","specialFill","specialStroke","ruleNameColor","showMarkers","markerRadius"]),U=h(e=>e?Object.keys(e).every(i=>i==="railroad"||se.has(i)):!1,"isRailroadStyleOptions"),de=h(e=>e?"railroad"in e&&e.railroad?e.railroad:U(e)?e:{}:{},"extractRailroadOverrides"),me=h(e=>{if(!e||U(e))return{};let{railroad:i,svgId:n,theme:a,look:t,...r}=e;return r},"extractThemeOverrides"),m=h((e,i)=>{if(typeof e!="string")return i;let n=e.trim();return oe.test(n)?n:i},"sanitizeColorValue"),j=h((e,i)=>{if(typeof e!="string")return i;let n=e.trim();return le.test(n)?n:i},"sanitizeFontFamilyValue"),$=h((e,i)=>{let n=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(n)&&n>=0?n:i},"sanitizeNumberValue"),ce=h(e=>{let i=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(i)&&i>0?i:void 0},"parseThemeFontSize"),he=h(e=>{let i=j(e.fontFamily,T.fontFamily),n=ce(e.fontSize)??T.fontSize;return{...T,fontFamily:i,fontSize:n,terminalFill:m(e.secondBkg??e.secondaryColor,T.terminalFill),terminalStroke:m(e.secondaryBorderColor??e.lineColor,T.terminalStroke),terminalTextColor:m(e.secondaryTextColor??e.textColor,T.terminalTextColor),nonTerminalFill:m(e.mainBkg??e.background,T.nonTerminalFill),nonTerminalStroke:m(e.primaryBorderColor??e.lineColor,T.nonTerminalStroke),nonTerminalTextColor:m(e.primaryTextColor??e.textColor,T.nonTerminalTextColor),lineColor:m(e.lineColor,T.lineColor),markerFill:m(e.lineColor,T.markerFill),commentFill:m(e.labelBackground??e.tertiaryColor,T.commentFill),commentStroke:m(e.tertiaryBorderColor??e.lineColor,T.commentStroke),commentTextColor:m(e.tertiaryTextColor??e.textColor,T.commentTextColor),specialFill:m(e.tertiaryColor??e.secondaryColor,T.specialFill),specialStroke:m(e.tertiaryBorderColor??e.secondaryBorderColor,T.specialStroke),ruleNameColor:m(e.titleColor??e.textColor,T.ruleNameColor)}},"buildThemeDefaults"),B=h(e=>{let i=W(),n={...I(),...i.themeVariables??{},...me(e)},a=he(n),t={...i.railroad??{},...de(e)};return{compactMode:t.compactMode??a.compactMode,padding:$(t.padding,a.padding),verticalSeparation:$(t.verticalSeparation,a.verticalSeparation),horizontalSeparation:$(t.horizontalSeparation,a.horizontalSeparation),arcRadius:$(t.arcRadius,a.arcRadius),fontSize:$(t.fontSize,a.fontSize),fontFamily:j(t.fontFamily,a.fontFamily),terminalFill:m(t.terminalFill,a.terminalFill),terminalStroke:m(t.terminalStroke,a.terminalStroke),terminalTextColor:m(t.terminalTextColor,a.terminalTextColor),nonTerminalFill:m(t.nonTerminalFill,a.nonTerminalFill),nonTerminalStroke:m(t.nonTerminalStroke,a.nonTerminalStroke),nonTerminalTextColor:m(t.nonTerminalTextColor,a.nonTerminalTextColor),lineColor:m(t.lineColor,a.lineColor),strokeWidth:$(t.strokeWidth,a.strokeWidth),markerFill:m(t.markerFill,a.markerFill),commentFill:m(t.commentFill,a.commentFill),commentStroke:m(t.commentStroke,a.commentStroke),commentTextColor:m(t.commentTextColor,a.commentTextColor),specialFill:m(t.specialFill,a.specialFill),specialStroke:m(t.specialStroke,a.specialStroke),ruleNameColor:m(t.ruleNameColor,a.ruleNameColor),showMarkers:t.showMarkers??a.showMarkers,markerRadius:$(t.markerRadius,a.markerRadius)}},"buildRailroadStyleOptions"),fe=h(e=>{let{fontFamily:i,fontSize:n,terminalFill:a,terminalStroke:t,terminalTextColor:r,nonTerminalFill:o,nonTerminalStroke:g,nonTerminalTextColor:d,lineColor:s,strokeWidth:c,markerFill:l,commentFill:f,commentStroke:p,commentTextColor:u,specialFill:C,specialStroke:S,ruleNameColor:k}=B(e);return`
  .railroad-diagram {
    font-family: ${i};
    font-size: ${n}px;
  }

  .railroad-terminal rect {
    fill: ${a};
    stroke: ${t};
    stroke-width: ${c}px;
  }

  .railroad-terminal text {
    fill: ${r};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${o};
    stroke: ${g};
    stroke-width: ${c}px;
  }

  .railroad-nonterminal text {
    fill: ${d};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${s};
    stroke-width: ${c}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${l};
  }

  .railroad-comment ellipse {
    fill: ${f};
    stroke: ${p};
    stroke-width: ${c}px;
  }

  .railroad-comment text {
    fill: ${u};
    font-style: italic;
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${C};
    stroke: ${S};
    stroke-width: ${c}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${d};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${k};
    font-family: ${i};
    font-size: ${n}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`},"getStyles"),b,x=(b=class{constructor(){this.d=""}moveTo(i,n){return this.d+=`M ${i} ${n} `,this}lineTo(i,n){return this.d+=`L ${i} ${n} `,this}horizontalTo(i){return this.d+=`H ${i} `,this}verticalTo(i){return this.d+=`V ${i} `,this}arcTo(i,n,a,t,r,o,g){return this.d+=`A ${i} ${n} ${a} ${t?1:0} ${r?1:0} ${o} ${g} `,this}build(){return this.d.trim()}},h(b,"PathBuilder"),b),R,pe=(R=class{constructor(i,n=B()){this.textCache=new Map,this.svg=i,this.config=n}measureText(i){if(this.textCache.has(i))return this.textCache.get(i);let n=this.svg.append("text").attr("font-family",this.config.fontFamily).attr("font-size",this.config.fontSize).text(i),a=n.node().getBBox(),t={width:a.width,height:a.height};return n.remove(),this.textCache.set(i,t),t}renderTerminal(i,n){let a=this.measureText(n),t=a.width+this.config.padding*2,r=a.height+this.config.padding*2,o=i.append("g").attr("class","railroad-terminal");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r).attr("rx",10).attr("ry",10),o.append("text").attr("x",t/2).attr("y",r/2).text(n),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderNonTerminal(i,n){let a=this.measureText(n),t=a.width+this.config.padding*2,r=a.height+this.config.padding*2,o=i.append("g").attr("class","railroad-nonterminal");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r),o.append("text").attr("x",t/2).attr("y",r/2).text(n),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderSequence(i,n){let a=n.map(s=>this.renderExpression(i,s)),t=0,r=0,o=0;for(let s of a)t+=s.dimensions.width,r=Math.max(r,s.dimensions.up),o=Math.max(o,s.dimensions.down);t+=(a.length-1)*this.config.horizontalSeparation;let g=i.append("g").attr("class","railroad-sequence"),d=0;for(let s=0;s<a.length;s++){let c=a[s],l=r-c.dimensions.up;if(g.node().appendChild(c.element).setAttribute("transform",`translate(${d}, ${l})`),s<a.length-1){let f=d+c.dimensions.width,p=f+this.config.horizontalSeparation,u=r;g.append("path").attr("class","railroad-line").attr("d",new x().moveTo(f,u).lineTo(p,u).build())}d+=c.dimensions.width+this.config.horizontalSeparation}return{element:g.node(),dimensions:{width:t,height:r+o,up:r,down:o}}}renderChoice(i,n){let a=n.map(f=>this.renderExpression(i,f)),t=0,r=0;for(let f of a)t=Math.max(t,f.dimensions.width),r+=f.dimensions.height;r+=(a.length-1)*this.config.verticalSeparation;let o=this.config.arcRadius,g=o*4,d=t+g,s=i.append("g").attr("class","railroad-choice"),c=0,l=r/2;for(let f of a){let p=c,u=p+f.dimensions.up,C=o*2+(t-f.dimensions.width)/2;s.node().appendChild(f.element).setAttribute("transform",`translate(${C}, ${p})`);let S=new x,k=u>l;u===l?S.moveTo(0,l).lineTo(C,u):S.moveTo(0,l).arcTo(o,o,0,!1,k,o,l+(k?o:-o)).lineTo(o,u-(k?o:-o)).arcTo(o,o,0,!1,!k,o*2,u).lineTo(C,u),s.append("path").attr("class","railroad-line").attr("d",S.build());let z=new x,E=C+f.dimensions.width,G=d-o*2;u===l?z.moveTo(E,u).lineTo(d,l):z.moveTo(E,u).lineTo(G,u).arcTo(o,o,0,!1,!k,d-o,u+(k?-o:o)).lineTo(d-o,l+(k?o:-o)).arcTo(o,o,0,!1,k,d,l),s.append("path").attr("class","railroad-line").attr("d",z.build()),c+=f.dimensions.height+this.config.verticalSeparation}return{element:s.node(),dimensions:{width:d,height:r,up:l,down:r-l}}}renderOptional(i,n){let a=this.renderExpression(i,n),t=this.config.arcRadius,r=t*2,o=a.dimensions.width+t*4,g=a.dimensions.height+r,d=i.append("g").attr("class","railroad-optional"),s=t*2,c=r;d.node().appendChild(a.element).setAttribute("transform",`translate(${s}, ${c})`);let l=c+a.dimensions.up,f=new x().moveTo(0,l).lineTo(t*2,l);d.append("path").attr("class","railroad-line").attr("d",f.build());let p=new x().moveTo(s+a.dimensions.width,l).lineTo(o,l);d.append("path").attr("class","railroad-line").attr("d",p.build());let u=new x().moveTo(0,l).arcTo(t,t,0,!1,!1,t,l-t).lineTo(t,t).arcTo(t,t,0,!1,!0,t*2,0).lineTo(o-t*2,0).arcTo(t,t,0,!1,!0,o-t,t).lineTo(o-t,l-t).arcTo(t,t,0,!1,!1,o,l);return d.append("path").attr("class","railroad-line").attr("d",u.build()),{element:d.node(),dimensions:{width:o,height:g,up:l,down:g-l}}}renderRepetition(i,n,a){let t=this.renderExpression(i,n),r=this.config.arcRadius,o=r*2,g=t.dimensions.width+r*4,d=a===0,s=t.dimensions.height+o+(d?o:0),c=i.append("g").attr("class","railroad-repetition"),l=r*2,f=d?o:0;c.node().appendChild(t.element).setAttribute("transform",`translate(${l}, ${f})`);let p=f+t.dimensions.up;c.append("path").attr("class","railroad-line").attr("d",new x().moveTo(0,p).lineTo(r*2,p).build()),c.append("path").attr("class","railroad-line").attr("d",new x().moveTo(l+t.dimensions.width,p).lineTo(g,p).build());let u=f+t.dimensions.height+r,C=new x().moveTo(l+t.dimensions.width,p).arcTo(r,r,0,!1,!0,l+t.dimensions.width+r,p+r).lineTo(l+t.dimensions.width+r,u).arcTo(r,r,0,!1,!0,l+t.dimensions.width,u+r).lineTo(r*2,u+r).arcTo(r,r,0,!1,!0,r,u).lineTo(r,p+r).arcTo(r,r,0,!1,!0,r*2,p);if(c.append("path").attr("class","railroad-line").attr("d",C.build()),d){let S=new x().moveTo(0,p).arcTo(r,r,0,!1,!1,r,p-r).lineTo(r,r).arcTo(r,r,0,!1,!0,r*2,0).lineTo(g-r*2,0).arcTo(r,r,0,!1,!0,g-r,r).lineTo(g-r,p-r).arcTo(r,r,0,!1,!1,g,p);c.append("path").attr("class","railroad-line").attr("d",S.build())}return{element:c.node(),dimensions:{width:g,height:s,up:p,down:s-p}}}renderSpecial(i,n){let a=this.measureText("? "+n+" ?"),t=a.width+this.config.padding*2,r=a.height+this.config.padding*2,o=i.append("g").attr("class","railroad-special");return o.append("rect").attr("x",0).attr("y",0).attr("width",t).attr("height",r),o.append("text").attr("x",t/2).attr("y",r/2).text("? "+n+" ?"),{element:o.node(),dimensions:{width:t,height:r,up:r/2,down:r/2}}}renderExpression(i,n){switch(n.type){case"terminal":return this.renderTerminal(i,n.value);case"nonterminal":return this.renderNonTerminal(i,n.name);case"sequence":return this.renderSequence(i,n.elements);case"choice":return this.renderChoice(i,n.alternatives);case"optional":return this.renderOptional(i,n.element);case"repetition":return this.renderRepetition(i,n.element,n.min);case"special":return this.renderSpecial(i,n.text);default:throw new Error(`Unknown node type: ${n.type}`)}}renderRule(i,n){let a=this.svg.append("g").attr("class","railroad-rule").attr("transform",`translate(0, ${n})`),t=i.name+" =",r=this.measureText(t).width+20,o=r+20,g=a.append("g"),d=this.renderExpression(g,i.definition),s=Math.max(20,d.dimensions.up),c=s-d.dimensions.up;return g.attr("transform",`translate(${o}, ${c})`),a.append("g").attr("class","railroad-rule-name-group").append("text").attr("class","railroad-rule-name").attr("x",0).attr("y",s).text(t),a.append("g").attr("class","railroad-start").append("circle").attr("cx",r).attr("cy",s).attr("r",this.config.markerRadius),a.append("g").attr("class","railroad-end").append("circle").attr("cx",o+d.dimensions.width+10).attr("cy",s).attr("r",this.config.markerRadius),a.append("path").attr("class","railroad-line").attr("d",new x().moveTo(r+this.config.markerRadius,s).lineTo(o,s).build()),a.append("path").attr("class","railroad-line").attr("d",new x().moveTo(o+d.dimensions.width,s).lineTo(o+d.dimensions.width+10-this.config.markerRadius,s).build()),{height:Math.max(40,c+d.dimensions.height+this.config.padding*2),width:o+d.dimensions.width+10+this.config.markerRadius}}renderDiagram(i){let n=this.config.padding,a=0;for(let t of i){let r=this.renderRule(t,n);n+=r.height+this.config.verticalSeparation,a=Math.max(a,r.width)}return{width:a+this.config.padding*2,height:n+this.config.padding}}},h(R,"RailroadRenderer"),R),O=h((e,i,n)=>{J(e,i.height,i.width,n),e.attr("viewBox",`0 0 ${i.width} ${i.height}`)},"configureRailroadSvgSize"),ue=h((e,i,n)=>{w.debug(`[Railroad] Rendering diagram
`+e);try{let a=H(i);a.attr("class","railroad-diagram");let t=W().railroad?.useMaxWidth??!0,r=ne.getRules();if(w.debug(`[Railroad] Rendering ${r.length} rules`),r.length===0){w.warn("[Railroad] No rules to render"),O(a,{height:100,width:200},t);return}let o=new pe(a,B()).renderDiagram(r);O(a,o,t),w.debug("[Railroad] Render complete")}catch(a){throw w.error("[Railroad] Render error:",a),a}},"draw"),Te={draw:ue};export{fe as C,Te as D,ne as V};
