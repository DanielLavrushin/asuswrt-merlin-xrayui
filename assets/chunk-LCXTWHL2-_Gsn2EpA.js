import{m as Zt}from"./chunk-6764PJDD-B7SRhxT0.js";import{y as Jt}from"./chunk-ZXARS5L4-DRYvtot4.js";import{m as d,p as _,q as O,j as te,k as ee,s as se,e as ie,a as re,l as ae,n as ne,o as oe,ao as le,C as M,u as ce}from"./mermaid.esm.min-D1ZKfwnv.js";var Dt=(function(){var t=d(function(w,n,a,g){for(a=a||{},g=w.length;g--;a[w[g]]=n);return a},"o"),e=[1,2],i=[1,3],o=[1,4],r=[2,4],u=[1,9],h=[1,11],y=[1,16],p=[1,17],S=[1,18],m=[1,19],E=[1,33],x=[1,20],N=[1,21],c=[1,22],v=[1,23],$=[1,24],F=[1,26],I=[1,27],B=[1,28],P=[1,29],tt=[1,30],et=[1,31],st=[1,32],it=[1,35],rt=[1,36],at=[1,37],nt=[1,38],U=[1,34],f=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ot=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],vt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],mt={trace:d(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:d(function(w,n,a,g,k,s,T){var l=s.length-1;switch(k){case 3:return g.setRootDoc(s[l]),s[l];case 4:this.$=[];break;case 5:s[l]!="nl"&&(s[l-1].push(s[l]),this.$=s[l-1]);break;case 6:case 7:this.$=s[l];break;case 8:this.$="nl";break;case 12:this.$=s[l];break;case 13:let ht=s[l-1];ht.description=g.trimColon(s[l]),this.$=ht;break;case 14:this.$={stmt:"relation",state1:s[l-2],state2:s[l]};break;case 15:let dt=g.trimColon(s[l]);this.$={stmt:"relation",state1:s[l-3],state2:s[l-1],description:dt};break;case 19:this.$={stmt:"state",id:s[l-3],type:"default",description:"",doc:s[l-1]};break;case 20:var R=s[l],K=s[l-2].trim();if(s[l].match(":")){var ct=s[l].split(":");R=ct[0],K=[K,ct[1]]}this.$={stmt:"state",id:R,type:"default",description:K};break;case 21:this.$={stmt:"state",id:s[l-3],type:"default",description:s[l-5],doc:s[l-1]};break;case 22:this.$={stmt:"state",id:s[l],type:"fork"};break;case 23:this.$={stmt:"state",id:s[l],type:"join"};break;case 24:this.$={stmt:"state",id:s[l],type:"choice"};break;case 25:this.$={stmt:"state",id:g.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:s[l-1].trim(),note:{position:s[l-2].trim(),text:s[l].trim()}};break;case 29:this.$=s[l].trim(),g.setAccTitle(this.$);break;case 30:case 31:this.$=s[l].trim(),g.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:s[l-3],url:s[l-2],tooltip:s[l-1]};break;case 33:this.$={stmt:"click",id:s[l-3],url:s[l-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:s[l-1].trim(),classes:s[l].trim()};break;case 36:this.$={stmt:"style",id:s[l-1].trim(),styleClass:s[l].trim()};break;case 37:this.$={stmt:"applyClass",id:s[l-1].trim(),styleClass:s[l].trim()};break;case 38:g.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:g.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:g.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:g.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:s[l].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:s[l-2].trim(),classes:[s[l].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:s[l-2].trim(),classes:[s[l].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:i,6:o},{1:[3]},{3:5,4:e,5:i,6:o},{3:6,4:e,5:i,6:o},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],r,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:u,5:h,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,22:m,24:E,25:x,26:N,27:c,28:v,29:$,32:25,33:F,35:I,37:B,38:P,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:y,17:p,19:S,22:m,24:E,25:x,26:N,27:c,28:v,29:$,32:25,33:F,35:I,37:B,38:P,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,7]),t(f,[2,8]),t(f,[2,9]),t(f,[2,10]),t(f,[2,11]),t(f,[2,12],{14:[1,40],15:[1,41]}),t(f,[2,16]),{18:[1,42]},t(f,[2,18],{20:[1,43]}),{23:[1,44]},t(f,[2,22]),t(f,[2,23]),t(f,[2,24]),t(f,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(f,[2,28]),{34:[1,49]},{36:[1,50]},t(f,[2,31]),{13:51,24:E,57:U},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(ot,[2,44],{58:[1,56]}),t(ot,[2,45],{58:[1,57]}),t(f,[2,38]),t(f,[2,39]),t(f,[2,40]),t(f,[2,41]),t(f,[2,6]),t(f,[2,13]),{13:58,24:E,57:U},t(f,[2,17]),t(vt,r,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(f,[2,29]),t(f,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(f,[2,14],{14:[1,71]}),{4:u,5:h,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,21:[1,72],22:m,24:E,25:x,26:N,27:c,28:v,29:$,32:25,33:F,35:I,37:B,38:P,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(f,[2,34]),t(f,[2,35]),t(f,[2,36]),t(f,[2,37]),t(ot,[2,46]),t(ot,[2,47]),t(f,[2,15]),t(f,[2,19]),t(vt,r,{7:78}),t(f,[2,26]),t(f,[2,27]),{5:[1,79]},{5:[1,80]},{4:u,5:h,8:8,9:10,10:12,11:13,12:14,13:15,16:y,17:p,19:S,21:[1,81],22:m,24:E,25:x,26:N,27:c,28:v,29:$,32:25,33:F,35:I,37:B,38:P,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(f,[2,32]),t(f,[2,33]),t(f,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:d(function(w,n){if(n.recoverable)this.trace(w);else{var a=new Error(w);throw a.hash=n,a}},"parseError"),parse:d(function(w){var n=this,a=[0],g=[],k=[null],s=[],T=this.table,l="",R=0,K=0,ct=0,ht=2,dt=1,qt=s.slice.call(arguments,1),b=Object.create(this.lexer),W={yy:{}};for(var St in this.yy)Object.prototype.hasOwnProperty.call(this.yy,St)&&(W.yy[St]=this.yy[St]);b.setInput(w,W.yy),W.yy.lexer=b,W.yy.parser=this,typeof b.yylloc>"u"&&(b.yylloc={});var kt=b.yylloc;s.push(kt);var Vt=b.options&&b.options.ranges;typeof W.yy.parseError=="function"?this.parseError=W.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Qt(L){a.length=a.length-2*L,k.length=k.length-L,s.length=s.length-L}d(Qt,"popStack");function Lt(){var L;return L=g.pop()||b.lex()||dt,typeof L!="number"&&(L instanceof Array&&(g=L,L=g.pop()),L=n.symbols_[L]||L),L}d(Lt,"lex");for(var D,_t,z,A,we,Tt,X={},ut,Y,It,pt;;){if(z=a[a.length-1],this.defaultActions[z]?A=this.defaultActions[z]:((D===null||typeof D>"u")&&(D=Lt()),A=T[z]&&T[z][D]),typeof A>"u"||!A.length||!A[0]){var bt="";pt=[];for(ut in T[z])this.terminals_[ut]&&ut>ht&&pt.push("'"+this.terminals_[ut]+"'");b.showPosition?bt="Parse error on line "+(R+1)+`:
`+b.showPosition()+`
Expecting `+pt.join(", ")+", got '"+(this.terminals_[D]||D)+"'":bt="Parse error on line "+(R+1)+": Unexpected "+(D==dt?"end of input":"'"+(this.terminals_[D]||D)+"'"),this.parseError(bt,{text:b.match,token:this.terminals_[D]||D,line:b.yylineno,loc:kt,expected:pt})}if(A[0]instanceof Array&&A.length>1)throw new Error("Parse Error: multiple actions possible at state: "+z+", token: "+D);switch(A[0]){case 1:a.push(D),k.push(b.yytext),s.push(b.yylloc),a.push(A[1]),D=null,_t?(D=_t,_t=null):(K=b.yyleng,l=b.yytext,R=b.yylineno,kt=b.yylloc,ct>0);break;case 2:if(Y=this.productions_[A[1]][1],X.$=k[k.length-Y],X._$={first_line:s[s.length-(Y||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(Y||1)].first_column,last_column:s[s.length-1].last_column},Vt&&(X._$.range=[s[s.length-(Y||1)].range[0],s[s.length-1].range[1]]),Tt=this.performAction.apply(X,[l,K,R,W.yy,A[1],k,s].concat(qt)),typeof Tt<"u")return Tt;Y&&(a=a.slice(0,-1*Y*2),k=k.slice(0,-1*Y),s=s.slice(0,-1*Y)),a.push(this.productions_[A[1]][0]),k.push(X.$),s.push(X._$),It=T[a[a.length-2]][a[a.length-1]],a.push(It);break;case 3:return!0}}return!0},"parse")},Ht=(function(){var w={EOF:1,parseError:d(function(n,a){if(this.yy.parser)this.yy.parser.parseError(n,a);else throw new Error(n)},"parseError"),setInput:d(function(n,a){return this.yy=a||this.yy||{},this._input=n,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:d(function(){var n=this._input[0];this.yytext+=n,this.yyleng++,this.offset++,this.match+=n,this.matched+=n;var a=n.match(/(?:\r\n?|\n).*/g);return a?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),n},"input"),unput:d(function(n){var a=n.length,g=n.split(/(?:\r\n?|\n)/g);this._input=n+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-a),this.offset-=a;var k=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),g.length-1&&(this.yylineno-=g.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:g?(g.length===k.length?this.yylloc.first_column:0)+k[k.length-g.length].length-g[0].length:this.yylloc.first_column-a},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-a]),this.yyleng=this.yytext.length,this},"unput"),more:d(function(){return this._more=!0,this},"more"),reject:d(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:d(function(n){this.unput(this.match.slice(n))},"less"),pastInput:d(function(){var n=this.matched.substr(0,this.matched.length-this.match.length);return(n.length>20?"...":"")+n.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:d(function(){var n=this.match;return n.length<20&&(n+=this._input.substr(0,20-n.length)),(n.substr(0,20)+(n.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:d(function(){var n=this.pastInput(),a=new Array(n.length+1).join("-");return n+this.upcomingInput()+`
`+a+"^"},"showPosition"),test_match:d(function(n,a){var g,k,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),k=n[0].match(/(?:\r\n?|\n).*/g),k&&(this.yylineno+=k.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:k?k[k.length-1].length-k[k.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+n[0].length},this.yytext+=n[0],this.match+=n[0],this.matches=n,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(n[0].length),this.matched+=n[0],g=this.performAction.call(this,this.yy,this,a,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),g)return g;if(this._backtrack){for(var T in s)this[T]=s[T];return!1}return!1},"test_match"),next:d(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var n,a,g,k;this._more||(this.yytext="",this.match="");for(var s=this._currentRules(),T=0;T<s.length;T++)if(g=this._input.match(this.rules[s[T]]),g&&(!a||g[0].length>a[0].length)){if(a=g,k=T,this.options.backtrack_lexer){if(n=this.test_match(g,s[T]),n!==!1)return n;if(this._backtrack){a=!1;continue}else return!1}else if(!this.options.flex)break}return a?(n=this.test_match(a,s[k]),n!==!1?n:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:d(function(){var n=this.next();return n||this.lex()},"lex"),begin:d(function(n){this.conditionStack.push(n)},"begin"),popState:d(function(){var n=this.conditionStack.length-1;return n>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:d(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:d(function(n){return n=this.conditionStack.length-1-Math.abs(n||0),n>=0?this.conditionStack[n]:"INITIAL"},"topState"),pushState:d(function(n){this.begin(n)},"pushState"),stateStackSize:d(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:d(function(n,a,g,k){function s(){let T=a.yytext.indexOf("%%");if(T===0)return!1;if(T>0){let l=a.yytext.slice(0,T),R=a.yytext.slice(T);R&&n.lexer.unput(R),a.yytext=l}return!0}switch(d(s,"processId"),g){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;case 17:return this.popState(),"acc_title_value";case 18:return this.begin("acc_descr"),35;case 19:return this.popState(),"acc_descr_value";case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 25:return this.popState(),this.pushState("CLASSDEFID"),42;case 26:return this.popState(),43;case 27:return this.pushState("CLASS"),48;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;case 29:return this.popState(),50;case 30:return this.pushState("STYLE"),45;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 32:return this.popState(),47;case 33:return this.pushState("SCALE"),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),a.yytext=a.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";case 49:return s()?(this.popState(),"ID"):void 0;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:return 19;case 53:this.popState();break;case 54:return this.popState(),this.pushState("struct"),20;case 55:return this.popState(),21;case 56:break;case 57:return this.begin("NOTE"),29;case 58:return this.popState(),this.pushState("NOTE_ID"),59;case 59:return this.popState(),this.pushState("NOTE_ID"),60;case 60:this.popState(),this.pushState("FLOATING_NOTE");break;case 61:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 62:break;case 63:return"NOTE_TEXT";case 64:return s()?(this.popState(),"ID"):void 0;case 65:return s()?(this.popState(),this.pushState("NOTE_TEXT"),24):void 0;case 66:return this.popState(),a.yytext=a.yytext.substr(2).trim(),31;case 67:return this.popState(),a.yytext=a.yytext.slice(0,-8).trim(),31;case 68:return 6;case 69:return 6;case 70:return 16;case 71:return 57;case 72:return s()?24:void 0;case 73:return a.yytext=a.yytext.trim(),14;case 74:return 15;case 75:return 28;case 76:return 58;case 77:return 5;case 78:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,55,56,57,71,72,73,74,75,76],inclusive:!1},FLOATING_NOTE_ID:{rules:[64],inclusive:!1},FLOATING_NOTE:{rules:[61,62,63],inclusive:!1},NOTE_TEXT:{rules:[66,67],inclusive:!1},NOTE_ID:{rules:[65],inclusive:!1},NOTE:{rules:[58,59,60],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,54,57,68,69,70,71,72,73,74,76,77,78],inclusive:!0}}};return w})();mt.lexer=Ht;function lt(){this.yy={}}return d(lt,"Parser"),lt.prototype=mt,mt.Parser=lt,new lt})();Dt.parser=Dt;var Be=Dt,q="state",H="root",Ct="relation",he="classDef",de="style",ue="applyClass",Z="default",Yt="divider",Bt="fill:none",Pt="fill: #333",Gt="markdown",Wt="normal",Et="rect",$t="rectWithTitle",pe="stateStart",ye="stateEnd",At="divider",Nt="roundedWithTitle",fe="note",ge="noteGroup",J="statediagram",me="state",Se=`${J}-${me}`,zt="transition",ke="note",_e="note-edge",Te=`${zt} ${_e}`,be=`${J}-${ke}`,Ee="cluster",$e=`${J}-${Ee}`,De="cluster-alt",Ce=`${J}-${De}`,Mt="parent",jt="note",xe="state",xt="----",ve=`${xt}${jt}`,Ot=`${xt}${Mt}`,Ut=d((t,e="TB")=>{if(!t.doc)return e;let i=e;for(let o of t.doc)o.stmt==="dir"&&(i=o.value);return i},"getDir"),Le=d(function(t,e){return e.db.getClasses()},"getClasses"),Ie=d(async function(t,e,i,o){_.info("REF0:"),_.info("Drawing state diagram (v2)",e);let{securityLevel:r,state:u,layout:h}=O();o.db.extract(o.db.getRootDocV2());let y=o.db.getData(),p=Zt(e,r);y.type=o.type,y.layoutAlgorithm=h,y.nodeSpacing=u?.nodeSpacing||50,y.rankSpacing=u?.rankSpacing||50,O().look==="neo"?y.markers=["barbNeo"]:y.markers=["barb"],y.diagramId=e,await te(y,p);let S=8;try{(typeof o.db.getLinks=="function"?o.db.getLinks():new Map).forEach((m,E)=>{let x=typeof E=="string"?E:typeof E?.id=="string"?E.id:"";if(!x){_.warn("⚠️ Invalid or missing stateId from key:",JSON.stringify(E));return}let N=p.node()?.querySelectorAll("g"),c;if(N?.forEach(I=>{I.textContent?.trim()===x&&(c=I)}),!c){_.warn("⚠️ Could not find node matching text:",x);return}let v=c.parentNode;if(!v){_.warn("⚠️ Node has no parent, cannot wrap:",x);return}let $=document.createElementNS("http://www.w3.org/2000/svg","a"),F=m.url.replace(/^"+|"+$/g,"");if($.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",F),$.setAttribute("target","_blank"),m.tooltip){let I=m.tooltip.replace(/^"+|"+$/g,"");$.setAttribute("title",I)}v.replaceChild($,c),$.appendChild(c),_.info("🔗 Wrapped node in <a> tag for:",x,m.url)})}catch(m){_.error("❌ Error injecting clickable links:",m)}ee.insertTitle(p,"statediagramTitleText",u?.titleTopMargin??25,o.db.getDiagramTitle()),Jt(p,S,J,u?.useMaxWidth??!0)},"draw"),Pe={getClasses:Le,draw:Ie,getDir:Ut},ft=new Map,G=0;function gt(t="",e=0,i="",o=xt){let r=i!==null&&i.length>0?`${o}${i}`:"";return`${xe}-${t}${r}-${e}`}d(gt,"stateDomId");var Ae=d((t,e,i,o,r,u,h,y)=>{_.trace("items",e),e.forEach(p=>{switch(p.stmt){case q:Q(t,p,i,o,r,u,h,y);break;case Z:Q(t,p,i,o,r,u,h,y);break;case Ct:{Q(t,p.state1,i,o,r,u,h,y),Q(t,p.state2,i,o,r,u,h,y);let S=h==="neo",m={id:"edge"+G,start:p.state1.id,end:p.state2.id,arrowhead:"normal",arrowTypeEnd:S?"arrow_barb_neo":"arrow_barb",style:Bt,labelStyle:"",label:M.sanitizeText(p.description??"",O()),arrowheadStyle:Pt,labelpos:"c",labelType:Gt,thickness:Wt,classes:zt,look:h};r.push(m),G++}break}})},"setupDoc"),wt=d((t,e="TB")=>{let i=e;if(t.doc)for(let o of t.doc)o.stmt==="dir"&&(i=o.value);return i},"getDir");function V(t,e,i){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(r=>{let u=i.get(r);u&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...u.styles])}));let o=t.find(r=>r.id===e.id);o?Object.assign(o,e):t.push(e)}d(V,"insertOrUpdateNode");function Kt(t){return t?.classes?.join(" ")??""}d(Kt,"getClassesFromDbInfo");function Xt(t){return t?.styles??[]}d(Xt,"getStylesFromDbInfo");var Q=d((t,e,i,o,r,u,h,y)=>{let p=e.id,S=i.get(p),m=Kt(S),E=Xt(S),x=O();if(_.info("dataFetcher parsedItem",e,S,E),p!=="root"){let N=Et;e.start===!0?N=pe:e.start===!1&&(N=ye),e.type!==Z&&(N=e.type),ft.get(p)||ft.set(p,{id:p,shape:N,description:M.sanitizeText(p,x),cssClasses:`${m} ${Se}`,cssStyles:E});let c=ft.get(p);e.description&&(Array.isArray(c.description)?(c.shape=$t,c.description.push(e.description)):c.description?.length&&c.description.length>0?(c.shape=$t,c.description===p?c.description=[e.description]:c.description=[c.description,e.description]):(c.shape=Et,c.description=e.description),c.description=M.sanitizeTextOrArray(c.description,x)),c.description?.length===1&&c.shape===$t&&(c.type==="group"?c.shape=Nt:c.shape=Et),!c.type&&e.doc&&(_.info("Setting cluster for XCX",p,wt(e)),c.type="group",c.isGroup=!0,c.dir=wt(e),c.shape=e.type===Yt?At:Nt,c.cssClasses=`${c.cssClasses} ${$e} ${u?Ce:""}`);let v={labelStyle:"",shape:c.shape,label:c.description,cssClasses:c.cssClasses,cssCompiledStyles:[],cssStyles:c.cssStyles,id:p,dir:c.dir,domId:gt(p,G),type:c.type,isGroup:c.type==="group",padding:8,rx:10,ry:10,look:h,labelType:"markdown"};if(v.shape===At&&(v.label=""),t&&t.id!=="root"&&(_.trace("Setting node ",p," to be child of its parent ",t.id),v.parentId=t.id),v.centerLabel=!0,e.note){let $={labelStyle:"",shape:fe,label:e.note.text,labelType:"markdown",cssClasses:be,cssStyles:[],cssCompiledStyles:[],id:p+ve+"-"+G,domId:gt(p,G,jt),type:c.type,isGroup:c.type==="group",padding:x.flowchart?.padding,look:h,position:e.note.position},F=p+Ot,I={labelStyle:"",shape:ge,label:e.note.text,cssClasses:c.cssClasses,cssStyles:[],id:p+Ot,domId:gt(p,G,Mt),type:"group",isGroup:!0,padding:16,look:h,position:e.note.position};G++,I.id=F,$.parentId=F,V(o,I,y),V(o,$,y),V(o,v,y);let B=p,P=$.id;e.note.position==="left of"&&(B=$.id,P=p),r.push({id:B+"-"+P,start:B,end:P,arrowhead:"none",arrowTypeEnd:"",style:Bt,labelStyle:"",classes:Te,arrowheadStyle:Pt,labelpos:"c",labelType:Gt,thickness:Wt,look:h})}else V(o,v,y)}e.doc&&(_.trace("Adding nodes children "),Ae(e,e.doc,i,o,r,!u,h,y))},"dataFetcher"),Ne=d(()=>{ft.clear(),G=0},"reset"),C={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Rt=d(()=>new Map,"newClassesList"),Ft=d(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),yt=d(t=>JSON.parse(JSON.stringify(t)),"clone"),j,Ge=(j=class{constructor(e){this.version=e,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Rt(),this.documents={root:Ft()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.getAccTitle=se,this.setAccTitle=ie,this.getAccDescription=re,this.setAccDescription=ae,this.setDiagramTitle=ne,this.getDiagramTitle=oe,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this)}extract(e){this.clear(!0);for(let r of Array.isArray(e)?e:e.doc)switch(r.stmt){case q:this.addState(r.id.trim(),r.type,r.doc,r.description,r.note);break;case Ct:this.addRelation(r.state1,r.state2,r.description);break;case he:this.addStyleClass(r.id.trim(),r.classes);break;case de:this.handleStyleDef(r);break;case ue:this.setCssClass(r.id.trim(),r.styleClass);break;case"click":this.addLink(r.id,r.url,r.tooltip);break}let i=this.getStates(),o=O();Ne(),Q(void 0,this.getRootDocV2(),i,this.nodes,this.edges,!0,o.look,this.classes);for(let r of this.nodes)if(Array.isArray(r.label)){if(r.description=r.label.slice(1),r.isGroup&&r.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${r.id}]`);r.label=r.label[0]}}handleStyleDef(e){let i=e.id.trim().split(","),o=e.styleClass.split(",");for(let r of i){let u=this.getState(r);if(!u){let h=r.trim();this.addState(h),u=this.getState(h)}u&&(u.styles=o.map(h=>h.replace(/;/g,"")?.trim()))}}setRootDoc(e){_.info("Setting root doc",e),this.rootDoc=e,this.version===1?this.extract(e):this.extract(this.getRootDocV2())}docTranslator(e,i,o){if(i.stmt===Ct){this.docTranslator(e,i.state1,!0),this.docTranslator(e,i.state2,!1);return}if(i.stmt===q&&(i.id===C.START_NODE?(i.id=e.id+(o?"_start":"_end"),i.start=o):i.id=i.id.trim()),i.stmt!==H&&i.stmt!==q||!i.doc)return;let r=[],u=[];for(let h of i.doc)if(h.type===Yt){let y=yt(h);y.doc=yt(u),r.push(y),u=[]}else u.push(h);if(r.length>0&&u.length>0){let h={stmt:q,id:le(),type:"divider",doc:yt(u)};r.push(yt(h)),i.doc=r}i.doc.forEach(h=>this.docTranslator(i,h,!0))}getRootDocV2(){return this.docTranslator({id:H,stmt:H},{id:H,stmt:H,doc:this.rootDoc},!0),{id:H,doc:this.rootDoc}}addState(e,i=Z,o=void 0,r=void 0,u=void 0,h=void 0,y=void 0,p=void 0){let S=e?.trim();if(!this.currentDocument.states.has(S))_.info("Adding state ",S,r),this.currentDocument.states.set(S,{stmt:q,id:S,descriptions:[],type:i,doc:o,note:u,classes:[],styles:[],textStyles:[]});else{let m=this.currentDocument.states.get(S);if(!m)throw new Error(`State not found: ${S}`);m.doc||(m.doc=o),m.type||(m.type=i)}if(r&&(_.info("Setting state description",S,r),(Array.isArray(r)?r:[r]).forEach(m=>this.addDescription(S,m.trim()))),u){let m=this.currentDocument.states.get(S);if(!m)throw new Error(`State not found: ${S}`);m.note=u,m.note.text=M.sanitizeText(m.note.text,O())}h&&(_.info("Setting state classes",S,h),(Array.isArray(h)?h:[h]).forEach(m=>this.setCssClass(S,m.trim()))),y&&(_.info("Setting state styles",S,y),(Array.isArray(y)?y:[y]).forEach(m=>this.setStyle(S,m.trim()))),p&&(_.info("Setting state styles",S,y),(Array.isArray(p)?p:[p]).forEach(m=>this.setTextStyle(S,m.trim())))}clear(e){this.nodes=[],this.edges=[],this.documents={root:Ft()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Rt(),e||(this.links=new Map,ce())}getState(e){return this.currentDocument.states.get(e)}getStates(){return this.currentDocument.states}logDocuments(){_.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(e,i,o){this.links.set(e,{url:i,tooltip:o}),_.warn("Adding link",e,i,o)}getLinks(){return this.links}startIdIfNeeded(e=""){return e===C.START_NODE?(this.startEndCount++,`${C.START_TYPE}${this.startEndCount}`):e}startTypeIfNeeded(e="",i=Z){return e===C.START_NODE?C.START_TYPE:i}endIdIfNeeded(e=""){return e===C.END_NODE?(this.startEndCount++,`${C.END_TYPE}${this.startEndCount}`):e}endTypeIfNeeded(e="",i=Z){return e===C.END_NODE?C.END_TYPE:i}addRelationObjs(e,i,o=""){let r=this.startIdIfNeeded(e.id.trim()),u=this.startTypeIfNeeded(e.id.trim(),e.type),h=this.startIdIfNeeded(i.id.trim()),y=this.startTypeIfNeeded(i.id.trim(),i.type);this.addState(r,u,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.addState(h,y,i.doc,i.description,i.note,i.classes,i.styles,i.textStyles),this.currentDocument.relations.push({id1:r,id2:h,relationTitle:M.sanitizeText(o,O())})}addRelation(e,i,o){if(typeof e=="object"&&typeof i=="object")this.addRelationObjs(e,i,o);else if(typeof e=="string"&&typeof i=="string"){let r=this.startIdIfNeeded(e.trim()),u=this.startTypeIfNeeded(e),h=this.endIdIfNeeded(i.trim()),y=this.endTypeIfNeeded(i);this.addState(r,u),this.addState(h,y),this.currentDocument.relations.push({id1:r,id2:h,relationTitle:o?M.sanitizeText(o,O()):void 0})}}addDescription(e,i){let o=this.currentDocument.states.get(e),r=i.startsWith(":")?i.replace(":","").trim():i;o?.descriptions?.push(M.sanitizeText(r,O()))}cleanupLabel(e){return e.startsWith(":")?e.slice(2).trim():e.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(e,i=""){this.classes.has(e)||this.classes.set(e,{id:e,styles:[],textStyles:[]});let o=this.classes.get(e);i&&o&&i.split(C.STYLECLASS_SEP).forEach(r=>{let u=r.replace(/([^;]*);/,"$1").trim();if(RegExp(C.COLOR_KEYWORD).exec(r)){let h=u.replace(C.FILL_KEYWORD,C.BG_FILL).replace(C.COLOR_KEYWORD,C.FILL_KEYWORD);o.textStyles.push(h)}o.styles.push(u)})}getClasses(){return this.classes}setCssClass(e,i){e.split(",").forEach(o=>{let r=this.getState(o);if(!r){let u=o.trim();this.addState(u),r=this.getState(u)}r?.classes?.push(i)})}setStyle(e,i){this.getState(e)?.styles?.push(i)}setTextStyle(e,i){this.getState(e)?.textStyles?.push(i)}getDirectionStatement(){return this.rootDoc.find(e=>e.stmt==="dir")}getDirection(){return this.getDirectionStatement()?.value??"TB"}setDirection(e){let i=this.getDirectionStatement();i?i.value=e:this.rootDoc.unshift({stmt:"dir",value:e})}trimColon(e){return e.startsWith(":")?e.slice(1).trim():e.trim()}getData(){let e=O();return{nodes:this.nodes,edges:this.edges,other:{},config:e,direction:Ut(this.getRootDocV2())}}getConfig(){return O().state}},d(j,"StateDB"),j.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3},j),Oe=d(t=>`
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
`,"getStyles"),We=Oe;export{Be as Y,Ge as _,We as g,Pe as q};
