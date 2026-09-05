import{m as Qt}from"./chunk-VE5CLXGZ-CLu-9tya.js";import{y as te}from"./chunk-A7VWPJGB-woPQYAgi.js";import{m as d,p as b,w as O,M as ee,t as se,a as ie,l as re,n as ae,h as ne,g as oe,j as le,am as ce,u as z,s as he,i as Et,aj as de}from"./mermaid.esm.min-ebj79acB.js";import{T as ue}from"./chunk-6L755F7B-HEeUVHIN.js";var Ct=(function(){var t=d(function(F,o,a,g){for(a=a||{},g=F.length;g--;a[F[g]]=o);return a},"o"),e=[1,2],s=[1,3],n=[1,4],r=[2,4],h=[1,9],c=[1,11],y=[1,16],p=[1,17],S=[1,18],m=[1,19],$=[1,33],C=[1,20],N=[1,21],u=[1,22],_=[1,23],L=[1,24],A=[1,26],P=[1,27],D=[1,28],R=[1,29],tt=[1,30],et=[1,31],st=[1,32],it=[1,35],rt=[1,36],at=[1,37],nt=[1,38],U=[1,34],f=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ot=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],Lt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],mt={trace:d(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:d(function(F,o,a,g,T,i,k){var l=i.length-1;switch(T){case 3:return g.setRootDoc(i[l]),i[l];case 4:this.$=[];break;case 5:i[l]!="nl"&&(i[l-1].push(i[l]),this.$=i[l-1]);break;case 6:case 7:this.$=i[l];break;case 8:this.$="nl";break;case 12:this.$=i[l];break;case 13:let ht=i[l-1];ht.description=g.trimColon(i[l]),this.$=ht;break;case 14:this.$={stmt:"relation",state1:i[l-2],state2:i[l]};break;case 15:let dt=g.trimColon(i[l]);this.$={stmt:"relation",state1:i[l-3],state2:i[l-1],description:dt};break;case 19:this.$={stmt:"state",id:i[l-3],type:"default",description:"",doc:i[l-1]};break;case 20:var B=i[l],K=i[l-2].trim();if(i[l].match(":")){var ct=i[l].split(":");B=ct[0],K=[K,ct[1]]}this.$={stmt:"state",id:B,type:"default",description:K};break;case 21:this.$={stmt:"state",id:i[l-3],type:"default",description:i[l-5],doc:i[l-1]};break;case 22:this.$={stmt:"state",id:i[l],type:"fork"};break;case 23:this.$={stmt:"state",id:i[l],type:"join"};break;case 24:this.$={stmt:"state",id:i[l],type:"choice"};break;case 25:this.$={stmt:"state",id:g.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[l-1].trim(),note:{position:i[l-2].trim(),text:i[l].trim()}};break;case 29:this.$=i[l].trim(),g.setAccTitle(this.$);break;case 30:case 31:this.$=i[l].trim(),g.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[l-3],url:i[l-2],tooltip:i[l-1]};break;case 33:this.$={stmt:"click",id:i[l-3],url:i[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[l-1].trim(),classes:i[l].trim()};break;case 36:this.$={stmt:"style",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 37:this.$={stmt:"applyClass",id:i[l-1].trim(),styleClass:i[l].trim()};break;case 38:g.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:g.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:g.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:g.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[l-2].trim(),classes:[i[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:s,6:n},{1:[3]},{3:5,4:e,5:s,6:n},{3:6,4:e,5:s,6:n},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],r,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:h,5:c,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,22:m,24:$,25:C,26:N,27:u,28:_,29:L,32:25,33:A,35:P,37:D,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:y,17:p,19:S,22:m,24:$,25:C,26:N,27:u,28:_,29:L,32:25,33:A,35:P,37:D,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,7]),t(f,[2,8]),t(f,[2,9]),t(f,[2,10]),t(f,[2,11]),t(f,[2,12],{14:[1,40],15:[1,41]}),t(f,[2,16]),{18:[1,42]},t(f,[2,18],{20:[1,43]}),{23:[1,44]},t(f,[2,22]),t(f,[2,23]),t(f,[2,24]),t(f,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(f,[2,28]),{34:[1,49]},{36:[1,50]},t(f,[2,31]),{13:51,24:$,57:U},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(ot,[2,44],{58:[1,56]}),t(ot,[2,45],{58:[1,57]}),t(f,[2,38]),t(f,[2,39]),t(f,[2,40]),t(f,[2,41]),t(f,[2,6]),t(f,[2,13]),{13:58,24:$,57:U},t(f,[2,17]),t(Lt,r,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(f,[2,29]),t(f,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(f,[2,14],{14:[1,71]}),{4:h,5:c,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,21:[1,72],22:m,24:$,25:C,26:N,27:u,28:_,29:L,32:25,33:A,35:P,37:D,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(f,[2,34]),t(f,[2,35]),t(f,[2,36]),t(f,[2,37]),t(ot,[2,46]),t(ot,[2,47]),t(f,[2,15]),t(f,[2,19]),t(Lt,r,{7:78}),t(f,[2,26]),t(f,[2,27]),{5:[1,79]},{5:[1,80]},{4:h,5:c,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,21:[1,81],22:m,24:$,25:C,26:N,27:u,28:_,29:L,32:25,33:A,35:P,37:D,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,32]),t(f,[2,33]),t(f,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:d(function(F,o){if(o.recoverable)this.trace(F);else{var a=new Error(F);throw a.hash=o,a}},"parseError"),parse:d(function(F){var o=this,a=[0],g=[],T=[null],i=[],k=this.table,l="",B=0,K=0,ct=0,ht=2,dt=1,Jt=i.slice.call(arguments,1),E=Object.create(this.lexer),G={yy:{}};for(var St in this.yy)Object.prototype.hasOwnProperty.call(this.yy,St)&&(G.yy[St]=this.yy[St]);E.setInput(F,G.yy),G.yy.lexer=E,G.yy.parser=this,typeof E.yylloc>"u"&&(E.yylloc={});var Tt=E.yylloc;i.push(Tt);var qt=E.options&&E.options.ranges;typeof G.yy.parseError=="function"?this.parseError=G.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Zt(I){a.length=a.length-2*I,T.length=T.length-I,i.length=i.length-I}d(Zt,"popStack");function At(){var I;return I=g.pop()||E.lex()||dt,typeof I!="number"&&(I instanceof Array&&(g=I,I=g.pop()),I=o.symbols_[I]||I),I}d(At,"lex");for(var x,bt,M,w,Be,kt,X={},ut,Y,It,pt;;){if(M=a[a.length-1],this.defaultActions[M]?w=this.defaultActions[M]:((x===null||typeof x>"u")&&(x=At()),w=k[M]&&k[M][x]),typeof w>"u"||!w.length||!w[0]){var _t="";pt=[];for(ut in k[M])this.terminals_[ut]&&ut>ht&&pt.push("'"+this.terminals_[ut]+"'");E.showPosition?_t="Parse error on line "+(B+1)+`:
`+E.showPosition()+`
Expecting `+pt.join(", ")+", got '"+(this.terminals_[x]||x)+"'":_t="Parse error on line "+(B+1)+": Unexpected "+(x==dt?"end of input":"'"+(this.terminals_[x]||x)+"'"),this.parseError(_t,{text:E.match,token:this.terminals_[x]||x,line:E.yylineno,loc:Tt,expected:pt})}if(w[0]instanceof Array&&w.length>1)throw new Error("Parse Error: multiple actions possible at state: "+M+", token: "+x);switch(w[0]){case 1:a.push(x),T.push(E.yytext),i.push(E.yylloc),a.push(w[1]),x=null,bt?(x=bt,bt=null):(K=E.yyleng,l=E.yytext,B=E.yylineno,Tt=E.yylloc,ct>0);break;case 2:if(Y=this.productions_[w[1]][1],X.$=T[T.length-Y],X._$={first_line:i[i.length-(Y||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(Y||1)].first_column,last_column:i[i.length-1].last_column},qt&&(X._$.range=[i[i.length-(Y||1)].range[0],i[i.length-1].range[1]]),kt=this.performAction.apply(X,[l,K,B,G.yy,w[1],T,i].concat(Jt)),typeof kt<"u")return kt;Y&&(a=a.slice(0,-1*Y*2),T=T.slice(0,-1*Y),i=i.slice(0,-1*Y)),a.push(this.productions_[w[1]][0]),T.push(X.$),i.push(X._$),It=k[a[a.length-2]][a[a.length-1]],a.push(It);break;case 3:return!0}}return!0},"parse")},Vt=(function(){var F={EOF:1,parseError:d(function(o,a){if(this.yy.parser)this.yy.parser.parseError(o,a);else throw new Error(o)},"parseError"),setInput:d(function(o,a){return this.yy=a||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:d(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var a=o.match(/(?:\r\n?|\n).*/g);return a?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:d(function(o){var a=o.length,g=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-a),this.offset-=a;var T=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),g.length-1&&(this.yylineno-=g.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:g?(g.length===T.length?this.yylloc.first_column:0)+T[T.length-g.length].length-g[0].length:this.yylloc.first_column-a},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-a]),this.yyleng=this.yytext.length,this},"unput"),more:d(function(){return this._more=!0,this},"more"),reject:d(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:d(function(o){this.unput(this.match.slice(o))},"less"),pastInput:d(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:d(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:d(function(){var o=this.pastInput(),a=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+a+"^"},"showPosition"),test_match:d(function(o,a){var g,T,i;if(this.options.backtrack_lexer&&(i={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(i.yylloc.range=this.yylloc.range.slice(0))),T=o[0].match(/(?:\r\n?|\n).*/g),T&&(this.yylineno+=T.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:T?T[T.length-1].length-T[T.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],g=this.performAction.call(this,this.yy,this,a,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),g)return g;if(this._backtrack){for(var k in i)this[k]=i[k];return!1}return!1},"test_match"),next:d(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,a,g,T;this._more||(this.yytext="",this.match="");for(var i=this._currentRules(),k=0;k<i.length;k++)if(g=this._input.match(this.rules[i[k]]),g&&(!a||g[0].length>a[0].length)){if(a=g,T=k,this.options.backtrack_lexer){if(o=this.test_match(g,i[k]),o!==!1)return o;if(this._backtrack){a=!1;continue}else return!1}else if(!this.options.flex)break}return a?(o=this.test_match(a,i[T]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:d(function(){var o=this.next();return o||this.lex()},"lex"),begin:d(function(o){this.conditionStack.push(o)},"begin"),popState:d(function(){var o=this.conditionStack.length-1;return o>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:d(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:d(function(o){return o=this.conditionStack.length-1-Math.abs(o||0),o>=0?this.conditionStack[o]:"INITIAL"},"topState"),pushState:d(function(o){this.begin(o)},"pushState"),stateStackSize:d(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:d(function(o,a,g,T){function i(){let k=a.yytext.indexOf("%%");if(k===0)return!1;if(k>0){let l=a.yytext.slice(0,k),B=a.yytext.slice(k);B&&o.lexer.unput(B),a.yytext=l}return!0}switch(d(i,"processId"),g){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;case 17:return this.popState(),"acc_title_value";case 18:return this.begin("acc_descr"),35;case 19:return this.popState(),"acc_descr_value";case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 25:return this.popState(),this.pushState("CLASSDEFID"),42;case 26:return this.popState(),43;case 27:return this.pushState("CLASS"),48;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;case 29:return this.popState(),50;case 30:return this.pushState("STYLE"),45;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 32:return this.popState(),47;case 33:return this.pushState("SCALE"),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";case 49:return i()?(this.popState(),"ID"):void 0;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:throw new Error('Error: State name must be a single word. Found: "'+a.yytext.trim()+'"');case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState("struct"),20;case 56:return this.popState(),21;case 57:break;case 58:return this.begin("NOTE"),29;case 59:return this.popState(),this.pushState("NOTE_ID"),59;case 60:return this.popState(),this.pushState("NOTE_ID"),60;case 61:this.popState(),this.pushState("FLOATING_NOTE");break;case 62:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 63:break;case 64:return"NOTE_TEXT";case 65:return i()?(this.popState(),"ID"):void 0;case 66:return i()?(this.popState(),this.pushState("NOTE_TEXT"),24):void 0;case 67:return this.popState(),a.yytext=a.yytext.substr(2).trim(),31;case 68:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),31;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:return i()?24:void 0;case 74:return a.yytext=a.yytext.trim(),14;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}};return F})();mt.lexer=Vt;function lt(){this.yy={}}return d(lt,"Parser"),lt.prototype=mt,mt.Parser=lt,new lt})();Ct.parser=Ct;var Me=Ct,V="state",H="root",xt="relation",pe="classDef",ye="style",fe="applyClass",Z="default",Pt="divider",Yt="fill:none",jt="fill: #333",Gt="markdown",Mt="normal",Dt="rect",$t="rectWithTitle",ge="stateStart",me="stateEnd",wt="divider",Nt="roundedWithTitle",Se="note",Te="noteGroup",Q="statediagram",be="state",ke=`${Q}-${be}`,zt="transition",_e="note",Ee="note-edge",De=`${zt} ${Ee}`,$e=`${Q}-${_e}`,Ce="cluster",xe=`${Q}-${Ce}`,ve="cluster-alt",Le=`${Q}-${ve}`,Wt="parent",Ut="note",Ae="state",vt="----",Ie=`${vt}${Ut}`,Ot=`${vt}${Wt}`,Kt=d((t,e="TB")=>{if(!t.doc)return e;let s=e;for(let n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir"),we=d(function(t,e){return e.db.getClasses()},"getClasses"),Ne=d(async function(t,e,s,n){b.info("REF0:"),b.info("Drawing state diagram (v2)",e);let{securityLevel:r,state:h,layout:c}=O();n.db.extract(n.db.getRootDocV2());let y=n.db.getData(),p=Qt(e,r);y.type=n.type,y.layoutAlgorithm=c,y.nodeSpacing=h?.nodeSpacing||50,y.rankSpacing=h?.rankSpacing||50,O().look==="neo"?y.markers=["barbNeo"]:y.markers=["barb"],y.diagramId=e,await ee(y,p);let S=8;try{(typeof n.db.getLinks=="function"?n.db.getLinks():new Map).forEach((m,$)=>{let C=typeof $=="string"?$:typeof $?.id=="string"?$.id:"",N=y.nodes.find(D=>D.id===C);if(!C){b.warn("⚠️ Invalid or missing stateId from key:",JSON.stringify($));return}let u=p.node()?.querySelectorAll("g.node, g.rough-node"),_;if(u?.forEach(D=>{let R=D.textContent?.trim();(D.id===N?.domId||R===C)&&(_=D)}),!_){b.warn("⚠️ Could not find node matching text:",C);return}let L=_.parentNode;if(!L){b.warn("⚠️ Node has no parent, cannot wrap:",C);return}let A=document.createElementNS("http://www.w3.org/2000/svg","a"),P=m.url.replace(/^"+|"+$/g,"");if(A.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",P),A.setAttribute("target","_blank"),m.tooltip){let D=m.tooltip.replace(/^"+|"+$/g,"");A.setAttribute("title",D),_.setAttribute("title",D)}L.replaceChild(A,_),A.appendChild(_),b.info("🔗 Wrapped node in <a> tag for:",C,m.url)})}catch(m){b.error("❌ Error injecting clickable links:",m)}se.insertTitle(p,"statediagramTitleText",h?.titleTopMargin??25,n.db.getDiagramTitle()),te(p,S,Q,h?.useMaxWidth??!0)},"draw"),ze={getClasses:we,draw:Ne,getDir:Kt},ft=new Map,j=0;function gt(t="",e=0,s="",n=vt){let r=s!==null&&s.length>0?`${n}${s}`:"";return`${Ae}-${t}${r}-${e}`}d(gt,"stateDomId");var Oe=d((t,e,s,n,r,h,c,y)=>{b.trace("items",e),e.forEach(p=>{switch(p.stmt){case V:q(t,p,s,n,r,h,c,y);break;case Z:q(t,p,s,n,r,h,c,y);break;case xt:{q(t,p.state1,s,n,r,h,c,y),q(t,p.state2,s,n,r,h,c,y);let S=c==="neo",m={id:"edge"+j,start:p.state1.id,end:p.state2.id,arrowhead:"normal",arrowTypeEnd:S?"arrow_barb_neo":"arrow_barb",style:Yt,labelStyle:"",label:z.sanitizeText(p.description??"",O()),arrowheadStyle:jt,labelpos:"c",labelType:Gt,thickness:Mt,classes:zt,look:c};r.push(m),j++}break}})},"setupDoc"),Rt=d((t,e="TB")=>{let s=e;if(t.doc)for(let n of t.doc)n.stmt==="dir"&&(s=n.value);return s},"getDir");function J(t,e,s){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(r=>{let h=s.get(r);h&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...h.styles])}));let n=t.find(r=>r.id===e.id);n?Object.assign(n,e):t.push(e)}d(J,"insertOrUpdateNode");function Xt(t){return t?.classes?.join(" ")??""}d(Xt,"getClassesFromDbInfo");function Ht(t){return t?.styles??[]}d(Ht,"getStylesFromDbInfo");var q=d((t,e,s,n,r,h,c,y)=>{let p=e.id,S=s.get(p),m=Xt(S),$=Ht(S),C=O();if(b.info("dataFetcher parsedItem",e,S,$),p!=="root"){let N=Dt;e.start===!0?N=ge:e.start===!1&&(N=me),e.type!==Z&&(N=e.type),ft.get(p)||ft.set(p,{id:p,shape:N,description:z.sanitizeText(p,C),cssClasses:`${m} ${ke}`,cssStyles:$});let u=ft.get(p);e.description&&(Array.isArray(u.description)?(u.shape=$t,u.description.push(e.description)):u.description?.length&&u.description.length>0?(u.shape=$t,u.description===p?u.description=[e.description]:u.description=[u.description,e.description]):(u.shape=Dt,u.description=e.description),u.description=z.sanitizeTextOrArray(u.description,C)),u.description?.length===1&&u.shape===$t&&(u.type==="group"?u.shape=Nt:u.shape=Dt),!u.type&&e.doc&&(b.info("Setting cluster for XCX",p,Rt(e)),u.type="group",u.isGroup=!0,u.dir=Rt(e),u.explicitDir=e.doc.some(L=>L.stmt==="dir"),u.shape=e.type===Pt?wt:Nt,u.cssClasses=`${u.cssClasses} ${xe} ${h?Le:""}`);let _={labelStyle:"",shape:u.shape,label:u.description,cssClasses:u.cssClasses,cssCompiledStyles:[],cssStyles:u.cssStyles,id:p,dir:u.dir,domId:gt(p,j),type:u.type,isGroup:u.type==="group",padding:8,rx:10,ry:10,look:c,labelType:"markdown"};if(_.shape===wt&&(_.label=""),t&&t.id!=="root"&&(b.trace("Setting node ",p," to be child of its parent ",t.id),_.parentId=t.id),_.centerLabel=!0,e.note){let L={labelStyle:"",shape:Se,label:e.note.text,labelType:"markdown",cssClasses:$e,cssStyles:[],cssCompiledStyles:[],id:p+Ie+"-"+j,domId:gt(p,j,Ut),type:u.type,isGroup:u.type==="group",padding:C.flowchart?.padding,look:c,position:e.note.position},A=p+Ot,P={labelStyle:"",shape:Te,label:e.note.text,cssClasses:u.cssClasses,cssStyles:[],id:p+Ot,domId:gt(p,j,Wt),type:"group",isGroup:!0,padding:16,look:c,position:e.note.position};j++,P.id=A,L.parentId=A,J(n,P,y),J(n,L,y),J(n,_,y);let D=p,R=L.id;e.note.position==="left of"&&(D=L.id,R=p),r.push({id:D+"-"+R,start:D,end:R,arrowhead:"none",arrowTypeEnd:"",style:Yt,labelStyle:"",classes:De,arrowheadStyle:jt,labelpos:"c",labelType:Gt,thickness:Mt,look:c})}else J(n,_,y)}e.doc&&(b.trace("Adding nodes children "),Oe(e,e.doc,s,n,r,!h,c,y))},"dataFetcher"),Re=d(()=>{ft.clear(),j=0},"reset"),v={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Ft=d(()=>new Map,"newClassesList"),Bt=d(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),yt=d(t=>JSON.parse(JSON.stringify(t)),"clone"),W,We=(W=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Ft(),this.documents={root:Bt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=ie,this.setAccTitle=re,this.getAccDescription=ae,this.setAccDescription=ne,this.setDiagramTitle=oe,this.getDiagramTitle=le,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}extract(e){this.clear(!0);for(let r of Array.isArray(e)?e:e.doc)switch(r.stmt){case V:this.addState(r.id.trim(),r.type,r.doc,r.description,r.note);break;case xt:this.addRelation(r.state1,r.state2,r.description);break;case pe:this.addStyleClass(r.id.trim(),r.classes);break;case ye:this.handleStyleDef(r);break;case fe:this.setCssClass(r.id.trim(),r.styleClass);break;case"click":this.addLink(r.id,r.url,r.tooltip);break}let s=this.getStates(),n=O();Re(),q(void 0,this.getRootDocV2(),s,this.nodes,this.edges,!0,n.look,this.classes);for(let r of this.nodes)if(Array.isArray(r.label)){if(r.description=r.label.slice(1),r.isGroup&&r.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${r.id}]`);r.label=r.label[0]}}handleStyleDef(e){let s=e.id.trim().split(","),n=e.styleClass.split(",");for(let r of s){let h=this.getState(r);if(!h){let c=r.trim();this.addState(c),h=this.getState(c)}h&&(h.styles=n.map(c=>c.replace(/;/g,"")?.trim()))}}setRootDoc(e){b.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,s,n){if(s.stmt===xt){this.docTranslator(e,s.state1,!0),this.docTranslator(e,s.state2,!1);return}if(s.stmt===V&&(s.id===v.START_NODE?(s.id=e.id+(n?"_start":"_end"),s.start=n):s.id=s.id.trim()),s.stmt!==H&&s.stmt!==V||!s.doc)return;let r=[],h=[];for(let c of s.doc)if(c.type===Pt){let y=yt(c);y.doc=yt(h),r.push(y),h=[]}else h.push(c);if(r.length>0&&h.length>0){let c={stmt:V,id:ce(),type:"divider",doc:yt(h)};r.push(yt(c)),s.doc=r}s.doc.forEach(c=>this.docTranslator(s,c,!0))}getRootDocV2(){return this.docTranslator({id:H,stmt:H},{id:H,stmt:H,doc:this.rootDoc},!0),{id:H,doc:this.rootDoc}}addState(e,s=Z,n=void 0,r=void 0,h=void 0,c=void 0,y=void 0,p=void 0){let S=e?.trim();if(!this.currentDocument.states.has(S))b.info("Adding state ",S,r),this.currentDocument.states.set(S,{stmt:V,id:S,descriptions:[],type:s,doc:n,note:h,classes:[],styles:[],textStyles:[]});else{let m=this.currentDocument.states.get(S);if(!m)throw new Error(`State not found: ${S}`);m.doc||(m.doc=n),m.type||(m.type=s)}if(r&&(b.info("Setting state description",S,r),(Array.isArray(r)?r:[r]).forEach(m=>this.addDescription(S,m.trim()))),h){let m=this.currentDocument.states.get(S);if(!m)throw new Error(`State not found: ${S}`);m.note=h,m.note.text=z.sanitizeText(m.note.text,O())}c&&(b.info("Setting state classes",S,c),(Array.isArray(c)?c:[c]).forEach(m=>this.setCssClass(S,m.trim()))),y&&(b.info("Setting state styles",S,y),(Array.isArray(y)?y:[y]).forEach(m=>this.setStyle(S,m.trim()))),p&&(b.info("Setting state styles",S,y),(Array.isArray(p)?p:[p]).forEach(m=>this.setTextStyle(S,m.trim())))}clear(e){this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:Bt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Ft(),e||(this.links=new Map,he())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){b.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,s,n){this.links.set(e,{url:s,tooltip:n}),b.warn("Adding link",e,s,n)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===v.START_NODE?(this.startEndCount++,`${v.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",s=Z){return e===v.START_NODE?v.START_TYPE:s}endIdIfNeeded(e=""){return e===v.END_NODE?(this.startEndCount++,`${v.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",s=Z){return e===v.END_NODE?v.END_TYPE:s}addRelationObjs(e,s,n=""){let r=this.startIdIfNeeded(e.id.trim()),h=this.startTypeIfNeeded(e.id.trim(),e.type),c=this.startIdIfNeeded(s.id.trim()),y=this.startTypeIfNeeded(s.id.trim(),s.type);this.addState(r,h,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(c,y,s.doc,s.description,s.note,s.classes,s.styles,s.textStyles),this.currentDocument.relations.push({id1:r,id2:c,relationTitle:z.sanitizeText(n,O())})}addRelation(e,s,n){if(typeof e=="object"&&typeof s=="object")this.addRelationObjs(e,s,n);else if(typeof e=="string"&&typeof s=="string"){let r=this.startIdIfNeeded(e.trim()),h=this.startTypeIfNeeded(e),c=this.endIdIfNeeded(s.trim()),y=this.endTypeIfNeeded(s);this.addState(r,h),this.addState(c,y),this.currentDocument.relations.push({id1:r,id2:c,relationTitle:n?z.sanitizeText(n,O()):void 0})}}addDescription(e,s){let n=this.currentDocument.states.get(e),r=s.startsWith(":")?s.replace(":","").trim():s;n?.descriptions?.push(z.sanitizeText(r,O()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,s=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});let n=this.classes.get(e);s&&n&&s.split(v.STYLECLASS_SEP).forEach(r=>{let h=r.replace(/([^;]*);/,"$1").trim();if(RegExp(v.COLOR_KEYWORD).exec(r)){let c=h.replace(v.FILL_KEYWORD,v.BG_FILL).replace(v.COLOR_KEYWORD,v.FILL_KEYWORD);n.textStyles.push(c)}n.styles.push(h)})}getClasses(){return this.classes}setupToolTips(e){let s=ue();Et(e).select("svg").selectAll("g.node, g.rough-node").on("mouseover",n=>{let r=Et(n.currentTarget),h=r.attr("title");if(h===null)return;let c=n.currentTarget?.getBoundingClientRect();s.transition().duration(200).style("opacity",".9"),s.style("left",window.scrollX+c.left+(c.right-c.left)/2+"px").style("top",window.scrollY+c.bottom+"px"),s.html(de.sanitize(h)),r.classed("hover",!0)}).on("mouseout",n=>{s.transition().duration(500).style("opacity",0),Et(n.currentTarget).classed("hover",!1)})}setCssClass(e,s){e.split(",").forEach(n=>{let r=this.getState(n);if(!r){let h=n.trim();this.addState(h),r=this.getState(h)}r?.classes?.push(s)})}setStyle(e,s){this.getState(e)?.styles?.push(s)}setTextStyle(e,s){this.getState(e)?.textStyles?.push(s)}bindFunctions(e){this.funs.forEach(s=>{s(e)})}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt==="dir")}getDirection(){return this.getDirectionStatement()?.value??"TB"}setDirection(e){let s=this.getDirectionStatement();s?s.value=e:this.rootDoc.unshift({stmt:"dir",value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){let e=O();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:Kt(this.getRootDocV2())}}getConfig(){return O().state}},d(W,"StateDB"),W.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},W),Fe=d(t=>`
defs [id$="-barbEnd"] {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: ${t.strokeWidth||1};
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: ${t.strokeWidth||1}px;
}
[id$="-barbEnd"] {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${t.mainBkg};
  stroke: ${t.useGradient?"url("+t.svgId+"-gradient)":t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${t.radius}px;
  ry: ${t.radius}px;
  filter: ${t.dropShadow?t.dropShadow.replace("url(#drop-shadow)",`url(${t.svgId}-drop-shadow)`):"none"}
}
`,"getStyles"),Ue=Fe;export{We as D,Me as U,Ue as b,ze as t};
