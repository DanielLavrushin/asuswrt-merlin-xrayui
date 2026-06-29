import{a as ue,l as he,o as fe,n as ke,s as ye,e as me,m as c,q as dt,i as $t,F as pe,V as ge,G as xe,b as be,Z as ve,Y as Te,p as it,S as $e,J as jt,K as Ut,$ as we,N as _e,Q as De,R as Se,T as Ce,U as Me,_ as Ye,a0 as qt,a1 as Qt,a2 as Jt,a3 as Xt,a4 as Zt,a5 as Ee,C as Oe,u as Ae,f as st,a6 as ie,g as Ie,k as Le,a7 as Ct}from"./mermaid.esm.min-D1ZKfwnv.js";import"./app-BduW4X-T.js";var We=Ct((t,s)=>{(function(r,i){typeof t=="object"&&typeof s<"u"?s.exports=i():typeof define=="function"&&define.amd?define(i):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_isoWeek=i()})(t,(function(){var r="day";return function(i,n,h){var x=c(function(M){return M.add(4-M.isoWeekday(),r)},"a"),D=n.prototype;D.isoWeekYear=function(){return x(this).year()},D.isoWeek=function(M){if(!this.$utils().u(M))return this.add(7*(M-this.isoWeek()),r);var w,A,W,N,z=x(this),S=(w=this.isoWeekYear(),A=this.$u,W=(A?h.utc:h)().year(w).startOf("year"),N=4-W.isoWeekday(),W.isoWeekday()>4&&(N+=7),W.add(N,r));return z.diff(S,"week")+1},D.isoWeekday=function(M){return this.$utils().u(M)?this.day()||7:this.day(this.day()%7?M:M-7)};var L=D.startOf;D.startOf=function(M,w){var A=this.$utils(),W=!!A.u(w)||w;return A.p(M)==="isoweek"?W?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):L.bind(this)(M,w)}}}))}),Fe=Ct((t,s)=>{(function(r,i){typeof t=="object"&&typeof s<"u"?s.exports=i():typeof define=="function"&&define.amd?define(i):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_customParseFormat=i()})(t,(function(){var r={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},i=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d/,h=/\d\d/,x=/\d\d?/,D=/\d*[^-_:/,()\s\d]+/,L={},M=c(function($){return($=+$)+($>68?1900:2e3)},"a"),w=c(function($){return function(C){this[$]=+C}},"f"),A=[/[+-]\d\d:?(\d\d)?|Z/,function($){(this.zone||(this.zone={})).offset=(function(C){if(!C||C==="Z")return 0;var I=C.match(/([+-]|\d\d)/g),E=60*I[1]+(+I[2]||0);return E===0?0:I[0]==="+"?-E:E})($)}],W=c(function($){var C=L[$];return C&&(C.indexOf?C:C.s.concat(C.f))},"u"),N=c(function($,C){var I,E=L.meridiem;if(E){for(var R=1;R<=24;R+=1)if($.indexOf(E(R,0,C))>-1){I=R>12;break}}else I=$===(C?"pm":"PM");return I},"d"),z={A:[D,function($){this.afternoon=N($,!1)}],a:[D,function($){this.afternoon=N($,!0)}],Q:[n,function($){this.month=3*($-1)+1}],S:[n,function($){this.milliseconds=100*+$}],SS:[h,function($){this.milliseconds=10*+$}],SSS:[/\d{3}/,function($){this.milliseconds=+$}],s:[x,w("seconds")],ss:[x,w("seconds")],m:[x,w("minutes")],mm:[x,w("minutes")],H:[x,w("hours")],h:[x,w("hours")],HH:[x,w("hours")],hh:[x,w("hours")],D:[x,w("day")],DD:[h,w("day")],Do:[D,function($){var C=L.ordinal,I=$.match(/\d+/);if(this.day=I[0],C)for(var E=1;E<=31;E+=1)C(E).replace(/\[|\]/g,"")===$&&(this.day=E)}],w:[x,w("week")],ww:[h,w("week")],M:[x,w("month")],MM:[h,w("month")],MMM:[D,function($){var C=W("months"),I=(W("monthsShort")||C.map((function(E){return E.slice(0,3)}))).indexOf($)+1;if(I<1)throw new Error;this.month=I%12||I}],MMMM:[D,function($){var C=W("months").indexOf($)+1;if(C<1)throw new Error;this.month=C%12||C}],Y:[/[+-]?\d+/,w("year")],YY:[h,function($){this.year=M($)}],YYYY:[/\d{4}/,w("year")],Z:A,ZZ:A};function S($){var C,I;C=$,I=L&&L.formats;for(var E=($=C.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(g,p,m){var y=m&&m.toUpperCase();return p||I[m]||r[m]||I[y].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(l,u,d){return u||d.slice(1)}))}))).match(i),R=E.length,V=0;V<R;V+=1){var Y=E[V],b=z[Y],k=b&&b[0],f=b&&b[1];E[V]=f?{regex:k,parser:f}:Y.replace(/^\[|\]$/g,"")}return function(g){for(var p={},m=0,y=0;m<R;m+=1){var l=E[m];if(typeof l=="string")y+=l.length;else{var u=l.regex,d=l.parser,v=g.slice(y),e=u.exec(v)[0];d.call(p,e),g=g.replace(e,"")}}return(function(a){var o=a.afternoon;if(o!==void 0){var T=a.hours;o?T<12&&(a.hours+=12):T===12&&(a.hours=0),delete a.afternoon}})(p),p}}return c(S,"l"),function($,C,I){I.p.customParseFormat=!0,$&&$.parseTwoDigitYear&&(M=$.parseTwoDigitYear);var E=C.prototype,R=E.parse;E.parse=function(V){var Y=V.date,b=V.utc,k=V.args;this.$u=b;var f=k[1];if(typeof f=="string"){var g=k[2]===!0,p=k[3]===!0,m=g||p,y=k[2];p&&(y=k[2]),L=this.$locale(),!g&&y&&(L=I.Ls[y]),this.$d=(function(v,e,a,o){try{if(["x","X"].indexOf(e)>-1)return new Date((e==="X"?1e3:1)*v);var T=S(e)(v),O=T.year,_=T.month,F=T.day,P=T.hours,ft=T.minutes,H=T.seconds,X=T.milliseconds,at=T.zone,nt=T.week,kt=new Date,yt=F||(O||_?1:kt.getDate()),ot=O||kt.getFullYear(),B=0;O&&!_||(B=_>0?_-1:kt.getMonth());var tt,Q=P||0,j=ft||0,bt=H||0,et=X||0;return at?new Date(Date.UTC(ot,B,yt,Q,j,bt,et+60*at.offset*1e3)):a?new Date(Date.UTC(ot,B,yt,Q,j,bt,et)):(tt=new Date(ot,B,yt,Q,j,bt,et),nt&&(tt=o(tt).week(nt).toDate()),tt)}catch{return new Date("")}})(Y,f,b,I),this.init(),y&&y!==!0&&(this.$L=this.locale(y).$L),m&&Y!=this.format(f)&&(this.$d=new Date("")),L={}}else if(f instanceof Array)for(var l=f.length,u=1;u<=l;u+=1){k[1]=f[u-1];var d=I.apply(this,k);if(d.isValid()){this.$d=d.$d,this.$L=d.$L,this.init();break}u===l&&(this.$d=new Date(""))}else R.call(this,V)}}}))}),Pe=Ct((t,s)=>{(function(r,i){typeof t=="object"&&typeof s<"u"?s.exports=i():typeof define=="function"&&define.amd?define(i):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_advancedFormat=i()})(t,(function(){return function(r,i){var n=i.prototype,h=n.format;n.format=function(x){var D=this,L=this.$locale();if(!this.isValid())return h.bind(this)(x);var M=this.$utils(),w=(x||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,(function(A){switch(A){case"Q":return Math.ceil((D.$M+1)/3);case"Do":return L.ordinal(D.$D);case"gggg":return D.weekYear();case"GGGG":return D.isoWeekYear();case"wo":return L.ordinal(D.week(),"W");case"w":case"ww":return M.s(D.week(),A==="w"?1:2,"0");case"W":case"WW":return M.s(D.isoWeek(),A==="W"?1:2,"0");case"k":case"kk":return M.s(String(D.$H===0?24:D.$H),A==="k"?1:2,"0");case"X":return Math.floor(D.$d.getTime()/1e3);case"x":return D.$d.getTime();case"z":return"["+D.offsetName()+"]";case"zzz":return"["+D.offsetName("long")+"]";default:return A}}));return h.bind(this)(w)}}}))}),ze=Ct((t,s)=>{(function(r,i){typeof t=="object"&&typeof s<"u"?s.exports=i():typeof define=="function"&&define.amd?define(i):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_duration=i()})(t,(function(){var r,i,n=1e3,h=6e4,x=36e5,D=864e5,L=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,M=31536e6,w=2628e6,A=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,W={years:M,months:w,days:D,hours:x,minutes:h,seconds:n,milliseconds:1,weeks:6048e5},N=c(function(Y){return Y instanceof R},"c"),z=c(function(Y,b,k){return new R(Y,k,b.$l)},"f"),S=c(function(Y){return i.p(Y)+"s"},"m"),$=c(function(Y){return Y<0},"l"),C=c(function(Y){return $(Y)?Math.ceil(Y):Math.floor(Y)},"$"),I=c(function(Y){return Math.abs(Y)},"y"),E=c(function(Y,b){return Y?$(Y)?{negative:!0,format:""+I(Y)+b}:{negative:!1,format:""+Y+b}:{negative:!1,format:""}},"v"),R=(function(){function Y(k,f,g){var p=this;if(this.$d={},this.$l=g,k===void 0&&(this.$ms=0,this.parseFromMilliseconds()),f)return z(k*W[S(f)],this);if(typeof k=="number")return this.$ms=k,this.parseFromMilliseconds(),this;if(typeof k=="object")return Object.keys(k).forEach((function(l){p.$d[S(l)]=k[l]})),this.calMilliseconds(),this;if(typeof k=="string"){var m=k.match(A);if(m){var y=m.slice(2).map((function(l){return l!=null?Number(l):0}));return this.$d.years=y[0],this.$d.months=y[1],this.$d.weeks=y[2],this.$d.days=y[3],this.$d.hours=y[4],this.$d.minutes=y[5],this.$d.seconds=y[6],this.calMilliseconds(),this}}return this}c(Y,"l");var b=Y.prototype;return b.calMilliseconds=function(){var k=this;this.$ms=Object.keys(this.$d).reduce((function(f,g){return f+(k.$d[g]||0)*W[g]}),0)},b.parseFromMilliseconds=function(){var k=this.$ms;this.$d.years=C(k/M),k%=M,this.$d.months=C(k/w),k%=w,this.$d.days=C(k/D),k%=D,this.$d.hours=C(k/x),k%=x,this.$d.minutes=C(k/h),k%=h,this.$d.seconds=C(k/n),k%=n,this.$d.milliseconds=k},b.toISOString=function(){var k=E(this.$d.years,"Y"),f=E(this.$d.months,"M"),g=+this.$d.days||0;this.$d.weeks&&(g+=7*this.$d.weeks);var p=E(g,"D"),m=E(this.$d.hours,"H"),y=E(this.$d.minutes,"M"),l=this.$d.seconds||0;this.$d.milliseconds&&(l+=this.$d.milliseconds/1e3,l=Math.round(1e3*l)/1e3);var u=E(l,"S"),d=k.negative||f.negative||p.negative||m.negative||y.negative||u.negative,v=m.format||y.format||u.format?"T":"",e=(d?"-":"")+"P"+k.format+f.format+p.format+v+m.format+y.format+u.format;return e==="P"||e==="-P"?"P0D":e},b.toJSON=function(){return this.toISOString()},b.format=function(k){var f=k||"YYYY-MM-DDTHH:mm:ss",g={Y:this.$d.years,YY:i.s(this.$d.years,2,"0"),YYYY:i.s(this.$d.years,4,"0"),M:this.$d.months,MM:i.s(this.$d.months,2,"0"),D:this.$d.days,DD:i.s(this.$d.days,2,"0"),H:this.$d.hours,HH:i.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:i.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:i.s(this.$d.seconds,2,"0"),SSS:i.s(this.$d.milliseconds,3,"0")};return f.replace(L,(function(p,m){return m||String(g[p])}))},b.as=function(k){return this.$ms/W[S(k)]},b.get=function(k){var f=this.$ms,g=S(k);return g==="milliseconds"?f%=1e3:f=g==="weeks"?C(f/W[g]):this.$d[g],f||0},b.add=function(k,f,g){var p;return p=f?k*W[S(f)]:N(k)?k.$ms:z(k,this).$ms,z(this.$ms+p*(g?-1:1),this)},b.subtract=function(k,f){return this.add(k,f,!0)},b.locale=function(k){var f=this.clone();return f.$l=k,f},b.clone=function(){return z(this.$ms,this)},b.humanize=function(k){return r().add(this.$ms,"ms").locale(this.$l).fromNow(!k)},b.valueOf=function(){return this.asMilliseconds()},b.milliseconds=function(){return this.get("milliseconds")},b.asMilliseconds=function(){return this.as("milliseconds")},b.seconds=function(){return this.get("seconds")},b.asSeconds=function(){return this.as("seconds")},b.minutes=function(){return this.get("minutes")},b.asMinutes=function(){return this.as("minutes")},b.hours=function(){return this.get("hours")},b.asHours=function(){return this.as("hours")},b.days=function(){return this.get("days")},b.asDays=function(){return this.as("days")},b.weeks=function(){return this.get("weeks")},b.asWeeks=function(){return this.as("weeks")},b.months=function(){return this.get("months")},b.asMonths=function(){return this.as("months")},b.years=function(){return this.get("years")},b.asYears=function(){return this.as("years")},Y})(),V=c(function(Y,b,k){return Y.add(b.years()*k,"y").add(b.months()*k,"M").add(b.days()*k,"d").add(b.hours()*k,"h").add(b.minutes()*k,"m").add(b.seconds()*k,"s").add(b.milliseconds()*k,"ms")},"p");return function(Y,b,k){r=k,i=k().$utils(),k.duration=function(p,m){var y=k.locale();return z(p,{$l:y},m)},k.isDuration=N;var f=b.prototype.add,g=b.prototype.subtract;b.prototype.add=function(p,m){return N(p)?V(this,p,1):f.bind(this)(p,m)},b.prototype.subtract=function(p,m){return N(p)?V(this,p,-1):g.bind(this)(p,m)}}}))}),Et=(function(){var t=c(function(y,l,u,d){for(u=u||{},d=y.length;d--;u[y[d]]=l);return u},"o"),s=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],r=[1,26],i=[1,27],n=[1,28],h=[1,29],x=[1,30],D=[1,31],L=[1,32],M=[1,33],w=[1,34],A=[1,9],W=[1,10],N=[1,11],z=[1,12],S=[1,13],$=[1,14],C=[1,15],I=[1,16],E=[1,19],R=[1,20],V=[1,21],Y=[1,22],b=[1,23],k=[1,25],f=[1,35],g={trace:c(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:c(function(y,l,u,d,v,e,a){var o=e.length-1;switch(v){case 1:return e[o-1];case 2:this.$=[];break;case 3:e[o-1].push(e[o]),this.$=e[o-1];break;case 4:case 5:this.$=e[o];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(e[o].substr(11)),this.$=e[o].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=e[o].substr(18);break;case 19:d.TopAxis(),this.$=e[o].substr(8);break;case 20:d.setAxisFormat(e[o].substr(11)),this.$=e[o].substr(11);break;case 21:d.setTickInterval(e[o].substr(13)),this.$=e[o].substr(13);break;case 22:d.setExcludes(e[o].substr(9)),this.$=e[o].substr(9);break;case 23:d.setIncludes(e[o].substr(9)),this.$=e[o].substr(9);break;case 24:d.setTodayMarker(e[o].substr(12)),this.$=e[o].substr(12);break;case 27:d.setDiagramTitle(e[o].substr(6)),this.$=e[o].substr(6);break;case 28:this.$=e[o].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=e[o].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(e[o].substr(8)),this.$=e[o].substr(8);break;case 33:d.addTask(e[o-1],e[o]),this.$="task";break;case 34:this.$=e[o-1],d.setClickEvent(e[o-1],e[o],null);break;case 35:this.$=e[o-2],d.setClickEvent(e[o-2],e[o-1],e[o]);break;case 36:this.$=e[o-2],d.setClickEvent(e[o-2],e[o-1],null),d.setLink(e[o-2],e[o]);break;case 37:this.$=e[o-3],d.setClickEvent(e[o-3],e[o-2],e[o-1]),d.setLink(e[o-3],e[o]);break;case 38:this.$=e[o-2],d.setClickEvent(e[o-2],e[o],null),d.setLink(e[o-2],e[o-1]);break;case 39:this.$=e[o-3],d.setClickEvent(e[o-3],e[o-1],e[o]),d.setLink(e[o-3],e[o-2]);break;case 40:this.$=e[o-1],d.setLink(e[o-1],e[o]);break;case 41:case 47:this.$=e[o-1]+" "+e[o];break;case 42:case 43:case 45:this.$=e[o-2]+" "+e[o-1]+" "+e[o];break;case 44:case 46:this.$=e[o-3]+" "+e[o-2]+" "+e[o-1]+" "+e[o];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(s,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:r,13:i,14:n,15:h,16:x,17:D,18:L,19:18,20:M,21:w,22:A,23:W,24:N,25:z,26:S,27:$,28:C,29:I,30:E,31:R,33:V,35:Y,36:b,37:24,38:k,40:f},t(s,[2,7],{1:[2,1]}),t(s,[2,3]),{9:36,11:17,12:r,13:i,14:n,15:h,16:x,17:D,18:L,19:18,20:M,21:w,22:A,23:W,24:N,25:z,26:S,27:$,28:C,29:I,30:E,31:R,33:V,35:Y,36:b,37:24,38:k,40:f},t(s,[2,5]),t(s,[2,6]),t(s,[2,17]),t(s,[2,18]),t(s,[2,19]),t(s,[2,20]),t(s,[2,21]),t(s,[2,22]),t(s,[2,23]),t(s,[2,24]),t(s,[2,25]),t(s,[2,26]),t(s,[2,27]),{32:[1,37]},{34:[1,38]},t(s,[2,30]),t(s,[2,31]),t(s,[2,32]),{39:[1,39]},t(s,[2,8]),t(s,[2,9]),t(s,[2,10]),t(s,[2,11]),t(s,[2,12]),t(s,[2,13]),t(s,[2,14]),t(s,[2,15]),t(s,[2,16]),{41:[1,40],43:[1,41]},t(s,[2,4]),t(s,[2,28]),t(s,[2,29]),t(s,[2,33]),t(s,[2,34],{42:[1,42],43:[1,43]}),t(s,[2,40],{41:[1,44]}),t(s,[2,35],{43:[1,45]}),t(s,[2,36]),t(s,[2,38],{42:[1,46]}),t(s,[2,37]),t(s,[2,39])],defaultActions:{},parseError:c(function(y,l){if(l.recoverable)this.trace(y);else{var u=new Error(y);throw u.hash=l,u}},"parseError"),parse:c(function(y){var l=this,u=[0],d=[],v=[null],e=[],a=this.table,o="",T=0,O=0,_=0,F=2,P=1,ft=e.slice.call(arguments,1),H=Object.create(this.lexer),X={yy:{}};for(var at in this.yy)Object.prototype.hasOwnProperty.call(this.yy,at)&&(X.yy[at]=this.yy[at]);H.setInput(y,X.yy),X.yy.lexer=H,X.yy.parser=this,typeof H.yylloc>"u"&&(H.yylloc={});var nt=H.yylloc;e.push(nt);var kt=H.options&&H.options.ranges;typeof X.yy.parseError=="function"?this.parseError=X.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function yt(U){u.length=u.length-2*U,v.length=v.length-U,e.length=e.length-U}c(yt,"popStack");function ot(){var U;return U=d.pop()||H.lex()||P,typeof U!="number"&&(U instanceof Array&&(d=U,U=d.pop()),U=l.symbols_[U]||U),U}c(ot,"lex");for(var B,tt,Q,j,bt,et,lt={},vt,Z,Vt,Tt;;){if(Q=u[u.length-1],this.defaultActions[Q]?j=this.defaultActions[Q]:((B===null||typeof B>"u")&&(B=ot()),j=a[Q]&&a[Q][B]),typeof j>"u"||!j.length||!j[0]){var Mt="";Tt=[];for(vt in a[Q])this.terminals_[vt]&&vt>F&&Tt.push("'"+this.terminals_[vt]+"'");H.showPosition?Mt="Parse error on line "+(T+1)+`:
`+H.showPosition()+`
Expecting `+Tt.join(", ")+", got '"+(this.terminals_[B]||B)+"'":Mt="Parse error on line "+(T+1)+": Unexpected "+(B==P?"end of input":"'"+(this.terminals_[B]||B)+"'"),this.parseError(Mt,{text:H.match,token:this.terminals_[B]||B,line:H.yylineno,loc:nt,expected:Tt})}if(j[0]instanceof Array&&j.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Q+", token: "+B);switch(j[0]){case 1:u.push(B),v.push(H.yytext),e.push(H.yylloc),u.push(j[1]),B=null,tt?(B=tt,tt=null):(O=H.yyleng,o=H.yytext,T=H.yylineno,nt=H.yylloc,_>0);break;case 2:if(Z=this.productions_[j[1]][1],lt.$=v[v.length-Z],lt._$={first_line:e[e.length-(Z||1)].first_line,last_line:e[e.length-1].last_line,first_column:e[e.length-(Z||1)].first_column,last_column:e[e.length-1].last_column},kt&&(lt._$.range=[e[e.length-(Z||1)].range[0],e[e.length-1].range[1]]),et=this.performAction.apply(lt,[o,O,T,X.yy,j[1],v,e].concat(ft)),typeof et<"u")return et;Z&&(u=u.slice(0,-1*Z*2),v=v.slice(0,-1*Z),e=e.slice(0,-1*Z)),u.push(this.productions_[j[1]][0]),v.push(lt.$),e.push(lt._$),Vt=a[u[u.length-2]][u[u.length-1]],u.push(Vt);break;case 3:return!0}}return!0},"parse")},p=(function(){var y={EOF:1,parseError:c(function(l,u){if(this.yy.parser)this.yy.parser.parseError(l,u);else throw new Error(l)},"parseError"),setInput:c(function(l,u){return this.yy=u||this.yy||{},this._input=l,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:c(function(){var l=this._input[0];this.yytext+=l,this.yyleng++,this.offset++,this.match+=l,this.matched+=l;var u=l.match(/(?:\r\n?|\n).*/g);return u?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),l},"input"),unput:c(function(l){var u=l.length,d=l.split(/(?:\r\n?|\n)/g);this._input=l+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-u),this.offset-=u;var v=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),d.length-1&&(this.yylineno-=d.length-1);var e=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:d?(d.length===v.length?this.yylloc.first_column:0)+v[v.length-d.length].length-d[0].length:this.yylloc.first_column-u},this.options.ranges&&(this.yylloc.range=[e[0],e[0]+this.yyleng-u]),this.yyleng=this.yytext.length,this},"unput"),more:c(function(){return this._more=!0,this},"more"),reject:c(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:c(function(l){this.unput(this.match.slice(l))},"less"),pastInput:c(function(){var l=this.matched.substr(0,this.matched.length-this.match.length);return(l.length>20?"...":"")+l.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:c(function(){var l=this.match;return l.length<20&&(l+=this._input.substr(0,20-l.length)),(l.substr(0,20)+(l.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:c(function(){var l=this.pastInput(),u=new Array(l.length+1).join("-");return l+this.upcomingInput()+`
`+u+"^"},"showPosition"),test_match:c(function(l,u){var d,v,e;if(this.options.backtrack_lexer&&(e={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(e.yylloc.range=this.yylloc.range.slice(0))),v=l[0].match(/(?:\r\n?|\n).*/g),v&&(this.yylineno+=v.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:v?v[v.length-1].length-v[v.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+l[0].length},this.yytext+=l[0],this.match+=l[0],this.matches=l,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(l[0].length),this.matched+=l[0],d=this.performAction.call(this,this.yy,this,u,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),d)return d;if(this._backtrack){for(var a in e)this[a]=e[a];return!1}return!1},"test_match"),next:c(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var l,u,d,v;this._more||(this.yytext="",this.match="");for(var e=this._currentRules(),a=0;a<e.length;a++)if(d=this._input.match(this.rules[e[a]]),d&&(!u||d[0].length>u[0].length)){if(u=d,v=a,this.options.backtrack_lexer){if(l=this.test_match(d,e[a]),l!==!1)return l;if(this._backtrack){u=!1;continue}else return!1}else if(!this.options.flex)break}return u?(l=this.test_match(u,e[v]),l!==!1?l:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:c(function(){var l=this.next();return l||this.lex()},"lex"),begin:c(function(l){this.conditionStack.push(l)},"begin"),popState:c(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:c(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:c(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:c(function(l){this.begin(l)},"pushState"),stateStackSize:c(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:c(function(l,u,d,v){switch(d){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return y})();g.lexer=p;function m(){this.yy={}}return c(m,"Parser"),m.prototype=g,g.Parser=m,new m})();Et.parser=Et;var He=Et,Ne=st(Ie()),q=st(ie()),Be=st(We()),Re=st(Fe()),Ge=st(Pe());q.default.extend(Be.default);q.default.extend(Re.default);q.default.extend(Ge.default);var Kt={friday:5,saturday:6},J="",Lt="",Wt,Ft="",pt=[],gt=[],Pt=new Map,zt=[],Dt=[],ht="",Ht="",se=["active","done","crit","milestone","vert"],Nt=[],ct="",xt=!1,Bt=!1,Rt="sunday",St="saturday",Ot=0,Ve=c(function(){zt=[],Dt=[],ht="",Nt=[],wt=0,It=void 0,_t=void 0,G=[],J="",Lt="",Ht="",Wt=void 0,Ft="",pt=[],gt=[],xt=!1,Bt=!1,Ot=0,Pt=new Map,ct="",Ae(),Rt="sunday",St="saturday"},"clear"),je=c(function(t){ct=t},"setDiagramId"),Ue=c(function(t){Lt=t},"setAxisFormat"),qe=c(function(){return Lt},"getAxisFormat"),Qe=c(function(t){Wt=t},"setTickInterval"),Je=c(function(){return Wt},"getTickInterval"),Xe=c(function(t){Ft=t},"setTodayMarker"),Ze=c(function(){return Ft},"getTodayMarker"),Ke=c(function(t){J=t},"setDateFormat"),ti=c(function(){xt=!0},"enableInclusiveEndDates"),ei=c(function(){return xt},"endDatesAreInclusive"),ii=c(function(){Bt=!0},"enableTopAxis"),si=c(function(){return Bt},"topAxisEnabled"),ri=c(function(t){Ht=t},"setDisplayMode"),ai=c(function(){return Ht},"getDisplayMode"),ni=c(function(){return J},"getDateFormat"),oi=c(function(t){pt=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),li=c(function(){return pt},"getIncludes"),ci=c(function(t){gt=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),di=c(function(){return gt},"getExcludes"),ui=c(function(){return Pt},"getLinks"),hi=c(function(t){ht=t,zt.push(t)},"addSection"),fi=c(function(){return zt},"getSections"),ki=c(function(){let t=te(),s=10,r=0;for(;!t&&r<s;)t=te(),r++;return Dt=G,Dt},"getTasks"),re=c(function(t,s,r,i){let n=t.format(s.trim()),h=t.format("YYYY-MM-DD");return i.includes(n)||i.includes(h)?!1:r.includes("weekends")&&(t.isoWeekday()===Kt[St]||t.isoWeekday()===Kt[St]+1)||r.includes(t.format("dddd").toLowerCase())?!0:r.includes(n)||r.includes(h)},"isInvalidDate"),yi=c(function(t){Rt=t},"setWeekday"),mi=c(function(){return Rt},"getWeekday"),pi=c(function(t){St=t},"setWeekend"),ae=c(function(t,s,r,i){if(!r.length||t.manualEndTime)return;let n;t.startTime instanceof Date?n=(0,q.default)(t.startTime):n=(0,q.default)(t.startTime,s,!0),n=n.add(1,"d");let h;t.endTime instanceof Date?h=(0,q.default)(t.endTime):h=(0,q.default)(t.endTime,s,!0);let[x,D]=gi(n,h,s,r,i);t.endTime=x.toDate(),t.renderEndTime=D},"checkTaskDates"),gi=c(function(t,s,r,i,n){let h=!1,x=null,D=s.add(1e4,"d");for(;t<=s;){if(h||(x=s.toDate()),h=re(t,r,i,n),h&&(s=s.add(1,"d"),s>D))throw new Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.");t=t.add(1,"d")}return[s,x]},"fixTaskDates"),At=c(function(t,s,r){if(r=r.trim(),c(h=>{let x=h.trim();return x==="x"||x==="X"},"isTimestampFormat")(s)&&/^\d+$/.test(r))return new Date(Number(r));let i=/^after\s+(?<ids>[\d\w- ]+)/.exec(r);if(i!==null){let h=null;for(let D of i.groups.ids.split(" ")){let L=rt(D);L!==void 0&&(!h||L.endTime>h.endTime)&&(h=L)}if(h)return h.endTime;let x=new Date;return x.setHours(0,0,0,0),x}let n=(0,q.default)(r,s.trim(),!0);if(n.isValid())return n.toDate();{it.debug("Invalid date:"+r),it.debug("With date format:"+s.trim());let h=new Date(r);if(h===void 0||isNaN(h.getTime())||h.getFullYear()<-1e4||h.getFullYear()>1e4)throw new Error("Invalid date:"+r);return h}},"getStartDate"),ne=c(function(t){let s=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return s!==null?[Number.parseFloat(s[1]),s[2]]:[NaN,"ms"]},"parseDuration"),oe=c(function(t,s,r,i=!1){r=r.trim();let n=/^until\s+(?<ids>[\d\w- ]+)/.exec(r);if(n!==null){let M=null;for(let A of n.groups.ids.split(" ")){let W=rt(A);W!==void 0&&(!M||W.startTime<M.startTime)&&(M=W)}if(M)return M.startTime;let w=new Date;return w.setHours(0,0,0,0),w}let h=(0,q.default)(r,s.trim(),!0);if(h.isValid())return i&&(h=h.add(1,"d")),h.toDate();let x=(0,q.default)(t),[D,L]=ne(r);if(!Number.isNaN(D)){let M=x.add(D,L);M.isValid()&&(x=M)}return x.toDate()},"getEndDate"),wt=0,ut=c(function(t){return t===void 0?(wt=wt+1,"task"+wt):t},"parseId"),xi=c(function(t,s){let r;s.substr(0,1)===":"?r=s.substr(1,s.length):r=s;let i=r.split(","),n={};Gt(i,n,se);for(let x=0;x<i.length;x++)i[x]=i[x].trim();let h="";switch(i.length){case 1:n.id=ut(),n.startTime=t.endTime,h=i[0];break;case 2:n.id=ut(),n.startTime=At(void 0,J,i[0]),h=i[1];break;case 3:n.id=ut(i[0]),n.startTime=At(void 0,J,i[1]),h=i[2];break}return h&&(n.endTime=oe(n.startTime,J,h,xt),n.manualEndTime=(0,q.default)(h,"YYYY-MM-DD",!0).isValid(),ae(n,J,gt,pt)),n},"compileData"),bi=c(function(t,s){let r;s.substr(0,1)===":"?r=s.substr(1,s.length):r=s;let i=r.split(","),n={};Gt(i,n,se);for(let h=0;h<i.length;h++)i[h]=i[h].trim();switch(i.length){case 1:n.id=ut(),n.startTime={type:"prevTaskEnd",id:t},n.endTime={data:i[0]};break;case 2:n.id=ut(),n.startTime={type:"getStartDate",startData:i[0]},n.endTime={data:i[1]};break;case 3:n.id=ut(i[0]),n.startTime={type:"getStartDate",startData:i[1]},n.endTime={data:i[2]};break}return n},"parseData"),It,_t,G=[],le={},vi=c(function(t,s){let r={section:ht,type:ht,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:s},task:t,classes:[]},i=bi(_t,s);r.raw.startTime=i.startTime,r.raw.endTime=i.endTime,r.id=i.id,r.prevTaskId=_t,r.active=i.active,r.done=i.done,r.crit=i.crit,r.milestone=i.milestone,r.vert=i.vert,r.order=Ot,Ot++;let n=G.push(r);_t=r.id,le[r.id]=n-1},"addTask"),rt=c(function(t){let s=le[t];return G[s]},"findTaskById"),Ti=c(function(t,s){let r={section:ht,type:ht,description:t,task:t,classes:[]},i=xi(It,s);r.startTime=i.startTime,r.endTime=i.endTime,r.id=i.id,r.active=i.active,r.done=i.done,r.crit=i.crit,r.milestone=i.milestone,r.vert=i.vert,It=r,Dt.push(r)},"addTaskOrg"),te=c(function(){let t=c(function(r){let i=G[r],n="";switch(G[r].raw.startTime.type){case"prevTaskEnd":{let h=rt(i.prevTaskId);i.startTime=h.endTime;break}case"getStartDate":n=At(void 0,J,G[r].raw.startTime.startData),n&&(G[r].startTime=n);break}return G[r].startTime&&(G[r].endTime=oe(G[r].startTime,J,G[r].raw.endTime.data,xt),G[r].endTime&&(G[r].processed=!0,G[r].manualEndTime=(0,q.default)(G[r].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),ae(G[r],J,gt,pt))),G[r].processed},"compileTask"),s=!0;for(let[r,i]of G.entries())t(r),s=s&&i.processed;return s},"compileTasks"),$i=c(function(t,s){let r=s;dt().securityLevel!=="loose"&&(r=(0,Ne.sanitizeUrl)(s)),t.split(",").forEach(function(i){rt(i)!==void 0&&(de(i,()=>{window.open(r,"_self")}),Pt.set(i,r))}),ce(t,"clickable")},"setLink"),ce=c(function(t,s){t.split(",").forEach(function(r){let i=rt(r);i!==void 0&&i.classes.push(s)})},"setClass"),wi=c(function(t,s,r){if(dt().securityLevel!=="loose"||s===void 0)return;let i=[];if(typeof r=="string"){i=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let n=0;n<i.length;n++){let h=i[n].trim();h.startsWith('"')&&h.endsWith('"')&&(h=h.substr(1,h.length-2)),i[n]=h}}i.length===0&&i.push(t),rt(t)!==void 0&&de(t,()=>{Le.runFunc(s,...i)})},"setClickFun"),de=c(function(t,s){Nt.push(function(){let r=ct?`${ct}-${t}`:t,i=document.querySelector(`[id="${r}"]`);i!==null&&i.addEventListener("click",function(){s()})},function(){let r=ct?`${ct}-${t}`:t,i=document.querySelector(`[id="${r}-text"]`);i!==null&&i.addEventListener("click",function(){s()})})},"pushFun"),_i=c(function(t,s,r){t.split(",").forEach(function(i){wi(i,s,r)}),ce(t,"clickable")},"setClickEvent"),Di=c(function(t){Nt.forEach(function(s){s(t)})},"bindFunctions"),Si={getConfig:c(()=>dt().gantt,"getConfig"),clear:Ve,setDateFormat:Ke,getDateFormat:ni,enableInclusiveEndDates:ti,endDatesAreInclusive:ei,enableTopAxis:ii,topAxisEnabled:si,setAxisFormat:Ue,getAxisFormat:qe,setTickInterval:Qe,getTickInterval:Je,setTodayMarker:Xe,getTodayMarker:Ze,setAccTitle:me,getAccTitle:ye,setDiagramTitle:ke,getDiagramTitle:fe,setDiagramId:je,setDisplayMode:ri,getDisplayMode:ai,setAccDescription:he,getAccDescription:ue,addSection:hi,getSections:fi,getTasks:ki,addTask:vi,findTaskById:rt,addTaskOrg:Ti,setIncludes:oi,getIncludes:li,setExcludes:ci,getExcludes:di,setClickEvent:_i,setLink:$i,getLinks:ui,bindFunctions:Di,parseDuration:ne,isInvalidDate:re,setWeekday:yi,getWeekday:mi,setWeekend:pi};function Gt(t,s,r){let i=!0;for(;i;)i=!1,r.forEach(function(n){let h="^\\s*"+n+"\\s*$",x=new RegExp(h);t[0].match(x)&&(s[n]=!0,t.shift(1),i=!0)})}c(Gt,"getTaskTags");var mt=st(ie()),Ci=st(ze());mt.default.extend(Ci.default);var Mi=c(function(){it.debug("Something is calling, setConf, remove the call")},"setConf"),ee={monday:Ye,tuesday:Me,wednesday:Ce,thursday:Se,friday:De,saturday:_e,sunday:we},Yi=c((t,s)=>{let r=[...t].map(()=>-1/0),i=[...t].sort((h,x)=>h.startTime-x.startTime||h.order-x.order),n=0;for(let h of i)for(let x=0;x<r.length;x++)if(h.startTime>=r[x]){r[x]=h.endTime,h.order=x+s,x>n&&(n=x);break}return n},"getMaxIntersections"),K,Yt=1e4,Ei=c(function(t,s,r,i){let n=dt().gantt;i.db.setDiagramId(s);let h=dt().securityLevel,x;h==="sandbox"&&(x=$t("#i"+s));let D=h==="sandbox"?$t(x.nodes()[0].contentDocument.body):$t("body"),L=h==="sandbox"?x.nodes()[0].contentDocument:document,M=L.getElementById(s);K=M.parentElement.offsetWidth,K===void 0&&(K=1200),n.useWidth!==void 0&&(K=n.useWidth);let w=i.db.getTasks(),A=[];for(let f of w)A.push(f.type);A=k(A);let W={},N=2*n.topPadding;if(i.db.getDisplayMode()==="compact"||n.displayMode==="compact"){let f={};for(let p of w)f[p.section]===void 0?f[p.section]=[p]:f[p.section].push(p);let g=0;for(let p of Object.keys(f)){let m=Yi(f[p],g)+1;g+=m,N+=m*(n.barHeight+n.barGap),W[p]=m}}else{N+=w.length*(n.barHeight+n.barGap);for(let f of A)W[f]=w.filter(g=>g.type===f).length}M.setAttribute("viewBox","0 0 "+K+" "+N);let z=D.select(`[id="${s}"]`),S=pe().domain([ge(w,function(f){return f.startTime}),xe(w,function(f){return f.endTime})]).rangeRound([0,K-n.leftPadding-n.rightPadding]);function $(f,g){let p=f.startTime,m=g.startTime,y=0;return p>m?y=1:p<m&&(y=-1),y}c($,"taskCompare"),w.sort($),C(w,K,N),be(z,N,K,n.useMaxWidth),z.append("text").text(i.db.getDiagramTitle()).attr("x",K/2).attr("y",n.titleTopMargin).attr("class","titleText");function C(f,g,p){let m=n.barHeight,y=m+n.barGap,l=n.topPadding,u=n.leftPadding,d=ve().domain([0,A.length]).range(["#00B9FA","#F95002"]).interpolate(Te);E(y,l,u,g,p,f,i.db.getExcludes(),i.db.getIncludes()),V(u,l,g,p),I(f,y,l,u,m,d,g),Y(y,l),b(u,l,g,p)}c(C,"makeGantt");function I(f,g,p,m,y,l,u){f.sort((a,o)=>a.vert===o.vert?0:a.vert?1:-1);let d=[...new Set(f.map(a=>a.order))].map(a=>f.find(o=>o.order===a));z.append("g").selectAll("rect").data(d).enter().append("rect").attr("x",0).attr("y",function(a,o){return o=a.order,o*g+p-2}).attr("width",function(){return u-n.rightPadding/2}).attr("height",g).attr("class",function(a){for(let[o,T]of A.entries())if(a.type===T)return"section section"+o%n.numberSectionStyles;return"section section0"}).enter();let v=z.append("g").selectAll("rect").data(f).enter(),e=i.db.getLinks();if(v.append("rect").attr("id",function(a){return s+"-"+a.id}).attr("rx",3).attr("ry",3).attr("x",function(a){return a.milestone?S(a.startTime)+m+.5*(S(a.endTime)-S(a.startTime))-.5*y:S(a.startTime)+m}).attr("y",function(a,o){return o=a.order,a.vert?n.gridLineStartPadding:o*g+p}).attr("width",function(a){return a.milestone?y:a.vert?.08*y:S(a.renderEndTime||a.endTime)-S(a.startTime)}).attr("height",function(a){return a.vert?w.length*(n.barHeight+n.barGap)+n.barHeight*2:y}).attr("transform-origin",function(a,o){return o=a.order,(S(a.startTime)+m+.5*(S(a.endTime)-S(a.startTime))).toString()+"px "+(o*g+p+.5*y).toString()+"px"}).attr("class",function(a){let o="task",T="";a.classes.length>0&&(T=a.classes.join(" "));let O=0;for(let[F,P]of A.entries())a.type===P&&(O=F%n.numberSectionStyles);let _="";return a.active?a.crit?_+=" activeCrit":_=" active":a.done?a.crit?_=" doneCrit":_=" done":a.crit&&(_+=" crit"),_.length===0&&(_=" task"),a.milestone&&(_=" milestone "+_),a.vert&&(_=" vert "+_),_+=O,_+=" "+T,o+_}),v.append("text").attr("id",function(a){return s+"-"+a.id+"-text"}).text(function(a){return a.task}).attr("font-size",n.fontSize).attr("x",function(a){let o=S(a.startTime),T=S(a.renderEndTime||a.endTime);if(a.milestone&&(o+=.5*(S(a.endTime)-S(a.startTime))-.5*y,T=o+y),a.vert)return S(a.startTime)+m;let O=this.getBBox().width;return O>T-o?T+O+1.5*n.leftPadding>u?o+m-5:T+m+5:(T-o)/2+o+m}).attr("y",function(a,o){return a.vert?n.gridLineStartPadding+w.length*(n.barHeight+n.barGap)+60:(o=a.order,o*g+n.barHeight/2+(n.fontSize/2-2)+p)}).attr("text-height",y).attr("class",function(a){let o=S(a.startTime),T=S(a.endTime);a.milestone&&(T=o+y);let O=this.getBBox().width,_="";a.classes.length>0&&(_=a.classes.join(" "));let F=0;for(let[ft,H]of A.entries())a.type===H&&(F=ft%n.numberSectionStyles);let P="";return a.active&&(a.crit?P="activeCritText"+F:P="activeText"+F),a.done?a.crit?P=P+" doneCritText"+F:P=P+" doneText"+F:a.crit&&(P=P+" critText"+F),a.milestone&&(P+=" milestoneText"),a.vert&&(P+=" vertText"),O>T-o?T+O+1.5*n.leftPadding>u?_+" taskTextOutsideLeft taskTextOutside"+F+" "+P:_+" taskTextOutsideRight taskTextOutside"+F+" "+P+" width-"+O:_+" taskText taskText"+F+" "+P+" width-"+O}),dt().securityLevel==="sandbox"){let a;a=$t("#i"+s);let o=a.nodes()[0].contentDocument;v.filter(function(T){return e.has(T.id)}).each(function(T){var O=o.querySelector("#"+CSS.escape(s+"-"+T.id)),_=o.querySelector("#"+CSS.escape(s+"-"+T.id+"-text"));let F=O.parentNode;var P=o.createElement("a");P.setAttribute("xlink:href",e.get(T.id)),P.setAttribute("target","_top"),F.appendChild(P),P.appendChild(O),P.appendChild(_)})}}c(I,"drawRects");function E(f,g,p,m,y,l,u,d){if(u.length===0&&d.length===0)return;let v,e;for(let{startTime:_,endTime:F}of l)(v===void 0||_<v)&&(v=_),(e===void 0||F>e)&&(e=F);if(!v||!e)return;if((0,mt.default)(e).diff((0,mt.default)(v),"year")>5){it.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}let a=i.db.getDateFormat(),o=[],T=null,O=(0,mt.default)(v);for(;O.valueOf()<=e;)i.db.isInvalidDate(O,a,u,d)?T?T.end=O:T={start:O,end:O}:T&&(o.push(T),T=null),O=O.add(1,"d");z.append("g").selectAll("rect").data(o).enter().append("rect").attr("id",_=>s+"-exclude-"+_.start.format("YYYY-MM-DD")).attr("x",_=>S(_.start.startOf("day"))+p).attr("y",n.gridLineStartPadding).attr("width",_=>S(_.end.endOf("day"))-S(_.start.startOf("day"))).attr("height",y-g-n.gridLineStartPadding).attr("transform-origin",function(_,F){return(S(_.start)+p+.5*(S(_.end)-S(_.start))).toString()+"px "+(F*f+.5*y).toString()+"px"}).attr("class","exclude-range")}c(E,"drawExcludeDays");function R(f,g,p,m){if(p<=0||f>g)return 1/0;let y=g-f,l=mt.default.duration({[m??"day"]:p}).asMilliseconds();return l<=0?1/0:Math.ceil(y/l)}c(R,"getEstimatedTickCount");function V(f,g,p,m){let y=i.db.getDateFormat(),l=i.db.getAxisFormat(),u;l?u=l:y==="D"?u="%d":u=n.axisFormat??"%Y-%m-%d";let d=$e(S).tickSize(-m+g+n.gridLineStartPadding).tickFormat(jt(u)),v=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(i.db.getTickInterval()||n.tickInterval);if(v!==null){let e=parseInt(v[1],10);if(isNaN(e)||e<=0)it.warn(`Invalid tick interval value: "${v[1]}". Skipping custom tick interval.`);else{let a=v[2],o=i.db.getWeekday()||n.weekday,T=S.domain(),O=T[0],_=T[1],F=R(O,_,e,a);if(F>Yt)it.warn(`The tick interval "${e}${a}" would generate ${F} ticks, which exceeds the maximum allowed (${Yt}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(a){case"millisecond":d.ticks(Zt.every(e));break;case"second":d.ticks(Xt.every(e));break;case"minute":d.ticks(Jt.every(e));break;case"hour":d.ticks(Qt.every(e));break;case"day":d.ticks(qt.every(e));break;case"week":d.ticks(ee[o].every(e));break;case"month":d.ticks(Ut.every(e));break}}}if(z.append("g").attr("class","grid").attr("transform","translate("+f+", "+(m-50)+")").call(d).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),i.db.topAxisEnabled()||n.topAxis){let e=Ee(S).tickSize(-m+g+n.gridLineStartPadding).tickFormat(jt(u));if(v!==null){let a=parseInt(v[1],10);if(isNaN(a)||a<=0)it.warn(`Invalid tick interval value: "${v[1]}". Skipping custom tick interval.`);else{let o=v[2],T=i.db.getWeekday()||n.weekday,O=S.domain(),_=O[0],F=O[1];if(R(_,F,a,o)<=Yt)switch(o){case"millisecond":e.ticks(Zt.every(a));break;case"second":e.ticks(Xt.every(a));break;case"minute":e.ticks(Jt.every(a));break;case"hour":e.ticks(Qt.every(a));break;case"day":e.ticks(qt.every(a));break;case"week":e.ticks(ee[T].every(a));break;case"month":e.ticks(Ut.every(a));break}}}z.append("g").attr("class","grid").attr("transform","translate("+f+", "+g+")").call(e).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}c(V,"makeGrid");function Y(f,g){let p=0,m=Object.keys(W).map(y=>[y,W[y]]);z.append("g").selectAll("text").data(m).enter().append(function(y){let l=y[0].split(Oe.lineBreakRegex),u=-(l.length-1)/2,d=L.createElementNS("http://www.w3.org/2000/svg","text");d.setAttribute("dy",u+"em");for(let[v,e]of l.entries()){let a=L.createElementNS("http://www.w3.org/2000/svg","tspan");a.setAttribute("alignment-baseline","central"),a.setAttribute("x","10"),v>0&&a.setAttribute("dy","1em"),a.textContent=e,d.appendChild(a)}return d}).attr("x",10).attr("y",function(y,l){if(l>0)for(let u=0;u<l;u++)return p+=m[l-1][1],y[1]*f/2+p*f+g;else return y[1]*f/2+g}).attr("font-size",n.sectionFontSize).attr("class",function(y){for(let[l,u]of A.entries())if(y[0]===u)return"sectionTitle sectionTitle"+l%n.numberSectionStyles;return"sectionTitle"})}c(Y,"vertLabels");function b(f,g,p,m){let y=i.db.getTodayMarker();if(y==="off")return;let l=z.append("g").attr("class","today"),u=new Date,d=l.append("line");d.attr("x1",S(u)+f).attr("x2",S(u)+f).attr("y1",n.titleTopMargin).attr("y2",m-n.titleTopMargin).attr("class","today"),y!==""&&d.attr("style",y.replace(/,/g,";"))}c(b,"drawToday");function k(f){let g={},p=[];for(let m=0,y=f.length;m<y;++m)Object.prototype.hasOwnProperty.call(g,f[m])||(g[f[m]]=!0,p.push(f[m]));return p}c(k,"checkUnique")},"draw"),Oi={setConf:Mi,draw:Ei},Ai=c(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar — same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),Ii=Ai,Fi={parser:He,db:Si,renderer:Oi,styles:Ii};export{Fi as diagram};
