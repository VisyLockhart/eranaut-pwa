import{n as m,t as l}from"./chunk-B3TDcqVz.js";import{n as d,r as p,t as T}from"./chunk-m0SrDzKB.js";var Rl=0;var jo=1;var Cl=2;var us=1;var Pl=2;var Di=3;var Wn=0;var Oe=1;var Qe=2;var ri=0;var Ni=1;var oi=2;var ta=3;var ea=4;var Il=5;var ai=100;var Ll=101;var Dl=102;var Nl=103;var Ul=104;var Fl=200;var Ol=201;var Bl=202;var zl=203;var na=204;var ia=205;var kl=206;var Hl=207;var Gl=208;var Vl=209;var Wl=210;var Xl=211;var ql=212;var Yl=213;var Zl=214;var Qs=0;var js=1;var tr=2;var wi=3;var er=4;var nr=5;var ir=6;var sr=7;var sa=0;var Jl=1;var $l=2;var pn=0;var ra=1;var oa=2;var aa=3;var la=4;var ca=5;var ha=6;var ua=7;var da=300;var li=301;var Ui=302;var Pr=303;var Ir=304;var rr=1e3;var un=1001;var or=1002;var we=1003;var Kl=1004;var ds=1005;var Fe=1006;var Lr=1007;var An=1008;var Ze=1009;var fa=1010;var pa=1011;var Fi=1012;var Dr=1013;var on=1014;var an=1015;var ln=1016;var Nr=1017;var Ur=1018;var ci=1020;var ma=35902;var ga=35899;var _a=1021;var xa=1022;var cn=1023;var Tn=1026;var Rn=1027;var va=1028;var Fr=1029;var Xn=1030;var Or=1031;var Br=1033;var fs=33776;var ps=33777;var ms=33778;var gs=33779;var zr=35840;var kr=35841;var Hr=35842;var Gr=35843;var Vr=36196;var Wr=37492;var Xr=37496;var qr=37488;var Yr=37489;var _s=37490;var Zr=37491;var Jr=37808;var $r=37809;var Kr=37810;var Qr=37811;var jr=37812;var to=37813;var eo=37814;var no=37815;var io=37816;var so=37817;var ro=37818;var oo=37819;var ao=37820;var lo=37821;var co=36492;var ho=36494;var uo=36495;var fo=36283;var po=36284;var xs=36285;var mo=36286;var Zi=2300;var ar=2301;var $s=2302;var qo=2303;var Yo=2400;var Zo=2401;var Jo=2402;var Ql=3200;var ya=0;var jl=1;var Cn=``;var ye=`srgb`;var Ji=`srgb-linear`;var $i=`linear`;var le=`srgb`;var Ks=7680;var tc=519;var ec=512;var nc=513;var ic=514;var Ma=515;var sc=516;var rc=517;var Sa=518;var ba=519;var oc=35044;var Ea=`300 es`;var $e=2e3;var Ki=2001;function oh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function ah(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Qi(i){return document.createElementNS(`http://www.w3.org/1999/xhtml`,i)}function ac(){let i=Qi(`canvas`);return i.style.display=`block`,i}var rl={};var Ai=null;function Ta(...i){let t=`THREE.`+i.shift();Ai?Ai(`log`,t,...i):console.log(t,...i)}function lc(i){let t=i[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let e=i[1];e&&e.isStackTrace?i[0]+=` `+e.getLocation():i[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return i}function Wt(...i){i=lc(i);let t=`THREE.`+i.shift();if(Ai)Ai(`warn`,t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Xt(...i){i=lc(i);let t=`THREE.`+i.shift();if(Ai)Ai(`error`,t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Yi(...i){let t=i.join(` `);t in rl||(rl[t]=!0,Wt(...i))}function cc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var hc={[Qs]:Qs,[tr]:ir,[er]:er,[wi]:nr,[js]:js,[ir]:tr,[sr]:sr,[nr]:wi};var dn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}};var Ie=[`00`,`01`,`02`,`03`,`04`,`05`,`06`,`07`,`08`,`09`,`0a`,`0b`,`0c`,`0d`,`0e`,`0f`,`10`,`11`,`12`,`13`,`14`,`15`,`16`,`17`,`18`,`19`,`1a`,`1b`,`1c`,`1d`,`1e`,`1f`,`20`,`21`,`22`,`23`,`24`,`25`,`26`,`27`,`28`,`29`,`2a`,`2b`,`2c`,`2d`,`2e`,`2f`,`30`,`31`,`32`,`33`,`34`,`35`,`36`,`37`,`38`,`39`,`3a`,`3b`,`3c`,`3d`,`3e`,`3f`,`40`,`41`,`42`,`43`,`44`,`45`,`46`,`47`,`48`,`49`,`4a`,`4b`,`4c`,`4d`,`4e`,`4f`,`50`,`51`,`52`,`53`,`54`,`55`,`56`,`57`,`58`,`59`,`5a`,`5b`,`5c`,`5d`,`5e`,`5f`,`60`,`61`,`62`,`63`,`64`,`65`,`66`,`67`,`68`,`69`,`6a`,`6b`,`6c`,`6d`,`6e`,`6f`,`70`,`71`,`72`,`73`,`74`,`75`,`76`,`77`,`78`,`79`,`7a`,`7b`,`7c`,`7d`,`7e`,`7f`,`80`,`81`,`82`,`83`,`84`,`85`,`86`,`87`,`88`,`89`,`8a`,`8b`,`8c`,`8d`,`8e`,`8f`,`90`,`91`,`92`,`93`,`94`,`95`,`96`,`97`,`98`,`99`,`9a`,`9b`,`9c`,`9d`,`9e`,`9f`,`a0`,`a1`,`a2`,`a3`,`a4`,`a5`,`a6`,`a7`,`a8`,`a9`,`aa`,`ab`,`ac`,`ad`,`ae`,`af`,`b0`,`b1`,`b2`,`b3`,`b4`,`b5`,`b6`,`b7`,`b8`,`b9`,`ba`,`bb`,`bc`,`bd`,`be`,`bf`,`c0`,`c1`,`c2`,`c3`,`c4`,`c5`,`c6`,`c7`,`c8`,`c9`,`ca`,`cb`,`cc`,`cd`,`ce`,`cf`,`d0`,`d1`,`d2`,`d3`,`d4`,`d5`,`d6`,`d7`,`d8`,`d9`,`da`,`db`,`dc`,`dd`,`de`,`df`,`e0`,`e1`,`e2`,`e3`,`e4`,`e5`,`e6`,`e7`,`e8`,`e9`,`ea`,`eb`,`ec`,`ed`,`ee`,`ef`,`f0`,`f1`,`f2`,`f3`,`f4`,`f5`,`f6`,`f7`,`f8`,`f9`,`fa`,`fb`,`fc`,`fd`,`fe`,`ff`];var To=Math.PI/180;var lr=180/Math.PI;function vs(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ie[i&255]+Ie[i>>8&255]+Ie[i>>16&255]+Ie[i>>24&255]+`-`+Ie[t&255]+Ie[t>>8&255]+`-`+Ie[t>>16&15|64]+Ie[t>>24&255]+`-`+Ie[e&63|128]+Ie[e>>8&255]+`-`+Ie[e>>16&255]+Ie[e>>24&255]+Ie[n&255]+Ie[n>>8&255]+Ie[n>>16&255]+Ie[n>>24&255]).toLowerCase()}function ie(i,t,e){return Math.max(t,Math.min(e,i))}function lh(i,t){return(i%t+t)%t}function wo(i,t,e){return(1-e)*i+e*t}function uc(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function wa(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function ch(i,t){if(t.constructor===Float32Array)return i;let e=wa(t);if(e===void 0)throw new Error(`THREE.MathUtils: Invalid component type.`);return Math.max(i/e,-1)}function hh(i,t){if(t.constructor===Float32Array)return i;let e=wa(t);if(e===void 0)throw new Error(`THREE.MathUtils: Invalid component type.`);return Math.round(i*e)}var re=class{static{this.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error(`THREE.Vector2: index is out of range: `+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error(`THREE.Vector2: index is out of range: `+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};var fn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let c=n[s+0],l=n[s+1],d=n[s+2],_=n[s+3],u=r[o+0],m=r[o+1],x=r[o+2],A=r[o+3];if(_!==A||c!==u||l!==m||d!==x){let g=c*u+l*m+d*x+_*A;g<0&&(u=-u,m=-m,x=-x,A=-A,g=-g);let f=1-a;if(g<.9995){let R=Math.acos(g),F=Math.sin(R);f=Math.sin(f*R)/F,a=Math.sin(a*R)/F,c=c*f+u*a,l=l*f+m*a,d=d*f+x*a,_=_*f+A*a}else{c=c*f+u*a,l=l*f+m*a,d=d*f+x*a,_=_*f+A*a;let R=1/Math.sqrt(c*c+l*l+d*d+_*_);c*=R,l*=R,d*=R,_*=R}}t[e]=c,t[e+1]=l,t[e+2]=d,t[e+3]=_}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],c=n[s+1],l=n[s+2],d=n[s+3],_=r[o],u=r[o+1],m=r[o+2],x=r[o+3];return t[e]=a*x+d*_+c*m-l*u,t[e+1]=c*x+d*u+l*_-a*m,t[e+2]=l*x+d*m+a*u-c*_,t[e+3]=d*x-a*_-c*u-l*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),d=a(s/2),_=a(r/2),u=c(n/2),m=c(s/2),x=c(r/2);switch(o){case`XYZ`:this._x=u*d*_+l*m*x,this._y=l*m*_-u*d*x,this._z=l*d*x+u*m*_,this._w=l*d*_-u*m*x;break;case`YXZ`:this._x=u*d*_+l*m*x,this._y=l*m*_-u*d*x,this._z=l*d*x-u*m*_,this._w=l*d*_+u*m*x;break;case`ZXY`:this._x=u*d*_-l*m*x,this._y=l*m*_+u*d*x,this._z=l*d*x+u*m*_,this._w=l*d*_-u*m*x;break;case`ZYX`:this._x=u*d*_-l*m*x,this._y=l*m*_+u*d*x,this._z=l*d*x-u*m*_,this._w=l*d*_+u*m*x;break;case`YZX`:this._x=u*d*_+l*m*x,this._y=l*m*_+u*d*x,this._z=l*d*x-u*m*_,this._w=l*d*_-u*m*x;break;case`XZY`:this._x=u*d*_-l*m*x,this._y=l*m*_-u*d*x,this._z=l*d*x+u*m*_,this._w=l*d*_+u*m*x;break;default:Wt(`Quaternion: .setFromEuler() encountered an unknown order: `+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],c=e[9],l=e[2],d=e[6],_=e[10],u=n+a+_;if(u>0){let m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(d-c)*m,this._y=(r-l)*m,this._z=(o-s)*m}else if(n>a&&n>_){let m=2*Math.sqrt(1+n-a-_);this._w=(d-c)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+l)/m}else if(a>_){let m=2*Math.sqrt(1+a-n-_);this._w=(r-l)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(c+d)/m}else{let m=2*Math.sqrt(1+_-n-a);this._w=(o-s)/m,this._x=(r+l)/m,this._y=(c+d)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ie(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,c=e._y,l=e._z,d=e._w;return this._x=n*d+o*a+s*l-r*c,this._y=s*d+o*c+r*a-n*l,this._z=r*d+o*l+n*c-s*a,this._w=o*d-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=this.dot(t);a<0&&(n=-n,s=-s,r=-r,o=-o,a=-a);let c=1-e;if(a<.9995){let l=Math.acos(a),d=Math.sin(l);c=Math.sin(c*l)/d,e=Math.sin(e*l)/d,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+o*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+o*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var et=class{static{this.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error(`THREE.Vector3: index is out of range: `+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error(`THREE.Vector3: index is out of range: `+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ol.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ol.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*s-a*n),d=2*(a*e-r*s),_=2*(r*n-o*e);return this.x=e+c*l+o*_-a*d,this.y=n+c*d+a*l-r*_,this.z=s+c*_+r*d-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this.z=ie(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this.z=ie(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ao.copy(this).projectOnVector(t),this.sub(Ao)}reflect(t){return this.sub(Ao.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};var Ao=new et;var ol=new fn;var qt=class{static{this.prototype.isMatrix3=!0}constructor(t,e,n,s,r,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l)}set(t,e,n,s,r,o,a,c,l){let d=this.elements;return d[0]=t,d[1]=s,d[2]=a,d[3]=e,d[4]=r,d[5]=c,d[6]=n,d[7]=o,d[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],d=n[4],_=n[7],u=n[2],m=n[5],x=n[8],A=s[0],g=s[3],f=s[6],R=s[1],F=s[4],C=s[7],N=s[2],I=s[5],y=s[8];return r[0]=o*A+a*R+c*N,r[3]=o*g+a*F+c*I,r[6]=o*f+a*C+c*y,r[1]=l*A+d*R+_*N,r[4]=l*g+d*F+_*I,r[7]=l*f+d*C+_*y,r[2]=u*A+m*R+x*N,r[5]=u*g+m*F+x*I,r[8]=u*f+m*C+x*y,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],d=t[8];return e*o*d-e*a*l-n*r*d+n*a*c+s*r*l-s*o*c}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],d=t[8],_=d*o-a*l,u=a*c-d*r,m=l*r-o*c,x=e*_+n*u+s*m;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let A=1/x;return t[0]=_*A,t[1]=(s*l-d*n)*A,t[2]=(a*n-s*o)*A,t[3]=u*A,t[4]=(d*e-s*c)*A,t[5]=(s*r-a*e)*A,t[6]=m*A,t[7]=(n*c-l*e)*A,t[8]=(o*e-n*r)*A,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-s*l,s*c,-s*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return Yi(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Ro.makeScale(t,e)),this}rotate(t){return Yi(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Ro.makeRotation(-t)),this}translate(t,e){return Yi(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Ro.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};var Ro=new qt;var al=new qt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322);var ll=new qt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function uh(){let i={enabled:!0,workingColorSpace:Ji,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===le&&(s.r=En(s.r),s.g=En(s.g),s.b=En(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===le&&(s.r=Ti(s.r),s.g=Ti(s.g),s.b=Ti(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Cn?$i:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[o].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ji]:{primaries:t,whitePoint:n,transfer:$i,toXYZ:al,fromXYZ:ll,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:ye},outputColorSpaceConfig:{drawingBufferColorSpace:ye}},[ye]:{primaries:t,whitePoint:n,transfer:le,toXYZ:al,fromXYZ:ll,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:ye}}}),i}var ne=uh();function En(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ti(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var di;var cr=class{static getDataURL(t,e=`image/png`){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>`u`)return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{di===void 0&&(di=Qi(`canvas`)),di.width=t.width,di.height=t.height;let s=di.getContext(`2d`);t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=di}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<`u`&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&t instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&t instanceof ImageBitmap){let e=Qi(`canvas`);e.width=t.width,e.height=t.height;let n=e.getContext(`2d`);n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=En(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(En(e[n]/255)*255):e[n]=En(e[n]);return{data:e,width:t.width,height:t.height}}else return Wt(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),t}};var dh=0;var Ri=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:dh++}),this.uuid=vs(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<`u`&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<`u`&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t==`string`;if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:``},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Co(s[o].image)):r.push(Co(s[o]))}else r=Co(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Co(i){return typeof HTMLImageElement<`u`&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&i instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&i instanceof ImageBitmap?cr.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Wt(`Texture: Unable to serialize Texture.`),{})}var fh=0;var Po=new et;var ke=class i extends dn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=un,s=un,r=Fe,o=An,a=cn,c=Ze,l=i.DEFAULT_ANISOTROPY,d=Cn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:fh++}),this.uuid=vs(),this.name=``,this.source=new Ri(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new re(0,0),this.repeat=new re(1,1),this.center=new re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Po).x}get height(){return this.source.getSize(Po).y}get depth(){return this.source.getSize(Po).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Wt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Wt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t==`string`;if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(t){if(this.mapping!==da)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case rr:t.x=t.x-Math.floor(t.x);break;case un:t.x=t.x<0?0:1;break;case or:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x)}if(t.y<0||t.y>1)switch(this.wrapT){case rr:t.y=t.y-Math.floor(t.y);break;case un:t.y=t.y<0?0:1;break;case or:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y)}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};ke.DEFAULT_IMAGE=null;ke.DEFAULT_MAPPING=da;ke.DEFAULT_ANISOTROPY=1;var ge=class{static{this.prototype.isVector4=!0}constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error(`THREE.Vector4: index is out of range: `+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error(`THREE.Vector4: index is out of range: `+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,c=t.elements,l=c[0],d=c[4],_=c[8],u=c[1],m=c[5],x=c[9],A=c[2],g=c[6],f=c[10];if(Math.abs(d-u)<.01&&Math.abs(_-A)<.01&&Math.abs(x-g)<.01){if(Math.abs(d+u)<.1&&Math.abs(_+A)<.1&&Math.abs(x+g)<.1&&Math.abs(l+m+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let F=(l+1)/2,C=(m+1)/2,N=(f+1)/2,I=(d+u)/4,y=(_+A)/4,T=(x+g)/4;return F>C&&F>N?F<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(F),s=I/n,r=y/n):C>N?C<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(C),n=I/s,r=T/s):N<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(N),n=y/r,s=T/r),this.set(n,s,r,e),this}let R=Math.sqrt((g-x)*(g-x)+(_-A)*(_-A)+(u-d)*(u-d));return Math.abs(R)<.001&&(R=1),this.x=(g-x)/R,this.y=(_-A)/R,this.z=(u-d)/R,this.w=Math.acos((l+m+f-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this.z=ie(this.z,t.z,e.z),this.w=ie(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this.z=ie(this.z,t,e),this.w=ie(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var hr=class extends dn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Fe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ge(0,0,t,e),this.scissorTest=!1,this.viewport=new ge(0,0,t,e),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new ke({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Fe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Ri(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}};var Xe=class extends hr{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}};var ji=class extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=we,this.minFilter=we,this.wrapR=un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var ur=class extends ke{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=we,this.minFilter=we,this.wrapR=un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var me=class i{static{this.prototype.isMatrix4=!0}constructor(t,e,n,s,r,o,a,c,l,d,_,u,m,x,A,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l,d,_,u,m,x,A,g)}set(t,e,n,s,r,o,a,c,l,d,_,u,m,x,A,g){let f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=c,f[2]=l,f[6]=d,f[10]=_,f[14]=u,f[3]=m,f[7]=x,f[11]=A,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/fi.setFromMatrixColumn(t,0).length(),r=1/fi.setFromMatrixColumn(t,1).length(),o=1/fi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),d=Math.cos(r),_=Math.sin(r);if(t.order===`XYZ`){let u=o*d,m=o*_,x=a*d,A=a*_;e[0]=c*d,e[4]=-c*_,e[8]=l,e[1]=m+x*l,e[5]=u-A*l,e[9]=-a*c,e[2]=A-u*l,e[6]=x+m*l,e[10]=o*c}else if(t.order===`YXZ`){let u=c*d,m=c*_,x=l*d,A=l*_;e[0]=u+A*a,e[4]=x*a-m,e[8]=o*l,e[1]=o*_,e[5]=o*d,e[9]=-a,e[2]=m*a-x,e[6]=A+u*a,e[10]=o*c}else if(t.order===`ZXY`){let u=c*d,m=c*_,x=l*d,A=l*_;e[0]=u-A*a,e[4]=-o*_,e[8]=x+m*a,e[1]=m+x*a,e[5]=o*d,e[9]=A-u*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order===`ZYX`){let u=o*d,m=o*_,x=a*d,A=a*_;e[0]=c*d,e[4]=x*l-m,e[8]=u*l+A,e[1]=c*_,e[5]=A*l+u,e[9]=m*l-x,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order===`YZX`){let u=o*c,m=o*l,x=a*c,A=a*l;e[0]=c*d,e[4]=A-u*_,e[8]=x*_+m,e[1]=_,e[5]=o*d,e[9]=-a*d,e[2]=-l*d,e[6]=m*_+x,e[10]=u-A*_}else if(t.order===`XZY`){let u=o*c,m=o*l,x=a*c,A=a*l;e[0]=c*d,e[4]=-_,e[8]=l*d,e[1]=u*_+A,e[5]=o*d,e[9]=m*_-x,e[2]=x*_-m,e[6]=a*d,e[10]=A*_+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(ph,t,mh)}lookAt(t,e,n){let s=this.elements;return Ve.subVectors(t,e),Ve.lengthSq()===0&&(Ve.z=1),Ve.normalize(),Ln.crossVectors(n,Ve),Ln.lengthSq()===0&&(Math.abs(n.z)===1?Ve.x+=1e-4:Ve.z+=1e-4,Ve.normalize(),Ln.crossVectors(n,Ve)),Ln.normalize(),Rs.crossVectors(Ve,Ln),s[0]=Ln.x,s[4]=Rs.x,s[8]=Ve.x,s[1]=Ln.y,s[5]=Rs.y,s[9]=Ve.y,s[2]=Ln.z,s[6]=Rs.z,s[10]=Ve.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],d=n[1],_=n[5],u=n[9],m=n[13],x=n[2],A=n[6],g=n[10],f=n[14],R=n[3],F=n[7],C=n[11],N=n[15],I=s[0],y=s[4],T=s[8],Y=s[12],H=s[1],X=s[5],Q=s[9],st=s[13],B=s[2],it=s[6],at=s[10],$=s[14],dt=s[3],j=s[7],ht=s[11],ft=s[15];return r[0]=o*I+a*H+c*B+l*dt,r[4]=o*y+a*X+c*it+l*j,r[8]=o*T+a*Q+c*at+l*ht,r[12]=o*Y+a*st+c*$+l*ft,r[1]=d*I+_*H+u*B+m*dt,r[5]=d*y+_*X+u*it+m*j,r[9]=d*T+_*Q+u*at+m*ht,r[13]=d*Y+_*st+u*$+m*ft,r[2]=x*I+A*H+g*B+f*dt,r[6]=x*y+A*X+g*it+f*j,r[10]=x*T+A*Q+g*at+f*ht,r[14]=x*Y+A*st+g*$+f*ft,r[3]=R*I+F*H+C*B+N*dt,r[7]=R*y+F*X+C*it+N*j,r[11]=R*T+F*Q+C*at+N*ht,r[15]=R*Y+F*st+C*$+N*ft,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],c=t[9],l=t[13],d=t[2],_=t[6],u=t[10],m=t[14],x=t[3],A=t[7],g=t[11],f=t[15],R=c*m-l*u,F=a*m-l*_,C=a*u-c*_,N=o*m-l*d,I=o*u-c*d,y=o*_-a*d;return e*(A*R-g*F+f*C)-n*(x*R-g*N+f*I)+s*(x*F-A*N+f*y)-r*(x*C-A*I+g*y)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],o=t[5],a=t[9],c=t[2],l=t[6],d=t[10];return e*(o*d-a*l)-n*(r*d-a*c)+s*(r*l-o*c)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],d=t[8],_=t[9],u=t[10],m=t[11],x=t[12],A=t[13],g=t[14],f=t[15],R=e*a-n*o,F=e*c-s*o,C=e*l-r*o,N=n*c-s*a,I=n*l-r*a,y=s*l-r*c,T=d*A-_*x,Y=d*g-u*x,H=d*f-m*x,X=_*g-u*A,Q=_*f-m*A,st=u*f-m*g,B=R*st-F*Q+C*X+N*H-I*Y+y*T;if(B===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let it=1/B;return t[0]=(a*st-c*Q+l*X)*it,t[1]=(s*Q-n*st-r*X)*it,t[2]=(A*y-g*I+f*N)*it,t[3]=(u*I-_*y-m*N)*it,t[4]=(c*H-o*st-l*Y)*it,t[5]=(e*st-s*H+r*Y)*it,t[6]=(g*C-x*y-f*F)*it,t[7]=(d*y-u*C+m*F)*it,t[8]=(o*Q-a*H+l*T)*it,t[9]=(n*H-e*Q-r*T)*it,t[10]=(x*I-A*C+f*R)*it,t[11]=(_*C-d*I-m*R)*it,t[12]=(a*Y-o*X-c*T)*it,t[13]=(e*X-n*Y+s*T)*it,t[14]=(A*F-x*N-g*R)*it,t[15]=(d*N-_*F+u*R)*it,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,l=r*o,d=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,d*a+n,d*c-s*o,0,l*c-s*a,d*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,l=r+r,d=o+o,_=a+a,u=r*l,m=r*d,x=r*_,A=o*d,g=o*_,f=a*_,R=c*l,F=c*d,C=c*_,N=n.x,I=n.y,y=n.z;return s[0]=(1-(A+f))*N,s[1]=(m+C)*N,s[2]=(x-F)*N,s[3]=0,s[4]=(m-C)*I,s[5]=(1-(u+f))*I,s[6]=(g+R)*I,s[7]=0,s[8]=(x+F)*y,s[9]=(g-R)*y,s[10]=(1-(u+A))*y,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let o=fi.set(s[0],s[1],s[2]).length(),a=fi.set(s[4],s[5],s[6]).length(),c=fi.set(s[8],s[9],s[10]).length();r<0&&(o=-o),en.copy(this);let l=1/o,d=1/a,_=1/c;return en.elements[0]*=l,en.elements[1]*=l,en.elements[2]*=l,en.elements[4]*=d,en.elements[5]*=d,en.elements[6]*=d,en.elements[8]*=_,en.elements[9]*=_,en.elements[10]*=_,e.setFromRotationMatrix(en),n.x=o,n.y=a,n.z=c,this}makePerspective(t,e,n,s,r,o,a=$e,c=!1){let l=this.elements,d=2*r/(e-t),_=2*r/(n-s),u=(e+t)/(e-t),m=(n+s)/(n-s),x,A;if(c)x=r/(o-r),A=o*r/(o-r);else if(a===$e)x=-(o+r)/(o-r),A=-2*o*r/(o-r);else if(a===Ki)x=-o/(o-r),A=-o*r/(o-r);else throw new Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+a);return l[0]=d,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=_,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=x,l[14]=A,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=$e,c=!1){let l=this.elements,d=2/(e-t),_=2/(n-s),u=-(e+t)/(e-t),m=-(n+s)/(n-s),x,A;if(c)x=1/(o-r),A=o/(o-r);else if(a===$e)x=-2/(o-r),A=-(o+r)/(o-r);else if(a===Ki)x=-1/(o-r),A=-r/(o-r);else throw new Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+a);return l[0]=d,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=_,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=x,l[14]=A,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};var fi=new et;var en=new me;var ph=new et(0,0,0);var mh=new et(1,1,1);var Ln=new et;var Rs=new et;var Ve=new et;var cl=new me;var hl=new fn;var Bn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],d=s[9],_=s[2],u=s[6],m=s[10];switch(e){case`XYZ`:this._y=Math.asin(ie(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,l),this._z=0);break;case`YXZ`:this._x=Math.asin(-ie(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-_,r),this._z=0);break;case`ZXY`:this._x=Math.asin(ie(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-_,m),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case`ZYX`:this._y=Math.asin(-ie(_,-1,1)),Math.abs(_)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case`YZX`:this._z=Math.asin(ie(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,l),this._y=Math.atan2(-_,r)):(this._x=0,this._y=Math.atan2(a,m));break;case`XZY`:this._z=Math.asin(-ie(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-d,m),this._y=0);break;default:Wt(`Euler: .setFromRotationMatrix() encountered an unknown order: `+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return cl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(cl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return hl.setFromEuler(this),this.setFromQuaternion(hl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Bn.DEFAULT_ORDER=`XYZ`;var ts=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}};var gh=0;var ul=new et;var pi=new fn;var vn=new me;var Cs=new et;var Vi=new et;var _h=new et;var xh=new fn;var dl=new et(1,0,0);var fl=new et(0,1,0);var pl=new et(0,0,1);var ml={type:`added`};var vh={type:`removed`};var mi={type:`childadded`,child:null};var Io={type:`childremoved`,child:null};var qe=class i extends dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gh++}),this.uuid=vs(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new et,e=new Bn,n=new fn,s=new et(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new me},normalMatrix:{value:new qt}}),this.matrix=new me,this.matrixWorld=new me,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ts,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.multiply(pi),this}rotateOnWorldAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.premultiply(pi),this}rotateX(t){return this.rotateOnAxis(dl,t)}rotateY(t){return this.rotateOnAxis(fl,t)}rotateZ(t){return this.rotateOnAxis(pl,t)}translateOnAxis(t,e){return ul.copy(t).applyQuaternion(this.quaternion),this.position.add(ul.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(dl,t)}translateY(t){return this.translateOnAxis(fl,t)}translateZ(t){return this.translateOnAxis(pl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(vn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Cs.copy(t):Cs.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Vi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vn.lookAt(Vi,Cs,this.up):vn.lookAt(Cs,Vi,this.up),this.quaternion.setFromRotationMatrix(vn),s&&(vn.extractRotation(s.matrixWorld),pi.setFromRotationMatrix(vn),this.quaternion.premultiply(pi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Xt(`Object3D.add: object can't be added as a child of itself.`,t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ml),mi.child=t,this.dispatchEvent(mi),mi.child=null):Xt(`Object3D.add: object not an instance of THREE.Object3D.`,t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(vh),Io.child=t,this.dispatchEvent(Io),Io.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),vn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),vn.multiply(t.parent.matrixWorld)),t.applyMatrix4(vn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ml),mi.child=t,this.dispatchEvent(mi),mi.child=null,this}getObjectById(t){return this.getObjectByProperty(`id`,t)}getObjectByName(t){return this.getObjectByProperty(`name`,t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vi,t,_h),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vi,xh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t==`string`,n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type=`InstancedMesh`,s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type=`BatchedMesh`,s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>m(l({},a),{boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>l({},a)),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,d=c.length;l<d;l++){let _=c[l];r(t.shapes,_)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(t.materials,this.material[c]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(t.animations,c))}}if(e){let a=o(t.geometries),c=o(t.materials),l=o(t.textures),d=o(t.images),_=o(t.shapes),u=o(t.skeletons),m=o(t.animations),x=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),d.length>0&&(n.images=d),_.length>0&&(n.shapes=_),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),x.length>0&&(n.nodes=x)}return n.object=s,n;function o(a){let c=[];for(let l in a){let d=a[l];delete d.metadata,c.push(d)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};qe.DEFAULT_UP=new et(0,1,0);qe.DEFAULT_MATRIX_AUTO_UPDATE=!0;qe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ti=class extends qe{constructor(){super(),this.isGroup=!0,this.type=`Group`}};var yh={type:`move`};var Ci=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ti,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ti,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new et,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new et),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ti,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new et,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new et,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:`connected`,data:t}),this}disconnect(t){return this.dispatchEvent({type:`disconnected`,data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!==`visible-blurred`){if(l&&t.hand){o=!0;for(let A of t.hand.values()){let g=e.getJointPose(A,n),f=this._getHandJoint(l,A);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.quaternion,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}let d=l.joints[`index-finger-tip`],_=l.joints[`thumb-tip`],u=d.position.distanceTo(_.position);l.inputState.pinching&&u>.025?(l.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=.015&&(l.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.quaternion,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:`gripUpdated`,data:t,target:this})));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.quaternion,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(yh)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new ti;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}};var dc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};var Dn={h:0,s:0,l:0};var Ps={h:0,s:0,l:0};function Lo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Kt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s==`number`?this.setHex(s):typeof s==`string`&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ne.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=ne.workingColorSpace){return this.r=t,this.g=e,this.b=n,ne.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=ne.workingColorSpace){if(t=lh(t,1),e=ie(e,0,1),n=ie(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Lo(o,r,t+1/3),this.g=Lo(o,r,t),this.b=Lo(o,r,t-1/3)}return ne.colorSpaceToWorking(this,s),this}setStyle(t,e=ye){function n(r){r!==void 0&&parseFloat(r)<1&&Wt(`Color: Alpha component of `+t+` will be ignored.`)}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case`rgb`:case`rgba`:if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case`hsl`:case`hsla`:if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Wt(`Color: Unknown color model `+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);Wt(`Color: Invalid hex color `+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ye){let n=dc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Wt(`Color: Unknown color `+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=En(t.r),this.g=En(t.g),this.b=En(t.b),this}copyLinearToSRGB(t){return this.r=Ti(t.r),this.g=Ti(t.g),this.b=Ti(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ye){return ne.workingToColorSpace(Le.copy(this),t),Math.round(ie(Le.r*255,0,255))*65536+Math.round(ie(Le.g*255,0,255))*256+Math.round(ie(Le.b*255,0,255))}getHexString(t=ye){return(`000000`+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ne.workingColorSpace){ne.workingToColorSpace(Le.copy(this),e);let n=Le.r,s=Le.g,r=Le.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,l,d=(a+o)/2;if(a===o)c=0,l=0;else{let _=o-a;switch(l=d<=.5?_/(o+a):_/(2-o-a),o){case n:c=(s-r)/_+(s<r?6:0);break;case s:c=(r-n)/_+2;break;case r:c=(n-s)/_+4}c/=6}return t.h=c,t.s=l,t.l=d,t}getRGB(t,e=ne.workingColorSpace){return ne.workingToColorSpace(Le.copy(this),e),t.r=Le.r,t.g=Le.g,t.b=Le.b,t}getStyle(t=ye){ne.workingToColorSpace(Le.copy(this),t);let e=Le.r,n=Le.g,s=Le.b;return t!==ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Dn),this.setHSL(Dn.h+t,Dn.s+e,Dn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Dn),t.getHSL(Ps);let n=wo(Dn.h,Ps.h,e),s=wo(Dn.s,Ps.s,e),r=wo(Dn.l,Ps.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}};var Le=new Kt;Kt.NAMES=dc;var ei=class extends qe{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Bn,this.environmentIntensity=1,this.environmentRotation=new Bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}};var nn=new et;var yn=new et;var Do=new et;var Mn=new et;var gi=new et;var _i=new et;var gl=new et;var No=new et;var Uo=new et;var Fo=new et;var Oo=new ge;var Bo=new ge;var zo=new ge;var On=class i{constructor(t=new et,e=new et,n=new et){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),nn.subVectors(t,e),s.cross(nn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){nn.subVectors(s,e),yn.subVectors(n,e),Do.subVectors(t,e);let o=nn.dot(nn),a=nn.dot(yn),c=nn.dot(Do),l=yn.dot(yn),d=yn.dot(Do),_=o*l-a*a;if(_===0)return r.set(0,0,0),null;let u=1/_,m=(l*c-a*d)*u,x=(o*d-a*c)*u;return r.set(1-m-x,x,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Mn)===null?!1:Mn.x>=0&&Mn.y>=0&&Mn.x+Mn.y<=1}static getInterpolation(t,e,n,s,r,o,a,c){return this.getBarycoord(t,e,n,s,Mn)===null?(c.x=0,c.y=0,`z`in c&&(c.z=0),`w`in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Mn.x),c.addScaledVector(o,Mn.y),c.addScaledVector(a,Mn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,o){return Oo.setScalar(0),Bo.setScalar(0),zo.setScalar(0),Oo.fromBufferAttribute(t,e),Bo.fromBufferAttribute(t,n),zo.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Oo,r.x),o.addScaledVector(Bo,r.y),o.addScaledVector(zo,r.z),o}static isFrontFacing(t,e,n,s){return nn.subVectors(n,e),yn.subVectors(t,e),nn.cross(yn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return nn.subVectors(this.c,this.b),yn.subVectors(this.a,this.b),nn.cross(yn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;gi.subVectors(s,n),_i.subVectors(r,n),No.subVectors(t,n);let c=gi.dot(No),l=_i.dot(No);if(c<=0&&l<=0)return e.copy(n);Uo.subVectors(t,s);let d=gi.dot(Uo),_=_i.dot(Uo);if(d>=0&&_<=d)return e.copy(s);let u=c*_-d*l;if(u<=0&&c>=0&&d<=0&&c-d>0)return o=c/(c-d),e.copy(n).addScaledVector(gi,o);Fo.subVectors(t,r);let m=gi.dot(Fo),x=_i.dot(Fo);if(x>=0&&m<=x)return e.copy(r);let A=m*l-c*x;if(A<=0&&l>=0&&x<=0)return a=l/(l-x),e.copy(n).addScaledVector(_i,a);let g=d*x-m*_;if(g<=0&&_-d>=0&&m-x>=0)return gl.subVectors(r,s),a=(_-d)/(_-d+(m-x)),e.copy(s).addScaledVector(gl,a);let f=1/(g+A+u);return o=A*f,a=u*f,e.copy(n).addScaledVector(gi,o).addScaledVector(_i,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}};var zn=class{constructor(t=new et(1/0,1/0,1/0),e=new et(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(sn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(sn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=sn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,sn):sn.fromBufferAttribute(r,o),sn.applyMatrix4(t.matrixWorld),this.expandByPoint(sn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Is.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Is.copy(n.boundingBox)),Is.applyMatrix4(t.matrixWorld),this.union(Is)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,sn),sn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Wi),Ls.subVectors(this.max,Wi),xi.subVectors(t.a,Wi),vi.subVectors(t.b,Wi),yi.subVectors(t.c,Wi),Nn.subVectors(vi,xi),Un.subVectors(yi,vi),$n.subVectors(xi,yi);let e=[0,-Nn.z,Nn.y,0,-Un.z,Un.y,0,-$n.z,$n.y,Nn.z,0,-Nn.x,Un.z,0,-Un.x,$n.z,0,-$n.x,-Nn.y,Nn.x,0,-Un.y,Un.x,0,-$n.y,$n.x,0];return!ko(e,xi,vi,yi,Ls)||(e=[1,0,0,0,1,0,0,0,1],!ko(e,xi,vi,yi,Ls))?!1:(Ds.crossVectors(Nn,Un),e=[Ds.x,Ds.y,Ds.z],ko(e,xi,vi,yi,Ls))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,sn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(sn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Sn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}};var Sn=[new et,new et,new et,new et,new et,new et,new et,new et];var sn=new et;var Is=new zn;var xi=new et;var vi=new et;var yi=new et;var Nn=new et;var Un=new et;var $n=new et;var Wi=new et;var Ls=new et;var Ds=new et;var Kn=new et;function ko(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Kn.fromArray(i,r);let a=s.x*Math.abs(Kn.x)+s.y*Math.abs(Kn.y)+s.z*Math.abs(Kn.z),c=t.dot(Kn),l=e.dot(Kn),d=n.dot(Kn);if(Math.max(-Math.max(c,l,d),Math.min(c,l,d))>a)return!1}return!0}var ve=new et;var Ns=new re;var Mh=0;var ze=class extends dn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Mh++}),this.name=``,this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=oc,this.updateRanges=[],this.gpuType=an,this.version=0,this._normalizationScale=t!==void 0?wa(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ns.fromBufferAttribute(this,e),Ns.applyMatrix3(t),this.setXY(e,Ns.x,Ns.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix3(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix4(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyNormalMatrix(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.transformDirection(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):ch(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):hh(t,this.array)}};var es=class extends ze{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var ns=class extends ze{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Ue=class extends ze{constructor(t,e,n){super(new Float32Array(t),e,n)}};var Sh=new zn;var Xi=new et;var Ho=new et;var ni=class{constructor(t=new et,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Sh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Xi.subVectors(t,this.center);let e=Xi.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Xi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ho.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Xi.copy(t.center).add(Ho)),this.expandByPoint(Xi.copy(t.center).sub(Ho))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}};var bh=0;var Je=new me;var Go=new qe;var Mi=new et;var We=new zn;var qi=new zn;var Te=new et;var He=class i extends dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:bh++}),this.uuid=vs(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(oh(t)?ns:es)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new qt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Je.makeRotationFromQuaternion(t),this.applyMatrix4(Je),this}rotateX(t){return Je.makeRotationX(t),this.applyMatrix4(Je),this}rotateY(t){return Je.makeRotationY(t),this.applyMatrix4(Je),this}rotateZ(t){return Je.makeRotationZ(t),this.applyMatrix4(Je),this}translate(t,e,n){return Je.makeTranslation(t,e,n),this.applyMatrix4(Je),this}scale(t,e,n){return Je.makeScale(t,e,n),this.applyMatrix4(Je),this}lookAt(t){return Go.lookAt(t),Go.updateMatrix(),this.applyMatrix4(Go.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Mi).negate(),this.translate(Mi.x,Mi.y,Mi.z),this}setFromPoints(t){let e=this.getAttribute(`position`);if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute(`position`,new Ue(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Wt(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new zn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Xt(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new et(-1/0,-1/0,-1/0),new et(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];We.setFromBufferAttribute(r),this.morphTargetsRelative?(Te.addVectors(this.boundingBox.min,We.min),this.boundingBox.expandByPoint(Te),Te.addVectors(this.boundingBox.max,We.max),this.boundingBox.expandByPoint(Te)):(this.boundingBox.expandByPoint(We.min),this.boundingBox.expandByPoint(We.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xt(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ni);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Xt(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new et,1/0);return}if(t){let n=this.boundingSphere.center;if(We.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];qi.setFromBufferAttribute(a),this.morphTargetsRelative?(Te.addVectors(We.min,qi.min),We.expandByPoint(Te),Te.addVectors(We.max,qi.max),We.expandByPoint(Te)):(We.expandByPoint(qi.min),We.expandByPoint(qi.max))}We.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Te.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Te));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],c=this.morphTargetsRelative;for(let l=0,d=a.count;l<d;l++)Te.fromBufferAttribute(a,l),c&&(Mi.fromBufferAttribute(t,l),Te.add(Mi)),s=Math.max(s,n.distanceToSquared(Te))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Xt(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Xt(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=e.position,s=e.normal,r=e.uv,o=this.getAttribute(`tangent`);(o===void 0||o.count!==n.count)&&(o=new ze(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,o));let a=[],c=[],l=new Uint8Array(n.count);for(let Y=0;Y<n.count;Y++)a[Y]=new et,c[Y]=new et;let d=new et,_=new et,u=new et,m=new re,x=new re,A=new re,g=new et,f=new et;function R(Y,H,X){l[Y]=l[H]=l[X]=1,d.fromBufferAttribute(n,Y),_.fromBufferAttribute(n,H),u.fromBufferAttribute(n,X),m.fromBufferAttribute(r,Y),x.fromBufferAttribute(r,H),A.fromBufferAttribute(r,X),_.sub(d),u.sub(d),x.sub(m),A.sub(m);let Q=1/(x.x*A.y-A.x*x.y);isFinite(Q)&&(g.copy(_).multiplyScalar(A.y).addScaledVector(u,-x.y).multiplyScalar(Q),f.copy(u).multiplyScalar(x.x).addScaledVector(_,-A.x).multiplyScalar(Q),a[Y].add(g),a[H].add(g),a[X].add(g),c[Y].add(f),c[H].add(f),c[X].add(f))}let F=this.groups;F.length===0&&(F=[{start:0,count:t.count}]);for(let Y=0,H=F.length;Y<H;++Y){let X=F[Y],Q=X.start,st=X.count;for(let B=Q,it=Q+st;B<it;B+=3)R(t.getX(B+0),t.getX(B+1),t.getX(B+2))}let C=new et,N=new et,I=new et,y=new et;function T(Y){I.fromBufferAttribute(s,Y),y.copy(I);let H=a[Y];C.copy(H),C.sub(I.multiplyScalar(I.dot(H))).normalize(),N.crossVectors(y,H);let Q=N.dot(c[Y])<0?-1:1;o.setXYZW(Y,C.x,C.y,C.z,Q)}for(let Y=0,H=n.count;Y<H;++Y)l[Y]&&T(Y);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute(`position`);if(e!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==e.count)n=new ze(new Float32Array(e.count*3),3),this.setAttribute(`normal`,n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);let s=new et,r=new et,o=new et,a=new et,c=new et,l=new et,d=new et,_=new et;if(t)for(let u=0,m=t.count;u<m;u+=3){let x=t.getX(u+0),A=t.getX(u+1),g=t.getX(u+2);s.fromBufferAttribute(e,x),r.fromBufferAttribute(e,A),o.fromBufferAttribute(e,g),d.subVectors(o,r),_.subVectors(s,r),d.cross(_),a.fromBufferAttribute(n,x),c.fromBufferAttribute(n,A),l.fromBufferAttribute(n,g),a.add(d),c.add(d),l.add(d),n.setXYZ(x,a.x,a.y,a.z),n.setXYZ(A,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let u=0,m=e.count;u<m;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),o.fromBufferAttribute(e,u+2),d.subVectors(o,r),_.subVectors(s,r),d.cross(_),n.setXYZ(u+0,d.x,d.y,d.z),n.setXYZ(u+1,d.x,d.y,d.z),n.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Te.fromBufferAttribute(t,e),Te.normalize(),t.setXYZ(e,Te.x,Te.y,Te.z)}toNonIndexed(){function t(a,c){let l=a.array,d=a.itemSize,_=a.normalized,u=new l.constructor(c.length*d),m=0,x=0;for(let A=0,g=c.length;A<g;A++){a.isInterleavedBufferAttribute?m=c[A]*a.data.stride+a.offset:m=c[A]*d;for(let f=0;f<d;f++)u[x++]=l[m++]}return new ze(u,d,_)}if(this.index===null)return Wt(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=t(c,n);e.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let d=0,_=l.length;d<_;d++){let u=l[d],m=t(u,n);c.push(m)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let c in n){let l=n[c];t.data.attributes[c]=l.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],d=[];for(let _=0,u=l.length;_<u;_++){let m=l[_];d.push(m.toJSON(t.data))}d.length>0&&(s[c]=d,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let l in s){let d=s[l];this.setAttribute(l,d.clone(e))}let r=t.morphAttributes;for(let l in r){let d=[],_=r[l];for(let u=0,m=_.length;u<m;u++)d.push(_[u].clone(e));this.morphAttributes[l]=d}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let l=0,d=o.length;l<d;l++){let _=o[l];this.addGroup(_.start,_.count,_.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}};var Vo=new et;var Eh=new et;var Th=new qt;var rn=class{constructor(t=new et(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Vo.subVectors(n,e).cross(Eh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(Vo),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let o=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(o<0||o>1)?null:e.copy(t.start).addScaledVector(s,o)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Th.getNormalMatrix(t),s=this.coplanarPoint(Vo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}};var wh=0;var kn=class extends dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:wh++}),this.uuid=vs(),this.name=``,this.type=`Material`,this.blending=Ni,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=na,this.blendDst=ia,this.blendEquation=ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Kt(0,0,0),this.blendAlpha=0,this.depthFunc=wi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=tc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ks,this.stencilZFail=Ks,this.stencilZPass=Ks,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Wt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Wt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t==`string`;e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Kt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new rn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors==`number`?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new re().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new re().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(t){t===!0&&this.version++}};var bn=new et;var Wo=new et;var Us=new et;var Fs=new et;var is=class{constructor(t=new et,e=new et(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,bn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=bn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(bn.copy(this.origin).addScaledVector(this.direction,e),bn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Wo.copy(t).add(e).multiplyScalar(.5),Us.copy(e).sub(t).normalize(),Fs.copy(this.origin).sub(Wo);let r=t.distanceTo(e)*.5,o=-this.direction.dot(Us),a=Fs.dot(this.direction),c=-Fs.dot(Us),l=Fs.lengthSq(),d=Math.abs(1-o*o),_,u,m,x;if(d>0)if(_=o*c-a,u=o*a-c,x=r*d,_>=0)if(u>=-x)if(u<=x){let A=1/d;_*=A,u*=A,m=_*(_+o*u+2*a)+u*(o*_+u+2*c)+l}else u=r,_=Math.max(0,-(o*u+a)),m=-_*_+u*(u+2*c)+l;else u=-r,_=Math.max(0,-(o*u+a)),m=-_*_+u*(u+2*c)+l;else u<=-x?(_=Math.max(0,-(-o*r+a)),u=_>0?-r:Math.min(Math.max(-r,-c),r),m=-_*_+u*(u+2*c)+l):u<=x?(_=0,u=Math.min(Math.max(-r,-c),r),m=u*(u+2*c)+l):(_=Math.max(0,-(o*r+a)),u=_>0?r:Math.min(Math.max(-r,-c),r),m=-_*_+u*(u+2*c)+l);else u=o>0?-r:r,_=Math.max(0,-(o*u+a)),m=-_*_+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,_),s&&s.copy(Wo).addScaledVector(Us,u),m}intersectSphere(t,e){if(t.radius<0)return null;bn.subVectors(t.center,this.origin);let n=bn.dot(this.direction),s=bn.dot(bn)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,c,l=1/this.direction.x,d=1/this.direction.y,_=1/this.direction.z,u=this.origin;return l>=0?(n=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(n=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),d>=0?(r=(t.min.y-u.y)*d,o=(t.max.y-u.y)*d):(r=(t.max.y-u.y)*d,o=(t.min.y-u.y)*d),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),_>=0?(a=(t.min.z-u.z)*_,c=(t.max.z-u.z)*_):(a=(t.max.z-u.z)*_,c=(t.min.z-u.z)*_),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,bn)!==null}intersectTriangle(t,e,n,s,r){let o=this.origin,a=this.direction,c=a.x,l=a.y,d=a.z,_=t.x-o.x,u=t.y-o.y,m=t.z-o.z,x=e.x-o.x,A=e.y-o.y,g=e.z-o.z,f=n.x-o.x,R=n.y-o.y,F=n.z-o.z,C=Math.abs(c),N=Math.abs(l),I=Math.abs(d),y,T,Y,H,X,Q,st,B,it,at,$,dt;if(C>=N&&C>=I?(Y=c,Q=_,it=x,dt=f,c>=0?(y=l,T=d,H=u,X=m,st=A,B=g,at=R,$=F):(y=d,T=l,H=m,X=u,st=g,B=A,at=F,$=R)):N>=I?(Y=l,Q=u,it=A,dt=R,l>=0?(y=d,T=c,H=m,X=_,st=g,B=x,at=F,$=f):(y=c,T=d,H=_,X=m,st=x,B=g,at=f,$=F)):(Y=d,Q=m,it=g,dt=F,d>=0?(y=c,T=l,H=_,X=u,st=x,B=A,at=f,$=R):(y=l,T=c,H=u,X=_,st=A,B=x,at=R,$=f)),Y===0)return null;let j=y/Y,ht=T/Y,ft=1/Y,Rt=H-j*Q,kt=X-ht*Q,lt=st-j*it,vt=B-ht*it,Tt=at-j*dt,Pt=$-ht*dt,yt=Tt*vt-Pt*lt,Vt=Rt*Pt-kt*Tt,ue=lt*kt-vt*Rt;if(s){if(yt<0||Vt<0||ue<0)return null}else if((yt<0||Vt<0||ue<0)&&(yt>0||Vt>0||ue>0))return null;let It=yt+Vt+ue;if(It===0)return null;let nt=ft*(yt*Q+Vt*it+ue*dt);return(It>0?nt<0:nt>0)?null:this.at(nt/It,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var Pi=class extends kn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Kt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bn,this.combine=sa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var _l=new me;var Qn=new is;var Os=new ni;var xl=new et;var Bs=new et;var zs=new et;var ks=new et;var Xo=new et;var Hs=new et;var vl=new et;var Gs=new et;var Ke=class extends qe{constructor(t=new He,e=new Pi){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){Hs.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let d=a[c],_=r[c];d!==0&&(Xo.fromBufferAttribute(_,t),o?Hs.addScaledVector(Xo,d):Hs.addScaledVector(Xo.sub(e),d))}e.add(Hs)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Os.copy(n.boundingSphere),Os.applyMatrix4(r),Qn.copy(t.ray).recast(t.near),!(Os.containsPoint(Qn.origin)===!1&&(Qn.intersectSphere(Os,xl)===null||Qn.origin.distanceToSquared(xl)>(t.far-t.near)**2))&&(_l.copy(r).invert(),Qn.copy(t.ray).applyMatrix4(_l),(n.boundingBox===null||Qn.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(t,e,Qn)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,d=r.attributes.uv1,_=r.attributes.normal,u=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let x=0,A=u.length;x<A;x++){let g=u[x],f=o[g.materialIndex],R=Math.max(g.start,m.start),F=Math.min(a.count,Math.min(g.start+g.count,m.start+m.count));for(let C=R,N=F;C<N;C+=3){let I=a.getX(C),y=a.getX(C+1),T=a.getX(C+2);s=Vs(this,f,t,n,l,d,_,I,y,T),s&&(s.faceIndex=Math.floor(C/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let x=Math.max(0,m.start),A=Math.min(a.count,m.start+m.count);for(let g=x,f=A;g<f;g+=3){let R=a.getX(g),F=a.getX(g+1),C=a.getX(g+2);s=Vs(this,o,t,n,l,d,_,R,F,C),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let x=0,A=u.length;x<A;x++){let g=u[x],f=o[g.materialIndex],R=Math.max(g.start,m.start),F=Math.min(c.count,Math.min(g.start+g.count,m.start+m.count));for(let C=R,N=F;C<N;C+=3){let I=C,y=C+1,T=C+2;s=Vs(this,f,t,n,l,d,_,I,y,T),s&&(s.faceIndex=Math.floor(C/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let x=Math.max(0,m.start),A=Math.min(c.count,m.start+m.count);for(let g=x,f=A;g<f;g+=3){let R=g,F=g+1,C=g+2;s=Vs(this,o,t,n,l,d,_,R,F,C),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function Ah(i,t,e,n,s,r,o,a){let c;if(t.side===Oe?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,t.side===Wn,a),c===null)return null;Gs.copy(a),Gs.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(Gs);return l<e.near||l>e.far?null:{distance:l,point:Gs.clone(),object:i}}function Vs(i,t,e,n,s,r,o,a,c,l){i.getVertexPosition(a,Bs),i.getVertexPosition(c,zs),i.getVertexPosition(l,ks);let d=Ah(i,t,e,n,Bs,zs,ks,vl);if(d){let _=new et;On.getBarycoord(vl,Bs,zs,ks,_),s&&(d.uv=On.getInterpolatedAttribute(s,a,c,l,_,new re)),r&&(d.uv1=On.getInterpolatedAttribute(r,a,c,l,_,new re)),o&&(d.normal=On.getInterpolatedAttribute(o,a,c,l,_,new et),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));let u={a,b:c,c:l,normal:new et,materialIndex:0};On.getNormal(Bs,zs,ks,u.normal),d.face=u,d.barycoord=_}return d}var dr=class extends ke{constructor(t=null,e=1,n=1,s,r,o,a,c,l=we,d=we,_,u){super(null,o,a,c,l,d,s,r,_,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var jn=new ni;var Rh=new re(.5,.5);var Ws=new et;var ii=class{constructor(t=new rn,e=new rn,n=new rn,s=new rn,r=new rn,o=new rn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=$e,n=!1){let s=this.planes,r=t.elements,o=r[0],a=r[1],c=r[2],l=r[3],d=r[4],_=r[5],u=r[6],m=r[7],x=r[8],A=r[9],g=r[10],f=r[11],R=r[12],F=r[13],C=r[14],N=r[15];if(s[0].setComponents(l-o,m-d,f-x,N-R).normalize(),s[1].setComponents(l+o,m+d,f+x,N+R).normalize(),s[2].setComponents(l+a,m+_,f+A,N+F).normalize(),s[3].setComponents(l-a,m-_,f-A,N-F).normalize(),n)s[4].setComponents(c,u,g,C).normalize(),s[5].setComponents(l-c,m-u,f-g,N-C).normalize();else if(s[4].setComponents(l-c,m-u,f-g,N-C).normalize(),e===$e)s[5].setComponents(l+c,m+u,f+g,N+C).normalize();else if(e===Ki)s[5].setComponents(c,u,g,C).normalize();else throw new Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),jn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),jn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(jn)}intersectsSprite(t){jn.center.set(0,0,0);return jn.radius=.7071067811865476+Rh.distanceTo(t.center),jn.applyMatrix4(t.matrixWorld),this.intersectsSphere(jn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Ws.x=s.normal.x>0?t.max.x:t.min.x,Ws.y=s.normal.y>0?t.max.y:t.min.y,Ws.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ws)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var yl=new me;var fr=class i{constructor(){this.coordinateSystem=$e,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let s=0;s<e.length;s++){let r=e[s];yl.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new ii),n[s].setFromProjectionMatrix(yl,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let s=0;s<t._count;s++)e[s]===void 0&&(e[s]=new ii),e[s].copy(n[s]);return this._count=t._count,this}clone(){return new i().copy(this)}};var pr=class extends kn{constructor(t){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new Kt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}};var Ml=new me;var $o=new is;var Xs=new ni;var qs=new et;var si=class extends qe{constructor(t=new He,e=new pr){super(),this.isPoints=!0,this.type=`Points`,this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Xs.copy(n.boundingSphere),Xs.applyMatrix4(s),Xs.radius+=r,t.ray.intersectsSphere(Xs)===!1)return;Ml.copy(s).invert(),$o.copy(t.ray).applyMatrix4(Ml);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,_=n.attributes.position;if(l!==null){let u=Math.max(0,o.start),m=Math.min(l.count,o.start+o.count);for(let x=u,A=m;x<A;x++){let g=l.getX(x);qs.fromBufferAttribute(_,g),Sl(qs,g,c,s,t,e,this)}}else{let u=Math.max(0,o.start),m=Math.min(_.count,o.start+o.count);for(let x=u,A=m;x<A;x++)qs.fromBufferAttribute(_,x),Sl(qs,x,c,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Sl(i,t,e,n,s,r,o){let a=$o.distanceSqToPoint(i);if(a<e){let c=new et;$o.closestPointToPoint(i,c),c.applyMatrix4(n);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ss=class extends ke{constructor(t=[],e=li,n,s,r,o,a,c,l,d){super(t,e,n,s,r,o,a,c,l,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var wn=class extends ke{constructor(t,e,n=on,s,r,o,a=we,c=we,l,d=Tn,_=1){if(d!==Tn&&d!==Rn)throw new Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:t,height:e,depth:_},s,r,o,a,c,d,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ri(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}};var rs=class extends wn{constructor(t,e=on,n=li,s,r,o=we,a=we,c,l=Tn){let d={width:t,height:t,depth:1},_=[d,d,d,d,d,d];super(t,t,e,n,s,r,o,a,c,l),this.image=_,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}};var os=class extends ke{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}};var Ii=class i extends He{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type=`BoxGeometry`,this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],d=[],_=[],u=0,m=0;x(`z`,`y`,`x`,-1,-1,n,e,t,o,r,0),x(`z`,`y`,`x`,1,-1,n,e,-t,o,r,1),x(`x`,`z`,`y`,1,1,t,n,e,s,o,2),x(`x`,`z`,`y`,1,-1,t,n,-e,s,o,3),x(`x`,`y`,`z`,1,-1,t,e,n,s,r,4),x(`x`,`y`,`z`,-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute(`position`,new Ue(l,3)),this.setAttribute(`normal`,new Ue(d,3)),this.setAttribute(`uv`,new Ue(_,2));function x(A,g,f,R,F,C,N,I,y,T,Y){let H=C/y,X=N/T,Q=C/2,st=N/2,B=I/2,it=y+1,at=T+1,$=0,dt=0,j=new et;for(let ht=0;ht<at;ht++){let ft=ht*X-st;for(let Rt=0;Rt<it;Rt++)j[A]=(Rt*H-Q)*R,j[g]=ft*F,j[f]=B,l.push(j.x,j.y,j.z),j[A]=0,j[g]=0,j[f]=I>0?1:-1,d.push(j.x,j.y,j.z),_.push(Rt/y),_.push(1-ht/T),$+=1}for(let ht=0;ht<T;ht++)for(let ft=0;ft<y;ft++){let Rt=u+ft+it*ht,kt=u+ft+it*(ht+1),lt=u+(ft+1)+it*(ht+1),vt=u+(ft+1)+it*ht;c.push(Rt,kt,vt),c.push(kt,lt,vt),dt+=6}a.addGroup(m,dt,Y),m+=dt,u+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var as=class i extends He{constructor(t=1,e=1,n=1,s=1){super(),this.type=`PlaneGeometry`,this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(s),l=a+1,d=c+1,_=t/a,u=e/c,m=[],x=[],A=[],g=[];for(let f=0;f<d;f++){let R=f*u-o;for(let F=0;F<l;F++){let C=F*_-r;x.push(C,-R,0),A.push(0,0,1),g.push(F/a),g.push(1-f/c)}}for(let f=0;f<c;f++)for(let R=0;R<a;R++){let F=R+l*f,C=R+l*(f+1),N=R+1+l*(f+1),I=R+1+l*f;m.push(F,C,I),m.push(C,N,I)}this.setIndex(m),this.setAttribute(`position`,new Ue(x,3)),this.setAttribute(`normal`,new Ue(A,3)),this.setAttribute(`uv`,new Ue(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var ls=class i extends He{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);let a=[],c=[],l=[],d=[],_=t,u=(e-t)/s,m=new et,x=new re;for(let A=0;A<=s;A++){for(let g=0;g<=n;g++){let f=r+g/n*o;m.x=_*Math.cos(f),m.y=_*Math.sin(f),c.push(m.x,m.y,m.z),l.push(0,0,1),x.x=(m.x/e+1)/2,x.y=(m.y/e+1)/2,d.push(x.x,x.y)}_+=u}for(let A=0;A<s;A++){let g=A*(n+1);for(let f=0;f<n;f++){let R=f+g,F=R,C=R+n+1,N=R+n+2,I=R+1;a.push(F,C,I),a.push(C,N,I)}}this.setIndex(a),this.setAttribute(`position`,new Ue(c,3)),this.setAttribute(`normal`,new Ue(l,3)),this.setAttribute(`uv`,new Ue(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};function hi(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(bl(s))s.isRenderTargetTexture?(Wt(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(bl(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function De(i){let t={};for(let e=0;e<i.length;e++){let n=hi(i[e]);for(let s in n)t[s]=n[s]}return t}function bl(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Ch(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Aa(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ne.workingColorSpace}var fc={clone:hi,merge:De};var Ph=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;var Ih=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;var Ge=class extends kn{constructor(t){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ph,this.fragmentShader=Ih,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=hi(t.uniforms),this.uniformsGroups=Ch(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:`t`,value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:`c`,value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:`v2`,value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:`v3`,value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:`v4`,value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:`m3`,value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:`m4`,value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case`t`:this.uniforms[n].value=e[s.value]||null;break;case`c`:this.uniforms[n].value=new Kt().setHex(s.value);break;case`v2`:this.uniforms[n].value=new re().fromArray(s.value);break;case`v3`:this.uniforms[n].value=new et().fromArray(s.value);break;case`v4`:this.uniforms[n].value=new ge().fromArray(s.value);break;case`m3`:this.uniforms[n].value=new qt().fromArray(s.value);break;case`m4`:this.uniforms[n].value=new me().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}};var mr=class extends Ge{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}};var gr=class extends kn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Ql,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}};var _r=class extends kn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Si(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT==`number`?new t(i):Array.prototype.slice.call(i)}function Ys(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Hn=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}};var xr=class extends Hn{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Yo,endingEnd:Yo}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Zo:r=t,a=2*e-n;break;case Jo:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Zo:o=t,c=2*n-e;break;case Jo:o=1,c=n+s[1]-s[0];break;default:o=t-1,c=e}let l=(n-e)*.5,d=this.valueSize;this._weightPrev=l/(e-a),this._weightNext=l/(c-n),this._offsetPrev=r*d,this._offsetNext=o*d}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,d=this._offsetPrev,_=this._offsetNext,u=this._weightPrev,m=this._weightNext,x=(n-e)/(s-e),A=x*x,g=A*x,f=-u*g+2*u*A-u*x,R=(1+u)*g+(-1.5-2*u)*A+(-.5+u)*x+1,F=(-1-m)*g+(1.5+m)*A+.5*x,C=m*g-m*A;for(let N=0;N!==a;++N)r[N]=f*o[d+N]+R*o[l+N]+F*o[c+N]+C*o[_+N];return r}};var vr=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,d=(n-e)/(s-e),_=1-d;for(let u=0;u!==a;++u)r[u]=o[l+u]*_+o[c+u]*d;return r}};var yr=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}};var Mr=class extends Hn{interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,d=this.inTangents,_=this.outTangents;if(!d||!_){let x=(n-e)/(s-e),A=1-x;for(let g=0;g!==a;++g)r[g]=o[l+g]*A+o[c+g]*x;return r}let u=a*2,m=t-1;for(let x=0;x!==a;++x){let A=o[l+x],g=o[c+x],f=m*u+x*2,R=_[f],F=_[f+1],C=t*u+x*2,N=d[C],I=d[C+1],y=Dh(n,e,R,N,s);r[x]=pc(y,A,F,I,g)}return r}};function pc(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function Lh(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function Dh(i,t,e,n,s){let r=(i-t)/(s-t);for(let o=0;o<8;o++){let a=pc(r,t,e,n,s)-i;if(Math.abs(a)<1e-10)break;let c=Lh(r,t,e,n,s);if(Math.abs(c)<1e-10)break;r=Math.max(0,Math.min(1,r-a/c))}return r}var Ye=class{constructor(t,e,n,s){if(t===void 0)throw new Error(`THREE.KeyframeTrack: track name is undefined`);if(e===void 0||e.length===0)throw new Error(`THREE.KeyframeTrack: no keyframes in track named `+t);this.name=t,this.times=Si(e,this.TimeBufferType),this.values=Si(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Si(t.times,Array),values:Si(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),Ys(t.settings)&&(n.settings={inTangents:Si(t.settings.inTangents,Array),outTangents:Si(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new yr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new vr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new xr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Mr(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Zi:e=this.InterpolantFactoryMethodDiscrete;break;case ar:e=this.InterpolantFactoryMethodLinear;break;case $s:e=this.InterpolantFactoryMethodSmooth;break;case qo:e=this.InterpolantFactoryMethodBezier}if(e===void 0){let n=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Wt(`KeyframeTrack:`,n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Zi;case this.InterpolantFactoryMethodLinear:return ar;case this.InterpolantFactoryMethodSmooth:return $s;case this.InterpolantFactoryMethodBezier:return qo}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t;Ys(this.settings)&&(El(this.settings.inTangents,t),El(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;Ys(this.settings)&&(Tl(this.settings.inTangents,t),Tl(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Xt(`KeyframeTrack: Invalid value size in track.`,this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Xt(`KeyframeTrack: Track is empty.`,this),t=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c==`number`&&isNaN(c)){Xt(`KeyframeTrack: Time is not a valid number.`,this,a,c),t=!1;break}if(o!==null&&o>c){Xt(`KeyframeTrack: Out of order keys.`,this,a,c,o),t=!1;break}o=c}if(s!==void 0&&ah(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){Xt(`KeyframeTrack: Value is not a valid number.`,this,a,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===$s,r=t.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=t[a];if(l!==t[a+1]&&(a!==1||l!==t[0]))if(s)c=!0;else{let _=a*n,u=_-n,m=_+n;for(let x=0;x!==n;++x){let A=e[_+x];if(A!==e[u+x]||A!==e[m+x]){c=!0;break}}}if(c){if(a!==o){t[o]=t[a];let _=a*n,u=o*n;for(let m=0;m!==n;++m)e[u+m]=e[_+m]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)e[c+l]=e[a+l];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,Ys(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function El(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]+=t}function Tl(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}Ye.prototype.ValueTypeName=``;Ye.prototype.TimeBufferType=Float32Array;Ye.prototype.ValueBufferType=Float32Array;Ye.prototype.DefaultInterpolation=ar;var Gn=class extends Ye{constructor(t,e,n){super(t,e,n)}};Gn.prototype.ValueTypeName=`bool`;Gn.prototype.ValueBufferType=Array;Gn.prototype.DefaultInterpolation=Zi;Gn.prototype.InterpolantFactoryMethodLinear=void 0;Gn.prototype.InterpolantFactoryMethodSmooth=void 0;var Sr=class extends Ye{constructor(t,e,n,s){super(t,e,n,s)}};Sr.prototype.ValueTypeName=`color`;var br=class extends Ye{constructor(t,e,n,s){super(t,e,n,s)}};br.prototype.ValueTypeName=`number`;var Er=class extends Hn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-e)/(s-e),l=t*a;for(let d=l+a;l!==d;l+=4)fn.slerpFlat(r,0,o,l-a,o,l,c);return r}};var cs=class extends Ye{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Er(this.times,this.values,this.getValueSize(),t)}};cs.prototype.ValueTypeName=`quaternion`;cs.prototype.InterpolantFactoryMethodSmooth=void 0;var Vn=class extends Ye{constructor(t,e,n){super(t,e,n)}};Vn.prototype.ValueTypeName=`string`;Vn.prototype.ValueBufferType=Array;Vn.prototype.DefaultInterpolation=Zi;Vn.prototype.InterpolantFactoryMethodLinear=void 0;Vn.prototype.InterpolantFactoryMethodSmooth=void 0;var Tr=class extends Ye{constructor(t,e,n,s){super(t,e,n,s)}};Tr.prototype.ValueTypeName=`vector`;var wr=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(d){a++,r===!1&&s.onStart!==void 0&&s.onStart(d,o,a),r=!0},this.itemEnd=function(d){o++,s.onProgress!==void 0&&s.onProgress(d,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(d){s.onError!==void 0&&s.onError(d)},this.resolveURL=function(d){return d=d.normalize(`NFC`),c?c(d):d},this.setURLModifier=function(d){return c=d,this},this.addHandler=function(d,_){return l.push(d,_),this},this.removeHandler=function(d){let _=l.indexOf(d);return _!==-1&&l.splice(_,2),this},this.getHandler=function(d){for(let _=0,u=l.length;_<u;_+=2){let m=l[_],x=l[_+1];if(m.global&&(m.lastIndex=0),m.test(d))return x}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}};var mc=new wr;var Ar=class{constructor(t){this.manager=t!==void 0?t:mc,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},this.priority=`auto`,this.cache=`default`,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};Ar.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var Zs=new et;var Js=new fn;var hn=new et;var hs=class extends qe{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new me,this.projectionMatrix=new me,this.projectionMatrixInverse=new me,this.coordinateSystem=$e,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Zs,Js,hn),hn.x===1&&hn.y===1&&hn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Zs,Js,hn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Zs,Js,hn),hn.x===1&&hn.y===1&&hn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Zs,Js,hn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var Fn=new et;var wl=new re;var Al=new re;var Re=class extends hs{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=lr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(To*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return lr*2*Math.atan(Math.tan(To*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Fn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Fn.x,Fn.y).multiplyScalar(-t/Fn.z),Fn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Fn.x,Fn.y).multiplyScalar(-t/Fn.z)}getViewSize(t,e){return this.getViewBounds(t,wl,Al),e.subVectors(Al,wl)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(To*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,e-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Rr=class extends hs{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=d*this.view.offsetY,c=a-d*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var bi=-90;var Ei=1;var Li=class extends qe{constructor(t,e,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Re(bi,Ei,t,e);s.layers=this.layers,this.add(s);let r=new Re(bi,Ei,t,e);r.layers=this.layers,this.add(r);let o=new Re(bi,Ei,t,e);o.layers=this.layers,this.add(o);let a=new Re(bi,Ei,t,e);a.layers=this.layers,this.add(a);let c=new Re(bi,Ei,t,e);c.layers=this.layers,this.add(c);let l=new Re(bi,Ei,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,c]=e;for(let l of e)this.remove(l);if(t===$e)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ki)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+t);for(let l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,d]=this.children,_=t.getRenderTarget(),u=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),x=t.xr.enabled;t.xr.enabled=!1;let A=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.mipmapsAutoUpdate=A,t.setRenderTarget(n,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,d),t.setRenderTarget(_,u,m),t.xr.enabled=x,n.texture.needsPMREMUpdate=!0}};var Cr=class extends Re{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}};var Ra=`\\[\\]\\.:\\/`;var Nh=new RegExp(`[`+Ra+`]`,`g`);var Ca=`[^`+Ra+`]`;var Uh=`[^`+Ra.replace(`\\.`,``)+`]`;var Fh=/((?:WC+[\/:])*)/.source.replace(`WC`,Ca);var Oh=/(WCOD+)?/.source.replace(`WCOD`,Uh);var Bh=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace(`WC`,Ca);var zh=/\.(WC+)(?:\[(.+)\])?/.source.replace(`WC`,Ca);var kh=new RegExp(`^`+Fh+Oh+Bh+zh+`$`);var Hh=[`material`,`materials`,`bones`,`map`];var Ko=class{constructor(t,e,n){let s=n||fe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}};var fe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,`_`).replace(Nh,``)}static parseTrackName(t){let e=kh.exec(t);if(e===null)throw new Error(`THREE.PropertyBinding: Cannot parse trackName: `+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Hh.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+t);return n}static findNode(t,e){if(e===void 0||e===``||e===`.`||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let c=n(a.children);if(c)return c}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Wt(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(n){let l=e.objectIndex;switch(n){case`materials`:if(!t.material){Xt(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){Xt(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){Xt(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let d=0;d<t.length;d++)if(t[d].name===l){l=d;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){Xt(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){Xt(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[n]===void 0){Xt(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Xt(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[l]}}let o=t[s];if(o===void 0){let l=e.nodeName;Xt(`PropertyBinding: Trying to update property for track: `+l+`.`+s+` but it wasn't found.`,t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s===`morphTargetInfluences`){if(!t.geometry){Xt(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){Xt(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};fe.Composite=Ko;fe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};fe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};fe.prototype.GetterByBindingType=[fe.prototype._getValue_direct,fe.prototype._getValue_array,fe.prototype._getValue_arrayElement,fe.prototype._getValue_toArray];fe.prototype.SetterByBindingTypeAndVersioning=[[fe.prototype._setValue_direct,fe.prototype._setValue_direct_setNeedsUpdate,fe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[fe.prototype._setValue_array,fe.prototype._setValue_array_setNeedsUpdate,fe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[fe.prototype._setValue_arrayElement,fe.prototype._setValue_arrayElement_setNeedsUpdate,fe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[fe.prototype._setValue_fromArray,fe.prototype._setValue_fromArray_setNeedsUpdate,fe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Qo=class{static{this.prototype.isMatrix2=!0}constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};function Pa(i,t,e,n){let s=Gh(n);switch(e){case _a:return i*t;case va:return i*t/s.components*s.byteLength;case Fr:return i*t/s.components*s.byteLength;case Xn:return i*t*2/s.components*s.byteLength;case Or:return i*t*2/s.components*s.byteLength;case xa:return i*t*3/s.components*s.byteLength;case cn:return i*t*4/s.components*s.byteLength;case Br:return i*t*4/s.components*s.byteLength;case fs:case ps:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ms:case gs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case kr:case Gr:return Math.max(i,16)*Math.max(t,8)/4;case zr:case Hr:return Math.max(i,8)*Math.max(t,8)/2;case Vr:case Wr:case qr:case Yr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Xr:case _s:case Zr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Jr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case $r:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Kr:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Qr:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case jr:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case to:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case eo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case no:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case io:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case so:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ro:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case oo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ao:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case lo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case co:case ho:case uo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case fo:case po:return Math.ceil(i/4)*Math.ceil(t/4)*8;case xs:case mo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Gh(i){switch(i){case Ze:case fa:return{byteLength:1,components:1};case Fi:case pa:case ln:return{byteLength:2,components:1};case Nr:case Ur:return{byteLength:2,components:4};case on:case Dr:case an:return{byteLength:4,components:1};case ma:case ga:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}}));typeof window<`u`&&(window.__THREE__?Wt(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Oc(){let i=null,t=!1,e=null,n=null;function s(r,o){n=i.requestAnimationFrame(s),e(r,o)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Wh(i){let t=new WeakMap;function e(a,c){let l=a.array,d=a.usage,_=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,d),a.onUploadCallback();let m;if(l instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<`u`&&l instanceof Float16Array)m=i.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=i.SHORT;else if(l instanceof Uint32Array)m=i.UNSIGNED_INT;else if(l instanceof Int32Array)m=i.INT;else if(l instanceof Int8Array)m=i.BYTE;else if(l instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+l);return{buffer:u,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:_}}function n(a,c,l){let d=c.array,_=c.updateRanges;if(i.bindBuffer(l,a),_.length===0)i.bufferSubData(l,0,d);else{_.sort((m,x)=>m.start-x.start);let u=0;for(let m=1;m<_.length;m++){let x=_[u],A=_[m];A.start<=x.start+x.count+1?x.count=Math.max(x.count,A.start+A.count-x.start):(++u,_[u]=A)}_.length=u+1;for(let m=0,x=_.length;m<x;m++){let A=_[m];i.bufferSubData(l,A.start*d.BYTES_PER_ELEMENT,d,A.start,A.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let d=t.get(a);(!d||d.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var jt={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`};var At={common:{diffuse:{value:new Kt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qt}},envmap:{envMap:{value:null},envMapRotation:{value:new qt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qt},normalScale:{value:new re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Kt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Kt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0},uvTransform:{value:new qt}},sprite:{diffuse:{value:new Kt(16777215)},opacity:{value:1},center:{value:new re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}}};var gn={basic:{uniforms:De([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.fog]),vertexShader:jt.meshbasic_vert,fragmentShader:jt.meshbasic_frag},lambert:{uniforms:De([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.fog,At.lights,{emissive:{value:new Kt(0)},envMapIntensity:{value:1}}]),vertexShader:jt.meshlambert_vert,fragmentShader:jt.meshlambert_frag},phong:{uniforms:De([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.fog,At.lights,{emissive:{value:new Kt(0)},specular:{value:new Kt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:jt.meshphong_vert,fragmentShader:jt.meshphong_frag},standard:{uniforms:De([At.common,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.roughnessmap,At.metalnessmap,At.fog,At.lights,{emissive:{value:new Kt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag},toon:{uniforms:De([At.common,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.gradientmap,At.fog,At.lights,{emissive:{value:new Kt(0)}}]),vertexShader:jt.meshtoon_vert,fragmentShader:jt.meshtoon_frag},matcap:{uniforms:De([At.common,At.bumpmap,At.normalmap,At.displacementmap,At.fog,{matcap:{value:null}}]),vertexShader:jt.meshmatcap_vert,fragmentShader:jt.meshmatcap_frag},points:{uniforms:De([At.points,At.fog]),vertexShader:jt.points_vert,fragmentShader:jt.points_frag},dashed:{uniforms:De([At.common,At.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:jt.linedashed_vert,fragmentShader:jt.linedashed_frag},depth:{uniforms:De([At.common,At.displacementmap]),vertexShader:jt.depth_vert,fragmentShader:jt.depth_frag},normal:{uniforms:De([At.common,At.bumpmap,At.normalmap,At.displacementmap,{opacity:{value:1}}]),vertexShader:jt.meshnormal_vert,fragmentShader:jt.meshnormal_frag},sprite:{uniforms:De([At.sprite,At.fog]),vertexShader:jt.sprite_vert,fragmentShader:jt.sprite_frag},background:{uniforms:{uvTransform:{value:new qt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:jt.background_vert,fragmentShader:jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qt}},vertexShader:jt.backgroundCube_vert,fragmentShader:jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:jt.cube_vert,fragmentShader:jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:jt.equirect_vert,fragmentShader:jt.equirect_frag},distance:{uniforms:De([At.common,At.displacementmap,{referencePosition:{value:new et},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:jt.distance_vert,fragmentShader:jt.distance_frag},shadow:{uniforms:De([At.lights,At.fog,{color:{value:new Kt(0)},opacity:{value:1}}]),vertexShader:jt.shadow_vert,fragmentShader:jt.shadow_frag}};gn.physical={uniforms:De([gn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qt},clearcoatNormalScale:{value:new re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new qt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qt},sheen:{value:0},sheenColor:{value:new Kt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qt},transmissionSamplerSize:{value:new re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qt},attenuationDistance:{value:0},attenuationColor:{value:new Kt(0)},specularColor:{value:new Kt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qt},anisotropyVector:{value:new re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qt}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag};var go={r:0,b:0,g:0};var Tf=new me;var Bc=new qt;Bc.set(-1,0,0,0,1,0,0,0,1);function wf(i,t,e,n,s,r){let o=new Kt(0),a=s===!0?0:1,c,l,d=null,_=0,u=null;function m(R){let F=R.isScene===!0?R.background:null;if(F&&F.isTexture){let C=R.backgroundBlurriness>0;F=t.get(F,C)}return F}function x(R){let F=!1,C=m(R);C===null?g(o,a):C&&C.isColor&&(g(C,1),F=!0);let N=i.xr.getEnvironmentBlendMode();N===`additive`?e.buffers.color.setClear(0,0,0,1,r):N===`alpha-blend`&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||F)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function A(R,F){let C=m(F);C&&C.isCubeTexture?(l===void 0&&(l=new Ke(new Ii(1,1,1),new Ge({name:`BackgroundCubeMaterial`,uniforms:hi(gn.backgroundCube.uniforms),vertexShader:gn.backgroundCube.vertexShader,fragmentShader:gn.backgroundCube.fragmentShader,side:Oe,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(N,I,y){this.matrixWorld.copyPosition(y.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=C,l.material.uniforms.backgroundBlurriness.value=F.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Tf.makeRotationFromEuler(F.backgroundRotation)).transpose(),C.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Bc),l.material.toneMapped=ne.getTransfer(C.colorSpace)!==le,(d!==C||_!==C.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,d=C,_=C.version,u=i.toneMapping),l.layers.enableAll(),R.unshift(l,l.geometry,l.material,0,0,null)):C&&C.isTexture&&(c===void 0&&(c=new Ke(new as(2,2),new Ge({name:`BackgroundMaterial`,uniforms:hi(gn.background.uniforms),vertexShader:gn.background.vertexShader,fragmentShader:gn.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=C,c.material.uniforms.backgroundIntensity.value=F.backgroundIntensity,c.material.toneMapped=ne.getTransfer(C.colorSpace)!==le,C.matrixAutoUpdate===!0&&C.updateMatrix(),c.material.uniforms.uvTransform.value.copy(C.matrix),(d!==C||_!==C.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,d=C,_=C.version,u=i.toneMapping),c.layers.enableAll(),R.unshift(c,c.geometry,c.material,0,0,null))}function g(R,F){R.getRGB(go,Aa(i)),e.buffers.color.setClear(go.r,go.g,go.b,F,r)}function f(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(R,F=1){o.set(R),a=F,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(R){a=R,g(o,a)},render:x,addToRenderList:A,dispose:f}}function Af(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,o=!1;function a(X,Q,st,B,it){let at=!1,$=_(X,B,st,Q);r!==$&&(r=$,l(r.object)),at=m(X,B,st,it),at&&x(X,B,st,it),it!==null&&t.update(it,i.ELEMENT_ARRAY_BUFFER),(at||o)&&(o=!1,C(X,Q,st,B),it!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(it).buffer))}function c(){return i.createVertexArray()}function l(X){return i.bindVertexArray(X)}function d(X){return i.deleteVertexArray(X)}function _(X,Q,st,B){let it=B.wireframe===!0,at=n[Q.id];at===void 0&&(at={},n[Q.id]=at);let $=X.isInstancedMesh===!0?X.id:0,dt=at[$];dt===void 0&&(dt={},at[$]=dt);let j=dt[st.id];j===void 0&&(j={},dt[st.id]=j);let ht=j[it];return ht===void 0&&(ht=u(c()),j[it]=ht),ht}function u(X){let Q=[],st=[],B=[];for(let it=0;it<e;it++)Q[it]=0,st[it]=0,B[it]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Q,enabledAttributes:st,attributeDivisors:B,object:X,attributes:{},index:null}}function m(X,Q,st,B){let it=r.attributes,at=Q.attributes,$=0,dt=st.getAttributes();for(let j in dt)if(dt[j].location>=0){let ft=it[j],Rt=at[j];if(Rt===void 0&&(j===`instanceMatrix`&&X.instanceMatrix&&(Rt=X.instanceMatrix),j===`instanceColor`&&X.instanceColor&&(Rt=X.instanceColor)),ft===void 0||ft.attribute!==Rt||Rt&&ft.data!==Rt.data)return!0;$++}return r.attributesNum!==$||r.index!==B}function x(X,Q,st,B){let it={},at=Q.attributes,$=0,dt=st.getAttributes();for(let j in dt)if(dt[j].location>=0){let ft=at[j];ft===void 0&&(j===`instanceMatrix`&&X.instanceMatrix&&(ft=X.instanceMatrix),j===`instanceColor`&&X.instanceColor&&(ft=X.instanceColor));let Rt={};Rt.attribute=ft,ft&&ft.data&&(Rt.data=ft.data),it[j]=Rt,$++}r.attributes=it,r.attributesNum=$,r.index=B}function A(){let X=r.newAttributes;for(let Q=0,st=X.length;Q<st;Q++)X[Q]=0}function g(X){f(X,0)}function f(X,Q){let st=r.newAttributes,B=r.enabledAttributes,it=r.attributeDivisors;st[X]=1,B[X]===0&&(i.enableVertexAttribArray(X),B[X]=1),it[X]!==Q&&(i.vertexAttribDivisor(X,Q),it[X]=Q)}function R(){let X=r.newAttributes,Q=r.enabledAttributes;for(let st=0,B=Q.length;st<B;st++)Q[st]!==X[st]&&(i.disableVertexAttribArray(st),Q[st]=0)}function F(X,Q,st,B,it,at,$){$===!0?i.vertexAttribIPointer(X,Q,st,it,at):i.vertexAttribPointer(X,Q,st,B,it,at)}function C(X,Q,st,B){A();let it=B.attributes,at=st.getAttributes(),$=Q.defaultAttributeValues;for(let dt in at){let j=at[dt];if(j.location>=0){let ht=it[dt];if(ht===void 0&&(dt===`instanceMatrix`&&X.instanceMatrix&&(ht=X.instanceMatrix),dt===`instanceColor`&&X.instanceColor&&(ht=X.instanceColor)),ht!==void 0){let ft=ht.normalized,Rt=ht.itemSize,kt=t.get(ht);if(kt===void 0)continue;let lt=kt.buffer,vt=kt.type,Tt=kt.bytesPerElement,Pt=vt===i.INT||vt===i.UNSIGNED_INT||ht.gpuType===Dr;if(ht.isInterleavedBufferAttribute){let yt=ht.data,Vt=yt.isInterleavedBuffer===!0?yt.stride:yt.itemSize,ue=ht.offset;if(yt.isInstancedInterleavedBuffer||yt.isInstancedBufferAttribute){for(let It=0;It<j.locationSize;It++)f(j.location+It,yt.meshPerAttribute);X.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=yt.meshPerAttribute*yt.count)}else for(let It=0;It<j.locationSize;It++)g(j.location+It);i.bindBuffer(i.ARRAY_BUFFER,lt);for(let It=0;It<j.locationSize;It++)F(j.location+It,Rt/j.locationSize,vt,ft,Vt*Tt,(ue+Rt/j.locationSize*It)*Tt,Pt)}else{if(ht.isInstancedBufferAttribute){for(let yt=0;yt<j.locationSize;yt++)f(j.location+yt,ht.meshPerAttribute);X.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let yt=0;yt<j.locationSize;yt++)g(j.location+yt);i.bindBuffer(i.ARRAY_BUFFER,lt);for(let yt=0;yt<j.locationSize;yt++)F(j.location+yt,Rt/j.locationSize,vt,ft,Rt*Tt,Rt/j.locationSize*yt*Tt,Pt)}}else if($!==void 0){let ft=$[dt];if(ft!==void 0)switch(ft.length){case 2:i.vertexAttrib2fv(j.location,ft);break;case 3:i.vertexAttrib3fv(j.location,ft);break;case 4:i.vertexAttrib4fv(j.location,ft);break;default:i.vertexAttrib1fv(j.location,ft)}}}}R()}function N(){Y();for(let X in n){let Q=n[X];for(let st in Q){let B=Q[st];for(let it in B){let at=B[it];for(let $ in at)d(at[$].object),delete at[$];delete B[it]}}delete n[X]}}function I(X){if(n[X.id]===void 0)return;let Q=n[X.id];for(let st in Q){let B=Q[st];for(let it in B){let at=B[it];for(let $ in at)d(at[$].object),delete at[$];delete B[it]}}delete n[X.id]}function y(X){for(let Q in n){let st=n[Q];for(let B in st){let it=st[B];if(it[X.id]===void 0)continue;let at=it[X.id];for(let $ in at)d(at[$].object),delete at[$];delete it[X.id]}}}function T(X){for(let Q in n){let st=n[Q],B=X.isInstancedMesh===!0?X.id:0,it=st[B];if(it!==void 0){for(let at in it){let $=it[at];for(let dt in $)d($[dt].object),delete $[dt];delete it[at]}delete st[B],Object.keys(st).length===0&&delete n[Q]}}}function Y(){H(),o=!0,r!==s&&(r=s,l(r.object))}function H(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:Y,resetDefaultState:H,dispose:N,releaseStatesOfGeometry:I,releaseStatesOfObject:T,releaseStatesOfProgram:y,initAttributes:A,enableAttribute:g,disableUnusedAttributes:R}}function Rf(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function o(c,l,d){d!==0&&(i.drawArraysInstanced(n,c,l,d),e.update(l,n,d))}function a(c,l,d){if(d===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(n,c,0,l,0,d);let u=0;for(let m=0;m<d;m++)u+=l[m];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function Cf(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let y=t.get(`EXT_texture_filter_anisotropic`);s=i.getParameter(y.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(y){return!(y!==cn&&n.convert(y)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(y){let T=y===ln&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(y!==Ze&&y!==an&&!T&&n.convert(y)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(y){if(y===`highp`){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return`highp`;y=`mediump`}return y===`mediump`&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=e.precision!==void 0?e.precision:`highp`,d=c(l);d!==l&&(Wt(`WebGLRenderer:`,l,`not supported, using`,d,`instead.`),l=d);let _=e.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),u=e.logarithmicDepthBuffer===!0&&_===!1;e.reversedDepthBuffer===!0&&_===!1&&Wt(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),e.logarithmicDepthBuffer===!0&&_===!0&&Wt(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),A=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),R=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),F=i.getParameter(i.MAX_VARYING_VECTORS),C=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),N=i.getParameter(i.MAX_SAMPLES),I=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:_,maxTextures:m,maxVertexTextures:x,maxTextureSize:A,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:R,maxVaryings:F,maxFragmentUniforms:C,maxSamples:N,samples:I}}function Pf(i){let t=this,e=null,n=0,s=!1,r=!1,o=new rn,a=new qt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(_,u){let m=_.length!==0||u||n!==0||s;return s=u,n=_.length,m},this.beginShadows=function(){r=!0,d(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(_,u){e=d(_,u,0)},this.setState=function(_,u,m){let x=_.clippingPlanes,A=_.clipIntersection,g=_.clipShadows,f=i.get(_);if(!s||x===null||x.length===0||r&&!g)r?d(null):l();else{let R=r?0:n,F=R*4,C=f.clippingState||null;c.value=C,C=d(x,u,F,m);for(let N=0;N!==F;++N)C[N]=e[N];f.clippingState=C,this.numIntersection=A?this.numPlanes:0,this.numPlanes+=R}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function d(_,u,m,x){let A=_!==null?_.length:0,g=null;if(A!==0){if(g=c.value,x!==!0||g===null){let f=m+A*4,R=u.matrixWorldInverse;a.getNormalMatrix(R),(g===null||g.length<f)&&(g=new Float32Array(f));for(let F=0,C=m;F!==A;++F,C+=4)o.copy(_[F]).applyMatrix4(R,a),o.normal.toArray(g,C),g[C+3]=o.constant}c.value=g,c.needsUpdate=!0}return t.numPlanes=A,t.numIntersection=0,g}}var Ss=class extends Xe{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new ss(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ii(5,5,5),r=new Ge({name:`CubemapFromEquirect`,uniforms:hi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Oe,blending:ri});r.uniforms.tEquirect.value=e;let o=new Ke(s,r),a=e.minFilter;return e.minFilter===An&&(e.minFilter=Fe),new Li(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}};var gc=256;var If=3;var Lf=20;var zc=256;var kc=16;var Df=3;var Nf=new et;var Uf=new Kt;var xo=class i{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Li(1,10,null),this._boxMesh=new Ke(new Ii(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:o=256,position:a=Nf}=r,c=this._renderer;this._setSize(o);let l=this._allocateTarget(),d=this._getSourceTarget(!0);e>0&&(d.texture.mipmapsAutoUpdate=!1);let _=c.autoClear,u=c.autoClearColor,m=c.autoClearDepth,x=c.autoClearStencil,A=t.background;c.autoClear=!0,c.autoClearColor=!0,c.autoClearDepth=!0,c.autoClearStencil=!0,A===null&&(t.background=c.getClearColor(Uf));let g=new Li(n,s,d);return g.position.copy(a),g.update(c,t),c.autoClear=_,c.autoClearColor=u,c.autoClearDepth=m,c.autoClearStencil=x,t.background=A,e>0&&(d.texture.mipmapsAutoUpdate=!0,this._blur(l,e)),this._applyPMREM(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=vc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=xc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(gc,uc(t))}_fromTexture(t,e){t.mapping===li||t.mapping===Ui?this._setSize(t.image.length===0?gc:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=_c(t,!1,!1),n=Math.log2(t)-If;for(let s=0;s<=n;s++)e.texture.mipmaps.push({width:t>>s,height:t>>s});return e.texture.name=`PMREM`,e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=_c(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let o=t.width>>e;t.viewport.set(0,0,o,o),r.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===li||t.mapping===Ui?(this._cubemapMaterial===null&&(this._cubemapMaterial=vc()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=xc()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Ff(),this._integrationMaterial=Of());let e=this._cubeSize,n=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/kc);for(let o=0;o<=n;o++){let a=i.lodToRoughness(o,n);if(o>n-Df)r.roughness.value=a,this._renderCube(t,o,this._integrationMaterial);else{let c=a>0?Math.log2(e)+.5*Math.log2(6/(zc*Math.pow(a,4)))+.5:0;s.roughness.value=a,s.lodBias.value=c,this._renderCube(t,o,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=Bf());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(t,0,n),s.envMap.value=t.texture,this._renderCube(r,0,n)}};function _c(i,t,e){return new Ss(i,{minFilter:An,generateMipmaps:t,type:ln,colorSpace:Ji,depthBuffer:e})}function bs(i,t,e){return new Ge({name:i,uniforms:t,vertexShader:jt.cube_vert,fragmentShader:e,side:Oe,blending:ri,depthTest:!1,depthWrite:!1})}function Ff(){return bs(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${zc}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Of(){return bs(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:kc}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Bf(){return bs(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Lf}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function xc(){return bs(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function vc(){return bs(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function zf(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,m=!1){return u==null?null:m?o(u):r(u)}function r(u){if(u&&u.isTexture){let m=u.mapping;if(m===Pr||m===Ir)if(t.has(u)){let x=t.get(u).texture;return a(x,u.mapping)}else{let x=u.image;if(x&&x.height>0){let A=new Ss(x.height);return A.fromEquirectangularTexture(i,u),t.set(u,A),u.addEventListener(`dispose`,l),a(A.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture&&u.isPMREMTexture!==!0){let m=u.mapping,x=m===Pr||m===Ir,A=m===li||m===Ui;if(x||A){let g=e.get(u),f=g!==void 0?g.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==f)return n===null&&(n=new xo(i)),g=x?n.fromEquirectangular(u,g):n.fromCubemap(u,g),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),g.texture;if(g!==void 0)return g.texture;{let R=u.image;return x&&R&&R.height>0||A&&R&&c(R)?(n===null&&(n=new xo(i)),g=x?n.fromEquirectangular(u):n.fromCubemap(u),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),u.addEventListener(`dispose`,d),g.texture):null}}}return u}function a(u,m){return m===Pr?u.mapping=li:m===Ir&&(u.mapping=Ui),u}function c(u){let m=0,x=6;for(let A=0;A<x;A++)u[A]!==void 0&&m++;return m===x}function l(u){let m=u.target;m.removeEventListener(`dispose`,l);let x=t.get(m);x!==void 0&&(t.delete(m),x.dispose())}function d(u){let m=u.target;m.removeEventListener(`dispose`,d);let x=e.get(m);x!==void 0&&(e.delete(m),x.dispose())}function _(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:_}}function kf(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e(`EXT_color_buffer_float`),e(`WEBGL_clip_cull_distance`),e(`OES_texture_float_linear`),e(`EXT_color_buffer_half_float`),e(`WEBGL_multisampled_render_to_texture`),e(`WEBGL_render_shared_exponent`)},get:function(n){let s=e(n);return s===null&&Yi(`WebGLRenderer: `+n+` extension not supported.`),s}}}function Hf(i,t,e,n){let s={},r=new WeakMap,o=new FinalizationRegistry(x=>delete s[x]);function a(x){c(x.target)}function c(x){x.index!==null&&t.remove(x.index);for(let g in x.attributes)t.remove(x.attributes[g]);x.removeEventListener(`dispose`,a),delete s[x.id],o.unregister(x);let A=r.get(x);A&&(t.remove(A),r.delete(x)),n.releaseStatesOfGeometry(x),x.isInstancedBufferGeometry===!0&&delete x._maxInstanceCount,e.memory.geometries--}function l(x,A){return s[A.id]!==void 0||(A.addEventListener(`dispose`,a),s[A.id]=new WeakRef(A),o.register(A,A.id,A),e.memory.geometries++),A}function d(x){let A=x.attributes;for(let g in A)t.update(A[g],i.ARRAY_BUFFER)}function _(x){let A=x.index,g=x.attributes.position,f=0;if(g===void 0)return;let R=A!==null?A.array.length:g.array.length/3-1,C=new(g.count>=65535?ns:es)(Math.ceil(R/3)*6,1),N=C.array;if(A!==null){let y=A.array;f=A.version;for(let T=0,Y=0;T<R;T+=3){let H=y[T+0],X=y[T+1],Q=y[T+2];N[Y++]=H,N[Y++]=X,N[Y++]=X,N[Y++]=Q,N[Y++]=Q,N[Y++]=H}}else{f=g.version;for(let y=0,T=0;y<R;y+=3){let Y=y+0,H=y+1,X=y+2;N[T++]=Y,N[T++]=H,N[T++]=H,N[T++]=X,N[T++]=X,N[T++]=Y}}C.version=f;let I=r.get(x);I&&t.remove(I),r.set(x,C)}function u(x){let A=r.get(x);if(A){let g=x.index;g!==null&&A.version<g.version&&_(x)}else _(x);return r.get(x)}function m(){for(let x in s){let A=s[x].deref();A!==void 0&&c(A)}}return{get:l,update:d,getWireframeAttribute:u,dispose:m}}function Gf(i,t,e){let n;function s(_){n=_}let r,o;function a(_){r=_.type,o=_.bytesPerElement}function c(_,u){i.drawElements(n,u,r,_*o),e.update(u,n,1)}function l(_,u,m){m!==0&&(i.drawElementsInstanced(n,u,r,_*o,m),e.update(u,n,m))}function d(_,u,m){if(m===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(n,u,0,r,_,0,m);let A=0;for(let g=0;g<m;g++)A+=u[g];e.update(A,n,1)}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=d}function Vf(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:Xt(`WebGLInfo: Unknown draw mode:`,o)}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Wf(i,t,e){let n=new WeakMap,s=new ge;function r(o,a,c){let l=o.morphTargetInfluences,d=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,_=d!==void 0?d.length:0,u=n.get(a);if(u===void 0||u.count!==_){let Y=function(){y.dispose(),n.delete(a),a.removeEventListener(`dispose`,Y)};u!==void 0&&u.texture.dispose();let m=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,A=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],R=a.morphAttributes.color||[],F=0;m===!0&&(F=1),x===!0&&(F=2),A===!0&&(F=3);let C=a.attributes.position.count*F,N=1;C>t.maxTextureSize&&(N=Math.ceil(C/t.maxTextureSize),C=t.maxTextureSize);let I=new Float32Array(C*N*4*_),y=new ji(I,C,N,_);y.type=an,y.needsUpdate=!0;let T=F*4;for(let H=0;H<_;H++){let X=g[H],Q=f[H],st=R[H],B=C*N*4*H;for(let it=0;it<X.count;it++){let at=it*T;m===!0&&(s.fromBufferAttribute(X,it),I[B+at+0]=s.x,I[B+at+1]=s.y,I[B+at+2]=s.z,I[B+at+3]=0),x===!0&&(s.fromBufferAttribute(Q,it),I[B+at+4]=s.x,I[B+at+5]=s.y,I[B+at+6]=s.z,I[B+at+7]=0),A===!0&&(s.fromBufferAttribute(st,it),I[B+at+8]=s.x,I[B+at+9]=s.y,I[B+at+10]=s.z,I[B+at+11]=st.itemSize===4?s.w:1)}}u={count:_,texture:y,size:new re(C,N)},n.set(a,u),a.addEventListener(`dispose`,Y)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,`morphTexture`,o.morphTexture,e);else{let m=0;for(let A=0;A<l.length;A++)m+=l[A];let x=a.morphTargetsRelative?1:1-m;c.getUniforms().setValue(i,`morphTargetBaseInfluence`,x),c.getUniforms().setValue(i,`morphTargetInfluences`,l)}c.getUniforms().setValue(i,`morphTargetsTexture`,u.texture,e),c.getUniforms().setValue(i,`morphTargetsTextureSize`,u.size)}return{update:r}}function Xf(i,t,e,n,s){let r=new WeakMap;function o(l){let d=s.render.frame,_=l.geometry,u=t.get(l,_);if(r.get(u)!==d&&(t.update(u),r.set(u,d)),l.isInstancedMesh&&(l.hasEventListener(`dispose`,c)===!1&&l.addEventListener(`dispose`,c),r.get(l)!==d&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,d))),l.isSkinnedMesh){let m=l.skeleton;r.get(m)!==d&&(m.update(),r.set(m,d))}return u}function a(){r=new WeakMap}function c(l){let d=l.target;d.removeEventListener(`dispose`,c),n.releaseStatesOfObject(d),e.remove(d.instanceMatrix),d.instanceColor!==null&&e.remove(d.instanceColor)}return{update:o,dispose:a}}var qf={[ra]:`LINEAR_TONE_MAPPING`,[oa]:`REINHARD_TONE_MAPPING`,[aa]:`CINEON_TONE_MAPPING`,[la]:`ACES_FILMIC_TONE_MAPPING`,[ha]:`AGX_TONE_MAPPING`,[ua]:`NEUTRAL_TONE_MAPPING`,[ca]:`CUSTOM_TONE_MAPPING`};function Yf(i,t,e,n,s,r){let o=new Xe(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=null,d=new He;d.setAttribute(`position`,new Ue([-1,3,0,-1,-1,0,3,-1,0],3)),d.setAttribute(`uv`,new Ue([0,2,0,0,2,0],2));let _=new mr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new Ke(d,_),m=new Rr(-1,1,1,-1,0,1),x=null,A=null,g=!1,f,R=null,F=[],C=!1;this.setSize=function(N,I){o.setSize(N,I),a!==null&&a.setSize(N,I),c!==null&&c.setSize(N,I);for(let y=0;y<F.length;y++){let T=F[y];T.setSize&&T.setSize(N,I)}},this.setEffects=function(N){F=N,C=F.length>0&&F[0].isRenderPass===!0;let I=o.width,y=o.height;F.length>0&&a===null&&(a=new Xe(I,y,{type:ln,depthBuffer:!1,stencilBuffer:!1}),c=new Xe(I,y,{type:ln,depthBuffer:!1,stencilBuffer:!1}));let T=s===!0&&F.some(Y=>Y.needsDepthTexture===!0);T!==(o.depthTexture!==null)&&(T===!0&&l===null&&(l=new wn(I,y),r===!0&&(l.format=Rn,l.type=ci)),o.dispose(),o.depthTexture=T?l:null,o.resolveDepthBuffer=T,o.storeMultisampledDepthBuffer=T);for(let Y=0;Y<F.length;Y++){let H=F[Y];H.setSize&&H.setSize(I,y),T&&H.needsDepthTexture===!0&&H.setDepthTexture&&H.setDepthTexture(l)}},this.begin=function(N,I){if(g||N.toneMapping===pn&&F.length===0)return!1;if(R=I,I!==null){let y=I.width,T=I.height;(o.width!==y||o.height!==T)&&this.setSize(y,T)}return C===!1&&N.setRenderTarget(o),f=N.toneMapping,N.toneMapping=pn,!0},this.hasRenderPass=function(){return C},this.end=function(N,I){N.toneMapping=f,g=!0;let y=o,T=a;for(let Y=0;Y<F.length;Y++){let H=F[Y];H.enabled!==!1&&(H.render(N,T,y,I),H.needsSwap!==!1&&(y=T,T=T===a?c:a))}if(x!==N.outputColorSpace||A!==N.toneMapping){x=N.outputColorSpace,A=N.toneMapping,_.defines={},ne.getTransfer(x)===le&&(_.defines.SRGB_TRANSFER=``);let Y=qf[A];Y&&(_.defines[Y]=``),_.needsUpdate=!0}_.uniforms.tDiffuse.value=y.texture,N.setRenderTarget(R),N.render(u,m),R=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),d.dispose(),_.dispose()}}var Hc=new ke;var Gc=new wn(1,1);var Vc=new rs(1);var Wc=new ji;var Xc=new ur;var qc=new ss;var yc=[];var Mc=[];var Sc=new Float32Array(16);var bc=new Float32Array(9);var Ec=new Float32Array(4);function zi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=yc[s];if(r===void 0&&(r=new Float32Array(s),yc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Me(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Se(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function vo(i,t){let e=Mc[t];e===void 0&&(e=new Int32Array(t),Mc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Zf(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Jf(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2fv(this.addr,t),Se(e,t)}}function $f(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Me(e,t))return;i.uniform3fv(this.addr,t),Se(e,t)}}function Kf(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4fv(this.addr,t),Se(e,t)}}function Qf(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Se(e,t)}else{if(Me(e,n))return;Ec.set(n),i.uniformMatrix2fv(this.addr,!1,Ec),Se(e,n)}}function jf(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Se(e,t)}else{if(Me(e,n))return;bc.set(n),i.uniformMatrix3fv(this.addr,!1,bc),Se(e,n)}}function tp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Me(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Se(e,t)}else{if(Me(e,n))return;Sc.set(n),i.uniformMatrix4fv(this.addr,!1,Sc),Se(e,n)}}function ep(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function np(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2iv(this.addr,t),Se(e,t)}}function ip(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Me(e,t))return;i.uniform3iv(this.addr,t),Se(e,t)}}function sp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4iv(this.addr,t),Se(e,t)}}function rp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function op(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Me(e,t))return;i.uniform2uiv(this.addr,t),Se(e,t)}}function ap(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Me(e,t))return;i.uniform3uiv(this.addr,t),Se(e,t)}}function lp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Me(e,t))return;i.uniform4uiv(this.addr,t),Se(e,t)}}function yo(i){return i.version===0&&(i.compareFunction=ba,i.needsUpdate=!0),i}function cp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=yo(Gc):r=Hc,e.setTexture2D(t||r,s)}function hp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Xc,s)}function up(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=yo(Vc):r=qc,e.setTextureCube(t||r,s)}function dp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Wc,s)}function fp(i){switch(i){case 5126:return Zf;case 35664:return Jf;case 35665:return $f;case 35666:return Kf;case 35674:return Qf;case 35675:return jf;case 35676:return tp;case 5124:case 35670:return ep;case 35667:case 35671:return np;case 35668:case 35672:return ip;case 35669:case 35673:return sp;case 5125:return rp;case 36294:return op;case 36295:return ap;case 36296:return lp;case 35678:case 36198:case 36298:case 36306:case 35682:return cp;case 35679:case 36299:case 36307:return hp;case 35680:case 36300:case 36308:case 36293:return up;case 36289:case 36303:case 36311:case 36292:return dp}}function pp(i,t){i.uniform1fv(this.addr,t)}function mp(i,t){let e=zi(t,this.size,2);i.uniform2fv(this.addr,e)}function gp(i,t){let e=zi(t,this.size,3);i.uniform3fv(this.addr,e)}function _p(i,t){let e=zi(t,this.size,4);i.uniform4fv(this.addr,e)}function xp(i,t){let e=zi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function vp(i,t){let e=zi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function yp(i,t){let e=zi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Mp(i,t){i.uniform1iv(this.addr,t)}function Sp(i,t){i.uniform2iv(this.addr,t)}function bp(i,t){i.uniform3iv(this.addr,t)}function Ep(i,t){i.uniform4iv(this.addr,t)}function Tp(i,t){i.uniform1uiv(this.addr,t)}function wp(i,t){i.uniform2uiv(this.addr,t)}function Ap(i,t){i.uniform3uiv(this.addr,t)}function Rp(i,t){i.uniform4uiv(this.addr,t)}function Cp(i,t,e){let n=this.cache,s=t.length,r=vo(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));let o;this.type===i.SAMPLER_2D_SHADOW?o=yo(Gc):o=Hc;for(let a=0;a!==s;++a)e.setTexture2D(t[a]||o,r[a])}function Pp(i,t,e){let n=this.cache,s=t.length,r=vo(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Xc,r[o])}function Ip(i,t,e){let n=this.cache,s=t.length,r=vo(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));let o;this.type===i.SAMPLER_CUBE_SHADOW?o=yo(Vc):o=qc;for(let a=0;a!==s;++a)e.setTextureCube(t[a]||o,r[a])}function Lp(i,t,e){let n=this.cache,s=t.length,r=vo(e,s);Me(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Wc,r[o])}function Dp(i){switch(i){case 5126:return pp;case 35664:return mp;case 35665:return gp;case 35666:return _p;case 35674:return xp;case 35675:return vp;case 35676:return yp;case 5124:case 35670:return Mp;case 35667:case 35671:return Sp;case 35668:case 35672:return bp;case 35669:case 35673:return Ep;case 5125:return Tp;case 36294:return wp;case 36295:return Ap;case 36296:return Rp;case 35678:case 36198:case 36298:case 36306:case 35682:return Cp;case 35679:case 36299:case 36307:return Pp;case 35680:case 36300:case 36308:case 36293:return Ip;case 36289:case 36303:case 36311:case 36292:return Lp}}var Da=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=fp(e.type)}};var Na=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Dp(e.type)}};var Ua=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}};var Ia=/(\w+)(\])?(\[|\.)?/g;function Tc(i,t){i.seq.push(t),i.map[t.id]=t}function Np(i,t,e){let n=i.name,s=n.length;for(Ia.lastIndex=0;;){let r=Ia.exec(n),o=Ia.lastIndex,a=r[1],c=r[2]===`]`,l=r[3];if(c&&(a=a|0),l===void 0||l===`[`&&o+2===s){Tc(e,l===void 0?new Da(a,i,t):new Na(a,i,t));break}else{let _=e.map[a];_===void 0&&(_=new Ua(a),Tc(e,_)),e=_}}}var Oi=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let o=0;o<n;++o){let a=t.getActiveUniform(e,o);Np(a,t.getUniformLocation(e,a.name),this)}let s=[],r=[];for(let o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function wc(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var Up=37297;var Fp=0;function Op(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?`>`:` `} ${a}: ${e[o]}`)}return n.join(`
`)}var Ac=new qt;function Bp(i){ne._getMatrix(Ac,ne.workingColorSpace,i);let t=`mat3( ${Ac.elements.map(e=>e.toFixed(4))} )`;switch(ne.getTransfer(i)){case $i:return[t,`LinearTransferOETF`];case le:return[t,`sRGBTransferOETF`];default:return Wt(`WebGLProgram: Unsupported color space: `,i),[t,`LinearTransferOETF`]}}function Rc(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||``).trim();if(n&&r===``)return``;let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return e.toUpperCase()+`

`+r+`

`+Op(i.getShaderSource(t),a)}else return r}function zp(i,t){let e=Bp(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var kp={[ra]:`Linear`,[oa]:`Reinhard`,[aa]:`Cineon`,[la]:`ACESFilmic`,[ha]:`AgX`,[ua]:`Neutral`,[ca]:`Custom`};function Hp(i,t){let e=kp[t];return e===void 0?(Wt(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+i+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+i+`( vec3 color ) { return `+e+`ToneMapping( color ); }`}var _o=new et;function Gp(){ne.getLuminanceCoefficients(_o);return[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${_o.x.toFixed(4)}, ${_o.y.toFixed(4)}, ${_o.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Vp(i){return[i.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,i.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Ms).join(`
`)}function Wp(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push(`#define `+e+` `+n)}return t.join(`
`)}function Xp(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ms(i){return i!==``}function Cc(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Pc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var qp=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fa(i){return i.replace(qp,Yp)}function Yp(i,t){let e=jt[t];if(e===void 0)throw new Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return Fa(e)}var Zp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ic(i){return i.replace(Zp,Jp)}function Jp(i,t,e,n){let s=``;for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,`[ `+r+` ]`).replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Lc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision===`highp`?t+=`
#define HIGH_PRECISION`:i.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:i.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var $p={[us]:`SHADOWMAP_TYPE_PCF`,[Di]:`SHADOWMAP_TYPE_VSM`};function Kp(i){return $p[i.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Qp={[Ui]:`ENVMAP_MODE_REFRACTION`};function jp(i){return i.envMap===!1?`ENVMAP_MODE_REFLECTION`:Qp[i.envMapMode]||`ENVMAP_MODE_REFLECTION`}var tm={[sa]:`ENVMAP_BLENDING_MULTIPLY`,[Jl]:`ENVMAP_BLENDING_MIX`,[$l]:`ENVMAP_BLENDING_ADD`};function em(i){return i.envMap===!1?`ENVMAP_BLENDING_NONE`:tm[i.combine]||`ENVMAP_BLENDING_NONE`}function nm(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,c=Kp(e),l=e.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,d=jp(e),_=em(e),u=Vp(e),m=Wp(r),x=s.createProgram(),A,g,f=e.glslVersion?`#version `+e.glslVersion+`
`:``;e.isRawShaderMaterial?(A=[`#define SHADER_TYPE `+e.shaderType,`#define SHADER_NAME `+e.shaderName,m].filter(Ms).join(`
`),A.length>0&&(A+=`
`),g=[`#define SHADER_TYPE `+e.shaderType,`#define SHADER_NAME `+e.shaderName,m].filter(Ms).join(`
`),g.length>0&&(g+=`
`)):(A=[Lc(e),`#define SHADER_TYPE `+e.shaderType,`#define SHADER_NAME `+e.shaderName,m,e.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,e.batching?`#define USE_BATCHING`:``,e.batchingColor?`#define USE_BATCHING_COLOR`:``,e.instancing?`#define USE_INSTANCING`:``,e.instancingColor?`#define USE_INSTANCING_COLOR`:``,e.instancingMorph?`#define USE_INSTANCING_MORPH`:``,e.useFog&&e.fog?`#define USE_FOG`:``,e.useFog&&e.fogExp2?`#define FOG_EXP2`:``,e.map?`#define USE_MAP`:``,e.envMap?`#define USE_ENVMAP`:``,e.envMap?`#define `+d:``,e.lightMap?`#define USE_LIGHTMAP`:``,e.aoMap?`#define USE_AOMAP`:``,e.bumpMap?`#define USE_BUMPMAP`:``,e.normalMap?`#define USE_NORMALMAP`:``,e.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,e.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,e.displacementMap?`#define USE_DISPLACEMENTMAP`:``,e.emissiveMap?`#define USE_EMISSIVEMAP`:``,e.anisotropy?`#define USE_ANISOTROPY`:``,e.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,e.clearcoatMap?`#define USE_CLEARCOATMAP`:``,e.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,e.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,e.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,e.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,e.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,e.specularMap?`#define USE_SPECULARMAP`:``,e.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,e.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,e.roughnessMap?`#define USE_ROUGHNESSMAP`:``,e.metalnessMap?`#define USE_METALNESSMAP`:``,e.alphaMap?`#define USE_ALPHAMAP`:``,e.alphaHash?`#define USE_ALPHAHASH`:``,e.transmission?`#define USE_TRANSMISSION`:``,e.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,e.thicknessMap?`#define USE_THICKNESSMAP`:``,e.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,e.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,e.mapUv?`#define MAP_UV `+e.mapUv:``,e.alphaMapUv?`#define ALPHAMAP_UV `+e.alphaMapUv:``,e.lightMapUv?`#define LIGHTMAP_UV `+e.lightMapUv:``,e.aoMapUv?`#define AOMAP_UV `+e.aoMapUv:``,e.emissiveMapUv?`#define EMISSIVEMAP_UV `+e.emissiveMapUv:``,e.bumpMapUv?`#define BUMPMAP_UV `+e.bumpMapUv:``,e.normalMapUv?`#define NORMALMAP_UV `+e.normalMapUv:``,e.displacementMapUv?`#define DISPLACEMENTMAP_UV `+e.displacementMapUv:``,e.metalnessMapUv?`#define METALNESSMAP_UV `+e.metalnessMapUv:``,e.roughnessMapUv?`#define ROUGHNESSMAP_UV `+e.roughnessMapUv:``,e.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+e.anisotropyMapUv:``,e.clearcoatMapUv?`#define CLEARCOATMAP_UV `+e.clearcoatMapUv:``,e.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+e.clearcoatNormalMapUv:``,e.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+e.clearcoatRoughnessMapUv:``,e.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+e.diffuseRoughnessMapUv:``,e.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+e.iridescenceMapUv:``,e.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+e.iridescenceThicknessMapUv:``,e.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+e.sheenColorMapUv:``,e.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+e.sheenRoughnessMapUv:``,e.specularMapUv?`#define SPECULARMAP_UV `+e.specularMapUv:``,e.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+e.specularColorMapUv:``,e.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+e.specularIntensityMapUv:``,e.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+e.transmissionMapUv:``,e.thicknessMapUv?`#define THICKNESSMAP_UV `+e.thicknessMapUv:``,e.vertexTangents&&e.flatShading===!1?`#define USE_TANGENT`:``,e.vertexNormals?`#define HAS_NORMAL`:``,e.vertexColors?`#define USE_COLOR`:``,e.vertexAlphas?`#define USE_COLOR_ALPHA`:``,e.vertexUv1s?`#define USE_UV1`:``,e.vertexUv2s?`#define USE_UV2`:``,e.vertexUv3s?`#define USE_UV3`:``,e.pointsUvs?`#define USE_POINTS_UV`:``,e.flatShading?`#define FLAT_SHADED`:``,e.skinning?`#define USE_SKINNING`:``,e.morphTargets?`#define USE_MORPHTARGETS`:``,e.morphNormals&&e.flatShading===!1?`#define USE_MORPHNORMALS`:``,e.morphColors?`#define USE_MORPHCOLORS`:``,e.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+e.morphTextureStride:``,e.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+e.morphTargetsCount:``,e.doubleSided?`#define DOUBLE_SIDED`:``,e.flipSided?`#define FLIP_SIDED`:``,e.shadowMapEnabled?`#define USE_SHADOWMAP`:``,e.shadowMapEnabled?`#define `+c:``,e.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,e.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,e.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,e.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Ms).join(`
`),g=[Lc(e),`#define SHADER_TYPE `+e.shaderType,`#define SHADER_NAME `+e.shaderName,m,e.useFog&&e.fog?`#define USE_FOG`:``,e.useFog&&e.fogExp2?`#define FOG_EXP2`:``,e.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,e.map?`#define USE_MAP`:``,e.matcap?`#define USE_MATCAP`:``,e.envMap?`#define USE_ENVMAP`:``,e.envMap?`#define `+l:``,e.envMap?`#define `+d:``,e.envMap?`#define `+_:``,e.envMapPMREM?`#define ENVMAP_MAX_LOD `+e.envMapMaxLod+`.0`:``,e.envMapPMREM?`#define ENVMAP_SIZE `+e.envMapSize+`.0`:``,e.lightMap?`#define USE_LIGHTMAP`:``,e.aoMap?`#define USE_AOMAP`:``,e.bumpMap?`#define USE_BUMPMAP`:``,e.normalMap?`#define USE_NORMALMAP`:``,e.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,e.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,e.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,e.emissiveMap?`#define USE_EMISSIVEMAP`:``,e.anisotropy?`#define USE_ANISOTROPY`:``,e.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,e.clearcoat?`#define USE_CLEARCOAT`:``,e.clearcoatMap?`#define USE_CLEARCOATMAP`:``,e.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,e.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,e.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,e.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,e.dispersion?`#define USE_DISPERSION`:``,e.retroreflection?`#define USE_RETROREFLECTION`:``,e.iridescence?`#define USE_IRIDESCENCE`:``,e.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,e.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,e.specularMap?`#define USE_SPECULARMAP`:``,e.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,e.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,e.roughnessMap?`#define USE_ROUGHNESSMAP`:``,e.metalnessMap?`#define USE_METALNESSMAP`:``,e.alphaMap?`#define USE_ALPHAMAP`:``,e.alphaTest?`#define USE_ALPHATEST`:``,e.alphaHash?`#define USE_ALPHAHASH`:``,e.sheen?`#define USE_SHEEN`:``,e.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,e.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,e.transmission?`#define USE_TRANSMISSION`:``,e.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,e.thicknessMap?`#define USE_THICKNESSMAP`:``,e.vertexTangents&&e.flatShading===!1?`#define USE_TANGENT`:``,e.vertexColors||e.instancingColor?`#define USE_COLOR`:``,e.vertexAlphas||e.batchingColor?`#define USE_COLOR_ALPHA`:``,e.vertexUv1s?`#define USE_UV1`:``,e.vertexUv2s?`#define USE_UV2`:``,e.vertexUv3s?`#define USE_UV3`:``,e.pointsUvs?`#define USE_POINTS_UV`:``,e.gradientMap?`#define USE_GRADIENTMAP`:``,e.flatShading?`#define FLAT_SHADED`:``,e.doubleSided?`#define DOUBLE_SIDED`:``,e.flipSided?`#define FLIP_SIDED`:``,e.shadowMapEnabled?`#define USE_SHADOWMAP`:``,e.shadowMapEnabled?`#define `+c:``,e.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,e.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,e.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,e.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,e.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,e.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,e.toneMapping!==pn?`#define TONE_MAPPING`:``,e.toneMapping!==pn?jt.tonemapping_pars_fragment:``,e.toneMapping!==pn?Hp(`toneMapping`,e.toneMapping):``,e.dithering?`#define DITHERING`:``,e.opaque?`#define OPAQUE`:``,jt.colorspace_pars_fragment,zp(`linearToOutputTexel`,e.outputColorSpace),Gp(),e.useDepthPacking?`#define DEPTH_PACKING `+e.depthPacking:``,`
`].filter(Ms).join(`
`)),o=Fa(o),o=Cc(o,e),o=Pc(o,e),a=Fa(a),a=Cc(a,e),a=Pc(a,e),o=Ic(o),a=Ic(a),e.isRawShaderMaterial!==!0&&(f=`#version 300 es
`,A=[u,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+A,g=[`#define varying in`,e.glslVersion===Ea?``:`layout(location = 0) out highp vec4 pc_fragColor;`,e.glslVersion===Ea?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let R=f+A+o,F=f+g+a,C=wc(s,s.VERTEX_SHADER,R),N=wc(s,s.FRAGMENT_SHADER,F);s.attachShader(x,C),s.attachShader(x,N),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(x,0,`position`),s.linkProgram(x);function I(H){if(i.debug.checkShaderErrors){let X=s.getProgramInfoLog(x)||``,Q=s.getShaderInfoLog(C)||``,st=s.getShaderInfoLog(N)||``,B=X.trim(),it=Q.trim(),at=st.trim(),$=!0,dt=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if($=!1,typeof i.debug.onShaderError==`function`)i.debug.onShaderError(s,x,C,N);else{let j=Rc(s,C,`vertex`),ht=Rc(s,N,`fragment`);Xt(`WebGLProgram: Shader Error `+s.getError()+` - VALIDATE_STATUS `+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+H.name+`
Material Type: `+H.type+`

Program Info Log: `+B+`
`+j+`
`+ht)}else B!==``?Wt(`WebGLProgram: Program Info Log:`,B):(it===``||at===``)&&(dt=!1);dt&&(H.diagnostics={runnable:$,programLog:B,vertexShader:{log:it,prefix:A},fragmentShader:{log:at,prefix:g}})}s.deleteShader(C),s.deleteShader(N),y=new Oi(s,x),T=Xp(s,x)}let y;this.getUniforms=function(){return y===void 0&&I(this),y};let T;this.getAttributes=function(){return T===void 0&&I(this),T};let Y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return Y===!1&&(Y=s.getProgramParameter(x,Up)),Y},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Fp++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=C,this.fragmentShader=N,this}var im=0;var Oa=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Ba(t),e.set(t,n)),n}};var Ba=class{constructor(t){this.id=im++,this.code=t,this.usedTimes=0}};function sm(i){return i===Xn||i===_s||i===xs}function rm(i,t,e,n,s,r){let o=new ts,a=new Oa,c=new Set,l=[],d=new Map,_=n.logarithmicDepthBuffer,u={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(y){return c.add(y),y===0?`uv`:`uv${y}`}function x(y,T,Y,H,X,Q){let st=H.fog,B=X.geometry,it=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?H.environment:null,at=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,$=t.get(y.envMap||it,at),dt=u[y.type],j=n.precision;y.precision!==null&&(j=n.getMaxPrecision(y.precision),j!==y.precision&&Wt(`WebGLProgram.getParameters:`,y.precision,`not supported, using`,j,`instead.`));let ht=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,ft=ht!==void 0?ht.length:0,Rt=0;B.morphAttributes.position!==void 0&&(Rt=1),B.morphAttributes.normal!==void 0&&(Rt=2),B.morphAttributes.color!==void 0&&(Rt=3);let kt,lt,vt,Tt;if(dt){let wt=gn[dt];kt=wt.vertexShader,lt=wt.fragmentShader}else{kt=y.vertexShader,lt=y.fragmentShader;let wt=a.getVertexShaderStage(y),ce=a.getFragmentShaderStage(y);a.update(y,wt,ce),vt=wt.id,Tt=ce.id}let Pt=i.getRenderTarget(),yt=i.state.buffers.depth.getReversed(),Vt=X.isInstancedMesh===!0,ue=X.isBatchedMesh===!0,It=!!y.map,nt=!!y.matcap,mt=!!$,ut=mt&&$.isPMREMTexture===!0,pt=!!y.aoMap,Mt=!!y.lightMap,Ut=!!y.bumpMap&&y.wireframe===!1,Ot=!!y.normalMap,ae=!!y.displacementMap,Jt=!!y.emissiveMap,Ht=!!y.metalnessMap,Yt=!!y.roughnessMap,Bt=y.anisotropy>0,k=y.clearcoat>0,p=y.diffuseRoughness>0,M=y.dispersion>0,S=y.retroreflectivity>0,b=y.iridescence>0,D=y.sheen>0,L=y.transmission>0,U=Bt&&!!y.anisotropyMap,v=k&&!!y.clearcoatMap,h=k&&!!y.clearcoatNormalMap,w=k&&!!y.clearcoatRoughnessMap,z=p&&!!y.diffuseRoughnessMap,O=b&&!!y.iridescenceMap,q=b&&!!y.iridescenceThicknessMap,J=D&&!!y.sheenColorMap,V=D&&!!y.sheenRoughnessMap,W=!!y.specularMap,ct=!!y.specularColorMap,P=!!y.specularIntensityMap,ot=L&&!!y.transmissionMap,rt=L&&!!y.thicknessMap,_t=!!y.gradientMap,xt=!!y.alphaMap,St=y.alphaTest>0,zt=!!y.alphaHash,Qt=!!y.extensions,gt=pn;y.toneMapped&&(Pt===null||Pt.isXRRenderTarget===!0)&&(gt=i.toneMapping);let Gt=ut?$.isCompressedCubeTexture?$.image[0].mipmaps:$.mipmaps:null,$t={shaderID:dt,shaderType:y.type,shaderName:y.name,vertexShader:kt,fragmentShader:lt,defines:y.defines,customVertexShaderID:vt,customFragmentShaderID:Tt,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:j,batching:ue,batchingColor:ue&&X._colorsTexture!==null,instancing:Vt,instancingColor:Vt&&X.instanceColor!==null,instancingMorph:Vt&&X.morphTexture!==null,outputColorSpace:Pt===null?i.outputColorSpace:Pt.isXRRenderTarget===!0?Pt.texture.colorSpace:ne.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:It,matcap:nt,envMap:mt,envMapMode:mt&&$.mapping,envMapPMREM:ut,envMapMaxLod:ut?Gt.length-1:null,envMapSize:ut?Gt[0].width:null,aoMap:pt,lightMap:Mt,bumpMap:Ut,normalMap:Ot,displacementMap:ae,emissiveMap:Jt,normalMapObjectSpace:Ot&&y.normalMapType===jl,normalMapTangentSpace:Ot&&y.normalMapType===ya,packedNormalMap:Ot&&y.normalMapType===ya&&sm(y.normalMap.format),metalnessMap:Ht,roughnessMap:Yt,anisotropy:Bt,anisotropyMap:U,clearcoat:k,clearcoatMap:v,clearcoatNormalMap:h,clearcoatRoughnessMap:w,diffuseRoughness:p,diffuseRoughnessMap:z,dispersion:M,retroreflection:S,iridescence:b,iridescenceMap:O,iridescenceThicknessMap:q,sheen:D,sheenColorMap:J,sheenRoughnessMap:V,specularMap:W,specularColorMap:ct,specularIntensityMap:P,transmission:L,transmissionMap:ot,thicknessMap:rt,gradientMap:_t,opaque:y.transparent===!1&&y.blending===Ni&&y.alphaToCoverage===!1,alphaMap:xt,alphaTest:St,alphaHash:zt,combine:y.combine,mapUv:It&&m(y.map.channel),aoMapUv:pt&&m(y.aoMap.channel),lightMapUv:Mt&&m(y.lightMap.channel),bumpMapUv:Ut&&m(y.bumpMap.channel),normalMapUv:Ot&&m(y.normalMap.channel),displacementMapUv:ae&&m(y.displacementMap.channel),emissiveMapUv:Jt&&m(y.emissiveMap.channel),metalnessMapUv:Ht&&m(y.metalnessMap.channel),roughnessMapUv:Yt&&m(y.roughnessMap.channel),anisotropyMapUv:U&&m(y.anisotropyMap.channel),clearcoatMapUv:v&&m(y.clearcoatMap.channel),clearcoatNormalMapUv:h&&m(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:w&&m(y.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:z&&m(y.diffuseRoughnessMap.channel),iridescenceMapUv:O&&m(y.iridescenceMap.channel),iridescenceThicknessMapUv:q&&m(y.iridescenceThicknessMap.channel),sheenColorMapUv:J&&m(y.sheenColorMap.channel),sheenRoughnessMapUv:V&&m(y.sheenRoughnessMap.channel),specularMapUv:W&&m(y.specularMap.channel),specularColorMapUv:ct&&m(y.specularColorMap.channel),specularIntensityMapUv:P&&m(y.specularIntensityMap.channel),transmissionMapUv:ot&&m(y.transmissionMap.channel),thicknessMapUv:rt&&m(y.thicknessMap.channel),alphaMapUv:xt&&m(y.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(Ot||Bt),vertexNormals:!!B.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!B.attributes.uv&&(It||xt),fog:!!st,useFog:y.fog===!0,fogExp2:!!st&&st.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||B.attributes.normal===void 0&&Ot===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:_,reversedDepthBuffer:yt,skinning:X.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:ft,morphTextureStride:Rt,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:Q.filter(wt=>wt.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&Y.length>0,shadowMapType:i.shadowMap.type,toneMapping:gt,decodeVideoTexture:It&&y.map.isVideoTexture===!0&&ne.getTransfer(y.map.colorSpace)===le,decodeVideoTextureEmissive:Jt&&y.emissiveMap.isVideoTexture===!0&&ne.getTransfer(y.emissiveMap.colorSpace)===le,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Qe,flipSided:y.side===Oe,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:Qt&&y.extensions.clipCullDistance===!0&&e.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Qt&&y.extensions.multiDraw===!0||ue)&&e.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:e.has(`KHR_parallel_shader_compile`),customProgramCacheKey:y.customProgramCacheKey()};return $t.vertexUv1s=c.has(1),$t.vertexUv2s=c.has(2),$t.vertexUv3s=c.has(3),c.clear(),$t}function A(y){let T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(let Y in y.defines)T.push(Y),T.push(y.defines[Y]);return y.isRawShaderMaterial===!1&&(g(T,y),f(T,y),T.push(i.outputColorSpace)),T.push(y.customProgramCacheKey),T.join()}function g(y,T){y.push(T.precision),y.push(T.outputColorSpace),y.push(T.envMapMode),y.push(T.envMapPMREM),y.push(T.envMapMaxLod),y.push(T.envMapSize),y.push(T.mapUv),y.push(T.alphaMapUv),y.push(T.lightMapUv),y.push(T.aoMapUv),y.push(T.bumpMapUv),y.push(T.normalMapUv),y.push(T.displacementMapUv),y.push(T.emissiveMapUv),y.push(T.metalnessMapUv),y.push(T.roughnessMapUv),y.push(T.anisotropyMapUv),y.push(T.clearcoatMapUv),y.push(T.clearcoatNormalMapUv),y.push(T.clearcoatRoughnessMapUv),y.push(T.diffuseRoughnessMapUv),y.push(T.iridescenceMapUv),y.push(T.iridescenceThicknessMapUv),y.push(T.sheenColorMapUv),y.push(T.sheenRoughnessMapUv),y.push(T.specularMapUv),y.push(T.specularColorMapUv),y.push(T.specularIntensityMapUv),y.push(T.transmissionMapUv),y.push(T.thicknessMapUv),y.push(T.combine),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.numSunLights),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numSunLightShadows),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.numLightProbes),y.push(T.numLightProbeGrids),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function f(y,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.diffuseRoughness&&o.enable(25),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),y.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),y.push(o.mask)}function R(y){let T=u[y.type],Y;if(T){let H=gn[T];Y=fc.clone(H.uniforms)}else Y=y.uniforms;return Y}function F(y,T){let Y=d.get(T);return Y!==void 0?++Y.usedTimes:(Y=new nm(i,T,y,s),l.push(Y),d.set(T,Y)),Y}function C(y){if(--y.usedTimes===0){let T=l.indexOf(y);l[T]=l[l.length-1],l.pop(),d.delete(y.cacheKey),y.destroy()}}function N(y){a.remove(y)}function I(){a.dispose()}return{getParameters:x,getProgramCacheKey:A,getUniforms:R,acquireProgram:F,releaseProgram:C,releaseShaderCache:N,programs:l,dispose:I}}function om(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function am(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Dc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Nc(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function a(u,m,x,A,g,f){let R=i[t];return R===void 0?(R={id:u.id,object:u,geometry:m,material:x,materialVariant:o(u),groupOrder:A,renderOrder:u.renderOrder,z:g,group:f},i[t]=R):(R.id=u.id,R.object=u,R.geometry=m,R.material=x,R.materialVariant=o(u),R.groupOrder=A,R.renderOrder=u.renderOrder,R.z=g,R.group=f),t++,R}function c(u,m,x,A,g,f,R){R.reversedDepth===!0&&(g=-g);let F=a(u,m,x,A,g,f);x.transmission>0?n.push(F):x.transparent===!0?s.push(F):e.push(F)}function l(u,m,x,A,g,f){let R=a(u,m,x,A,g,f);x.transmission>0?n.unshift(R):x.transparent===!0?s.unshift(R):e.unshift(R)}function d(u,m){e.length>1&&e.sort(u||am),n.length>1&&n.sort(m||Dc),s.length>1&&s.sort(m||Dc)}function _(){for(let u=t,m=i.length;u<m;u++){let x=i[u];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:_,sort:d}}function lm(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new Nc,i.set(n,[o])):s>=r.length?(o=new Nc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function cm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case`SunLight`:case`DirectionalLight`:e={direction:new et,color:new Kt};break;case`SpotLight`:e={position:new et,direction:new et,color:new Kt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:e={position:new et,color:new Kt,distance:0,decay:0};break;case`HemisphereLight`:e={direction:new et,skyColor:new Kt,groundColor:new Kt};break;case`RectAreaLight`:e={color:new Kt,position:new et,halfWidth:new et,halfHeight:new et}}return i[t.id]=e,e}}}function hm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case`SunLight`:case`DirectionalLight`:e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case`SpotLight`:e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re};break;case`PointLight`:e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new re,shadowCameraNear:1,shadowCameraFar:1e3}}return i[t.id]=e,e}}}var um=0;function dm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function fm(i){let t=new cm,e=hm(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new et);let s=new et,r=new me,o=new me;function a(l){let d=0,_=0,u=0;for(let Q=0;Q<9;Q++)n.probe[Q].set(0,0,0);let m=0,x=0,A=0,g=0,f=0,R=0,F=0,C=0,N=0,I=0,y=0,T=0,Y=0,H=0;l.sort(dm);for(let Q=0,st=l.length;Q<st;Q++){let B=l[Q],it=B.color,at=B.intensity,$=B.distance,dt=null;if(B.shadow&&B.shadow.map&&(B.shadow.map.texture.format===Xn?dt=B.shadow.map.texture:dt=B.shadow.map.depthTexture||B.shadow.map.texture),B.isAmbientLight)d+=it.r*at,_+=it.g*at,u+=it.b*at;else if(B.isLightProbe){for(let j=0;j<9;j++)n.probe[j].addScaledVector(B.sh.coefficients[j],at);H++}else if(B.isSunLight){let j=t.get(B);if(j.color.copy(B.color).multiplyScalar(B.intensity),B.castShadow){let ht=B.shadow,ft=e.get(B);ft.shadowIntensity=ht.intensity,ft.shadowBias=ht.bias,ft.shadowNormalBias=ht.normalBias,ft.shadowRadius=ht.radius,ft.shadowMapSize.copy(ht.mapSize).multiply(ht.getFrameExtents()),n.sunShadow[x]=ft,n.sunShadowMap[x]=dt;let Rt=ht.getViewportCount();for(let kt=0;kt<Rt;kt++)n.sunShadowMatrix[A+kt]=ht.getMatrix(kt),n.sunShadowCascade[A+kt]=ht._cascadeData[kt];A+=Rt,x++}n.sun[m]=j,m++}else if(B.isDirectionalLight){let j=t.get(B);if(j.color.copy(B.color).multiplyScalar(B.intensity),B.castShadow){let ht=B.shadow,ft=e.get(B);ft.shadowIntensity=ht.intensity,ft.shadowBias=ht.bias,ft.shadowNormalBias=ht.normalBias,ft.shadowRadius=ht.radius,ft.shadowMapSize=ht.mapSize,n.directionalShadow[g]=ft,n.directionalShadowMap[g]=dt,n.directionalShadowMatrix[g]=B.shadow.matrix,N++}n.directional[g]=j,g++}else if(B.isSpotLight){let j=t.get(B);j.position.setFromMatrixPosition(B.matrixWorld),j.color.copy(it).multiplyScalar(at),j.distance=$,j.coneCos=Math.cos(B.angle),j.penumbraCos=Math.cos(B.angle*(1-B.penumbra)),j.decay=B.decay,n.spot[R]=j;let ht=B.shadow;if(B.map&&(n.spotLightMap[T]=B.map,T++,ht.updateMatrices(B),B.castShadow&&Y++),n.spotLightMatrix[R]=ht.matrix,B.castShadow){let ft=e.get(B);ft.shadowIntensity=ht.intensity,ft.shadowBias=ht.bias,ft.shadowNormalBias=ht.normalBias,ft.shadowRadius=ht.radius,ft.shadowMapSize=ht.mapSize,n.spotShadow[R]=ft,n.spotShadowMap[R]=dt,y++}R++}else if(B.isRectAreaLight){let j=t.get(B);j.color.copy(it).multiplyScalar(at),j.halfWidth.set(B.width*.5,0,0),j.halfHeight.set(0,B.height*.5,0),n.rectArea[F]=j,F++}else if(B.isPointLight){let j=t.get(B);if(j.color.copy(B.color).multiplyScalar(B.intensity),j.distance=B.distance,j.decay=B.decay,B.castShadow){let ht=B.shadow,ft=e.get(B);ft.shadowIntensity=ht.intensity,ft.shadowBias=ht.bias,ft.shadowNormalBias=ht.normalBias,ft.shadowRadius=ht.radius,ft.shadowMapSize=ht.mapSize,ft.shadowCameraNear=ht.camera.near,ft.shadowCameraFar=ht.camera.far,n.pointShadow[f]=ft,n.pointShadowMap[f]=dt,n.pointShadowMatrix[f]=B.shadow.matrix,I++}n.point[f]=j,f++}else if(B.isHemisphereLight){let j=t.get(B);j.skyColor.copy(B.color).multiplyScalar(at),j.groundColor.copy(B.groundColor).multiplyScalar(at),n.hemi[C]=j,C++}}F>0&&(i.has(`OES_texture_float_linear`)===!0?(n.rectAreaLTC1=At.LTC_FLOAT_1,n.rectAreaLTC2=At.LTC_FLOAT_2):(n.rectAreaLTC1=At.LTC_HALF_1,n.rectAreaLTC2=At.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=_,n.ambient[2]=u;let X=n.hash;(X.sunLength!==m||X.directionalLength!==g||X.pointLength!==f||X.spotLength!==R||X.rectAreaLength!==F||X.hemiLength!==C||X.numSunShadows!==x||X.numDirectionalShadows!==N||X.numPointShadows!==I||X.numSpotShadows!==y||X.numSpotMaps!==T||X.numLightProbes!==H)&&(n.sun.length=m,n.directional.length=g,n.spot.length=R,n.rectArea.length=F,n.point.length=f,n.hemi.length=C,n.sunShadow.length=x,n.sunShadowMap.length=x,n.sunShadowMatrix.length=A,n.sunShadowCascade.length=A,n.directionalShadow.length=N,n.directionalShadowMap.length=N,n.directionalShadowMatrix.length=N,n.pointShadow.length=I,n.pointShadowMap.length=I,n.pointShadowMatrix.length=I,n.spotShadow.length=y,n.spotShadowMap.length=y,n.spotLightMatrix.length=y+T-Y,n.spotLightMap.length=T,n.numSpotLightShadowsWithMaps=Y,n.numLightProbes=H,X.sunLength=m,X.directionalLength=g,X.pointLength=f,X.spotLength=R,X.rectAreaLength=F,X.hemiLength=C,X.numSunShadows=x,X.numDirectionalShadows=N,X.numPointShadows=I,X.numSpotShadows=y,X.numSpotMaps=T,X.numLightProbes=H,n.version=um++)}function c(l,d){let _=0,u=0,m=0,x=0,A=0,g=0,f=d.matrixWorldInverse;for(let R=0,F=l.length;R<F;R++){let C=l[R];if(C.isSunLight){let N=n.sun[_];N.direction.setFromMatrixPosition(C.matrixWorld),N.direction.transformDirection(f),_++}else if(C.isDirectionalLight){let N=n.directional[u];N.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),N.direction.sub(s),N.direction.transformDirection(f),u++}else if(C.isSpotLight){let N=n.spot[x];N.position.setFromMatrixPosition(C.matrixWorld),N.position.applyMatrix4(f),N.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),N.direction.sub(s),N.direction.transformDirection(f),x++}else if(C.isRectAreaLight){let N=n.rectArea[A];N.position.setFromMatrixPosition(C.matrixWorld),N.position.applyMatrix4(f),o.identity(),r.copy(C.matrixWorld),r.premultiply(f),o.extractRotation(r),N.halfWidth.set(C.width*.5,0,0),N.halfHeight.set(0,C.height*.5,0),N.halfWidth.applyMatrix4(o),N.halfHeight.applyMatrix4(o),A++}else if(C.isPointLight){let N=n.point[m];N.position.setFromMatrixPosition(C.matrixWorld),N.position.applyMatrix4(f),m++}else if(C.isHemisphereLight){let N=n.hemi[g];N.direction.setFromMatrixPosition(C.matrixWorld),N.direction.transformDirection(f),g++}}}return{setup:a,setupView:c,state:n}}function Uc(i){let t=new fm(i),e=[],n=[],s=[];function r(_){d.camera=_,e.length=0,n.length=0,s.length=0}function o(_){_.isLightProbeGrid?s.push(_):e.push(_)}function a(_){n.push(_)}function c(){t.setup(e),s.sort((_,u)=>_.priority-u.priority||_.id-u.id)}function l(_){t.setupView(e,_)}let d={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function pm(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new Uc(i),t.set(s,[a])):r>=o.length?(a=new Uc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var mm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`;var gm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`;var _m=[new et(1,0,0),new et(-1,0,0),new et(0,1,0),new et(0,-1,0),new et(0,0,1),new et(0,0,-1)];var xm=[new et(0,-1,0),new et(0,-1,0),new et(0,0,1),new et(0,0,-1),new et(0,-1,0),new et(0,-1,0)];var Fc=new me;var ys=new et;var La=new et;function vm(i,t,e){let n=new ii,s=new re,r=new re,o=new ge,a=new gr,c=new _r,l={},d=e.maxTextureSize,_={[Wn]:Oe,[Oe]:Wn,[Qe]:Qe},u=new Ge({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new re},radius:{value:4}},vertexShader:mm,fragmentShader:gm}),m=u.clone();m.defines.HORIZONTAL_PASS=1;let x=new He;x.setAttribute(`position`,new ze(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let A=new Ke(x,u),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=us;let f=this.type;this.render=function(I,y,T){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||I.length===0)return;this.type===Pl&&(Wt(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=us);let Y=i.getRenderTarget(),H=i.getActiveCubeFace(),X=i.getActiveMipmapLevel(),Q=i.state;Q.setBlending(ri),Q.buffers.depth.getReversed()===!0?Q.buffers.color.setClear(0,0,0,0):Q.buffers.color.setClear(1,1,1,1),Q.buffers.depth.setTest(!0),Q.setScissorTest(!1);let st=f!==this.type;st&&y.traverse(function(B){B.material&&(Array.isArray(B.material)?B.material.forEach(it=>it.needsUpdate=!0):B.material.needsUpdate=!0)});for(let B=0,it=I.length;B<it;B++){let at=I[B],$=at.shadow;if($===void 0){Wt(`WebGLShadowMap:`,at,`has no shadow.`);continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;s.copy($.mapSize);let dt=$.getFrameExtents();s.multiply(dt),r.copy($.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(r.x=Math.floor(d/dt.x),s.x=r.x*dt.x,$.mapSize.x=r.x),s.y>d&&(r.y=Math.floor(d/dt.y),s.y=r.y*dt.y,$.mapSize.y=r.y));let j=i.state.buffers.depth.getReversed();if($.camera._reversedDepth=j,$.map===null||st===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===Di){if(at.isPointLight){Wt(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}$.map=new Xe(s.x,s.y,{format:Xn,type:ln,minFilter:Fe,magFilter:Fe,generateMipmaps:!1}),$.map.texture.name=at.name+`.shadowMap`,$.map.depthTexture=new wn(s.x,s.y,an),$.map.depthTexture.name=at.name+`.shadowMapDepth`,$.map.depthTexture.format=Tn,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=we,$.map.depthTexture.magFilter=we}else at.isPointLight?($.map=new Ss(s.x),$.map.depthTexture=new rs(s.x,on)):($.map=new Xe(s.x,s.y),$.map.depthTexture=new wn(s.x,s.y,on)),$.map.depthTexture.name=at.name+`.shadowMap`,$.map.depthTexture.format=Tn,this.type===us?($.map.depthTexture.compareFunction=j?Sa:Ma,$.map.depthTexture.minFilter=Fe,$.map.depthTexture.magFilter=Fe):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=we,$.map.depthTexture.magFilter=we);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==s.x||$.map.height!==s.y)&&$.map.setSize(s.x,s.y);let ht=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();at.isPointLight!==!0&&$.updateMatrices(at,T);let ft=($.camera.layers.mask&4294967294)!==0?$.camera.layers:T.layers;for(let Rt=0;Rt<ht;Rt++){let kt=$.getCamera(Rt);if(at.isPointLight){let lt=$.camera,vt=$.matrix,Tt=at.distance||lt.far;Tt!==lt.far&&(lt.far=Tt,lt.updateProjectionMatrix()),ys.setFromMatrixPosition(at.matrixWorld),lt.position.copy(ys),La.copy(lt.position),La.add(_m[Rt]),lt.up.copy(xm[Rt]),lt.lookAt(La),lt.updateMatrixWorld(),vt.makeTranslation(-ys.x,-ys.y,-ys.z),Fc.multiplyMatrices(lt.projectionMatrix,lt.matrixWorldInverse),$._frustum.setFromProjectionMatrix(Fc,lt.coordinateSystem,lt.reversedDepth)}if($.map.isWebGLCubeRenderTarget)i.setRenderTarget($.map,Rt),i.clear();else{Rt===0&&(i.setRenderTarget($.map),i.clear());let lt=$.getViewport(Rt);o.set(r.x*lt.x,r.y*lt.y,r.x*lt.z,r.y*lt.w),Q.viewport(o)}n=$.getFrustum(Rt),C(y,T,kt,at,ft,this.type)}$.isPointLightShadow!==!0&&this.type===Di&&R($,T),$.needsUpdate=!1}f=this.type,g.needsUpdate=!1,i.setRenderTarget(Y,H,X)};function R(I,y){let T=t.update(A);u.defines.VSM_SAMPLES!==I.blurSamples&&(u.defines.VSM_SAMPLES=I.blurSamples,m.defines.VSM_SAMPLES=I.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),I.mapPass===null?I.mapPass=new Xe(s.x,s.y,{format:Xn,type:ln}):(I.mapPass.width!==I.map.width||I.mapPass.height!==I.map.height)&&I.mapPass.setSize(I.map.width,I.map.height),u.uniforms.shadow_pass.value=I.map.depthTexture,u.uniforms.resolution.value.set(I.map.width,I.map.height),u.uniforms.radius.value=I.radius,i.setRenderTarget(I.mapPass),i.clear(),i.renderBufferDirect(y,null,T,u,A,null),m.uniforms.shadow_pass.value=I.mapPass.texture,m.uniforms.resolution.value.set(I.map.width,I.map.height),m.uniforms.radius.value=I.radius,i.setRenderTarget(I.map),i.clear(),i.renderBufferDirect(y,null,T,m,A,null)}function F(I,y,T,Y){let H=null,X=T.isPointLight===!0?I.customDistanceMaterial:I.customDepthMaterial;if(X!==void 0)H=X;else if(H=T.isPointLight===!0?c:a,i.localClippingEnabled&&y.clipShadows===!0&&Array.isArray(y.clippingPlanes)&&y.clippingPlanes.length!==0||y.displacementMap&&y.displacementScale!==0||y.alphaMap&&y.alphaTest>0||y.map&&y.alphaTest>0||y.alphaToCoverage===!0){let Q=H.uuid,st=y.uuid,B=l[Q];B===void 0&&(B={},l[Q]=B);let it=B[st];it===void 0&&(it=H.clone(),B[st]=it,y.addEventListener(`dispose`,N)),H=it}if(H.visible=y.visible,H.wireframe=y.wireframe,Y===Di?H.side=y.shadowSide!==null?y.shadowSide:y.side:H.side=y.shadowSide!==null?y.shadowSide:_[y.side],H.alphaMap=y.alphaMap,H.alphaTest=y.alphaToCoverage===!0?.5:y.alphaTest,H.map=y.map,H.clipShadows=y.clipShadows,H.clippingPlanes=y.clippingPlanes,H.clipIntersection=y.clipIntersection,H.displacementMap=y.displacementMap,H.displacementScale=y.displacementScale,H.displacementBias=y.displacementBias,H.wireframeLinewidth=y.wireframeLinewidth,H.linewidth=y.linewidth,T.isPointLight===!0&&H.isMeshDistanceMaterial===!0){let Q=i.properties.get(H);Q.light=T}return H}function C(I,y,T,Y,H,X){if(I.visible===!1)return;if(I.layers.test(H)&&(I.isMesh||I.isLine||I.isPoints)&&(I.castShadow||I.receiveShadow&&X===Di)&&(!I.frustumCulled||I.intersectsFrustum(n))){I.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,I.matrixWorld);let B=t.update(I),it=I.material;if(Array.isArray(it)){let at=B.groups;for(let $=0,dt=at.length;$<dt;$++){let j=at[$],ht=it[j.materialIndex];if(ht&&ht.visible){let ft=F(I,ht,Y,X);I.onBeforeShadow(i,I,y,T,B,ft,j),i.renderBufferDirect(T,null,B,ft,I,j),I.onAfterShadow(i,I,y,T,B,ft,j)}}}else if(it.visible){let at=F(I,it,Y,X);I.onBeforeShadow(i,I,y,T,B,at,null),i.renderBufferDirect(T,null,B,at,I,null),I.onAfterShadow(i,I,y,T,B,at,null)}}let st=I.children;for(let B=0,it=st.length;B<it;B++)C(st[B],y,T,Y,H,X)}function N(I){I.target.removeEventListener(`dispose`,N);for(let T in l){let Y=l[T],H=I.target.uuid;H in Y&&(Y[H].dispose(),delete Y[H])}}}function ym(i,t){function e(){let P=!1,ot=new ge,rt=null,_t=new ge(0,0,0,0);return{setMask:function(xt){rt!==xt&&!P&&(i.colorMask(xt,xt,xt,xt),rt=xt)},setLocked:function(xt){P=xt},setClear:function(xt,St,zt,Qt,gt){gt===!0&&(xt*=Qt,St*=Qt,zt*=Qt),ot.set(xt,St,zt,Qt),_t.equals(ot)===!1&&(i.clearColor(xt,St,zt,Qt),_t.copy(ot))},reset:function(){P=!1,rt=null,_t.set(-1,0,0,0)}}}function n(){let P=!1,ot=!1,rt=null,_t=null,xt=null;return{setReversed:function(St){if(ot!==St){let zt=t.get(`EXT_clip_control`);St?zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.ZERO_TO_ONE_EXT):zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.NEGATIVE_ONE_TO_ONE_EXT),ot=St;let Qt=xt;xt=null,this.setClear(Qt)}},getReversed:function(){return ot},setTest:function(St){St?yt(i.DEPTH_TEST):Vt(i.DEPTH_TEST)},setMask:function(St){rt!==St&&!P&&(i.depthMask(St),rt=St)},setFunc:function(St){if(ot&&(St=hc[St]),_t!==St){switch(St){case Qs:i.depthFunc(i.NEVER);break;case js:i.depthFunc(i.ALWAYS);break;case tr:i.depthFunc(i.LESS);break;case wi:i.depthFunc(i.LEQUAL);break;case er:i.depthFunc(i.EQUAL);break;case nr:i.depthFunc(i.GEQUAL);break;case ir:i.depthFunc(i.GREATER);break;case sr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}_t=St}},setLocked:function(St){P=St},setClear:function(St){xt!==St&&(xt=St,ot&&(St=1-St),i.clearDepth(St))},reset:function(){P=!1,rt=null,_t=null,xt=null,ot=!1}}}function s(){let P=!1,ot=null,rt=null,_t=null,xt=null,St=null,zt=null,Qt=null,gt=null;return{setTest:function(Gt){P||(Gt?yt(i.STENCIL_TEST):Vt(i.STENCIL_TEST))},setMask:function(Gt){ot!==Gt&&!P&&(i.stencilMask(Gt),ot=Gt)},setFunc:function(Gt,$t,wt){(rt!==Gt||_t!==$t||xt!==wt)&&(i.stencilFunc(Gt,$t,wt),rt=Gt,_t=$t,xt=wt)},setOp:function(Gt,$t,wt){(St!==Gt||zt!==$t||Qt!==wt)&&(i.stencilOp(Gt,$t,wt),St=Gt,zt=$t,Qt=wt)},setLocked:function(Gt){P=Gt},setClear:function(Gt){gt!==Gt&&(i.clearStencil(Gt),gt=Gt)},reset:function(){P=!1,ot=null,rt=null,_t=null,xt=null,St=null,zt=null,Qt=null,gt=null}}}let r=new e,o=new n,a=new s,c={},l=new WeakMap,d={},_={},u={},m=new WeakMap,x=[],A=null,g=!1,f=null,R=null,F=null,C=null,N=null,I=null,y=null,T=new Kt(0,0,0),Y=0,H=!1,X=null,Q=null,st=null,B=null,it=null,at=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),$=!1,dt=0,j=i.getParameter(i.VERSION);j.indexOf(`WebGL`)!==-1?(dt=parseFloat(/^WebGL (\d)/.exec(j)[1]),$=dt>=1):j.indexOf(`OpenGL ES`)!==-1&&(dt=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),$=dt>=2);let ht=null,ft={},Rt=i.getParameter(i.SCISSOR_BOX),kt=i.getParameter(i.VIEWPORT),lt=new ge().fromArray(Rt),vt=new ge().fromArray(kt);function Tt(P,ot,rt,_t){let xt=new Uint8Array(4),St=i.createTexture();i.bindTexture(P,St),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let zt=0;zt<rt;zt++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(ot,0,i.RGBA,1,1,_t,0,i.RGBA,i.UNSIGNED_BYTE,xt):i.texImage2D(ot+zt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,xt);return St}let Pt={};Pt[i.TEXTURE_2D]=Tt(i.TEXTURE_2D,i.TEXTURE_2D,1),Pt[i.TEXTURE_CUBE_MAP]=Tt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Pt[i.TEXTURE_2D_ARRAY]=Tt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Pt[i.TEXTURE_3D]=Tt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),yt(i.DEPTH_TEST),o.setFunc(wi),Ut(!1),Ot(jo),yt(i.CULL_FACE),pt(ri);function yt(P){d[P]!==!0&&(i.enable(P),d[P]=!0)}function Vt(P){d[P]!==!1&&(i.disable(P),d[P]=!1)}function ue(P,ot){return u[P]!==ot?(i.bindFramebuffer(P,ot),u[P]=ot,P===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ot),P===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ot),!0):!1}function It(P,ot){let rt=x,_t=!1;if(P){rt=m.get(ot),rt===void 0&&(rt=[],m.set(ot,rt));let xt=P.textures;if(rt.length!==xt.length||rt[0]!==i.COLOR_ATTACHMENT0){for(let St=0,zt=xt.length;St<zt;St++)rt[St]=i.COLOR_ATTACHMENT0+St;rt.length=xt.length,_t=!0}}else rt[0]!==i.BACK&&(rt[0]=i.BACK,_t=!0);_t&&i.drawBuffers(rt)}function nt(P){return A!==P?(i.useProgram(P),A=P,!0):!1}let mt={[ai]:i.FUNC_ADD,[Ll]:i.FUNC_SUBTRACT,[Dl]:i.FUNC_REVERSE_SUBTRACT};mt[Nl]=i.MIN,mt[Ul]=i.MAX;let ut={[Fl]:i.ZERO,[Ol]:i.ONE,[Bl]:i.SRC_COLOR,[na]:i.SRC_ALPHA,[Wl]:i.SRC_ALPHA_SATURATE,[Gl]:i.DST_COLOR,[kl]:i.DST_ALPHA,[zl]:i.ONE_MINUS_SRC_COLOR,[ia]:i.ONE_MINUS_SRC_ALPHA,[Vl]:i.ONE_MINUS_DST_COLOR,[Hl]:i.ONE_MINUS_DST_ALPHA,[Xl]:i.CONSTANT_COLOR,[ql]:i.ONE_MINUS_CONSTANT_COLOR,[Yl]:i.CONSTANT_ALPHA,[Zl]:i.ONE_MINUS_CONSTANT_ALPHA};function pt(P,ot,rt,_t,xt,St,zt,Qt,gt,Gt){if(P===ri){g===!0&&(Vt(i.BLEND),g=!1);return}if(g===!1&&(yt(i.BLEND),g=!0),P!==Il){if(P!==f||Gt!==H){if((R!==ai||N!==ai)&&(i.blendEquation(i.FUNC_ADD),R=ai,N=ai),Gt)switch(P){case Ni:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case oi:i.blendFunc(i.ONE,i.ONE);break;case ta:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ea:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Xt(`WebGLState: Invalid blending: `,P)}else switch(P){case Ni:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case oi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case ta:Xt(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case ea:Xt(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:Xt(`WebGLState: Invalid blending: `,P)}F=null,C=null,I=null,y=null,T.set(0,0,0),Y=0,f=P,H=Gt}return}xt=xt||ot,St=St||rt,zt=zt||_t,(ot!==R||xt!==N)&&(i.blendEquationSeparate(mt[ot],mt[xt]),R=ot,N=xt),(rt!==F||_t!==C||St!==I||zt!==y)&&(i.blendFuncSeparate(ut[rt],ut[_t],ut[St],ut[zt]),F=rt,C=_t,I=St,y=zt),(Qt.equals(T)===!1||gt!==Y)&&(i.blendColor(Qt.r,Qt.g,Qt.b,gt),T.copy(Qt),Y=gt),f=P,H=!1}function Mt(P,ot){P.side===Qe?Vt(i.CULL_FACE):yt(i.CULL_FACE);let rt=P.side===Oe;ot&&(rt=!rt),Ut(rt),P.blending===Ni&&P.transparent===!1?pt(ri):pt(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),o.setFunc(P.depthFunc),o.setTest(P.depthTest),o.setMask(P.depthWrite),r.setMask(P.colorWrite);let _t=P.stencilWrite;a.setTest(_t),_t&&(a.setMask(P.stencilWriteMask),a.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),a.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Jt(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?yt(i.SAMPLE_ALPHA_TO_COVERAGE):Vt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ut(P){X!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),X=P)}function Ot(P){P!==Rl?(yt(i.CULL_FACE),P!==Q&&(P===jo?i.cullFace(i.BACK):P===Cl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Vt(i.CULL_FACE),Q=P}function ae(P){P!==st&&($&&i.lineWidth(P),st=P)}function Jt(P,ot,rt){P?(yt(i.POLYGON_OFFSET_FILL),(B!==ot||it!==rt)&&(B=ot,it=rt,o.getReversed()&&(ot=-ot,rt=-rt),i.polygonOffset(ot,rt))):Vt(i.POLYGON_OFFSET_FILL)}function Ht(P){P?yt(i.SCISSOR_TEST):Vt(i.SCISSOR_TEST)}function Yt(P){P===void 0&&(P=i.TEXTURE0+at-1),ht!==P&&(i.activeTexture(P),ht=P)}function Bt(P,ot,rt){rt===void 0&&(ht===null?rt=i.TEXTURE0+at-1:rt=ht);let _t=ft[rt];_t===void 0&&(_t={type:void 0,texture:void 0},ft[rt]=_t),(_t.type!==P||_t.texture!==ot)&&(ht!==rt&&(i.activeTexture(rt),ht=rt),i.bindTexture(P,ot||Pt[P]),_t.type=P,_t.texture=ot)}function k(){let P=ft[ht];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function p(){try{i.compressedTexImage2D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function M(){try{i.compressedTexImage3D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function S(){try{i.texSubImage2D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function b(){try{i.texSubImage3D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function D(){try{i.compressedTexSubImage2D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function L(){try{i.compressedTexSubImage3D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function U(){try{i.texStorage2D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function v(){try{i.texStorage3D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function h(){try{i.texImage2D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function w(){try{i.texImage3D(...arguments)}catch(P){Xt(`WebGLState:`,P)}}function z(P){return _[P]!==void 0?_[P]:i.getParameter(P)}function O(P,ot){_[P]!==ot&&(i.pixelStorei(P,ot),_[P]=ot)}function q(P){lt.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),lt.copy(P))}function J(P){vt.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),vt.copy(P))}function V(P,ot){let rt=l.get(ot);rt===void 0&&(rt=new WeakMap,l.set(ot,rt));let _t=rt.get(P);_t===void 0&&(_t=i.getUniformBlockIndex(ot,P.name),i.uniformBlockBinding(ot,_t,_t),rt.set(P,_t))}function W(P,ot,rt){let xt=l.get(ot).get(P);c[xt]!==rt&&(i.bindBufferBase(i.UNIFORM_BUFFER,xt,rt),c[xt]=rt)}function ct(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),d={},_={},ht=null,ft={},u={},c={},m=new WeakMap,x=[],A=null,g=!1,f=null,R=null,F=null,C=null,N=null,I=null,y=null,T=new Kt(0,0,0),Y=0,H=!1,X=null,Q=null,st=null,B=null,it=null,lt.set(0,0,i.canvas.width,i.canvas.height),vt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:yt,disable:Vt,bindFramebuffer:ue,drawBuffers:It,useProgram:nt,setBlending:pt,setMaterial:Mt,setFlipSided:Ut,setCullFace:Ot,setLineWidth:ae,setPolygonOffset:Jt,setScissorTest:Ht,activeTexture:Yt,bindTexture:Bt,unbindTexture:k,compressedTexImage2D:p,compressedTexImage3D:M,texImage2D:h,texImage3D:w,pixelStorei:O,getParameter:z,updateUBOMapping:V,uniformBlockBinding:W,texStorage2D:U,texStorage3D:v,texSubImage2D:S,texSubImage3D:b,compressedTexSubImage2D:D,compressedTexSubImage3D:L,scissor:q,viewport:J,reset:ct}}function Mm(i,t,e,n,s,r,o){let a=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new re,d=new WeakMap,_=new Set,u,m=new WeakMap,x=new Set,A=new FinalizationRegistry(v=>x.delete(v)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function f(v,h){return g?new OffscreenCanvas(v,h):Qi(`canvas`)}function R(v,h,w){let z=1,O=U(v);if((O.width>w||O.height>w)&&(z=w/Math.max(O.width,O.height)),z<1)if(typeof HTMLImageElement<`u`&&v instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&v instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&v instanceof ImageBitmap||typeof VideoFrame<`u`&&v instanceof VideoFrame){let q=Math.floor(z*O.width),J=Math.floor(z*O.height);u===void 0&&(u=f(q,J));let V=h?f(q,J):u;return V.width=q,V.height=J,V.getContext(`2d`).drawImage(v,0,0,q,J),Wt(`WebGLRenderer: Texture has been resized from (`+O.width+`x`+O.height+`) to (`+q+`x`+J+`).`),V}else return`data`in v&&Wt(`WebGLRenderer: Image in DataTexture is too big (`+O.width+`x`+O.height+`).`),v;return v}function F(v){return v.generateMipmaps}function C(v){i.generateMipmap(v)}function N(v){return v.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:v.isWebGL3DRenderTarget?i.TEXTURE_3D:v.isWebGLArrayRenderTarget||v.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function I(v,h,w,z,O,q=!1){if(v!==null){if(i[v]!==void 0)return i[v];Wt(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+v+`'`)}let J;z&&(J=t.get(`EXT_texture_norm16`),J||Wt(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let V=h;if(h===i.RED&&(w===i.FLOAT&&(V=i.R32F),w===i.HALF_FLOAT&&(V=i.R16F),w===i.UNSIGNED_BYTE&&(V=i.R8),w===i.UNSIGNED_SHORT&&J&&(V=J.R16_EXT),w===i.SHORT&&J&&(V=J.R16_SNORM_EXT)),h===i.RED_INTEGER&&(w===i.UNSIGNED_BYTE&&(V=i.R8UI),w===i.UNSIGNED_SHORT&&(V=i.R16UI),w===i.UNSIGNED_INT&&(V=i.R32UI),w===i.BYTE&&(V=i.R8I),w===i.SHORT&&(V=i.R16I),w===i.INT&&(V=i.R32I)),h===i.RG&&(w===i.FLOAT&&(V=i.RG32F),w===i.HALF_FLOAT&&(V=i.RG16F),w===i.UNSIGNED_BYTE&&(V=i.RG8),w===i.UNSIGNED_SHORT&&J&&(V=J.RG16_EXT),w===i.SHORT&&J&&(V=J.RG16_SNORM_EXT)),h===i.RG_INTEGER&&(w===i.UNSIGNED_BYTE&&(V=i.RG8UI),w===i.UNSIGNED_SHORT&&(V=i.RG16UI),w===i.UNSIGNED_INT&&(V=i.RG32UI),w===i.BYTE&&(V=i.RG8I),w===i.SHORT&&(V=i.RG16I),w===i.INT&&(V=i.RG32I)),h===i.RGB_INTEGER&&(w===i.UNSIGNED_BYTE&&(V=i.RGB8UI),w===i.UNSIGNED_SHORT&&(V=i.RGB16UI),w===i.UNSIGNED_INT&&(V=i.RGB32UI),w===i.BYTE&&(V=i.RGB8I),w===i.SHORT&&(V=i.RGB16I),w===i.INT&&(V=i.RGB32I)),h===i.RGBA_INTEGER&&(w===i.UNSIGNED_BYTE&&(V=i.RGBA8UI),w===i.UNSIGNED_SHORT&&(V=i.RGBA16UI),w===i.UNSIGNED_INT&&(V=i.RGBA32UI),w===i.BYTE&&(V=i.RGBA8I),w===i.SHORT&&(V=i.RGBA16I),w===i.INT&&(V=i.RGBA32I)),h===i.RGB&&(w===i.UNSIGNED_SHORT&&J&&(V=J.RGB16_EXT),w===i.SHORT&&J&&(V=J.RGB16_SNORM_EXT),w===i.UNSIGNED_INT_5_9_9_9_REV&&(V=i.RGB9_E5),w===i.UNSIGNED_INT_10F_11F_11F_REV&&(V=i.R11F_G11F_B10F)),h===i.RGBA){let W=q?$i:ne.getTransfer(O);w===i.FLOAT&&(V=i.RGBA32F),w===i.HALF_FLOAT&&(V=i.RGBA16F),w===i.UNSIGNED_BYTE&&(V=W===le?i.SRGB8_ALPHA8:i.RGBA8),w===i.UNSIGNED_SHORT&&J&&(V=J.RGBA16_EXT),w===i.SHORT&&J&&(V=J.RGBA16_SNORM_EXT),w===i.UNSIGNED_SHORT_4_4_4_4&&(V=i.RGBA4),w===i.UNSIGNED_SHORT_5_5_5_1&&(V=i.RGB5_A1)}return(V===i.R16F||V===i.R32F||V===i.RG16F||V===i.RG32F||V===i.RGBA16F||V===i.RGBA32F)&&t.get(`EXT_color_buffer_float`),V}function y(v,h){let w;return v?h===null||h===on||h===ci?w=i.DEPTH24_STENCIL8:h===an?w=i.DEPTH32F_STENCIL8:h===Fi&&(w=i.DEPTH24_STENCIL8,Wt(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):h===null||h===on||h===ci?w=i.DEPTH_COMPONENT24:h===an?w=i.DEPTH_COMPONENT32F:h===Fi&&(w=i.DEPTH_COMPONENT16),w}function T(v,h){return F(v)===!0||v.isFramebufferTexture&&v.minFilter!==we&&v.minFilter!==Fe?Math.log2(Math.max(h.width,h.height))+1:v.mipmaps.length>0?v.mipmaps.length:v.isCompressedTexture&&Array.isArray(v.image)?h.mipmaps.length:1}function Y(v){let h=new WeakRef(v);n.get(v).__ref=h,x.add(h),A.register(v,h,h)}function H(v){let h=n.get(v).__ref;h!==void 0&&(x.delete(h),A.unregister(h))}function X(v){st(v.target)}function Q(v){B(v.target)}function st(v){v.removeEventListener(`dispose`,X),H(v),at(v),v.isVideoTexture&&d.delete(v),v.isHTMLTexture&&_.delete(v)}function B(v){v.removeEventListener(`dispose`,Q),H(v),dt(v)}function it(){for(let v of x){let h=v.deref();h!==void 0&&(h.isRenderTarget===!0?B(h):st(h))}x.clear(),_.clear()}function at(v){let h=n.get(v);if(h.__webglInit===void 0)return;let w=v.source,z=m.get(w);if(z){let O=z[h.__cacheKey];O.usedTimes--,O.usedTimes===0&&$(v),Object.keys(z).length===0&&m.delete(w)}n.remove(v)}function $(v){let h=n.get(v);i.deleteTexture(h.__webglTexture);let w=v.source,z=m.get(w);delete z[h.__cacheKey],o.memory.textures--}function dt(v){let h=n.get(v);h.__depthDisposeCallback&&h.__depthDisposeCallback();let w=v.depthTexture;if(w&&w.renderTarget===v&&st(w),v.isWebGLCubeRenderTarget)for(let O=0;O<6;O++){if(Array.isArray(h.__webglFramebuffer[O]))for(let q=0;q<h.__webglFramebuffer[O].length;q++)i.deleteFramebuffer(h.__webglFramebuffer[O][q]);else i.deleteFramebuffer(h.__webglFramebuffer[O]);h.__webglDepthbuffer&&i.deleteRenderbuffer(h.__webglDepthbuffer[O])}else{if(Array.isArray(h.__webglFramebuffer))for(let O=0;O<h.__webglFramebuffer.length;O++)i.deleteFramebuffer(h.__webglFramebuffer[O]);else i.deleteFramebuffer(h.__webglFramebuffer);if(h.__webglDepthbuffer&&i.deleteRenderbuffer(h.__webglDepthbuffer),h.__webglMultisampledFramebuffer&&i.deleteFramebuffer(h.__webglMultisampledFramebuffer),h.__webglColorRenderbuffer)for(let O=0;O<h.__webglColorRenderbuffer.length;O++)h.__webglColorRenderbuffer[O]&&i.deleteRenderbuffer(h.__webglColorRenderbuffer[O]);h.__webglDepthRenderbuffer&&i.deleteRenderbuffer(h.__webglDepthRenderbuffer)}let z=v.textures;for(let O=0,q=z.length;O<q;O++){let J=n.get(z[O]);J.__webglTexture&&(i.deleteTexture(J.__webglTexture),o.memory.textures--),n.remove(z[O])}n.remove(v)}let j=0;function ht(){j=0}function ft(){return j}function Rt(v){j=v}function kt(){let v=j;return v>=s.maxTextures&&Wt(`WebGLTextures: Trying to use `+(v+1)+` texture units while this GPU supports only `+s.maxTextures),j+=1,v}function lt(v){let h=[];return h.push(v.wrapS),h.push(v.wrapT),h.push(v.wrapR||0),h.push(v.magFilter),h.push(v.minFilter),h.push(v.anisotropy),h.push(v.internalFormat),h.push(v.format),h.push(v.type),h.push(v.generateMipmaps),h.push(v.mipmapsAutoUpdate),h.push(v.premultiplyAlpha),h.push(v.flipY),h.push(v.unpackAlignment),h.push(v.colorSpace),h.join()}function vt(v,h){let w=n.get(v);if(v.isVideoTexture&&D(v),v.isRenderTargetTexture===!1&&v.isExternalTexture!==!0&&v.version>0&&w.__version!==v.version){let z=v.image;if(z===null)Wt(`WebGLRenderer: Texture marked for update but no image data found.`);else if(z.complete===!1)Wt(`WebGLRenderer: Texture marked for update but image is incomplete`);else{Mt(w,v,h);return}}else v.isExternalTexture&&(w.__webglTexture=v.sourceTexture?v.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,w.__webglTexture,i.TEXTURE0+h)}function Tt(v,h){let w=n.get(v);if(v.isRenderTargetTexture===!1&&v.version>0&&w.__version!==v.version){Mt(w,v,h);return}else v.isExternalTexture&&(w.__webglTexture=v.sourceTexture?v.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,w.__webglTexture,i.TEXTURE0+h)}function Pt(v,h){let w=n.get(v);if(v.isRenderTargetTexture===!1&&v.version>0&&w.__version!==v.version){Mt(w,v,h);return}e.bindTexture(i.TEXTURE_3D,w.__webglTexture,i.TEXTURE0+h)}function yt(v,h){let w=n.get(v);if(v.version>0&&w.__version!==v.version){Ut(w,v,h);return}e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+h)}let Vt={[rr]:i.REPEAT,[un]:i.CLAMP_TO_EDGE,[or]:i.MIRRORED_REPEAT},ue={[we]:i.NEAREST,[Kl]:i.NEAREST_MIPMAP_NEAREST,[ds]:i.NEAREST_MIPMAP_LINEAR,[Fe]:i.LINEAR,[Lr]:i.LINEAR_MIPMAP_NEAREST,[An]:i.LINEAR_MIPMAP_LINEAR},It={[ec]:i.NEVER,[ba]:i.ALWAYS,[nc]:i.LESS,[Ma]:i.LEQUAL,[ic]:i.EQUAL,[Sa]:i.GEQUAL,[sc]:i.GREATER,[rc]:i.NOTEQUAL};function nt(v,h){if(h.type===an&&t.has(`OES_texture_float_linear`)===!1&&(h.magFilter===Fe||h.magFilter===Lr||h.magFilter===ds||h.magFilter===An||h.minFilter===Fe||h.minFilter===Lr||h.minFilter===ds||h.minFilter===An)&&Wt(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),i.texParameteri(v,i.TEXTURE_WRAP_S,Vt[h.wrapS]),i.texParameteri(v,i.TEXTURE_WRAP_T,Vt[h.wrapT]),(v===i.TEXTURE_3D||v===i.TEXTURE_2D_ARRAY)&&i.texParameteri(v,i.TEXTURE_WRAP_R,Vt[h.wrapR]),i.texParameteri(v,i.TEXTURE_MAG_FILTER,ue[h.magFilter]),i.texParameteri(v,i.TEXTURE_MIN_FILTER,ue[h.minFilter]),h.compareFunction&&(i.texParameteri(v,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(v,i.TEXTURE_COMPARE_FUNC,It[h.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(h.magFilter===we||h.minFilter!==ds&&h.minFilter!==An||h.type===an&&t.has(`OES_texture_float_linear`)===!1)return;if(h.anisotropy>1||n.get(h).__currentAnisotropy){let w=t.get(`EXT_texture_filter_anisotropic`);i.texParameterf(v,w.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(h.anisotropy,s.getMaxAnisotropy())),n.get(h).__currentAnisotropy=h.anisotropy}}}function mt(v,h){let w=!1;v.__webglInit===void 0&&(v.__webglInit=!0,h.addEventListener(`dispose`,X),Y(h));let z=h.source,O=m.get(z);O===void 0&&(O={},m.set(z,O));let q=lt(h);if(q!==v.__cacheKey){O[q]===void 0&&(O[q]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,w=!0),O[q].usedTimes++;let J=O[v.__cacheKey];J!==void 0&&(O[v.__cacheKey].usedTimes--,J.usedTimes===0&&$(h)),v.__cacheKey=q,v.__webglTexture=O[q].texture}return w}function ut(v,h,w){return Math.floor(Math.floor(v/w)/h)}function pt(v,h,w,z){let q=v.updateRanges;if(q.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,h.width,h.height,w,z,h.data);else{q.sort((P,ot)=>P.start-ot.start);let J=0;for(let P=1;P<q.length;P++){let ot=q[J],rt=q[P],_t=ot.start+ot.count,xt=ut(rt.start,h.width,4),St=ut(ot.start,h.width,4);rt.start<=_t+1&&xt===St&&ut(rt.start+rt.count-1,h.width,4)===xt?ot.count=Math.max(ot.count,rt.start+rt.count-ot.start):(++J,q[J]=rt)}q.length=J+1;let V=e.getParameter(i.UNPACK_ROW_LENGTH),W=e.getParameter(i.UNPACK_SKIP_PIXELS),ct=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,h.width);for(let P=0,ot=q.length;P<ot;P++){let rt=q[P],_t=Math.floor(rt.start/4),xt=Math.ceil(rt.count/4),St=_t%h.width,zt=Math.floor(_t/h.width),Qt=xt;e.pixelStorei(i.UNPACK_SKIP_PIXELS,St),e.pixelStorei(i.UNPACK_SKIP_ROWS,zt),e.texSubImage2D(i.TEXTURE_2D,0,St,zt,Qt,1,w,z,h.data)}v.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,V),e.pixelStorei(i.UNPACK_SKIP_PIXELS,W),e.pixelStorei(i.UNPACK_SKIP_ROWS,ct)}}function Mt(v,h,w){let z=i.TEXTURE_2D;(h.isDataArrayTexture||h.isCompressedArrayTexture)&&(z=i.TEXTURE_2D_ARRAY),h.isData3DTexture&&(z=i.TEXTURE_3D);let O=mt(v,h),q=h.source;e.bindTexture(z,v.__webglTexture,i.TEXTURE0+w);let J=n.get(q);if(q.version!==J.__version||O===!0){if(e.activeTexture(i.TEXTURE0+w),(typeof ImageBitmap<`u`&&h.image instanceof ImageBitmap)===!1){let gt=ne.getPrimaries(ne.workingColorSpace),Gt=h.colorSpace===Cn?null:ne.getPrimaries(h.colorSpace),$t=h.colorSpace===Cn||gt===Gt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,h.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,h.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,$t)}e.pixelStorei(i.UNPACK_ALIGNMENT,h.unpackAlignment);let W=R(h.image,!1,s.maxTextureSize);W=L(h,W);let ct=r.convert(h.format,h.colorSpace),P=r.convert(h.type),ot=I(h.internalFormat,ct,P,h.normalized,h.colorSpace,h.isVideoTexture);nt(z,h);let rt,_t=h.mipmaps,xt=h.isVideoTexture!==!0,St=J.__version===void 0||O===!0,zt=q.dataReady,Qt=T(h,W);if(h.isDepthTexture)ot=y(h.format===Rn,h.type),St&&(xt?e.texStorage2D(i.TEXTURE_2D,1,ot,W.width,W.height):e.texImage2D(i.TEXTURE_2D,0,ot,W.width,W.height,0,ct,P,null));else if(h.isDataTexture)if(_t.length>0){xt&&St&&e.texStorage2D(i.TEXTURE_2D,Qt,ot,_t[0].width,_t[0].height);for(let gt=0,Gt=_t.length;gt<Gt;gt++)rt=_t[gt],xt?zt&&e.texSubImage2D(i.TEXTURE_2D,gt,0,0,rt.width,rt.height,ct,P,rt.data):e.texImage2D(i.TEXTURE_2D,gt,ot,rt.width,rt.height,0,ct,P,rt.data);h.generateMipmaps=!1}else xt?(St&&e.texStorage2D(i.TEXTURE_2D,Qt,ot,W.width,W.height),zt&&pt(h,W,ct,P)):e.texImage2D(i.TEXTURE_2D,0,ot,W.width,W.height,0,ct,P,W.data);else if(h.isCompressedTexture)if(h.isCompressedArrayTexture){xt&&St&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Qt,ot,_t[0].width,_t[0].height,W.depth);for(let gt=0,Gt=_t.length;gt<Gt;gt++)if(rt=_t[gt],h.format!==cn)if(ct!==null)if(xt){if(zt)if(h.layerUpdates.size>0){let $t=Pa(rt.width,rt.height,h.format,h.type);for(let wt of h.layerUpdates){let ce=rt.data.subarray(wt*$t/rt.data.BYTES_PER_ELEMENT,(wt+1)*$t/rt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,gt,0,0,wt,rt.width,rt.height,1,ct,ce)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,gt,0,0,0,rt.width,rt.height,W.depth,ct,rt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,gt,ot,rt.width,rt.height,W.depth,0,rt.data,0,0);else Wt(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`);else xt?zt&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,gt,0,0,0,rt.width,rt.height,W.depth,ct,P,rt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,gt,ot,rt.width,rt.height,W.depth,0,ct,P,rt.data);h.layerUpdates.size>0&&h.clearLayerUpdates()}else{xt&&St&&e.texStorage2D(i.TEXTURE_2D,Qt,ot,_t[0].width,_t[0].height);for(let gt=0,Gt=_t.length;gt<Gt;gt++)rt=_t[gt],h.format!==cn?ct!==null?xt?zt&&e.compressedTexSubImage2D(i.TEXTURE_2D,gt,0,0,rt.width,rt.height,ct,rt.data):e.compressedTexImage2D(i.TEXTURE_2D,gt,ot,rt.width,rt.height,0,rt.data):Wt(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):xt?zt&&e.texSubImage2D(i.TEXTURE_2D,gt,0,0,rt.width,rt.height,ct,P,rt.data):e.texImage2D(i.TEXTURE_2D,gt,ot,rt.width,rt.height,0,ct,P,rt.data)}else if(h.isDataArrayTexture)if(xt){if(St&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Qt,ot,W.width,W.height,W.depth),zt)if(h.layerUpdates.size>0){let gt=Pa(W.width,W.height,h.format,h.type);for(let Gt of h.layerUpdates){let $t=W.data.subarray(Gt*gt/W.data.BYTES_PER_ELEMENT,(Gt+1)*gt/W.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Gt,W.width,W.height,1,ct,P,$t)}h.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,W.width,W.height,W.depth,ct,P,W.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ot,W.width,W.height,W.depth,0,ct,P,W.data);else if(h.isData3DTexture)xt?(St&&e.texStorage3D(i.TEXTURE_3D,Qt,ot,W.width,W.height,W.depth),zt&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,W.width,W.height,W.depth,ct,P,W.data)):e.texImage3D(i.TEXTURE_3D,0,ot,W.width,W.height,W.depth,0,ct,P,W.data);else if(h.isFramebufferTexture){if(St)if(xt)e.texStorage2D(i.TEXTURE_2D,Qt,ot,W.width,W.height);else{let gt=W.width,Gt=W.height;for(let $t=0;$t<Qt;$t++)e.texImage2D(i.TEXTURE_2D,$t,ot,gt,Gt,0,ct,P,null),gt>>=1,Gt>>=1}}else if(h.isHTMLTexture){if(`texElementImage2D`in i){let gt=i.canvas;if(gt.hasAttribute(`layoutsubtree`)||gt.setAttribute(`layoutsubtree`,`true`),W.parentNode!==gt){gt.appendChild(W),_.add(h),gt.onpaint=Gt=>{let $t=Gt.changedElements;for(let wt of _)$t.includes(wt.image)&&(wt.needsUpdate=!0)},gt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,W);else{let $t=i.RGBA,wt=i.RGBA,ce=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,$t,wt,ce,W)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(_t.length>0){if(xt&&St){let gt=U(_t[0]);e.texStorage2D(i.TEXTURE_2D,Qt,ot,gt.width,gt.height)}for(let gt=0,Gt=_t.length;gt<Gt;gt++)rt=_t[gt],xt?zt&&e.texSubImage2D(i.TEXTURE_2D,gt,0,0,ct,P,rt):e.texImage2D(i.TEXTURE_2D,gt,ot,ct,P,rt);h.generateMipmaps=!1}else if(xt){if(St){let gt=U(W);e.texStorage2D(i.TEXTURE_2D,Qt,ot,gt.width,gt.height)}zt&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ct,P,W)}else e.texImage2D(i.TEXTURE_2D,0,ot,ct,P,W);F(h)&&h.mipmapsAutoUpdate===!0&&C(z),J.__version=q.version,h.onUpdate&&h.onUpdate(h)}v.__version=h.version}function Ut(v,h,w){if(h.image.length!==6)return;let z=mt(v,h),O=h.source;e.bindTexture(i.TEXTURE_CUBE_MAP,v.__webglTexture,i.TEXTURE0+w);let q=n.get(O);if(O.version!==q.__version||z===!0){e.activeTexture(i.TEXTURE0+w);let J=ne.getPrimaries(ne.workingColorSpace),V=h.colorSpace===Cn?null:ne.getPrimaries(h.colorSpace),W=h.colorSpace===Cn||J===V?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,h.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,h.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,h.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,W);let ct=h.isCompressedTexture||h.image[0].isCompressedTexture,P=h.image[0]&&h.image[0].isDataTexture,ot=[];for(let wt=0;wt<6;wt++)!ct&&!P?ot[wt]=R(h.image[wt],!0,s.maxCubemapSize):ot[wt]=P?h.image[wt].image:h.image[wt],ot[wt]=L(h,ot[wt]);let rt=ot[0],_t=r.convert(h.format,h.colorSpace),xt=r.convert(h.type),St=I(h.internalFormat,_t,xt,h.normalized,h.colorSpace),zt=h.isVideoTexture!==!0,Qt=q.__version===void 0||z===!0,gt=O.dataReady,Gt=T(h,rt);nt(i.TEXTURE_CUBE_MAP,h);let $t;if(h.isDepthTexture){if(St=y(h.format===Rn,h.type),Qt)if(zt)e.texStorage2D(i.TEXTURE_CUBE_MAP,1,St,rt.width,rt.height);else for(let wt=0;wt<6;wt++)e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,St,rt.width,rt.height,0,_t,xt,null)}else if(ct){zt&&Qt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Gt,St,rt.width,rt.height);for(let wt=0;wt<6;wt++){$t=ot[wt].mipmaps;for(let ce=0;ce<$t.length;ce++){let be=$t[ce];h.format!==cn?_t!==null?zt?gt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce,0,0,be.width,be.height,_t,be.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce,St,be.width,be.height,0,be.data):Wt(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):zt?gt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce,0,0,be.width,be.height,_t,xt,be.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce,St,be.width,be.height,0,_t,xt,be.data)}}}else{if($t=h.mipmaps,zt&&Qt){$t.length>0&&Gt++;let wt=U(ot[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Gt,St,wt.width,wt.height)}for(let wt=0;wt<6;wt++)if(P){zt?gt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,0,0,ot[wt].width,ot[wt].height,_t,xt,ot[wt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,St,ot[wt].width,ot[wt].height,0,_t,xt,ot[wt].data);for(let ce=0;ce<$t.length;ce++){let Pn=$t[ce].image[wt].image;zt?gt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce+1,0,0,Pn.width,Pn.height,_t,xt,Pn.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce+1,St,Pn.width,Pn.height,0,_t,xt,Pn.data)}}else{zt?gt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,0,0,_t,xt,ot[wt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,0,St,_t,xt,ot[wt]);for(let ce=0;ce<$t.length;ce++){let be=$t[ce];zt?gt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce+1,0,0,_t,xt,be.image[wt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+wt,ce+1,St,_t,xt,be.image[wt])}}}F(h)&&h.mipmapsAutoUpdate===!0&&C(i.TEXTURE_CUBE_MAP),q.__version=O.version,h.onUpdate&&h.onUpdate(h)}v.__version=h.version}function Ot(v,h,w,z,O,q){let J=r.convert(w.format,w.colorSpace),V=r.convert(w.type),W=I(w.internalFormat,J,V,w.normalized,w.colorSpace),ct=n.get(h),P=n.get(w);if(P.__renderTarget=h,!ct.__hasExternalTextures){let ot=Math.max(1,h.width>>q),rt=Math.max(1,h.height>>q);O===i.TEXTURE_3D||O===i.TEXTURE_2D_ARRAY?e.texImage3D(O,q,W,ot,rt,h.depth,0,J,V,null):e.texImage2D(O,q,W,ot,rt,0,J,V,null)}e.bindFramebuffer(i.FRAMEBUFFER,v),b(h)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,z,O,P.__webglTexture,0,S(h)):(O===i.TEXTURE_2D||O>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&O<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,z,O,P.__webglTexture,q),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ae(v,h,w){if(i.bindRenderbuffer(i.RENDERBUFFER,v),h.depthBuffer){let z=h.depthTexture,O=z&&z.isDepthTexture?z.type:null,q=y(h.stencilBuffer,O),J=h.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;b(h)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,S(h),q,h.width,h.height):w?i.renderbufferStorageMultisample(i.RENDERBUFFER,S(h),q,h.width,h.height):i.renderbufferStorage(i.RENDERBUFFER,q,h.width,h.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,v)}else{let z=h.textures;for(let O=0;O<z.length;O++){let q=z[O],J=r.convert(q.format,q.colorSpace),V=r.convert(q.type),W=I(q.internalFormat,J,V,q.normalized,q.colorSpace);b(h)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,S(h),W,h.width,h.height):w?i.renderbufferStorageMultisample(i.RENDERBUFFER,S(h),W,h.width,h.height):i.renderbufferStorage(i.RENDERBUFFER,W,h.width,h.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Jt(v,h,w){let z=h.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,v),!(h.depthTexture&&h.depthTexture.isDepthTexture))throw new Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let O=n.get(h.depthTexture);O.__renderTarget=h;let q=z?h.depthTexture.image[0]:h.depthTexture.image;(!O.__webglTexture||q.width!==h.width||q.height!==h.height)&&(q.width=h.width,q.height=h.height,h.depthTexture.needsUpdate=!0),z?yt(h.depthTexture,0):vt(h.depthTexture,0);let J=O.__webglTexture,V=S(h),W=z?i.TEXTURE_CUBE_MAP_POSITIVE_X+w:i.TEXTURE_2D,ct=h.depthTexture.format===Rn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(h.depthTexture.format===Tn)b(h)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ct,W,J,0,V):i.framebufferTexture2D(i.FRAMEBUFFER,ct,W,J,0);else if(h.depthTexture.format===Rn)b(h)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ct,W,J,0,V):i.framebufferTexture2D(i.FRAMEBUFFER,ct,W,J,0);else throw new Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ht(v){let h=n.get(v),w=v.isWebGLCubeRenderTarget===!0;if(h.__boundDepthTexture!==v.depthTexture){let z=v.depthTexture;if(h.__depthDisposeCallback&&h.__depthDisposeCallback(),z){let O=()=>{delete h.__boundDepthTexture,delete h.__depthDisposeCallback,z.removeEventListener(`dispose`,O)};z.addEventListener(`dispose`,O),h.__depthDisposeCallback=O}h.__boundDepthTexture=z}if(v.depthTexture&&!h.__autoAllocateDepthBuffer)if(w)for(let z=0;z<6;z++)Jt(h.__webglFramebuffer[z],v,z);else v.texture.mipmaps.length>0?Jt(h.__webglFramebuffer[0],v,0):Jt(h.__webglFramebuffer,v,0);else if(w){h.__webglDepthbuffer=[];for(let z=0;z<6;z++)if(e.bindFramebuffer(i.FRAMEBUFFER,h.__webglFramebuffer[z]),h.__webglDepthbuffer[z]===void 0)h.__webglDepthbuffer[z]=i.createRenderbuffer(),ae(h.__webglDepthbuffer[z],v,!1);else{let O=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,q=h.__webglDepthbuffer[z];i.bindRenderbuffer(i.RENDERBUFFER,q),i.framebufferRenderbuffer(i.FRAMEBUFFER,O,i.RENDERBUFFER,q)}}else if(v.texture.mipmaps.length>0?e.bindFramebuffer(i.FRAMEBUFFER,h.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,h.__webglFramebuffer),h.__webglDepthbuffer===void 0)h.__webglDepthbuffer=i.createRenderbuffer(),ae(h.__webglDepthbuffer,v,!1);else{let O=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,q=h.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,q),i.framebufferRenderbuffer(i.FRAMEBUFFER,O,i.RENDERBUFFER,q)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Yt(v,h,w){let z=n.get(v);h!==void 0&&Ot(z.__webglFramebuffer,v,v.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),w!==void 0&&Ht(v)}function Bt(v){let h=v.texture,w=n.get(v),z=n.get(h);v.addEventListener(`dispose`,Q),Y(v);let O=v.textures,q=v.isWebGLCubeRenderTarget===!0,J=O.length>1;if(J||(z.__webglTexture===void 0&&(z.__webglTexture=i.createTexture()),z.__version=h.version,o.memory.textures++),q){w.__webglFramebuffer=[];for(let V=0;V<6;V++)if(h.mipmaps.length>0){w.__webglFramebuffer[V]=[];for(let W=0;W<h.mipmaps.length;W++)w.__webglFramebuffer[V][W]=i.createFramebuffer()}else w.__webglFramebuffer[V]=i.createFramebuffer()}else{if(h.mipmaps.length>0){w.__webglFramebuffer=[];for(let V=0;V<h.mipmaps.length;V++)w.__webglFramebuffer[V]=i.createFramebuffer()}else w.__webglFramebuffer=i.createFramebuffer();if(J)for(let V=0,W=O.length;V<W;V++){let ct=n.get(O[V]);ct.__webglTexture===void 0&&(ct.__webglTexture=i.createTexture(),o.memory.textures++)}if(v.samples>0&&b(v)===!1){w.__webglMultisampledFramebuffer=i.createFramebuffer(),w.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,w.__webglMultisampledFramebuffer);for(let V=0;V<O.length;V++){let W=O[V];w.__webglColorRenderbuffer[V]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,w.__webglColorRenderbuffer[V]);let ct=r.convert(W.format,W.colorSpace),P=r.convert(W.type),ot=I(W.internalFormat,ct,P,W.normalized,W.colorSpace,v.isXRRenderTarget===!0),rt=S(v);i.renderbufferStorageMultisample(i.RENDERBUFFER,rt,ot,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+V,i.RENDERBUFFER,w.__webglColorRenderbuffer[V])}i.bindRenderbuffer(i.RENDERBUFFER,null),v.depthBuffer&&(w.__webglDepthRenderbuffer=i.createRenderbuffer(),ae(w.__webglDepthRenderbuffer,v,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(q){e.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture),nt(i.TEXTURE_CUBE_MAP,h);for(let V=0;V<6;V++)if(h.mipmaps.length>0)for(let W=0;W<h.mipmaps.length;W++)Ot(w.__webglFramebuffer[V][W],v,h,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+V,W);else Ot(w.__webglFramebuffer[V],v,h,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+V,0);F(h)?C(i.TEXTURE_CUBE_MAP):h.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,h.mipmaps.length-1),e.unbindTexture()}else if(J){for(let V=0,W=O.length;V<W;V++){let ct=O[V],P=n.get(ct),ot=i.TEXTURE_2D;(v.isWebGL3DRenderTarget||v.isWebGLArrayRenderTarget)&&(ot=v.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,P.__webglTexture),nt(ot,ct),Ot(w.__webglFramebuffer,v,ct,i.COLOR_ATTACHMENT0+V,ot,0),F(ct)&&C(ot)}e.unbindTexture()}else{let V=i.TEXTURE_2D;if((v.isWebGL3DRenderTarget||v.isWebGLArrayRenderTarget)&&(V=v.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(V,z.__webglTexture),nt(V,h),h.mipmaps.length>0)for(let W=0;W<h.mipmaps.length;W++)Ot(w.__webglFramebuffer[W],v,h,i.COLOR_ATTACHMENT0,V,W);else Ot(w.__webglFramebuffer,v,h,i.COLOR_ATTACHMENT0,V,0);F(h)?C(V):h.mipmaps.length>0&&i.texParameteri(V,i.TEXTURE_MAX_LEVEL,h.mipmaps.length-1),e.unbindTexture()}v.depthBuffer&&Ht(v)}function k(v){let h=v.textures;for(let w=0,z=h.length;w<z;w++){let O=h[w];if(F(O)&&O.mipmapsAutoUpdate===!0){let q=N(v),J=n.get(O).__webglTexture;e.bindTexture(q,J),C(q),e.unbindTexture()}}}let p=[];function M(v){if(v.samples>0){if(b(v)===!1){let h=v.textures,w=v.width,z=v.height,O=i.COLOR_BUFFER_BIT,q=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,J=n.get(v),V=h.length>1;if(V)for(let ct=0;ct<h.length;ct++)e.bindFramebuffer(i.FRAMEBUFFER,J.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,J.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,J.__webglMultisampledFramebuffer),v.texture.mipmaps.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,J.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,J.__webglFramebuffer);for(let ct=0;ct<h.length;ct++){if(v.resolveDepthBuffer&&(v.depthBuffer&&(O|=i.DEPTH_BUFFER_BIT),v.stencilBuffer&&v.resolveStencilBuffer&&(O|=i.STENCIL_BUFFER_BIT)),V){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,J.__webglColorRenderbuffer[ct]);let P=n.get(h[ct]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,P,0)}i.blitFramebuffer(0,0,w,z,0,0,w,z,O,i.NEAREST),c===!0&&(p.length=0,p.push(i.COLOR_ATTACHMENT0+ct),v.depthBuffer&&v.storeMultisampledDepthBuffer===!1&&p.push(q),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,p))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),V)for(let ct=0;ct<h.length;ct++){e.bindFramebuffer(i.FRAMEBUFFER,J.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,J.__webglColorRenderbuffer[ct]);let P=n.get(h[ct]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,J.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,P,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,J.__webglMultisampledFramebuffer)}else if(v.depthBuffer&&v.storeMultisampledDepthBuffer===!1&&c){let h=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[h])}}}function S(v){return Math.min(s.maxSamples,v.samples)}function b(v){let h=n.get(v);return v.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&h.__useRenderToTexture!==!1}function D(v){let h=o.render.frame;d.get(v)!==h&&(d.set(v,h),v.update())}function L(v,h){let w=v.colorSpace,z=v.format,O=v.type;return v.isCompressedTexture===!0||v.isVideoTexture===!0||w!==Ji&&w!==Cn&&(ne.getTransfer(w)===le?(z!==cn||O!==Ze)&&Wt(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):Xt(`WebGLTextures: Unsupported texture color space:`,w)),h}function U(v){return typeof HTMLImageElement<`u`&&v instanceof HTMLImageElement?(l.width=v.naturalWidth||v.width,l.height=v.naturalHeight||v.height):typeof VideoFrame<`u`&&v instanceof VideoFrame?(l.width=v.displayWidth,l.height=v.displayHeight):(l.width=v.width,l.height=v.height),l}this.allocateTextureUnit=kt,this.resetTextureUnits=ht,this.getTextureUnits=ft,this.setTextureUnits=Rt,this.setTexture2D=vt,this.setTexture2DArray=Tt,this.setTexture3D=Pt,this.setTextureCube=yt,this.rebindTextures=Yt,this.setupRenderTarget=Bt,this.updateRenderTargetMipmap=k,this.updateMultisampleRenderTarget=M,this.setupDepthRenderbuffer=Ht,this.setupFrameBufferTexture=Ot,this.useMultisampledRTT=b,this.dispose=it}function Sm(i,t){function e(n,s=Cn){let r,o=ne.getTransfer(s);if(n===Ze)return i.UNSIGNED_BYTE;if(n===Nr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ur)return i.UNSIGNED_SHORT_5_5_5_1;if(n===ma)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===ga)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===fa)return i.BYTE;if(n===pa)return i.SHORT;if(n===Fi)return i.UNSIGNED_SHORT;if(n===Dr)return i.INT;if(n===on)return i.UNSIGNED_INT;if(n===an)return i.FLOAT;if(n===ln)return i.HALF_FLOAT;if(n===_a)return i.ALPHA;if(n===xa)return i.RGB;if(n===cn)return i.RGBA;if(n===Tn)return i.DEPTH_COMPONENT;if(n===Rn)return i.DEPTH_STENCIL;if(n===va)return i.RED;if(n===Fr)return i.RED_INTEGER;if(n===Xn)return i.RG;if(n===Or)return i.RG_INTEGER;if(n===Br)return i.RGBA_INTEGER;if(n===fs||n===ps||n===ms||n===gs)if(o===le)if(r=t.get(`WEBGL_compressed_texture_s3tc_srgb`),r!==null){if(n===fs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ms)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get(`WEBGL_compressed_texture_s3tc`),r!==null){if(n===fs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ms)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===gs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===zr||n===kr||n===Hr||n===Gr)if(r=t.get(`WEBGL_compressed_texture_pvrtc`),r!==null){if(n===zr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===kr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Hr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Gr)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Vr||n===Wr||n===Xr||n===qr||n===Yr||n===_s||n===Zr)if(r=t.get(`WEBGL_compressed_texture_etc`),r!==null){if(n===Vr||n===Wr)return o===le?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Xr)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===qr)return r.COMPRESSED_R11_EAC;if(n===Yr)return r.COMPRESSED_SIGNED_R11_EAC;if(n===_s)return r.COMPRESSED_RG11_EAC;if(n===Zr)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Jr||n===$r||n===Kr||n===Qr||n===jr||n===to||n===eo||n===no||n===io||n===so||n===ro||n===oo||n===ao||n===lo)if(r=t.get(`WEBGL_compressed_texture_astc`),r!==null){if(n===Jr)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===$r)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Kr)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Qr)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===jr)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===to)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===eo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===no)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===io)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===so)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ro)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===oo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ao)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===lo)return o===le?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===co||n===ho||n===uo)if(r=t.get(`EXT_texture_compression_bptc`),r!==null){if(n===co)return o===le?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ho)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===uo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===fo||n===po||n===xs||n===mo)if(r=t.get(`EXT_texture_compression_rgtc`),r!==null){if(n===fo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===po)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===xs)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===mo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ci?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var bm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`;var Em=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;var za=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new os(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Ge({vertexShader:bm,fragmentShader:Em,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ke(new as(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}};var ka=class extends dn{constructor(t,e){super();let n=this,s=null,r=1,o=null,a=`local-floor`,c=1,l=null,d=null,_=null,u=null,m=null,x=null,A=typeof XRWebGLBinding<`u`,g=new za,f={},R=e.getContextAttributes(),F=null,C=null,N=[],I=[],y=new re,T=null,Y=null,H=new Re;H.viewport=new ge;let X=new Re;X.viewport=new ge;let Q=[H,X],st=new Cr,B=null,it=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(lt){let vt=N[lt];return vt===void 0&&(vt=new Ci,N[lt]=vt),vt.getTargetRaySpace()},this.getControllerGrip=function(lt){let vt=N[lt];return vt===void 0&&(vt=new Ci,N[lt]=vt),vt.getGripSpace()},this.getHand=function(lt){let vt=N[lt];return vt===void 0&&(vt=new Ci,N[lt]=vt),vt.getHandSpace()};function at(lt){let vt=I.indexOf(lt.inputSource);if(vt===-1)return;let Tt=N[vt];Tt!==void 0&&(Tt.update(lt.inputSource,lt.frame,l||o),Tt.dispatchEvent({type:lt.type,data:lt.inputSource}))}function $(){s.removeEventListener(`select`,at),s.removeEventListener(`selectstart`,at),s.removeEventListener(`selectend`,at),s.removeEventListener(`squeeze`,at),s.removeEventListener(`squeezestart`,at),s.removeEventListener(`squeezeend`,at),s.removeEventListener(`end`,$),s.removeEventListener(`inputsourceschange`,dt);for(let lt=0;lt<N.length;lt++){let vt=I[lt];vt!==null&&(I[lt]=null,N[lt].disconnect(vt))}B=null,it=null,g.reset();for(let lt in f)delete f[lt];if(t.setRenderTarget(F),m=null,u=null,_=null,s=null,C=null,kt.stop(),n.isPresenting=!1,t.setPixelRatio(T),t.setSize(y.width,y.height,!1),Y!==null){let lt=Y.camera;lt.fov=Y.fov,lt.zoom=Y.zoom,lt.updateProjectionMatrix(),Y=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(lt){r=lt,n.isPresenting===!0&&Wt(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(lt){a=lt,n.isPresenting===!0&&Wt(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(lt){l=lt},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return _===null&&A&&(_=new XRWebGLBinding(s,e)),_},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(lt){if(s=lt,s!==null){if(F=t.getRenderTarget(),s.addEventListener(`select`,at),s.addEventListener(`selectstart`,at),s.addEventListener(`selectend`,at),s.addEventListener(`squeeze`,at),s.addEventListener(`squeezestart`,at),s.addEventListener(`squeezeend`,at),s.addEventListener(`end`,$),s.addEventListener(`inputsourceschange`,dt),R.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(y),A&&`createProjectionLayer`in XRWebGLBinding.prototype){let Tt=null,Pt=null,yt=null;R.depth&&(yt=R.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Tt=R.stencil?Rn:Tn,Pt=R.stencil?ci:on);let Vt={colorFormat:e.RGBA8,depthFormat:yt,scaleFactor:r};_=this.getBinding(),u=_.createProjectionLayer(Vt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),C=new Xe(u.textureWidth,u.textureHeight,{format:cn,type:Ze,depthTexture:new wn(u.textureWidth,u.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,Tt),stencilBuffer:R.stencil,colorSpace:t.outputColorSpace,samples:R.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let Tt={antialias:R.antialias,alpha:!0,depth:R.depth,stencil:R.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,Tt),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),C=new Xe(m.framebufferWidth,m.framebufferHeight,{format:cn,type:Ze,colorSpace:t.outputColorSpace,stencilBuffer:R.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}C.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),kt.setContext(s),kt.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function dt(lt){for(let vt=0;vt<lt.removed.length;vt++){let Tt=lt.removed[vt],Pt=I.indexOf(Tt);Pt>=0&&(I[Pt]=null,N[Pt].disconnect(Tt))}for(let vt=0;vt<lt.added.length;vt++){let Tt=lt.added[vt],Pt=I.indexOf(Tt);if(Pt===-1){for(let Vt=0;Vt<N.length;Vt++)if(Vt>=I.length){I.push(Tt),Pt=Vt;break}else if(I[Vt]===null){I[Vt]=Tt,Pt=Vt;break}if(Pt===-1)break}let yt=N[Pt];yt&&yt.connect(Tt)}}function j(lt,vt){vt===null?lt.matrixWorld.copy(lt.matrix):lt.matrixWorld.multiplyMatrices(vt.matrixWorld,lt.matrix),lt.matrixWorldInverse.copy(lt.matrixWorld).invert()}this.updateCamera=function(lt){if(s===null)return;let vt=lt.near,Tt=lt.far;g.texture!==null&&(g.depthNear>0&&(vt=g.depthNear),g.depthFar>0&&(Tt=g.depthFar)),st.near=X.near=H.near=vt,st.far=X.far=H.far=Tt,(B!==st.near||it!==st.far)&&(s.updateRenderState({depthNear:st.near,depthFar:st.far}),B=st.near,it=st.far),st.layers.mask=lt.layers.mask|6,H.layers.mask=st.layers.mask&-5,X.layers.mask=st.layers.mask&-3;let Pt=lt.parent,yt=st.cameras;j(st,Pt);for(let Vt=0;Vt<yt.length;Vt++)j(yt[Vt],Pt);st.projectionMatrix.copy(H.projectionMatrix),st.projectionMatrixInverse.copy(H.projectionMatrixInverse),Y===null&&lt.isPerspectiveCamera&&(Y={camera:lt,fov:lt.fov,zoom:lt.zoom}),ht(lt,st,Pt)};function ht(lt,vt,Tt){Tt===null?lt.matrix.copy(vt.matrixWorld):(lt.matrix.copy(Tt.matrixWorld),lt.matrix.invert(),lt.matrix.multiply(vt.matrixWorld)),lt.matrix.decompose(lt.position,lt.quaternion,lt.scale),lt.updateMatrixWorld(!0),lt.projectionMatrix.copy(vt.projectionMatrix),lt.projectionMatrixInverse.copy(vt.projectionMatrixInverse),lt.isPerspectiveCamera&&(lt.fov=lr*2*Math.atan(1/lt.projectionMatrix.elements[5]),lt.zoom=1)}this.getCamera=function(){return st},this.getFoveation=function(){if(!(u===null&&m===null))return c},this.setFoveation=function(lt){c=lt,u!==null&&(u.fixedFoveation=lt),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=lt)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(st)},this.getCameraTexture=function(lt){return f[lt]};let ft=null;function Rt(lt,vt){if(d=vt.getViewerPose(l||o),x=vt,d!==null){let Tt=d.views;m!==null&&(t.setRenderTargetFramebuffer(C,m.framebuffer),t.setRenderTarget(C));let Pt=!1;Tt.length!==st.cameras.length&&(st.cameras.length=0,Pt=!0);for(let It=0;It<Tt.length;It++){let nt=Tt[It],mt=null;if(m!==null)mt=m.getViewport(nt);else{let pt=_.getViewSubImage(u,nt);mt=pt.viewport,It===0&&(t.setRenderTargetTextures(C,pt.colorTexture,pt.depthStencilTexture),t.setRenderTarget(C))}let ut=Q[It];ut===void 0&&(ut=new Re,ut.layers.enable(It),ut.viewport=new ge,Q[It]=ut),ut.matrix.fromArray(nt.transform.matrix),ut.matrix.decompose(ut.position,ut.quaternion,ut.scale),ut.projectionMatrix.fromArray(nt.projectionMatrix),ut.projectionMatrixInverse.copy(ut.projectionMatrix).invert(),ut.viewport.set(mt.x,mt.y,mt.width,mt.height),It===0&&(st.matrix.copy(ut.matrix),st.matrix.decompose(st.position,st.quaternion,st.scale)),Pt===!0&&st.cameras.push(ut)}let yt=s.enabledFeatures;if(yt&&yt.includes(`depth-sensing`)&&s.depthUsage==`gpu-optimized`&&A){_=n.getBinding();let It=_.getDepthInformation(Tt[0]);It&&It.isValid&&It.texture&&g.init(It,s.renderState)}if(yt&&yt.includes(`camera-access`)&&A){t.state.unbindTexture(),_=n.getBinding();for(let It=0;It<Tt.length;It++){let nt=Tt[It].camera;if(nt){let mt=f[nt];mt||(mt=new os,f[nt]=mt);let ut=_.getCameraImage(nt);mt.sourceTexture=ut}}}}for(let Tt=0;Tt<N.length;Tt++){let Pt=I[Tt],yt=N[Tt];Pt!==null&&yt!==void 0&&yt.update(Pt,vt,l||o)}ft&&ft(lt,vt),vt.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:vt}),x=null}let kt=new Oc;kt.setAnimationLoop(Rt),this.setAnimationLoop=function(lt){ft=lt},this.dispose=function(){}}};var Tm=new me;var Yc=new qt;Yc.set(-1,0,0,0,1,0,0,0,1);function wm(i,t){function e(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function n(g,f){f.color.getRGB(g.fogColor.value,Aa(i)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function s(g,f,R,F,C){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?r(g,f):f.isMeshLambertMaterial?(r(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(r(g,f),_(g,f)):f.isMeshPhongMaterial?(r(g,f),d(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(r(g,f),u(g,f),f.isMeshPhysicalMaterial&&m(g,f,C)):f.isMeshMatcapMaterial?(r(g,f),x(g,f)):f.isMeshDepthMaterial?r(g,f):f.isMeshDistanceMaterial?(r(g,f),A(g,f)):f.isMeshNormalMaterial?r(g,f):f.isLineBasicMaterial?(o(g,f),f.isLineDashedMaterial&&a(g,f)):f.isPointsMaterial?c(g,f,R,F):f.isSpriteMaterial?l(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,e(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===Oe&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,e(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===Oe&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,e(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,e(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);let R=t.get(f),F=R.envMap,C=R.envMapRotation;F&&(g.envMap.value=F,g.envMapRotation.value.setFromMatrix4(Tm.makeRotationFromEuler(C)).transpose(),F.isCubeTexture&&F.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Yc),g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,g.aoMapTransform))}function o(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform))}function a(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function c(g,f,R,F){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*R,g.scale.value=F*.5,f.map&&(g.map.value=f.map,e(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function l(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function d(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function _(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function u(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function m(g,f,R){g.ior.value=f.ior,f.diffuseRoughness>0&&(g.diffuseRoughness.value=f.diffuseRoughness,f.diffuseRoughnessMap&&(g.diffuseRoughnessMap.value=f.diffuseRoughnessMap,e(f.diffuseRoughnessMap,g.diffuseRoughnessMapTransform))),f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Oe&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.retroreflectivity>0&&(g.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessMinimum,g.iridescenceThicknessMaximum.value=f.iridescenceThicknessMaximum,f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=R.texture,g.transmissionSamplerSize.value.set(R.width,R.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,g.specularIntensityMapTransform))}function x(g,f){f.matcap&&(g.matcap.value=f.matcap)}function A(g,f){let R=t.get(f).light;g.referencePosition.value.setFromMatrixPosition(R.matrixWorld),g.nearDistance.value=R.shadow.camera.near,g.farDistance.value=R.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Am(i,t,e,n){let s={},r={};function o(R,F){let C=F.program;n.uniformBlockBinding(R,C,s[R.id])}function a(R,F){let C=s[R.id];C===void 0&&(x(R),C=c(R),s[R.id]=C,R.addEventListener(`dispose`,g));let N=F.program;n.updateUBOMapping(R,N);let I=t.render.frame;r[R.id]!==I&&(l(R),r[R.id]=I)}function c(R){let F=i.createBuffer(),C=R.__size,N=R.usage;return i.bindBuffer(i.UNIFORM_BUFFER,F),i.bufferData(i.UNIFORM_BUFFER,C,N),i.bindBuffer(i.UNIFORM_BUFFER,null),F}function l(R){let F=s[R.id],C=R.uniforms,N=R.__cache;i.bindBuffer(i.UNIFORM_BUFFER,F);for(let I=0,y=C.length;I<y;I++){let T=C[I];if(Array.isArray(T))for(let Y=0,H=T.length;Y<H;Y++)d(T[Y],I,Y,N);else d(T,I,0,N)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(R,F,C,N){if(u(R,F,C,N)===!0){let I=R.__offset,y=R.value;if(Array.isArray(y)){let T=0;for(let Y=0;Y<y.length;Y++){let H=y[Y],X=A(H,!0);_(H,R.__data,T),T+=X.storage/Float32Array.BYTES_PER_ELEMENT}}else _(y,R.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,I,R.__data)}}function _(R,F,C){typeof R==`number`||typeof R==`boolean`?F[C]=R:R.isMatrix3?(F[C]=R.elements[0],F[C+1]=R.elements[1],F[C+2]=R.elements[2],F[C+3]=0,F[C+4]=R.elements[3],F[C+5]=R.elements[4],F[C+6]=R.elements[5],F[C+7]=0,F[C+8]=R.elements[6],F[C+9]=R.elements[7],F[C+10]=R.elements[8],F[C+11]=0):ArrayBuffer.isView(R)?F.set(R.subarray(0,F.length-C),C):R.toArray(F,C)}function u(R,F,C,N){let I=R.value,y=F+`_`+C;if(Array.isArray(I)){N[y]===void 0&&(N[y]=[]);let T=N[y],Y=!1;for(let H=0;H<I.length;H++)m(I[H],T,H)===!0&&(Y=!0);return Y}return m(I,N,y)}function m(R,F,C){if(F[C]===void 0)return typeof R==`number`||typeof R==`boolean`?F[C]=R:ArrayBuffer.isView(R)?F[C]=R.slice():F[C]=R.clone(),!0;{let N=F[C];if(typeof R==`number`||typeof R==`boolean`){if(N!==R)return F[C]=R,!0}else{if(ArrayBuffer.isView(R))return!0;if(N.equals(R)===!1)return N.copy(R),!0}}return!1}function x(R){let F=R.uniforms,C=0,N=16;for(let y=0,T=F.length;y<T;y++){let Y=Array.isArray(F[y])?F[y]:[F[y]];for(let H=0,X=Y.length;H<X;H++){let Q=Y[H],st=Array.isArray(Q.value)?Q.value:[Q.value],B=Array.isArray(F[y])||Array.isArray(Q.value),it=C;for(let $=0,dt=st.length;$<dt;$++){let j=st[$],ht=A(j,B),ft=C%N,Rt=ft%ht.boundary,kt=ft+Rt;C+=Rt,kt!==0&&N-kt<ht.storage&&(C+=N-kt),$===0&&(it=C),C+=ht.storage}Q.__data=new(Q.type===`int`?Int32Array:Q.type===`uint`?Uint32Array:Float32Array)((C-it)/Float32Array.BYTES_PER_ELEMENT),Q.__offset=it}}let I=C%N;return I>0&&(C+=N-I),R.__size=C,R.__cache={},this}function A(R,F){let C={boundary:0,storage:0};return typeof R==`number`||typeof R==`boolean`?(C.boundary=4,C.storage=4):R.isVector2?(C.boundary=8,C.storage=8):R.isVector3||R.isColor?(C.boundary=16,C.storage=12):R.isVector4?(C.boundary=16,C.storage=16):R.isMatrix3?(C.boundary=16,C.storage=48):R.isMatrix4?(C.boundary=16,C.storage=64):R.isTexture?Wt(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(R)?(C.boundary=16,C.storage=R.byteLength):Wt(`WebGLRenderer: Unsupported uniform value type.`,R),F===!0&&(C.boundary=16,C.storage=Math.ceil(C.storage/16)*16),C}function g(R){let F=R.target;F.removeEventListener(`dispose`,g),i.deleteBuffer(s[F.id]),delete s[F.id],delete r[F.id]}function f(){for(let R in s)i.deleteBuffer(s[R]);s={},r={}}return{bind:o,update:a,dispose:f}}var Rm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);var mn=null;function Cm(){return mn===null&&(mn=new dr(Rm,16,16,Xn,ln),mn.name=`DFG_LUT`,mn.minFilter=Fe,mn.magFilter=Fe,mn.wrapS=un,mn.wrapT=un,mn.generateMipmaps=!1,mn.needsUpdate=!0),mn}var Bi=class{constructor(t={}){let{canvas:e=ac(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:d=`default`,failIfMajorPerformanceCaveat:_=!1,reversedDepthBuffer:u=!1,outputBufferType:m=Ze}=t;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw new Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);x=n.getContextAttributes().alpha}else x=o;let A=m,g=new Set([Br,Or,Fr]),f=new Set([Ze,on,Fi,ci,Nr,Ur]),R=new Uint32Array(4),F=new Int32Array(4),C={textures:[],min:[],max:[],resolution:[]},N=null,I=null,y=[],T=[],Y=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=pn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let H=this,X=!1,Q=null,st=null,B=null,it=null;this._outputColorSpace=ye;let at=0,$=0,dt=null,j=-1,ht=null,ft=new ge,Rt=new ge,kt=null,lt=new Kt(0),vt=0,Tt=e.width,Pt=e.height,yt=1,Vt=null,ue=null,It=new ge(0,0,Tt,Pt),nt=new ge(0,0,Tt,Pt),mt=!1,ut=new ii,pt=new fr,Mt=!1,Ut=!1,Ot=new me,ae=new et,Jt=new ge,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Yt=!1;function Bt(){return dt===null?yt:1}let k=n;function p(E,G){return e.getContext(E,G)}let M,S,b,D,L,U,v,h,w,z,O,q,J,V,W,ct,P,ot,rt,_t,xt,St,zt;try{let E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:_};if(`setAttribute`in e&&e.setAttribute(`data-engine`,`three.js r187`),e.addEventListener(`webglcontextlost`,Gt,!1),e.addEventListener(`webglcontextrestored`,$t,!1),e.addEventListener(`webglcontextcreationerror`,wt,!1),k===null){let G=`webgl2`;if(k=p(G,E),k===null)throw p(G)?new Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):new Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Qt()}catch(E){throw e.removeEventListener(`webglcontextlost`,Gt,!1),e.removeEventListener(`webglcontextrestored`,$t,!1),e.removeEventListener(`webglcontextcreationerror`,wt,!1),Xt(`WebGLRenderer: `+E.message),E}function Qt(){M=new kf(k),M.init(),xt=new Sm(k,M),S=new Cf(k,M,t,xt),b=new ym(k,M),S.reversedDepthBuffer&&u&&b.buffers.depth.setReversed(!0),st=k.createFramebuffer(),B=k.createFramebuffer(),it=k.createFramebuffer(),D=new Vf(k),L=new om,U=new Mm(k,M,b,L,S,xt,D),v=new zf(H),h=new Wh(k),St=new Af(k,h),w=new Hf(k,h,D,St),z=new Xf(k,w,h,St,D),ot=new Wf(k,S,U),W=new Pf(L),O=new rm(H,v,M,S,St,W),q=new wm(H,L),J=new lm,V=new pm(M),P=new wf(H,v,b,z,x,c),ct=new vm(H,z,S),zt=new Am(k,D,S,b),rt=new Rf(k,M,D),_t=new Gf(k,M,D),D.programs=O.programs,H.capabilities=S,H.extensions=M,H.properties=L,H.renderLists=J,H.shadowMap=ct,H.state=b,H.info=D}A!==Ze&&(Y=new Yf(A,e.width,e.height,a,s,r));let gt=new ka(H,k);this.xr=gt,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){let E=M.get(`WEBGL_lose_context`);E&&E.loseContext()},this.forceContextRestore=function(){let E=M.get(`WEBGL_lose_context`);E&&E.restoreContext()},this.getPixelRatio=function(){return yt},this.setPixelRatio=function(E){E!==void 0&&(yt=E,this.setSize(Tt,Pt,!1))},this.getSize=function(E){return E.set(Tt,Pt)},this.setSize=function(E,G,tt=!0){if(gt.isPresenting){Wt(`WebGLRenderer: Can't change size while VR device is presenting.`);return}Tt=E,Pt=G,e.width=Math.floor(E*yt),e.height=Math.floor(G*yt),tt===!0&&(e.style.width=E+`px`,e.style.height=G+`px`),Y!==null&&Y.setSize(e.width,e.height),this.setViewport(0,0,E,G)},this.getDrawingBufferSize=function(E){return E.set(Tt*yt,Pt*yt).floor()},this.setDrawingBufferSize=function(E,G,tt){Tt=E,Pt=G,yt=tt,e.width=Math.floor(E*tt),e.height=Math.floor(G*tt),this.setViewport(0,0,E,G)},this.setEffects=function(E){if(A===Ze){Xt(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(E){for(let G=0;G<E.length;G++)if(E[G].isOutputPass===!0){Wt(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}Y.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(ft)},this.getViewport=function(E){return E.copy(It)},this.setViewport=function(E,G,tt,Z){E.isVector4?It.set(E.x,E.y,E.z,E.w):It.set(E,G,tt,Z),b.viewport(ft.copy(It).multiplyScalar(Bt()).round())},this.getScissor=function(E){return E.copy(nt)},this.setScissor=function(E,G,tt,Z){E.isVector4?nt.set(E.x,E.y,E.z,E.w):nt.set(E,G,tt,Z),b.scissor(Rt.copy(nt).multiplyScalar(Bt()).round())},this.getScissorTest=function(){return mt},this.setScissorTest=function(E){b.setScissorTest(mt=E)},this.setOpaqueSort=function(E){Vt=E},this.setTransparentSort=function(E){ue=E},this.getClearColor=function(E){return E.copy(P.getClearColor())},this.setClearColor=function(){P.setClearColor(...arguments)},this.getClearAlpha=function(){return P.getClearAlpha()},this.setClearAlpha=function(){P.setClearAlpha(...arguments)},this.clear=function(E=!0,G=!0,tt=!0){let Z=0;if(E){let K=!1;if(dt!==null){let Et=dt.texture.format;K=g.has(Et)}if(K){let Et=dt.texture.type,Lt=f.has(Et),bt=P.getClearColor(),Ct=P.getClearAlpha(),Ft=bt.r,Zt=bt.g,te=bt.b;Lt?(R[0]=Ft,R[1]=Zt,R[2]=te,R[3]=Ct,k.clearBufferuiv(k.COLOR,0,R)):(F[0]=Ft,F[1]=Zt,F[2]=te,F[3]=Ct,k.clearBufferiv(k.COLOR,0,F))}else Z|=k.COLOR_BUFFER_BIT}G&&(Z|=k.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),tt&&(Z|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),Z!==0&&k.clear(Z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),Q=E},this.dispose=function(){e.removeEventListener(`webglcontextlost`,Gt,!1),e.removeEventListener(`webglcontextrestored`,$t,!1),e.removeEventListener(`webglcontextcreationerror`,wt,!1),P.dispose(),J.dispose(),V.dispose(),U.dispose(),L.dispose(),v.dispose(),z.dispose(),w.dispose(),St.dispose(),zt.dispose(),O.dispose(),gt.dispose(),gt.removeEventListener(`sessionstart`,Xa),gt.removeEventListener(`sessionend`,qa),Yn.stop()};function Gt(E){E.preventDefault(),Ta(`WebGLRenderer: Context Lost.`),X=!0}function $t(){Ta(`WebGLRenderer: Context Restored.`),X=!1;let E=D.autoReset,G=ct.enabled,tt=ct.autoUpdate,Z=ct.needsUpdate,K=ct.type;Qt(),D.autoReset=E,ct.enabled=G,ct.autoUpdate=tt,ct.needsUpdate=Z,ct.type=K}function wt(E){Xt(`WebGLRenderer: A WebGL context could not be created. Reason: `,E.statusMessage)}function ce(E){let G=E.target;G.removeEventListener(`dispose`,ce),be(G)}function be(E){Pn(E),L.remove(E)}function Pn(E){let G=L.get(E).programs;G!==void 0&&(G.forEach(function(tt){O.releaseProgram(tt)}),E.isShaderMaterial&&O.releaseShaderCache(E))}this.renderBufferDirect=function(E,G,tt,Z,K,Et){G===null&&(G=Ht);let Lt=K.isMesh&&K.matrixWorld.determinantAffine()<0,bt=ih(E,G,tt,Z,K);b.setMaterial(Z,Lt);let Ct=tt.index,Ft=1;if(Z.wireframe===!0){if(Ct=w.getWireframeAttribute(tt),Ct===void 0)return;Ft=2}let Zt=tt.drawRange,te=tt.attributes.position,Dt=Zt.start*Ft,ee=(Zt.start+Zt.count)*Ft;Et!==null&&(Dt=Math.max(Dt,Et.start*Ft),ee=Math.min(ee,(Et.start+Et.count)*Ft)),Ct!==null?(Dt=Math.max(Dt,0),ee=Math.min(ee,Ct.count)):te!=null&&(Dt=Math.max(Dt,0),ee=Math.min(ee,te.count));let xe=ee-Dt;if(xe<0||xe===1/0)return;St.setup(K,Z,bt,tt,Ct);let de,he=rt;if(Ct!==null&&(de=h.get(Ct),he=_t,he.setIndex(de)),K.isMesh)Z.wireframe===!0?(b.setLineWidth(Z.wireframeLinewidth*Bt()),he.setMode(k.LINES)):he.setMode(k.TRIANGLES);else if(K.isLine){let Ce=Z.linewidth;Ce===void 0&&(Ce=1),b.setLineWidth(Ce*Bt()),K.isLineSegments?he.setMode(k.LINES):K.isLineLoop?he.setMode(k.LINE_LOOP):he.setMode(k.LINE_STRIP)}else K.isPoints?he.setMode(k.POINTS):K.isSprite&&he.setMode(k.TRIANGLES);if(K.isBatchedMesh)if(M.get(`WEBGL_multi_draw`))he.renderMultiDraw(K._multiDrawStarts,K._multiDrawCounts,K._multiDrawCount);else{let Ce=K._multiDrawStarts,Nt=K._multiDrawCounts,Ne=K._multiDrawCount,oe=Ct?h.get(Ct).bytesPerElement:1,Zn=L.get(Z).currentProgram.getUniforms();for(let Pe=0;Pe<Ne;Pe++)Zn.setValue(k,`_gl_DrawID`,Pe),he.render(Ce[Pe]/oe,Nt[Pe])}else if(K.isInstancedMesh)he.renderInstances(Dt,xe,K.count);else if(tt.isInstancedBufferGeometry){let Ce=tt._maxInstanceCount!==void 0?tt._maxInstanceCount:1/0,Nt=Math.min(tt.instanceCount,Ce);he.renderInstances(Dt,xe,Nt)}else he.render(Dt,xe)};function Wa(E,G,tt,Z){Q!==null&&E.isNodeMaterial&&Q.setObject(Z,E),Mt===!0&&W.setState(E,tt,!1),E.transparent===!0&&E.side===Qe&&E.forceSinglePass===!1?(E.side=Oe,E.needsUpdate=!0,Gi(E,G,Z),E.side=Wn,E.needsUpdate=!0,Gi(E,G,Z),E.side=Qe):Gi(E,G,Z)}this.compile=function(E,G,tt=null){tt===null&&(tt=E),Q!==null&&Q.renderStart(E,G,tt),I=V.get(tt),I.init(G),T.push(I),tt.traverseVisible(function(K){K.isLight&&K.layers.test(G.layers)&&(I.pushLight(K),K.castShadow&&I.pushShadow(K))}),E!==tt&&E.traverseVisible(function(K){K.isLight&&K.layers.test(G.layers)&&(I.pushLight(K),K.castShadow&&I.pushShadow(K))}),I.setupLights(),Q!==null&&Q.updateLights(I.state.lightsArray),Ut=this.localClippingEnabled,Mt=W.init(this.clippingPlanes,Ut),Mt===!0&&W.setGlobalState(this.clippingPlanes,G),Q!==null&&ct.render(I.state.shadowsArray,tt,G);let Z=new Set;return E.traverse(function(K){if(!(K.isMesh||K.isPoints||K.isLine||K.isSprite))return;let Et=K.material;if(Et)if(Array.isArray(Et))for(let Lt=0;Lt<Et.length;Lt++){let bt=Et[Lt];Wa(bt,tt,G,K),Z.add(bt)}else Wa(Et,tt,G,K),Z.add(Et)}),I=T.pop(),Q!==null&&Q.renderEnd(),Z},this.compileAsync=function(E,G,tt=null){let Z=this.compile(E,G,tt);return new Promise(K=>{function Et(){if(Z.forEach(function(Lt){let Ct=L.get(Lt).currentProgram;(Ct===void 0||Ct.isReady())&&Z.delete(Lt)}),Z.size===0){K(E);return}setTimeout(Et,10)}M.get(`KHR_parallel_shader_compile`)!==null?Et():setTimeout(Et,10)})};let So=null;function eh(E){So&&So(E)}function Xa(){Yn.stop()}function qa(){Yn.start()}let Yn=new Oc;Yn.setAnimationLoop(eh),typeof self<`u`&&Yn.setContext(self),this.setAnimationLoop=function(E){So=E,gt.setAnimationLoop(E),E===null?Yn.stop():Yn.start()},gt.addEventListener(`sessionstart`,Xa),gt.addEventListener(`sessionend`,qa),this.render=function(E,G){if(G!==void 0&&G.isCamera!==!0){Xt(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(X===!0)return;Q!==null&&Q.renderStart(E,G);let tt=gt.enabled===!0&&gt.isPresenting===!0,Z=Y!==null&&(dt===null||tt)&&Y.begin(H,dt);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),gt.enabled===!0&&gt.isPresenting===!0&&(Y===null||Y.isCompositing()===!1)&&(gt.cameraAutoUpdate===!0&&gt.updateCamera(G),G=gt.getCamera()),E.isScene===!0&&E.onBeforeRender(H,E,G,dt),I=V.get(E,T.length),I.init(G),I.state.textureUnits=U.getTextureUnits(),T.push(I),Ot.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),G.isArrayCamera?pt.setFromArrayCamera(G):ut.setFromProjectionMatrix(Ot,$e,G.reversedDepth),Ut=this.localClippingEnabled,Mt=W.init(this.clippingPlanes,Ut),N=J.get(E,y.length),N.init(),y.push(N),this.info.render.frame++,gt.enabled===!0&&gt.isPresenting===!0){let Lt=H.xr.getDepthSensingMesh();Lt!==null&&bo(Lt,G,-1/0,H.sortObjects)}bo(E,G,0,H.sortObjects),N.finish(),Q!==null&&Q.updateLights(I.state.lightsArray),H.sortObjects===!0&&N.sort(Vt,ue),Yt=gt.enabled===!1||gt.isPresenting===!1||gt.hasDepthSensing()===!1,Yt&&P.addToRenderList(N,E),this.info.autoReset===!0&&this.info.reset(),Mt===!0&&W.beginShadows();let K=I.state.shadowsArray;if(ct.render(K,E,G),Mt===!0&&W.endShadows(),(Z&&Y.hasRenderPass())===!1){let Lt=N.opaque,bt=N.transmissive;if(I.setupLights(),G.isArrayCamera){let Ct=G.cameras;if(bt.length>0)for(let Ft=0,Zt=Ct.length;Ft<Zt;Ft++){let te=Ct[Ft];Za(Lt,bt,E,te)}Yt&&P.render(E);for(let Ft=0,Zt=Ct.length;Ft<Zt;Ft++){let te=Ct[Ft];Ya(N,E,te,te.viewport)}}else bt.length>0&&Za(Lt,bt,E,G),Yt&&P.render(E),Ya(N,E,G)}dt!==null&&$===0&&(U.updateMultisampleRenderTarget(dt),U.updateRenderTargetMipmap(dt)),Z&&Y.end(H),E.isScene===!0&&E.onAfterRender(H,E,G),St.resetDefaultState(),j=-1,ht=null,T.pop(),T.length>0?(I=T[T.length-1],U.setTextureUnits(I.state.textureUnits),Mt===!0&&W.setGlobalState(H.clippingPlanes,I.state.camera)):I=null,y.pop(),y.length>0?N=y[y.length-1]:N=null,Q!==null&&Q.renderEnd()};function bo(E,G,tt,Z){if(E.visible===!1)return;if(E.layers.test(G.layers)){if(E.isGroup)tt=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(G);else if(E.isLight)I.pushLight(E),E.castShadow&&I.pushShadow(E);else if(E.isSprite){let Lt=G.isArrayCamera?pt:ut;if(!E.frustumCulled||E.intersectsFrustum(Lt)){Z&&Jt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Ot);let bt=z.update(E),Ct=E.material;Ct.visible&&N.push(E,bt,Ct,tt,Jt.z,null,G)}}else if(E.isMesh||E.isLine||E.isPoints){let Lt=G.isArrayCamera?pt:ut;if(!E.frustumCulled||E.intersectsFrustum(Lt)){let bt=z.update(E),Ct=E.material;if(Z&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Jt.copy(E.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),Jt.copy(bt.boundingSphere.center)),Jt.applyMatrix4(E.matrixWorld).applyMatrix4(Ot)),Array.isArray(Ct)){let Ft=bt.groups;for(let Zt=0,te=Ft.length;Zt<te;Zt++){let Dt=Ft[Zt],ee=Ct[Dt.materialIndex];ee&&ee.visible&&N.push(E,bt,ee,tt,Jt.z,Dt,G)}}else Ct.visible&&N.push(E,bt,Ct,tt,Jt.z,null,G)}}}let Et=E.children;for(let Lt=0,bt=Et.length;Lt<bt;Lt++)bo(Et[Lt],G,tt,Z)}function Ya(E,G,tt,Z){let{opaque:K,transmissive:Et,transparent:Lt}=E;I.setupLightsView(tt),Mt===!0&&W.setGlobalState(H.clippingPlanes,tt),Z&&b.viewport(ft.copy(Z)),K.length>0&&ws(K,G,tt),Et.length>0&&ws(Et,G,tt),Lt.length>0&&ws(Lt,G,tt),b.buffers.depth.setTest(!0),b.buffers.depth.setMask(!0),b.buffers.color.setMask(!0),b.setPolygonOffset(!1)}function Za(E,G,tt,Z){if((tt.isScene===!0?tt.overrideMaterial:null)!==null)return;if(I.state.transmissionRenderTarget[Z.id]===void 0){let Dt=M.has(`EXT_color_buffer_half_float`)||M.has(`EXT_color_buffer_float`);I.state.transmissionRenderTarget[Z.id]=new Xe(1,1,{generateMipmaps:!0,type:Dt?ln:Ze,minFilter:An,samples:Math.max(4,S.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ne.workingColorSpace})}let Et=I.state.transmissionRenderTarget[Z.id],Lt=Z.viewport||ft;Et.setSize(Lt.z*H.transmissionResolutionScale,Lt.w*H.transmissionResolutionScale);let bt=H.getRenderTarget(),Ct=H.getActiveCubeFace(),Ft=H.getActiveMipmapLevel();H.setRenderTarget(Et),H.getClearColor(lt),vt=H.getClearAlpha(),vt<1&&H.setClearColor(16777215,.5),H.clear(),Yt&&P.render(tt);let Zt=H.toneMapping;H.toneMapping=pn;let te=Z.viewport;if(Z.viewport!==void 0&&(Z.viewport=void 0),I.setupLightsView(Z),Mt===!0&&W.setGlobalState(H.clippingPlanes,Z),ws(E,tt,Z),U.updateMultisampleRenderTarget(Et),U.updateRenderTargetMipmap(Et),M.has(`WEBGL_multisampled_render_to_texture`)===!1){let Dt=!1;for(let ee=0,xe=G.length;ee<xe;ee++){let{object:he,geometry:Ce,material:Nt,group:Ne}=G[ee];if(Nt.side===Qe&&he.layers.test(Z.layers)){let oe=Nt.side;Nt.side=Oe,Nt.needsUpdate=!0,Ja(he,tt,Z,Ce,Nt,Ne),Nt.side=oe,Nt.needsUpdate=!0,Dt=!0}}Dt===!0&&(U.updateMultisampleRenderTarget(Et),U.updateRenderTargetMipmap(Et))}H.setRenderTarget(bt,Ct,Ft),H.setClearColor(lt,vt),te!==void 0&&(Z.viewport=te),H.toneMapping=Zt}function ws(E,G,tt){let Z=G.isScene===!0?G.overrideMaterial:null;for(let K=0,Et=E.length;K<Et;K++){let Lt=E[K],{object:bt,geometry:Ct,group:Ft}=Lt,Zt=Lt.material;Zt.allowOverride===!0&&Z!==null&&(Zt=Z),bt.layers.test(tt.layers)&&Ja(bt,G,tt,Ct,Zt,Ft)}}function Ja(E,G,tt,Z,K,Et){Q!==null&&K.isNodeMaterial&&Q.setObject(E,K),E.onBeforeRender(H,G,tt,Z,K,Et),E.modelViewMatrix.multiplyMatrices(tt.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),K.onBeforeRender(H,G,tt,Z,E,Et),K.transparent===!0&&K.side===Qe&&K.forceSinglePass===!1?(K.side=Oe,K.needsUpdate=!0,H.renderBufferDirect(tt,G,Z,K,E,Et),K.side=Wn,K.needsUpdate=!0,H.renderBufferDirect(tt,G,Z,K,E,Et),K.side=Qe):H.renderBufferDirect(tt,G,Z,K,E,Et),E.onAfterRender(H,G,tt,Z,K,Et)}function $a(E){let G=0;for(let tt of E)tt.texture!==null&&G++;return G}function Gi(E,G,tt){G.isScene!==!0&&(G=Ht);let Z=L.get(E),K=I.state.lights,Et=I.state.shadowsArray,Lt=K.state.version,bt=O.getParameters(E,K.state,Et,G,tt,I.state.lightProbeGridArray),Ct=O.getProgramCacheKey(bt),Ft=Z.programs;Z.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?G.environment:null,Z.fog=G.fog;let Zt=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;Z.envMap=v.get(E.envMap||Z.environment,Zt),Z.envMapRotation=Z.environment!==null&&E.envMap===null?G.environmentRotation:E.envMapRotation,Ft===void 0&&(E.addEventListener(`dispose`,ce),Ft=new Map,Z.programs=Ft,Z.programVariants=new Map);let te=Ft.get(Ct);if(te!==void 0){if(Z.currentProgram===te&&Z.lightsStateVersion===Lt)return Qa(E,bt),te}else bt.uniforms=O.getUniforms(E),Q!==null&&E.isNodeMaterial&&Q.build(E,tt,bt),E.onBeforeCompile(bt,H),te=O.acquireProgram(bt,Ct),Ft.set(Ct,te),Z.uniforms=bt.uniforms;let Dt=Z.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Dt.clippingPlanes=W.uniform),Qa(E,bt),Z.needsLights=rh(E),Z.lightsStateVersion=Lt,Z.needsLights&&(Dt.ambientLightColor.value=K.state.ambient,Dt.lightProbe.value=K.state.probe,Dt.sunLights.value=K.state.sun,Dt.sunLightShadows.value=K.state.sunShadow,Dt.directionalLights.value=K.state.directional,Dt.directionalLightShadows.value=K.state.directionalShadow,Dt.spotLights.value=K.state.spot,Dt.spotLightShadows.value=K.state.spotShadow,Dt.rectAreaLights.value=K.state.rectArea,Dt.ltc_1.value=K.state.rectAreaLTC1,Dt.ltc_2.value=K.state.rectAreaLTC2,Dt.pointLights.value=K.state.point,Dt.pointLightShadows.value=K.state.pointShadow,Dt.hemisphereLights.value=K.state.hemi,Dt.sunShadowMatrix.value=K.state.sunShadowMatrix,Dt.sunShadowCascade.value=K.state.sunShadowCascade,Dt.directionalShadowMatrix.value=K.state.directionalShadowMatrix,Dt.spotLightMatrix.value=K.state.spotLightMatrix,Dt.spotLightMap.value=K.state.spotLightMap,Dt.pointShadowMatrix.value=K.state.pointShadowMatrix),Z.numLightProbeGrids=$a(I.state.lightProbeGridArray),Z.currentProgram=te,Z.uniformsList=null,te}function nh(E,G,tt,Z,K){let Et=L.get(E),Lt=Et.currentProgram.id+`,`+Z+`,`+K,bt=Et.programVariants.get(Lt);return bt===void 0?(bt=Gi(E,G,tt),Et.programVariants.set(Lt,bt)):(Et.currentProgram=bt,Et.uniformsList=null,Et.outputColorSpace=Z,Et.toneMapping=K),bt}function Ka(E){if(E.uniformsList===null){let G=E.currentProgram.getUniforms();E.uniformsList=Oi.seqWithValue(G.seq,E.uniforms)}return E.uniformsList}function Qa(E,G){let tt=L.get(E);tt.outputColorSpace=G.outputColorSpace,tt.batching=G.batching,tt.batchingColor=G.batchingColor,tt.instancing=G.instancing,tt.instancingColor=G.instancingColor,tt.instancingMorph=G.instancingMorph,tt.skinning=G.skinning,tt.morphTargets=G.morphTargets,tt.morphNormals=G.morphNormals,tt.morphColors=G.morphColors,tt.morphTargetsCount=G.morphTargetsCount,tt.numClippingPlanes=G.numClippingPlanes,tt.numIntersection=G.numClipIntersection,tt.vertexAlphas=G.vertexAlphas,tt.vertexTangents=G.vertexTangents,tt.toneMapping=G.toneMapping}function ih(E,G,tt,Z,K){G.isScene!==!0&&(G=Ht),U.resetTextureUnits();let Et=G.fog,Lt=Z.isMeshStandardMaterial||Z.isMeshLambertMaterial||Z.isMeshPhongMaterial?G.environment:null,bt=dt===null?H.outputColorSpace:dt.isXRRenderTarget===!0?dt.texture.colorSpace:ne.workingColorSpace,Ct=Z.isMeshStandardMaterial||Z.isMeshLambertMaterial&&!Z.envMap||Z.isMeshPhongMaterial&&!Z.envMap,Ft=v.get(Z.envMap||Lt,Ct),Zt=Z.vertexColors===!0&&!!tt.attributes.color&&tt.attributes.color.itemSize===4,te=!!tt.attributes.tangent&&(!!Z.normalMap||Z.anisotropy>0),Dt=!!tt.morphAttributes.position,ee=!!tt.morphAttributes.normal,xe=!!tt.morphAttributes.color,de=pn;Z.toneMapped&&(dt===null||dt.isXRRenderTarget===!0)&&(de=H.toneMapping);let he=tt.morphAttributes.position||tt.morphAttributes.normal||tt.morphAttributes.color,Ce=he!==void 0?he.length:0,Nt=L.get(Z),Ne=I.state.lights;if(Mt===!0&&(Ut===!0||E!==ht)){let pe=E===ht&&Z.id===j;W.setState(Z,E,pe)}let oe=!1,Zn=!1;Z.version===Nt.__version?Nt.needsLights&&Nt.lightsStateVersion!==Ne.state.version||K.isBatchedMesh&&Nt.batching===!1||!K.isBatchedMesh&&Nt.batching===!0||K.isBatchedMesh&&Nt.batchingColor===!0&&K._colorsTexture===null||K.isBatchedMesh&&Nt.batchingColor===!1&&K._colorsTexture!==null||K.isInstancedMesh&&Nt.instancing===!1||!K.isInstancedMesh&&Nt.instancing===!0||K.isSkinnedMesh&&Nt.skinning===!1||!K.isSkinnedMesh&&Nt.skinning===!0||K.isInstancedMesh&&Nt.instancingColor===!0&&K.instanceColor===null||K.isInstancedMesh&&Nt.instancingColor===!1&&K.instanceColor!==null||K.isInstancedMesh&&Nt.instancingMorph===!0&&K.morphTexture===null||K.isInstancedMesh&&Nt.instancingMorph===!1&&K.morphTexture!==null||Nt.envMap!==Ft||Z.fog===!0&&Nt.fog!==Et||Nt.numClippingPlanes!==void 0&&(Nt.numClippingPlanes!==W.numPlanes||Nt.numIntersection!==W.numIntersection)||Nt.vertexAlphas!==Zt||Nt.vertexTangents!==te||Nt.morphTargets!==Dt||Nt.morphNormals!==ee||Nt.morphColors!==xe||Nt.morphTargetsCount!==Ce||Nt.numLightProbeGrids!==$a(I.state.lightProbeGridArray)?oe=!0:(Nt.outputColorSpace!==bt||Nt.toneMapping!==de)&&(Zn=!0):(oe=!0,Nt.__version=Z.version);let Pe=Nt.currentProgram;(oe===!0||Zn===!0)&&(Pe=Zn===!0?nh(Z,G,K,bt,de):Gi(Z,G,K),Q&&Z.isNodeMaterial&&Q.onUpdateProgram(Z,Pe,Nt));let As=!1,In=!1,Jn=!1,se=Pe.getUniforms(),Ae=Nt.uniforms;if(b.useProgram(Pe.program)&&(As=!0,In=!0,Jn=!0),Z.id!==j&&(j=Z.id,In=!0),As||ht!==E){b.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),se.setValue(k,`projectionMatrix`,E.projectionMatrix),se.setValue(k,`viewMatrix`,E.matrixWorldInverse);let Ee=se.map.cameraPosition;Ee!==void 0&&Ee.setValue(k,ae.setFromMatrixPosition(E.matrixWorld)),S.logarithmicDepthBuffer&&se.setValue(k,`logDepthBufFC`,2/(Math.log(E.far+1)/Math.LN2)),(Z.isMeshPhongMaterial||Z.isMeshToonMaterial||Z.isMeshLambertMaterial||Z.isMeshBasicMaterial||Z.isMeshStandardMaterial||Z.isShaderMaterial)&&se.setValue(k,`isOrthographic`,E.isOrthographicCamera===!0),ht!==E&&(ht=E,In=!0,Jn=!0)}if(Nt.needsLights&&(Ne.state.sunShadowMap.length>0&&se.setValue(k,`sunShadowMap`,Ne.state.sunShadowMap,U),Ne.state.directionalShadowMap.length>0&&se.setValue(k,`directionalShadowMap`,Ne.state.directionalShadowMap,U),Ne.state.spotShadowMap.length>0&&se.setValue(k,`spotShadowMap`,Ne.state.spotShadowMap,U),Ne.state.pointShadowMap.length>0&&se.setValue(k,`pointShadowMap`,Ne.state.pointShadowMap,U)),K.isSkinnedMesh){se.setOptional(k,K,`bindMatrix`),se.setOptional(k,K,`bindMatrixInverse`);let pe=K.skeleton;pe&&(pe.boneTexture===null&&pe.computeBoneTexture(),se.setValue(k,`boneTexture`,pe.boneTexture,U))}K.isBatchedMesh&&(se.setOptional(k,K,`batchingTexture`),se.setValue(k,`batchingTexture`,K._matricesTexture,U),se.setOptional(k,K,`batchingIdTexture`),se.setValue(k,`batchingIdTexture`,K._indirectTexture,U),se.setOptional(k,K,`batchingColorTexture`),K._colorsTexture!==null&&se.setValue(k,`batchingColorTexture`,K._colorsTexture,U));let tn=tt.morphAttributes;if((tn.position!==void 0||tn.normal!==void 0||tn.color!==void 0)&&ot.update(K,tt,Pe),(In||Nt.receiveShadow!==K.receiveShadow)&&(Nt.receiveShadow=K.receiveShadow,se.setValue(k,`receiveShadow`,K.receiveShadow)),(Z.isMeshStandardMaterial||Z.isMeshLambertMaterial||Z.isMeshPhongMaterial)&&Z.envMap===null&&G.environment!==null&&(Ae.envMapIntensity.value=G.environmentIntensity),Ae.dfgLUT!==void 0&&(Ae.dfgLUT.value=Cm()),In){if(se.setValue(k,`toneMappingExposure`,H.toneMappingExposure),Nt.needsLights&&sh(Ae,Jn),Et&&Z.fog===!0&&q.refreshFogUniforms(Ae,Et),q.refreshMaterialUniforms(Ae,Z,yt,Pt,I.state.transmissionRenderTarget[E.id]),Nt.needsLights&&Nt.numLightProbeGrids>0){let pe=C,Ee=0;for(let xn of I.state.lightProbeGridArray)xn.texture!==null&&(pe.textures[Ee]=xn.texture,pe.min[Ee]=xn.boundingBox.min,pe.max[Ee]=xn.boundingBox.max,pe.resolution[Ee]=xn.resolution,Ee++);for(let xn in pe)pe[xn].length=Ee;Ae.probesSH.value=pe.textures,Ae.probesMin.value=pe.min,Ae.probesMax.value=pe.max,Ae.probesResolution.value=pe.resolution}Oi.upload(k,Ka(Nt),Ae,U)}if(Z.isShaderMaterial&&Z.uniformsNeedUpdate===!0&&(Oi.upload(k,Ka(Nt),Ae,U),Z.uniformsNeedUpdate=!1),Z.isSpriteMaterial&&se.setValue(k,`center`,K.center),se.setValue(k,`modelViewMatrix`,K.modelViewMatrix),se.setValue(k,`normalMatrix`,K.normalMatrix),se.setValue(k,`modelMatrix`,K.matrixWorld),Z.uniformsGroups!==void 0){let pe=Z.uniformsGroups;for(let Ee=0,xn=pe.length;Ee<xn;Ee++){let tl=pe[Ee];zt.update(tl,Pe),zt.bind(tl,Pe)}}return Pe}function sh(E,G){E.ambientLightColor.needsUpdate=G,E.lightProbe.needsUpdate=G,E.sunLights.needsUpdate=G,E.sunLightShadows.needsUpdate=G,E.directionalLights.needsUpdate=G,E.directionalLightShadows.needsUpdate=G,E.pointLights.needsUpdate=G,E.pointLightShadows.needsUpdate=G,E.spotLights.needsUpdate=G,E.spotLightShadows.needsUpdate=G,E.rectAreaLights.needsUpdate=G,E.hemisphereLights.needsUpdate=G}function rh(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return at},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return dt},this.setRenderTargetTextures=function(E,G,tt){let Z=L.get(E);Z.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,Z.__autoAllocateDepthBuffer===!1&&(Z.__useRenderToTexture=!1),L.get(E.texture).__webglTexture=G,L.get(E.depthTexture).__webglTexture=Z.__autoAllocateDepthBuffer?void 0:tt,Z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,G){let tt=L.get(E);tt.__webglFramebuffer=G,tt.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(E,G=0,tt=0){dt=E,at=G,$=tt;let Z=null,K=!1,Et=!1;if(E){let bt=L.get(E);if(bt.__useDefaultFramebuffer!==void 0){b.bindFramebuffer(k.FRAMEBUFFER,bt.__webglFramebuffer),ft.copy(E.viewport),Rt.copy(E.scissor),kt=E.scissorTest,b.viewport(ft),b.scissor(Rt),b.setScissorTest(kt),j=-1;return}else if(bt.__webglFramebuffer===void 0)U.setupRenderTarget(E);else if(bt.__hasExternalTextures)U.rebindTextures(E,L.get(E.texture).__webglTexture,L.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Zt=E.depthTexture;if(bt.__boundDepthTexture!==Zt){if(Zt!==null&&L.has(Zt)&&(E.width!==Zt.image.width||E.height!==Zt.image.height))throw new Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);U.setupDepthRenderbuffer(E)}}let Ct=E.texture;(Ct.isData3DTexture||Ct.isDataArrayTexture||Ct.isCompressedArrayTexture)&&(Et=!0);let Ft=L.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ft[G])?Z=Ft[G][tt]:Z=Ft[G],K=!0):E.samples>0&&U.useMultisampledRTT(E)===!1?Z=L.get(E).__webglMultisampledFramebuffer:Array.isArray(Ft)?Z=Ft[tt]:Z=Ft,ft.copy(E.viewport),Rt.copy(E.scissor),kt=E.scissorTest}else ft.copy(It).multiplyScalar(yt).floor(),Rt.copy(nt).multiplyScalar(yt).floor(),kt=mt;if(tt!==0&&(Z=st),b.bindFramebuffer(k.FRAMEBUFFER,Z)&&b.drawBuffers(E,Z),b.viewport(ft),b.scissor(Rt),b.setScissorTest(kt),K){let bt=L.get(E.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+G,bt.__webglTexture,tt)}else if(Et){let bt=G;for(let Ct=0;Ct<E.textures.length;Ct++){let Ft=L.get(E.textures[Ct]);k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0+Ct,Ft.__webglTexture,tt,bt)}}else if(E!==null&&tt!==0){let bt=L.get(E.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,bt.__webglTexture,tt)}j=-1};function ja(E){let G=L.get(E);return(G.__readFormat!==E.format||G.__readType!==E.type)&&(G.__readFormat=E.format,G.__readType=E.type,G.__formatReadable=S.textureFormatReadable(E.format),G.__typeReadable=S.textureTypeReadable(E.type)),G}this.readRenderTargetPixels=function(E,G,tt,Z,K,Et,Lt,bt=0){if(!(E&&E.isWebGLRenderTarget)){Xt(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let Ct=L.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Lt!==void 0&&(Ct=Ct[Lt],Array.isArray(Ct)&&(Ct=Ct[0])),Ct){b.bindFramebuffer(k.FRAMEBUFFER,Ct);try{let Ft=E.textures[bt],Zt=Ft.format,te=Ft.type;E.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+bt);let Dt=ja(Ft);if(Dt.__formatReadable===!1){Xt(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(Dt.__typeReadable===!1){Xt(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}G>=0&&G<=E.width-Z&&tt>=0&&tt<=E.height-K&&k.readPixels(G,tt,Z,K,xt.convert(Zt),xt.convert(te),Et)}finally{let Ft=dt!==null?L.get(dt).__webglFramebuffer:null;b.bindFramebuffer(k.FRAMEBUFFER,Ft)}}},this.readRenderTargetPixelsAsync=async function(E,G,tt,Z,K,Et,Lt,bt=0){if(!(E&&E.isWebGLRenderTarget))throw new Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let Ct=L.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Lt!==void 0&&(Ct=Ct[Lt],Array.isArray(Ct)&&(Ct=Ct[0])),Ct)if(G>=0&&G<=E.width-Z&&tt>=0&&tt<=E.height-K){b.bindFramebuffer(k.FRAMEBUFFER,Ct);let Ft=E.textures[bt],Zt=Ft.format,te=Ft.type;E.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+bt);let Dt=ja(Ft);if(Dt.__formatReadable===!1)throw new Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(Dt.__typeReadable===!1)throw new Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let ee=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,ee),k.bufferData(k.PIXEL_PACK_BUFFER,Et.byteLength,k.STREAM_READ),k.readPixels(G,tt,Z,K,xt.convert(Zt),xt.convert(te),0),k.bindBuffer(k.PIXEL_PACK_BUFFER,null);let xe=dt!==null?L.get(dt).__webglFramebuffer:null;b.bindFramebuffer(k.FRAMEBUFFER,xe);let de=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await cc(k,de,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,ee),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,Et),k.bindBuffer(k.PIXEL_PACK_BUFFER,null),k.deleteBuffer(ee),k.deleteSync(de),Et}else throw new Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)},this.copyFramebufferToTexture=function(E,G=null,tt=0){let Z=Math.pow(2,-tt),K=Math.floor(E.image.width*Z),Et=Math.floor(E.image.height*Z),Lt=G!==null?G.x:0,bt=G!==null?G.y:0;U.setTexture2D(E,0),k.copyTexSubImage2D(k.TEXTURE_2D,tt,0,0,Lt,bt,K,Et),b.unbindTexture()},this.copyTextureToTexture=function(E,G,tt=null,Z=null,K=0,Et=0){let Lt,bt,Ct,Ft,Zt,te,Dt,ee,xe,de=E.isCompressedTexture?E.mipmaps[Et]:E.image;if(tt!==null)Lt=tt.max.x-tt.min.x,bt=tt.max.y-tt.min.y,Ct=tt.isBox3?tt.max.z-tt.min.z:1,Ft=tt.min.x,Zt=tt.min.y,te=tt.isBox3?tt.min.z:0;else{let se=Math.pow(2,-K);Lt=Math.floor(de.width*se),bt=Math.floor(de.height*se),E.isDataArrayTexture?Ct=de.depth:E.isData3DTexture?Ct=Math.floor(de.depth*se):Ct=1,Ft=0,Zt=0,te=0}Z!==null?(Dt=Z.x,ee=Z.y,xe=Z.z):(Dt=0,ee=0,xe=0);let he=xt.convert(G.format),Ce=xt.convert(G.type),Nt;G.isData3DTexture?(U.setTexture3D(G,0),Nt=k.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(U.setTexture2DArray(G,0),Nt=k.TEXTURE_2D_ARRAY):(U.setTexture2D(G,0),Nt=k.TEXTURE_2D),b.activeTexture(k.TEXTURE0),b.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,G.flipY),b.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),b.pixelStorei(k.UNPACK_ALIGNMENT,G.unpackAlignment);let Ne=b.getParameter(k.UNPACK_ROW_LENGTH),oe=b.getParameter(k.UNPACK_IMAGE_HEIGHT),Zn=b.getParameter(k.UNPACK_SKIP_PIXELS),Pe=b.getParameter(k.UNPACK_SKIP_ROWS),As=b.getParameter(k.UNPACK_SKIP_IMAGES);b.pixelStorei(k.UNPACK_ROW_LENGTH,de.width),b.pixelStorei(k.UNPACK_IMAGE_HEIGHT,de.height),b.pixelStorei(k.UNPACK_SKIP_PIXELS,Ft),b.pixelStorei(k.UNPACK_SKIP_ROWS,Zt),b.pixelStorei(k.UNPACK_SKIP_IMAGES,te);let In=E.isDataArrayTexture||E.isData3DTexture,Jn=G.isDataArrayTexture||G.isData3DTexture;if(E.isDepthTexture){let se=L.get(E),Ae=L.get(G),tn=L.get(se.__renderTarget),pe=L.get(Ae.__renderTarget);b.bindFramebuffer(k.READ_FRAMEBUFFER,tn.__webglFramebuffer),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let Ee=0;Ee<Ct;Ee++)In&&(k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,L.get(E).__webglTexture,K,te+Ee),k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,L.get(G).__webglTexture,Et,xe+Ee)),k.blitFramebuffer(Ft,Zt,Ft+Lt,Zt+bt,Dt,ee,Dt+Lt,ee+bt,k.DEPTH_BUFFER_BIT,k.NEAREST);b.bindFramebuffer(k.READ_FRAMEBUFFER,null),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else if(K!==0||E.isRenderTargetTexture||L.has(E)){let se=L.get(E),Ae=L.get(G);b.bindFramebuffer(k.READ_FRAMEBUFFER,B),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,it);for(let tn=0;tn<Ct;tn++)In?k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,se.__webglTexture,K,te+tn):k.framebufferTexture2D(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,se.__webglTexture,K),Jn?k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ae.__webglTexture,Et,xe+tn):k.framebufferTexture2D(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,Ae.__webglTexture,Et),K!==0?k.blitFramebuffer(Ft,Zt,Ft+Lt,Zt+bt,Dt,ee,Dt+Lt,ee+bt,k.COLOR_BUFFER_BIT,k.NEAREST):Jn?k.copyTexSubImage3D(Nt,Et,Dt,ee,xe+tn,Ft,Zt,Lt,bt):k.copyTexSubImage2D(Nt,Et,Dt,ee,Ft,Zt,Lt,bt);b.bindFramebuffer(k.READ_FRAMEBUFFER,null),b.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else Jn?E.isDataTexture||E.isData3DTexture?k.texSubImage3D(Nt,Et,Dt,ee,xe,Lt,bt,Ct,he,Ce,de.data):G.isCompressedArrayTexture?k.compressedTexSubImage3D(Nt,Et,Dt,ee,xe,Lt,bt,Ct,he,de.data):k.texSubImage3D(Nt,Et,Dt,ee,xe,Lt,bt,Ct,he,Ce,de):E.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,Et,Dt,ee,Lt,bt,he,Ce,de.data):E.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,Et,Dt,ee,de.width,de.height,he,de.data):k.texSubImage2D(k.TEXTURE_2D,Et,Dt,ee,Lt,bt,he,Ce,de);b.pixelStorei(k.UNPACK_ROW_LENGTH,Ne),b.pixelStorei(k.UNPACK_IMAGE_HEIGHT,oe),b.pixelStorei(k.UNPACK_SKIP_PIXELS,Zn),b.pixelStorei(k.UNPACK_SKIP_ROWS,Pe),b.pixelStorei(k.UNPACK_SKIP_IMAGES,As),Et===0&&G.generateMipmaps===!0&&G.mipmapsAutoUpdate===!0&&k.generateMipmap(Nt),b.unbindTexture()},this.initRenderTarget=function(E){L.get(E).__webglFramebuffer===void 0&&U.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?U.setTextureCube(E,0):E.isData3DTexture?U.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?U.setTexture2DArray(E,0):U.setTexture2D(E,0),b.unbindTexture()},this.resetState=function(){at=0,$=0,dt=null,b.reset(),St.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return $e}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=ne._getDrawingBufferColorSpace(t),e.unpackColorSpace=ne._getUnpackColorSpace()}};var Pm=4.2;var Im=.7;var Lm=170;var Ha=1.35;var Dm=6e4;var Nm=6e3;var qn=(i,t=0,e=1)=>Math.max(t,Math.min(e,i));var Jc=()=>Math.min(window.devicePixelRatio||1,2);var Ga=`01#<>/=+*ABCDEF`;var Va=i=>i[Math.floor(Math.random()*i.length)];var ki=i=>typeof CSS<`u`&&CSS.escape?CSS.escape(i):i.replace(/"/g,`\\"`);var $c=i=>({x:i.left+i.width/2,y:i.top+i.height/2});var Kc=i=>(i??``).replace(/,按下捲到這艘$/,``);function Qc(i){let{C:t,tok:e,rect:n}=i,s=new Set,r=[],o=nt=>(s.add(nt),nt),a=nt=>{s.delete(nt),i.dropNode(nt)},c=()=>{let nt=document.querySelector(`app-cyber-dome`);return nt&&i.visible(nt)?nt:null},l=nt=>nt.querySelector(`.cy-stage`);function d(nt,mt=c()){return mt?mt.querySelector(`g[data-boat="${ki(nt)}"]`)??mt.querySelector(`[data-boat="${ki(nt)}"]`):null}let _=nt=>nt.querySelector(`.core`)??nt,u=nt=>!!nt.querySelector(`.mscan`),m=nt=>nt.getAttribute(`data-m`)!==`track`,x=null;function A(){let nt=c(),mt=nt?l(nt):null;if(x&&(x.st!==mt||!x.st.isConnected)&&(i.dropNode(x.cv),x.st.classList.remove(`px-dk`),x=null),!nt||!mt)return;if(!x){let Mt=i.mkCanvas(`px-dkcv`,mt);mt.classList.add(`px-dk`),x={d:nt,st:mt,cv:Mt,g:i.fit(Mt,mt.clientWidth,mt.clientHeight),W:mt.clientWidth,H:mt.clientHeight}}let ut=mt.clientWidth,pt=mt.clientHeight;(ut!==x.W||pt!==x.H)&&(x.W=ut,x.H=pt,x.g=i.fit(x.cv,ut,pt))}let f=null,R=null,F=0,C=-1;function N(nt){let mt=o(document.createElement(`div`));mt.className=`px-bed`,mt.setAttribute(`aria-hidden`,`true`),nt.prepend(mt);let ut;try{ut=new Bi({antialias:!0,alpha:!0})}catch{return a(mt),R=nt,null}ut.setPixelRatio(Jc()),mt.appendChild(ut.domElement);let pt=new ei,Mt=new Re(38,2.4,.1,50);Mt.position.set(0,1.55,2.5),Mt.lookAt(0,-.35,-.2);let Ut=150,Ot=64,ae=new Float32Array(28800),Jt=0;for(let k=0;k<Ot;k++)for(let p=0;p<Ut;p++){let M=p/149*2-1,S=k/63*2-1,b=Math.sin(M*4.1+1.3)*.12+Math.sin(S*2.6-.7)*.14+Math.sin((M+S)*6.2)*.05+Math.cos(M*9-S*4)*.025-M*M*.1;ae[Jt++]=M*2.6+(Math.random()-.5)*.012,ae[Jt++]=b,ae[Jt++]=S*1.4+(Math.random()-.5)*.012}let Ht=new He;Ht.setAttribute(`position`,new ze(ae,3));let Yt=new Ge({transparent:!0,depthWrite:!1,blending:oi,uniforms:{uAng:{value:1.57},uHolo:{value:new Kt},uHot:{value:new Kt},uGlow:{value:1},uSize:{value:2.6*Jc()}},vertexShader:`uniform float uAng; uniform float uSize; varying float vB; varying float vC;
        void main(){ float a = atan(position.z + 1.6, position.x); float d = abs(uAng - a);
          vB = exp(-d * 7.0); float f = fract(position.y * 20.0 + 10.0); vC = smoothstep(0.86, 1.0, f) + smoothstep(0.14, 0.0, f);
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (1.0 + vB * 0.8) / -mv.z; }`,fragmentShader:`uniform vec3 uHolo; uniform vec3 uHot; uniform float uGlow; varying float vB; varying float vC;
        void main(){ vec2 q = gl_PointCoord - 0.5; if (dot(q,q) > 0.25) discard; float base = 0.08 + 0.26 * vC;
          vec3 col = mix(uHolo, uHot, smoothstep(0.7, 1.0, vB)); gl_FragColor = vec4(col, (base + vB * 0.85) * uGlow); }`});pt.add(new si(Ht,Yt));let Bt={st:nt,wrap:mt,renderer:ut,scene:pt,cam:Mt,mat:Yt,geo:Ht,lost:!1,w:0,h:0};return ut.domElement.addEventListener(`webglcontextlost`,k=>{k.preventDefault(),Bt.lost=!0},!1),ut.domElement.addEventListener(`webglcontextrestored`,()=>{Bt.lost=!1,Bt.w=0},!1),Bt}function I(){f&&(f.renderer.dispose(),f.renderer.forceContextLoss?.(),f.geo.dispose(),f.mat.dispose(),a(f.wrap),f.st.classList.remove(`px-bedon`),f=null)}function y(nt){let mt=nt.st.querySelector(`path.well`);if(!mt||typeof mt.getBBox!=`function`)return;let ut=mt.getBBox(),pt=Math.round(ut.width),Mt=Math.round(ut.height);pt<40||Mt<40||(Object.assign(nt.wrap.style,{left:ut.x+`px`,top:ut.y+`px`,width:pt+`px`,height:Mt+`px`}),(pt!==nt.w||Mt!==nt.h)&&(nt.w=pt,nt.h=Mt,nt.renderer.setSize(pt,Mt,!0),nt.cam.aspect=pt/Mt,nt.cam.updateProjectionMatrix()))}let T=null;function Y(nt,mt,ut){let Mt=c()?.querySelector(`.term`),Ut=Mt?.querySelector(`.prompt`);if(!Mt||!Ut)return;T&&T.el.parentElement!==Mt&&H();let Ot=T?.el??o(document.createElement(`div`));Ot.className=`px-log`+(mt===`arrive`?` arrive`:``),Ot.setAttribute(`aria-hidden`,`true`),Object.assign(Ot.style,{left:Ut.offsetLeft+`px`,top:Ut.offsetTop+`px`,width:Ut.offsetWidth+`px`,height:Ut.offsetHeight+`px`}),Ot.parentElement||Mt.appendChild(Ot),Mt.classList.add(`px-logon`),T={el:Ot,text:nt,t0:performance.now(),until:performance.now()+ut,kind:mt},i.kick()}function H(nt){!T||nt&&T.kind!==nt||(T.el.parentElement?.classList.remove(`px-logon`),a(T.el),T=null)}let X=null,Q=0,st=new Set;function B(nt){if(nt===X)return;X=nt;for(let pt of st)pt.classList.remove(`px-dl`);if(st.clear(),H(`hover`),!nt)return;let mt=c();if(!mt)return;for(let pt of Array.from(mt.querySelectorAll(`[data-boat="${ki(nt)}"]`)))pt.classList.add(`px-dl`),st.add(pt);Q=performance.now();let ut=d(nt,mt);ut&&Y(`> TRACK ${Kc(ut.getAttribute(`aria-label`))}`,`hover`,1e9),i.kick()}let it=nt=>{if(nt.pointerType!==`mouse`)return;B((nt.target instanceof Element?nt.target.closest(`.qe[data-sub]`):null)?.dataset.sub??null)},at=()=>B(null);document.addEventListener(`pointerover`,it,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,at),r.push(()=>{document.removeEventListener(`pointerover`,it),document.documentElement.removeEventListener(`pointerleave`,at)});let $=null,dt=new Map,j=new Map,ht=(nt,mt)=>{let ut=n(_(mt)),pt=n(nt);return{x:ut.left+ut.width/2-pt.left,y:ut.top+ut.height/2-pt.top}};function ft(){A();let nt=x?.d??null;if(f&&(!x||f.st!==x.st||!f.st.isConnected)&&I(),x&&!f&&R!==x.st&&(f=N(x.st),f&&x.st.classList.add(`px-bedon`)),f&&y(f),!nt){$=null;return}let mt=new Map;for(let Mt of Array.from(nt.querySelectorAll(`g.bl[data-boat]`)))mt.set(Mt.getAttribute(`data-boat`),ht(nt,Mt));let ut=new Set,pt=new Map;for(let Mt of Array.from(nt.querySelectorAll(`g.berth[data-boat]`))){let Ut=Mt.getAttribute(`data-boat`);pt.set(Ut,ht(nt,Mt)),Mt.classList.contains(`rd`)&&ut.add(Ut)}if($&&$.d===nt&&!u(nt)){for(let Mt of ut)$.blips.has(Mt)&&!$.berths.has(Mt)&&ue(nt,Mt,$.blips.get(Mt),pt.get(Mt));for(let[Mt,Ut]of[...j])performance.now()-Ut>Dm?j.delete(Mt):$.berths.has(Mt)&&!ut.has(Mt)&&dt.has(Mt)&&(j.delete(Mt),It(nt,dt.get(Mt)))}dt.clear();for(let[Mt,Ut]of pt)dt.set(Mt,Ut);$=u(nt)?$:{d:nt,blips:mt,berths:ut}}i.addSyncer(ft);let Rt=[],kt=0,lt=-1,vt=[],Tt=[];i.addMod({frame(nt,mt){let ut=x?.d;if(!x||!ut||!ut.isConnected)return;let pt=x.st,Mt=m(ut)&&!u(ut);pt.classList.toggle(`px-morph`,u(ut)),F+=nt;let Ut=F/Pm,Ot=Math.floor(Ut),ae=Ut-Ot,Jt=.25+(Math.PI-.5)*(Ot%2?1-(.5-.5*Math.cos(Math.PI*ae)):.5-.5*Math.cos(Math.PI*ae));if(Ot!==C&&(C=Ot,Mt)){lt=mt;let S=ut.querySelector(`.cy-mas`);S&&(S.classList.remove(`px-sweep`),S.offsetWidth,S.classList.add(`px-sweep`),i.later(()=>S.classList.remove(`px-sweep`),900))}let Ht=n(pt),Yt=Ht.bottom<0||Ht.top>i.vh();if(f&&!f.lost&&(f.wrap.classList.toggle(`px-off`,!Mt),Mt&&f.w&&!Yt)){let S=f.mat.uniforms;S.uAng.value=Jt,S.uHolo.value.setRGB(t.holo[0]/255,t.holo[1]/255,t.holo[2]/255,ye),S.uHot.value.setRGB(t[`text-strong`][0]/255,t[`text-strong`][1]/255,t[`text-strong`][2]/255,ye),f.renderer.render(f.scene,f.cam)}let Bt=x.g;if(Bt.clearRect(0,0,x.W,x.H),Yt)return;let k=S=>{let b=n(_(S));return{x:b.left+b.width/2-Ht.left,y:b.top+b.height/2-Ht.top,r:b}};if(lt>=0&&Mt){let S=(mt-lt)/.9,b=ut.querySelector(`.cy-mas`);if(S>=1||!b)lt=-1;else{let D=k(b);Bt.strokeStyle=e(t.volt,.55*(1-S)),Bt.lineWidth=1.4,Bt.beginPath(),Bt.ellipse(D.x,D.y+10,20+S*x.W*.28,8+S*x.H*.8,0,.15,Math.PI-.15),Bt.stroke()}}let p=pt.querySelector(`line.rail`),M=Array.from(pt.querySelectorAll(`g.berth.rd[data-boat]`));if(kt+=nt,p&&M.length&&kt>Im&&Rt.length<10){kt=0;let S=M[Math.floor(Math.random()*M.length)],b=k(S),D=n(p),L=D.top-Ht.top+D.height/2,U=Math.random()<.5;Rt.push({x:U?D.left-Ht.left:D.right-Ht.left,y:L,tx:b.x,ty:b.y-b.r.height/2,leg:0,id:S.getAttribute(`data-boat`)})}for(let S=Rt.length-1;S>=0;S--){let b=Rt[S],D=Lm*nt;if(b.leg===0){let U=b.tx-b.x;Math.abs(U)<=D?(b.x=b.tx,b.leg=1):b.x+=Math.sign(U)*D}else if(b.y+=D*.7,b.y>=b.ty){Rt.splice(S,1),vt.push({id:b.id,t0:mt});continue}let L=b.leg===0;Bt.fillStyle=e(t.holo,.35),L?Bt.fillRect(b.x-10*Math.sign(b.tx-b.x||1),b.y-.5,10*Math.sign(b.tx-b.x||1),1):Bt.fillRect(b.x-.5,b.y-8,1,8),Bt.fillStyle=e(t.volt,.95),Bt.fillRect(b.x-(L?3:1),b.y-(L?1:3),L?6:2,L?2:6)}for(let S=vt.length-1;S>=0;S--){let b=vt[S],D=(mt-b.t0)/.5,L=pt.querySelector(`g.berth[data-boat="${ki(b.id)}"]`);if(D>=1||!L){vt.splice(S,1);continue}let U=k(L);Bt.strokeStyle=e(t.volt,.9*(1-D)),Bt.lineWidth=1.5;let v=U.r.width/2+3+D*6,h=U.r.height/2+3+D*6;Bt.strokeRect(U.x-v,U.y-h,v*2,h*2)}for(let S=Tt.length-1;S>=0;S--){let b=Tt[S],D=(mt-b.t0)/.7;if(D>=1){Tt.splice(S,1);continue}let L=n(ut),U=b.x+L.left-Ht.left,v=b.y+L.top-Ht.top;Bt.font=`600 10px "JetBrains Mono", monospace`;for(let h=0;h<10;h++)Bt.fillStyle=e(h%3?t.holo:t.volt,1-D),Bt.fillText(Va(Ga),U-12+h*7%24,v-D*22-h%4*5)}if(X){let S=d(X,ut);if(S&&S.closest(`svg`)){let b=k(S),D=qn((performance.now()-Q)/260),L=15+(1-D)*12;Bt.strokeStyle=e(t.volt,.95*D),Bt.lineWidth=1.6,Bt.beginPath();for(let[U,v]of[[-1,-1],[1,-1],[-1,1],[1,1]])Bt.moveTo(b.x+U*L,b.y+v*(L-6)),Bt.lineTo(b.x+U*L,b.y+v*L),Bt.lineTo(b.x+U*(L-6),b.y+v*L);Bt.stroke()}}if(T){let S=performance.now();if(S>T.until||!T.el.isConnected)H();else{let b=Math.min(T.text.length,Math.floor((S-T.t0)/14)),D=T.text.slice(0,b);T.el.textContent!==D&&(T.el.textContent=D)}}},stop(){}});function Pt(){let nt=i.mkCanvas(`px-over`),mt=i.vw(),ut=i.vh();return{cv:nt,g:i.fit(nt,mt,ut),W:mt,H:ut}}function yt(nt,mt){let{cv:ut,g:pt,W:Mt,H:Ut}=Pt(),Ot=0;return{frame(ae){Ot+=ae,pt.clearRect(0,0,Mt,Ut);let Jt=nt.isConnected?n(_(nt)):null,Ht=n(mt),Yt=Jt?$c(Jt):{x:Mt/2,y:0};Yt.y<0&&(Yt={x:Yt.x,y:0});let Bt={x:Ht.left+Ht.width/2,y:Ht.top+Ht.height/2},k=qn(Ot/.38),p=1-Math.pow(1-k,3),M=Ot<Ha-.3?1:qn((Ha-Ot)/.3),S=Yt.x+(Bt.x-Yt.x)*p,b=Yt.y+(Bt.y-Yt.y)*p;pt.lineWidth=1.2;for(let[D,L]of[[-1.6,t.neon],[1.6,t.holo]])pt.strokeStyle=e(L,.55*M),pt.beginPath(),pt.moveTo(Yt.x+D,Yt.y),pt.lineTo(S+D,b),pt.stroke();if(pt.strokeStyle=e(t.volt,.95*M),pt.lineWidth=1.6,pt.setLineDash([10,6]),pt.lineDashOffset=-Ot*120,pt.beginPath(),pt.moveTo(Yt.x,Yt.y),pt.lineTo(S,b),pt.stroke(),pt.setLineDash([]),pt.strokeStyle=e(t.volt,.9*M),pt.beginPath(),pt.arc(Yt.x,Yt.y,7+Math.sin(Ot*18)*1.5,0,Math.PI*2),pt.stroke(),k>=1){let L=4+(1-qn((Ot-.38)/.22))*18,U=Math.min(18,Ht.width/4,Ht.height/2),v=Ht.left-L,h=Ht.right+L,w=Ht.top-L,z=Ht.bottom+L;pt.strokeStyle=e(t.volt,M),pt.lineWidth=2,pt.beginPath(),pt.moveTo(v,w+U),pt.lineTo(v,w),pt.lineTo(v+U,w),pt.moveTo(h-U,w),pt.lineTo(h,w),pt.lineTo(h,w+U),pt.moveTo(h,z-U),pt.lineTo(h,z),pt.lineTo(h-U,z),pt.moveTo(v+U,z),pt.lineTo(v,z),pt.lineTo(v,z-U),pt.stroke(),pt.font=`600 10px "JetBrains Mono", monospace`,pt.fillStyle=e(t.volt,M*(Math.sin(Ot*30)>-.6?1:.3)),pt.fillText(`TARGET LOCK`,v,w-5)}return Ot<Ha},stop(){i.dropNode(ut)}}}function Vt(nt,mt,ut){let{cv:pt,g:Mt,W:Ut,H:Ot}=Pt(),ae=Array.from({length:26},(Yt,Bt)=>({ch:Va(Ga),delay:Bt*.018,dx:(Math.random()-.5)*40,dy:(Math.random()-.5)*24,bend:(Math.random()-.5)*160})),Jt=0,Ht=.75;return{frame(Yt){Jt+=Yt,Mt.clearRect(0,0,Ut,Ot);let Bt=d(nt),k=Bt?n(_(Bt)):null,p=k?$c(k):{x:mt,y:-10};p.y<0&&(p={x:p.x,y:-10}),Mt.font=`600 11px "JetBrains Mono", monospace`;let M=!1;for(let S of ae){let b=qn((Jt-S.delay)/Ht);if(b<1&&(M=!0),b<=0||b>=1)continue;let D=1-Math.pow(1-b,2.2),L=mt+S.dx,U=ut+S.dy,v=(L+p.x)/2+S.bend,h=Math.min(U,p.y)-80,w=(1-D)*(1-D)*L+2*(1-D)*D*v+D*D*p.x,z=(1-D)*(1-D)*U+2*(1-D)*D*h+D*D*p.y;Mt.fillStyle=e(b>.85?t.volt:t.holo,1-Math.max(0,b-.85)/.15),Math.random()<.08&&(S.ch=Va(Ga)),Mt.fillText(S.ch,w,z)}return!M&&Bt&&vt.push({id:nt,t0:performance.now()/1e3}),M},stop(){i.dropNode(pt)}}}function ue(nt,mt,ut,pt){let{cv:Mt,g:Ut,W:Ot,H:ae}=Pt(),Jt=0,Ht=.9;i.addEvent({frame(p){if(Jt+=p,Ut.clearRect(0,0,Ot,ae),!nt.isConnected)return!1;let M=n(nt),S=qn(Jt/Ht),b=S<.5?2*S*S:1-Math.pow(-2*S+2,2)/2,D=M.left+ut.x+(pt.x-ut.x)*b,L=M.top+ut.y+(pt.y-ut.y)*b-Math.sin(Math.PI*b)*26;for(let U=0;U<6;U++){let v=qn(b-U*.04),h=M.left+ut.x+(pt.x-ut.x)*v,w=M.top+ut.y+(pt.y-ut.y)*v-Math.sin(Math.PI*v)*26;Ut.fillStyle=e(t.holo,.5*(1-U/6)*(1-Math.max(0,S-.8)/.2)),Ut.beginPath(),Ut.arc(h,w,3-U*.35,0,Math.PI*2),Ut.fill()}if(S<1)Ut.fillStyle=e(t.volt,1),Ut.beginPath(),Ut.arc(D,L,4.5,0,Math.PI*2),Ut.fill();else{let U=qn((Jt-Ht)/.6);Ut.strokeStyle=e(t.volt,.8*(1-U)),Ut.lineWidth=1.4,Ut.beginPath(),Ut.ellipse(M.left+pt.x,M.top+pt.y,10+U*46,6+U*18,0,0,Math.PI*2),Ut.stroke()}return Jt<1.5},stop(){i.dropNode(Mt)}});let Yt=Array.from(document.querySelectorAll(`[data-sub="${ki(mt)}"]`)).find(p=>p.offsetParent!==null);Yt&&i.later(()=>i.hit(Yt,`px-arrive`),Ht*1e3-150);let k=Kc(nt.querySelector(`g.berth[data-boat="${ki(mt)}"]`)?.getAttribute(`aria-label`)??null).replace(/ 待收.*$/,``);i.later(()=>Y(`> ARRIVED ${k} \xB7 READY`,`arrive`,Nm),Ht*1e3)}function It(nt,mt){if(!x||x.d!==nt)return;Tt.push({x:mt.x,y:mt.y,t0:performance.now()/1e3});let ut=nt.querySelector(`.term .tl2.port .sig b`);ut&&i.hit(ut,`px-dec`)}return{next(nt,mt){if(!nt||!mt)return;let ut=d(nt);ut&&i.addEvent(yt(ut,mt))},collect(nt,mt,ut){nt&&(j.set(nt,performance.now()),c()&&i.addEvent(Vt(nt,mt,ut)))},origin(){let mt=c()?.querySelector(`.cy-mas`);if(!mt)return null;let ut=n(mt);return{x:ut.left+ut.width/2,y:ut.top+ut.height*.6}},rebase(){$=null},stop(){for(let nt of r)nt();B(null),H(),I(),x&&(i.dropNode(x.cv),x.st.classList.remove(`px-dk`,`px-morph`),x=null);for(let nt of Array.from(document.querySelectorAll(`.cy-mas.px-sweep`)))nt.classList.remove(`px-sweep`);for(let nt of Array.from(document.querySelectorAll(`.px-arrive, .px-dec`)))nt.classList.remove(`px-arrive`,`px-dec`);for(let nt of s)nt.remove();s.clear(),Rt.length=0,j.clear()}}}var Es=`01#<>/\\=+*ABCDEF`;var Um=`0123456789`;var Ts=i=>i[Math.floor(Math.random()*i.length)];var Be=(i,t,e)=>Math.max(t,Math.min(e,i));var _n={k_dur:.36,m_speed:1,o_ring:1,p_dur:.7,q_dur:1.6,r_dur:.9,t_boot:1.6,x_speed:1400};var Hi=`"JetBrains Mono", ui-monospace, monospace`;function jc(i){let{C:t,tok:e,rect:n,vw:s,vh:r,visible:o}=i,a=(p,M=document)=>Array.from(M.querySelectorAll(p)),c=[],l=(p,...M)=>p.classList.add(...M),d$1=`.rt-card, .rt-sb-row, .ct-row, .rt-cmp tr, .dp-card`,_=[`px-l1`,`px-l2`,`px-zone`,`px-drag`,`px-k2`,`px-fade`,`px-charge`,`px-t1`,`px-ghost`,`px-v1`,`px-hit`,`px-path-off`];function u(p,M,S){p.classList.remove(M),p.offsetWidth,l(p,M),i.later(()=>{p.classList.remove(M),p.classList.add(`fx-settled`)},S)}function m(){let p=i.mkCanvas(`px-over px-top`),M=s(),S=r();return{cv:p,g:i.fit(p,M,S),W:M,H:S}}function x(p,M,S){document.addEventListener(p,M,S),c.push(()=>document.removeEventListener(p,M,S))}function A(p){let M=i.mkCanvas(`px-over`),S=0,b=0,D=null;i.addMod({frame(L,U){(S!==s()||b!==r()||!D)&&(S=s(),b=r(),D=i.fit(M,S,b)),D.clearRect(0,0,S,b),p(D,S,b,L,U)},stop(){i.dropNode(M)}})}let g=new Set;function f(p,M){let S=p.filter(z=>o(z)&&!g.has(z)&&(z.textContent??``).trim());if(!S.length)return null;let{cv:b,g:D,W:L,H:U}=m(),v=S.map(z=>{g.add(z);let O=getComputedStyle(z);return{el:z,text:(z.textContent??``).replace(/\s+/g,` `).trim(),font:`${O.fontWeight} ${O.fontSize} ${Hi}`}}),h=0,w=()=>v.forEach(z=>{z.el.style.clipPath=``,g.delete(z.el)});return{frame(z){h+=z;let O=Be(h/M,0,1);D.clearRect(0,0,L,U);for(let q of v){let J=n(q.el);q.el.style.clipPath=`inset(0 ${(1-O)*100}% 0 0)`;let V=q.text.length,W=Math.floor(V*O),ct=[...q.text.slice(W)].map(P=>P.trim()?Ts(/\d/.test(P)?Um:Es):P).join(``);D.font=q.font,D.textBaseline=`middle`,D.fillStyle=e(t.holo,.9),D.save(),D.beginPath(),D.rect(J.left+J.width*O,J.top-2,J.width*(1-O)+8,J.height+4),D.clip(),D.fillText(ct,J.left+J.width*O,J.top+J.height/2),D.restore(),O<1&&(D.fillStyle=e(t[`text-strong`],.9),D.fillRect(J.left+J.width*O,J.top,1.5,J.height))}return O<1},stop(){w(),i.dropNode(b)}}}function R(p$1,M){if(!o(p$1))return null;let S=p$1.matches(`.d-main`),b=p(p$1,{rect:n,vw:s,vh:r}),{cv:D,g:L,W:U,H:v}=m(),h=()=>{};if(S)u(p$1,`px-k2`,420);else{let q=M.filter(J=>J.isConnected).map(J=>d(J,200,V=>V.forEach(W=>u(W,`px-k2`,420))));h=()=>q.forEach(J=>J())}let w=document.createElement(`canvas`);w.width=120,w.height=80;let z=w.getContext(`2d`),O=0;return{frame(q){O+=q;let J=O/_n.k_dur,V=z.createImageData(120,80);for(let W=0;W<V.data.length;W+=4){let ct=Math.random();V.data[W]=t.holo[0]*ct,V.data[W+1]=t.holo[1]*ct,V.data[W+2]=t.holo[2]*ct,V.data[W+3]=255}z.putImageData(V,0,0),L.clearRect(0,0,U,v),L.imageSmoothingEnabled=!1,L.globalAlpha=.5*Be(1-J,0,1),L.drawImage(w,b.left,b.top,b.width,b.height),L.globalAlpha=1;for(let W=0;W<6;W++)L.fillStyle=e(W%2?t.neon:t.holo,.5*Be(1-J,0,1)),L.fillRect(b.left+(Math.random()-.5)*30,b.top+Math.random()*b.height,b.width,2+Math.random()*6);return J<1},stop(){h(),i.dropNode(D)}}}let F=`.d-nav-item, .d-sub-item, .m-nav .nav-item`,C=[],N=null,I=null,y=p=>{let M=document.elementFromPoint?.(i.ptr.x*i.zoom(),i.ptr.y*i.zoom());return!M||p.contains(M)},T$1=[];i.addSyncer(()=>{C=a(F).filter(o),N=a(`svg`).find(p=>p.getClientRects().length>0&&!!p.querySelector(`.rt-pt`))??null,I=a(`.up-steps`).find(o)??null,T$1=a(d$1).filter(o)}),i.addSyncer(()=>{for(let p of a(`.d-nav-item, .d-sub-item`)){let M=p.classList.contains(`active`);M!==p.classList.contains(`px-l1`)&&(M?l(p,`px-l1`):p.classList.remove(`px-l1`))}});let Y={x:-1e4,y:-1e4},H=null;A(p=>{let M=C.filter(h=>h.isConnected),S=null,b=null,D=1e9;for(let h of M){let w=n(h),z=Math.hypot(i.ptr.x-(w.left+w.width/2),i.ptr.y-(w.top+w.height/2));z<D&&(D=z,S=h,b=w)}let L=S&&D<90?S:null;if(L!==H&&(H?.classList.remove(`px-l2`),L&&l(L,`px-l2`),H=L),!S||!b||D>120){Y.x=Y.y=-1e4;return}Y.x<-1e3&&(Y.x=i.ptr.x,Y.y=i.ptr.y);let U=b.left+14,v=b.top+b.height/2;Y.x+=(i.ptr.x*.5+U*.5-Y.x)*.25,Y.y+=(i.ptr.y*.3+v*.7-Y.y)*.25,p.fillStyle=e(t.neon,.9),p.shadowColor=e(t.neon,1),p.shadowBlur=10,p.beginPath(),p.arc(Y.x,Y.y,3,0,Math.PI*2),p.fill(),p.shadowBlur=0});let X=new Map,Q=0;i.addSyncer(()=>{let p=new Set(a(`.dropzone`).filter(o));for(let[M,S]of X)p.has(M)||(i.dropNode(S.c),M.classList.remove(`px-zone`,`px-drag`),X.delete(M));for(let M of p)X.has(M)||(l(M,`px-zone`),X.set(M,{z:M,c:i.mkCanvas(`px-zcv`,M),cols:[]}))}),i.addMod({frame(p){for(let M of X.values()){let S=M.z.clientWidth,b=M.z.clientHeight,D=i.fit(M.c,S,b);D.clearRect(0,0,S,b);let L=M.z.classList.contains(`px-drag`),U=Math.ceil(S/12);M.cols.length!==U&&(M.cols=Array.from({length:U},()=>({y:Math.random()*b,v:20+Math.random()*50}))),D.font=`500 11px ${Hi}`,M.cols.forEach((v,h)=>{v.y+=v.v*p*_n.m_speed*(L?4:1),v.y>b+20&&(v.y=-20);for(let w=0;w<5;w++)D.fillStyle=e(L?t.volt:t.holo,.2-w*.04),D.fillText(Ts(Es),h*12+2,v.y-w*13)})}},stop(){for(let[p,M]of X)i.dropNode(M.c),p.classList.remove(`px-zone`,`px-drag`);X.clear()}});let st=p=>X.forEach(M=>M.z.classList.toggle(`px-drag`,p)),B=p=>Array.from(p.dataTransfer?.types??[]).includes(`Files`);x(`dragenter`,p=>{B(p)&&(Q++,st(!0))},{capture:!0}),x(`dragleave`,p=>{B(p)&&(Q=Math.max(0,Q-1),Q||st(!1))},{capture:!0}),x(`drop`,p=>{Q=0,st(!1);let M=p.target instanceof Element?p.target.closest(`.dropzone`):null;M&&i.addEvent(it(M))},{capture:!0}),x(`change`,p=>{let M=p.target;if(M instanceof HTMLInputElement&&M.type===`file`&&M.files?.length){let S=M.closest(`.dropzone`)??a(`.dropzone`).find(o);S&&i.addEvent(it(S))}});function it(p){let M=n(p),{cv:S,g:b,W:D,H:L}=m(),U=M.left+M.width/2,v=M.top+M.height/2,h=Array.from({length:90},()=>{let z=Math.random()*Math.PI*2,O=160+Math.random()*260;return{x:U+Math.cos(z)*O,y:v+Math.sin(z)*O,ch:Ts(Es)}}),w=0;return{frame(z){w+=z,b.clearRect(0,0,D,L),b.font=`600 11px ${Hi}`;for(let O of h)O.x+=(U-O.x)*Math.min(1,z*7),O.y+=(v-O.y)*Math.min(1,z*7),b.fillStyle=e(t.volt,Be(1.2-w,0,1)),b.fillText(O.ch,O.x,O.y);return w>.45&&w<.75&&(b.fillStyle=e(t.holo,.3*(1-(w-.45)/.3)),b.fillRect(M.left,M.top,M.width,M.height)),w<.9},stop(){i.dropNode(S)}}}A(p=>{let M=I;if(!M||!M.isConnected||Math.random()<.35)return;let S=a(`li`,M),b=S.findIndex(w=>w.classList.contains(`on`));if(b<0||b>=S.length-1)return;let D=n(S[b].querySelector(`i`)??S[b]),L=n(S[b+1].querySelector(`i`)??S[b+1]),U=D.top+D.height/2,v=D.right+4,h=L.left-4;if(!(h-v<10)){p.strokeStyle=e(t.holo,.9),p.lineWidth=1.4,p.shadowColor=e(t.holo,1),p.shadowBlur=8,p.beginPath(),p.moveTo(v,U);for(let w=v;w<h;w+=8)p.lineTo(w,U+(Math.random()-.5)*9);p.lineTo(h,U),p.stroke(),p.shadowBlur=0}});let at=()=>N?.isConnected?N:null;function $(p){let M=p.getScreenCTM();if(!M)return[];let S=i.zoom();return(p.getAttribute(`points`)??``).trim().split(/\s+/).filter(Boolean).map(b=>b.split(`,`).map(Number)).map(([b,D])=>[(b*M.a+M.e)/S,(D*M.d+M.f)/S])}function dt(p){let M=[],S=0;for(let D=0;D<p.length-1;D++){let L=Math.hypot(p[D+1][0]-p[D][0],p[D+1][1]-p[D][1]);M.push([p[D][0],p[D][1],p[D+1][0],p[D+1][1],S,L]),S+=L}return{L:S,at:D=>{let L=M.find(v=>D>=v[4]&&D<=v[4]+v[5])??M[M.length-1],U=L[5]?Be((D-L[4])/L[5],0,1):0;return[L[0]+(L[2]-L[0])*U,L[1]+(L[3]-L[1])*U]},ok:M.length>0}}let j=[],ht=null;function ft(p,M,S=1){let b=n(p);j.push({x:b.left+b.width/2,y:b.top+b.height/2,t:0,col:M,k:S}),i.kick()}x(`pointerover`,p=>{let M=p.target instanceof Element?p.target.closest(`.rt-pt`):null;M&&M!==ht&&ft(M,t.holo),ht=M});let Rt=``;A((p,M,S,b,D)=>{for(let w=j.length-1;w>=0;w--){let z=j[w];z.t+=b;let O=z.t/.8;if(O>1){j.splice(w,1);continue}for(let q of[0,.25]){let J=O-q;J<=0||(p.strokeStyle=e(z.col,(1-J)*.9),p.lineWidth=1.5,p.beginPath(),p.arc(z.x,z.y,12+J*46*z.k*_n.o_ring,0,Math.PI*2),p.stroke())}}let L=at(),U=L?.querySelector(`.rt-path`);if(!L||!U||U.classList.contains(`px-path-off`))return;let v=n(L),h=dt($(U));if(h.ok){p.save(),p.beginPath(),p.rect(v.left,v.top,v.width,v.height),p.clip();for(let w=0;w<4;w++){let[z,O]=h.at((D*120+w*h.L/4)%h.L);p.fillStyle=e(t.volt,1),p.shadowColor=e(t.volt,1),p.shadowBlur=10,p.beginPath(),p.arc(z,O,3,0,Math.PI*2),p.fill()}p.restore()}}),i.addSyncer(()=>{let p=at()?.querySelector(`.rt-path`),M=p?.getAttribute(`points`)??``;p&&M&&Rt&&M!==Rt&&i.addEvent(kt(p)),Rt=M});function kt(p){let M=p.ownerSVGElement;if(!M)return null;let S=n(M),b=dt($(p));if(!b.ok)return null;let{cv:D,g:L,W:U,H:v}=m();p.classList.add(`px-path-off`);let h=0,w=1.1;return{frame(z){h+=z;let O=Be(h/w,0,1),q=b.L*(1-Math.pow(1-O,2));L.clearRect(0,0,U,v),L.save(),L.beginPath(),L.rect(S.left,S.top,S.width,S.height),L.clip(),L.strokeStyle=e(t.holo,.9),L.lineWidth=2,L.beginPath();for(let ct=0;ct<=q;ct+=4){let[P,ot]=b.at(ct);ct?L.lineTo(P,ot):L.moveTo(P,ot)}L.stroke();let[J,V]=b.at(q),W=L.createRadialGradient(J,V,0,J,V,26);return W.addColorStop(0,e(t[`text-strong`],.95)),W.addColorStop(.3,e(t.volt,.6)),W.addColorStop(1,e(t.volt,0)),L.fillStyle=W,L.beginPath(),L.arc(J,V,26,0,Math.PI*2),L.fill(),L.restore(),h<1.35},stop(){i.dropNode(D),p.classList.remove(`px-path-off`)}}}let lt=`.rt-stat .num, .rt-meter-row b, .rt-meter-row strong`,vt=new WeakMap;i.addSyncer(()=>{let p=[];for(let M of a(lt)){let S=M.textContent??``,b=vt.get(M);b!==void 0&&b!==S&&p.push(M),vt.set(M,S)}p.length&&i.addEvent(f(p,_n.p_dur))});function Tt(p){let M=n(p),S=M.left+M.width/2,b=M.top+M.height/2,{cv:D,g:L,W:U,H:v}=m(),h=0,w=22,z=Math.hypot(U,v)*.7;return{frame(O){h+=O,L.clearRect(0,0,U,v);let q=h*900%z,J=Be(_n.q_dur-h,0,1);for(let V=w/2;V<v;V+=w)for(let W=w/2;W<U;W+=w){let ct=Math.abs(Math.hypot(W-S,V-b)-q),P=ct<30?(1-ct/30)*.7:.05;P<.06&&Math.random()>.02||(L.fillStyle=e(Math.random()<.04?t.volt:t.holo,P*J),L.fillRect(W-1,V-1,2,2))}return h<_n.q_dur},stop(){i.dropNode(D)}}}let Pt=new WeakSet;i.addSyncer(()=>{a(d$1).filter(M=>{if(Pt.has(M)||!o(M))return!1;Pt.add(M);let S=n(M);return S.bottom>0&&S.top<r()}).slice(0,14).forEach((M,S)=>i.later(()=>{u(M,`px-fade`,420),i.addEvent(f([M],_n.r_dur*.6))},S*60*_n.r_dur))}),A((p,M,S,b,D)=>{if(i.ptr.x<-1e3)return;let L=T$1.filter(h=>{if(!h.isConnected)return!1;let w=n(h);return i.ptr.x>=w.left&&i.ptr.x<=w.right&&i.ptr.y>=w.top&&i.ptr.y<=w.bottom&&y(h)}).map(n)[0];if(!L)return;let U=L.left+(Math.sin(D*2.4)+1)/2*L.width,v=p.createLinearGradient(U-60,0,U,0);v.addColorStop(0,e(t.holo,0)),v.addColorStop(1,e(t.holo,.14)),p.fillStyle=v,p.fillRect(U-60,L.top,60,L.height),p.fillStyle=e(t.holo,.7),p.fillRect(U,L.top,1,L.height),p.strokeStyle=e(t.neon,.9),p.lineWidth=1.5;for(let[h,w]of[[L.left-3,1],[L.right+3,-1]])p.beginPath(),p.moveTo(h+w*6,L.top),p.lineTo(h,L.top),p.lineTo(h,L.bottom),p.lineTo(h+w*6,L.bottom),p.stroke()});function yt(p,M,S){u(p,`px-charge`,400);let{cv:b,g:D,W:L,H:U}=m(),v=Array.from({length:14},(w,z)=>{let O=z/14*Math.PI*2,q=80+Math.random()*90;return{x:M,y:S,vx:Math.cos(O)*q,vy:Math.sin(O)*q,l:.45+Math.random()*.2}}),h=0;return{frame(w){h+=w,D.clearRect(0,0,L,U);for(let z of v)z.l-=w,!(z.l<=0)&&(z.x+=z.vx*w,z.y+=z.vy*w,z.vx*=.9,z.vy*=.9,D.fillStyle=e(t.volt,z.l*2),D.fillRect(z.x-1.5,z.y-1.5,3,3));return h<.7},stop(){i.dropNode(b)}}}let Vt=null;i.addSyncer(()=>{let p=new Set(a(`.ct-chip.on`).filter(o));if(Vt?.size){for(let M of p)if(!Vt.has(M)){i.addEvent(ue(M));break}}Vt=p});function ue(p){let M=a(`.ct-row`).filter(o).slice(0,12);if(!M.length)return null;let S=n(p),b=S.left+S.width/2,D=S.bottom,{cv:L,g:U,W:v,H:h}=m(),w=0;return{frame(z){w+=z,U.clearRect(0,0,v,h);let O=Be(1.6-w,0,1);return M.forEach((q,J)=>{let V=n(q),W=V.left+6,ct=V.top+V.height/2,P=Be((w-J*.05)/.5,0,1);if(P<=0)return;let ot=Math.abs(ct-D),_t=(ot+Math.abs(W-b))*P;U.strokeStyle=e(t.holo,.6*O),U.lineWidth=1,U.beginPath(),U.moveTo(b,D),_t<=ot?U.lineTo(b,D+Math.sign(ct-D)*_t):(U.lineTo(b,ct),U.lineTo(b+Math.sign(W-b)*(_t-ot),ct)),U.stroke(),P>=1&&(U.fillStyle=e(t.volt,O),U.fillRect(W-3,ct-3,6,6))}),w<1.6},stop(){i.dropNode(L)}}}i.addSyncer(()=>{for(let p of a(`.theme-opt`))p.classList.contains(`px-t1`)||l(p,`px-t1`)});let It=null;x(`pointermove`,p=>{let M=p.target instanceof Element?p.target.closest(`.theme-opt`):null;if(It&&It!==M&&(It.style.transform=``),It=M,!M)return;let S=M.getBoundingClientRect(),b=(p.clientX-S.left)/S.width-.5,D=(p.clientY-S.top)/S.height-.5;M.style.transform=`perspective(500px) rotateY(${b*14}deg) rotateX(${-D*14}deg) translateZ(6px)`},{passive:!0}),c.push(()=>{It&&(It.style.transform=``)});function nt(p){let M=n(p),{cv:S,g:b,W:D,H:L}=m();u(p,`px-charge`,400);let U=0;return{frame(v){U+=v,b.clearRect(0,0,D,L);let h=Be(U/.22,0,1),w=M.top+M.height/2,z=1-Be((U-.22)/.3,0,1);b.strokeStyle=e(t.holo,z),b.lineWidth=1.6,b.shadowColor=e(t.holo,1),b.shadowBlur=8,b.beginPath(),b.moveTo(M.left,w);for(let O=M.left;O<M.left+M.width*h;O+=5)b.lineTo(O,w+(Math.random()-.5)*M.height*.8);if(b.stroke(),b.shadowBlur=0,h>=1)for(let O=0;O<5;O++)b.fillStyle=e(t.volt,z),b.fillRect(M.right+Math.random()*14,w+(Math.random()-.5)*18,2,2);return U<.55},stop(){i.dropNode(S)}}}function mt(){let p=document.querySelector(`app-root`)??document.body,{cv:M,g:S,W:b,H:D}=m(),L=0,U=[`> SONAR CORE ........ OK`,`> HOLO LAYER ........ OK`,`> FX DRIVER ......... LOADED`,`> PREMIUM MODE ...... ONLINE`];return{frame(v){L+=v;let h=L/_n.t_boot;S.clearRect(0,0,b,D);let w=h<.18?1-h/.18*.995:h<.75?.005:Math.min(1,.005+(h-.75)/.25);if(p.style.transform=`scaleY(${w})`,p.style.transformOrigin=`50% 50%`,p.style.filter=h<.75?`brightness(2)`:``,h>=.18&&h<.75){S.fillStyle=e(t.bg,1),S.fillRect(0,0,b,D),S.fillStyle=e(t[`text-strong`],.9),S.fillRect(0,D/2-1,b,2),S.font=`500 13px ${Hi}`;let z=Math.floor((h-.18)/.5*U.length*1.2);U.slice(0,z).forEach((O,q)=>{S.fillStyle=e(q===U.length-1?t.volt:t.holo,1),S.fillText(O,40,60+q*22)})}return h<1},stop(){i.dropNode(M),p.style.transform=``,p.style.transformOrigin=``,p.style.filter=``}}}performance.now()>3e3&&document.querySelector(`.set-wrap`)&&i.addEvent(mt());function ut(p){let M=n(p);l(p,`px-ghost`);let{cv:S,g:b,W:D,H:L}=m(),U=0;return{frame(v){U+=v;let h=Be(U/.32,0,1),w=1-Math.pow(1-h,3);b.clearRect(0,0,D,L);let z=M.width*w,O=M.height*Math.min(1,w*1.4),q=M.left+(M.width-z)/2,J=M.top+(M.height-O)/2;return b.strokeStyle=e(t.holo,.9),b.lineWidth=1,b.strokeRect(q,J,z,O),b.fillStyle=e(t.neon,1),b.fillRect(q-2,J-2,10,2),b.fillRect(q-2,J-2,2,10),b.fillRect(q+z-8,J+O,10,2),b.fillRect(q+z,J+O-8,2,10),h>=1&&p.classList.contains(`px-ghost`)&&(p.classList.remove(`px-ghost`),u(p,`px-fade`,420)),h>=1&&(b.fillStyle=e(t[`text-strong`],.8),b.fillRect(M.left,M.top+M.height*Be((U-.32)/.3,0,1),M.width,1.5)),U<.66},stop(){i.dropNode(S),p.classList.remove(`px-ghost`)}}}function pt(p){u(p,`px-v1`,500),i.addEvent(f([p.querySelector(`.toast-text`)??p],.5))}let Mt=null;function Ut(){let p=Mt&&performance.now()-Mt.t<3e3&&Mt.el.isConnected?Mt.el:null;if(!p)return{x:s()/2,y:r()/2,top:r()/2};let M=n(p);return{x:M.left+M.width/2,y:M.top+M.height/2,top:M.top}}function Ot(){let p=Ut(),{cv:M,g:S,W:b,H:D}=m(),L=Math.hypot(Math.max(p.x,b-p.x),Math.max(p.y,D-p.y))+60,U=0,v=a(`.rt-block, .set-sec, .dropzone, .rt-card, .ct-slot-card, .modal-box, .dp-panel`).filter(o).map(h=>{let w=n(h);return{el:h,d:Math.hypot(Math.max(w.left-p.x,0,p.x-w.right),Math.max(w.top-p.y,0,p.y-w.bottom)),done:!1}});return{frame(h){U+=_n.x_speed*h,S.clearRect(0,0,b,D);let w=1-U/L;S.lineWidth=2,S.strokeStyle=e(t.neon,.6*w),S.beginPath(),S.arc(p.x-3,p.y,U,0,Math.PI*2),S.stroke(),S.strokeStyle=e(t.volt,w),S.beginPath(),S.arc(p.x+2,p.y,U,0,Math.PI*2),S.stroke();for(let z of v)!z.done&&U>=z.d&&(z.done=!0,u(z.el,`px-hit`,800));return U<L},stop(){i.dropNode(M)}}}function ae(){let p=Ut(),M=document.createElement(`canvas`);M.width=180,M.height=40;let S=M.getContext(`2d`);S.font=`700 28px "Chakra Petch", sans-serif`,S.fillStyle=`#fff`,S.textBaseline=`middle`,S.fillText(`SYNC OK`,4,20);let b=S.getImageData(0,0,180,40).data,D=Be(p.x-90,4,s()-184),L=Math.max(30,p.top-46),U=[];for(let q=0;q<40;q+=3)for(let J=0;J<180;J+=3)b[(q*180+J)*4+3]>128&&U.push({tx:D+J,ty:L+q,x:p.x+(Math.random()-.5)*60,y:p.top+10,ch:Ts(Es)});let{cv:v,g:h,W:w,H:z}=m(),O=0;return{frame(q){O+=q,h.clearRect(0,0,w,z),h.font=`600 8px ${Hi}`;let J=O>1.2?1-(O-1.2)/.4:1;for(let V of U){O<.9?(V.x+=(V.tx-V.x)*Math.min(1,q*9),V.y+=(V.ty-V.y)*Math.min(1,q*9)):V.y-=60*q;let W=Math.hypot(V.tx-V.x,V.ty-V.y)<2||O>=.9;h.fillStyle=e(W?t.volt:t.holo,J),W?h.fillRect(V.x-1,V.y-1,2.4,2.4):h.fillText(V.ch,V.x,V.y)}return O<1.6},stop(){i.dropNode(v)}}}let Jt=new MutationObserver(p=>{let M=null,S=[];for(let b of p)for(let D of Array.from(b.addedNodes)){if(!(D instanceof HTMLElement)||D.classList.contains(`px-cv`))continue;T(D)&&(M=D.parentElement,S.push(D));let L=D.matches(`.modal-box`)?D:D.querySelector(`.modal-box`);L&&i.later(()=>o(L)&&i.addEvent(ut(L)),0);let U=D.matches(`.toast`)?D:D.querySelector(`.toast`);U&&(pt(U),U.classList.contains(`warn`)||(i.addEvent(Ot()),i.addEvent(ae())))}M&&i.addEvent(R(M,S))});Jt.observe(document.body,{childList:!0,subtree:!0}),c.push(()=>Jt.disconnect());let Ht=null,Yt=0;x(`focusin`,p=>{Ht=p.target instanceof Element?p.target.closest(`input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), textarea, .sel-trigger`):null,Yt=performance.now(),i.kick()}),x(`focusout`,()=>{Ht=null}),A(p=>{if(!Ht||!o(Ht))return;let M=n(Ht),S=Be((performance.now()-Yt)/180,0,1),b=14*(1-S)+3,D=8;p.strokeStyle=e(S<1?t.holo:t.volt,1),p.lineWidth=1.5;for(let[L,U,v,h]of[[M.left-b,M.top-b,1,1],[M.right+b,M.top-b,-1,1],[M.left-b,M.bottom+b,1,-1],[M.right+b,M.bottom+b,-1,-1]])p.beginPath(),p.moveTo(L,U+h*D),p.lineTo(L,U),p.lineTo(L+v*D,U),p.stroke()});function Bt(p,M,S){let{cv:b,g:D,W:L,H:U}=m(),v=0,h=(Math.random()-.5)*40;return{frame(w){return v+=w,D.clearRect(0,0,L,U),D.font=`600 12px ${Hi}`,D.fillStyle=e(t.holo,1-v/.5),D.fillText(S,p+h*v,M-50*v),D.fillStyle=e(t.neon,.6*(1-v/.5)),D.fillText(S,p+h*v+2,M-50*v),v<.5},stop(){i.dropNode(b)}}}x(`keydown`,p=>{let M=p.target instanceof HTMLInputElement||p.target instanceof HTMLTextAreaElement?p.target:null;if(!M||p.key.length!==1||M.type===`password`)return;let S=n(M);i.addEvent(Bt(Math.min(S.right-16,S.left+12+M.value.length*8),S.top+S.height/2,Ts(Es)))});let k=/找配置|找路線|查價/;return x(`pointerdown`,p=>{let M=p.target instanceof Element?p.target:null;if(!M)return;let S=i.zoom(),b=M.closest(`.ct-chip`);b&&i.addEvent(yt(b,p.clientX/S,p.clientY/S));let D=M.closest(`.switch`);D&&i.addEvent(nt(D));let L=M.closest(`button`);L&&!L.hasAttribute(`disabled`)&&(k.test(L.textContent??``)&&!L.classList.contains(`rt-help-btn`)&&i.addEvent(Tt(L)),L.matches(`.primary, .primary-btn, .rt-save-btn, [type=submit]`)&&(Mt={el:L,t:performance.now()}));let U=M.closest(`.rt-pt`);U&&ft(U,t.volt,1.6)},{passive:!0}),{stop(){for(let p of c)p();for(let p of a(_.map(M=>`.`+M).join(`,`)))p.classList.remove(..._);for(let p of g)p.style.clipPath=``;g.clear()}}}var Fm=[`holo`,`volt`,`neon`,`neon-soft`,`bg`,`scope-bg`,`text-strong`];var je={a_sweep:4,a_glow:1,b_speed:1500,b_width:70,b_alpha:.5,c_dur:2.4,e_alpha:.55,g_density:1,h_dur:1.3,i_track:1,j_chroma:3};var ui=(i,t,e)=>Math.max(t,Math.min(e,i));var Mo=()=>Math.min(window.devicePixelRatio||1,2);var Om=(i,t)=>((i-t)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);function th(i,t,e){let n=Math.max(e.left-i,0,i-e.right),s=Math.max(e.top-t,0,t-e.bottom);return Math.hypot(n,s)}function Bm(i){if(i=i.trim(),i.startsWith(`#`)){let e=i.slice(1);return e.length===3&&(e=[...e].map(n=>n+n).join(``)),[parseInt(e.slice(0,2),16),parseInt(e.slice(2,4),16),parseInt(e.slice(4,6),16)]}let t=i.match(/[\d.]+/g);return t&&t.length>=3?[+t[0],+t[1],+t[2]]:[255,255,255]}var _e=(i,t)=>`rgba(${i[0]},${i[1]},${i[2]},${ui(t,0,1)})`;var Dx={start:zm};function zm(i){let t=document.documentElement,e={},n=()=>{let p=getComputedStyle(t);for(let M of Fm)e[M]=Bm(p.getPropertyValue(`--`+M))};n();let s=1,r=()=>{s=i.coordScale()||1};r();let o=()=>i.viewport().width,a=()=>i.viewport().height,c=p=>{let M=p.getBoundingClientRect();return{left:M.left/s,top:M.top/s,right:M.right/s,bottom:M.bottom/s,width:M.width/s,height:M.height/s}},l=p=>!!p&&p.getClientRects().length>0&&p.offsetParent!==null,d=new Set;function _(p,M=document.body){let S=document.createElement(`canvas`);return S.className=`px-cv `+p,S.setAttribute(`aria-hidden`,`true`),M.appendChild(S),d.add(S),S}function u(p){p.remove(),d.delete(p)}function m(p,M,S){let b=Mo(),D=Math.max(1,Math.round(M*b)),L=Math.max(1,Math.round(S*b));(p.width!==D||p.height!==L)&&(p.width=D,p.height=L),p.style.width=M+`px`,p.style.height=S+`px`;let U=p.getContext(`2d`);return U.setTransform(b,0,0,b,0,0),U}let x=()=>Array.from(document.querySelectorAll(`.plaque, .ov-ghead, .qe, .ct, .ov-sort, .d-nav-item.active, .m-nav .nav-item.active`)).filter(l),A=new Set,g=(p,M)=>{let S=setTimeout(()=>{A.delete(S),p()},M);A.add(S)},f=new Set;function R(p,M){p.classList.remove(`px-hit`,`px-hit-v`),p.offsetWidth,p.classList.add(M),f.add(p),g(()=>{p.classList.remove(M),p.classList.add(`fx-settled`),f.delete(p)},900)}let F=()=>Array.from(document.querySelectorAll(`app-sonar-scope`)).filter(p=>p.getBoundingClientRect().width>0);function C(p){let M=p.querySelector(`svg`),S=M?.querySelector(`circle.sn-face`),b=M?.getScreenCTM(),D=p.getBoundingClientRect();if(!M||!b)return{cx:D.width/s/2,cy:D.height/s/2,r:D.width/s/2,vx:(D.left+D.width/2)/s,vy:(D.top+D.height/2)/s};let L=(S?S.r.baseVal.value:104)*b.a/s;return{cx:(b.e-D.left)/s,cy:(b.f-D.top)/s,r:L,vx:b.e/s,vy:b.f/s}}function N(){let p=y?.origin();if(p)return p;let M=F()[0];if(!M)return{x:o()/2,y:120};let S=C(M);return{x:S.vx,y:S.vy}}let I={x:-1e4,y:-1e4,t:0,touch:!1},y=null,T=[],Y=new Set,H=0,X=0,Q=1,st=!1,B=()=>!st&&!document.hidden;function it(p){H=0;let M=X?(p-X)/1e3:.016,S=Math.min(.05,M);if(X=p,Q+=M,Q>.5){Q=0,r();for(let b of dt)b()}for(let b of T)b.frame?.(S,p/1e3);for(let b of[...Y])b.frame(Math.min(.5,M),p/1e3)||(b.stop(),Y.delete(b));B()&&(H=requestAnimationFrame(it))}function at(){!H&&B()&&(X=0,H=requestAnimationFrame(it))}function $(p){p&&(Y.add(p),at())}let dt=[],j=new Map;function ht(p){let M=p.classList.contains(`mini`),S=document.createElement(`div`);S.className=`px-a2`,S.setAttribute(`aria-hidden`,`true`),p.appendChild(S),d.add(S);let b;try{b=new Bi({antialias:!0,alpha:!0})}catch{return u(S),null}b.setPixelRatio(Mo()),S.appendChild(b.domElement);let D=new ei,L=new Re(50,1,.1,50),U=M?60:110,v=new Float32Array(U*U*3),h=0;for(let J=0;J<U;J++)for(let V=0;V<U;V++){let W=V/(U-1)*2-1,ct=J/(U-1)*2-1,P=Math.sin(W*3.1+1.3)*.18+Math.sin(ct*2.3-.7)*.18+Math.sin((W+ct)*5.2)*.07+Math.cos(W*7-ct*4)*.035-(W*W+ct*ct)*.12;v[h++]=W*1.6+(Math.random()-.5)*.01,v[h++]=P,v[h++]=ct*1.6+(Math.random()-.5)*.01}let w=new He;w.setAttribute(`position`,new ze(v,3));let z=new Ge({transparent:!0,depthWrite:!1,blending:oi,uniforms:{uAng:{value:0},uHolo:{value:new Kt},uHot:{value:new Kt},uGlow:{value:je.a_glow},uSize:{value:M?2.2:3.2*Mo()}},vertexShader:`uniform float uAng; uniform float uSize; varying float vB; varying float vC;
        void main(){ float a = atan(position.z, position.x); float d = mod(uAng - a + 6.2831853, 6.2831853);
          vB = exp(-d * 1.6); float f = fract(position.y * 22.0 + 10.0); vC = smoothstep(0.85, 1.0, f) + smoothstep(0.15, 0.0, f);
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (1.0 + vB) / -mv.z; }`,fragmentShader:`uniform vec3 uHolo; uniform vec3 uHot; uniform float uGlow; varying float vB; varying float vC;
        void main(){ vec2 q = gl_PointCoord - 0.5; if (dot(q,q) > 0.25) discard; float base = 0.12 + 0.35 * vC;
          vec3 col = mix(uHolo, uHot, smoothstep(0.75, 1.0, vB)); gl_FragColor = vec4(col, (base + vB * 0.9) * uGlow); }`});D.add(new si(w,z));let O=new Ke(new ls(1.62,1.66,96),new Pi({color:new Kt,transparent:!0,opacity:.35,side:Qe}));O.rotation.x=-Math.PI/2,D.add(O);let q={host:p,wrap:S,renderer:b,scene:D,cam:L,mat:z,geo:w,ring:O,ang:-Math.PI/2,t0:performance.now(),lost:!1,ro:new ResizeObserver(()=>ft(q))};return b.domElement.addEventListener(`webglcontextlost`,J=>{J.preventDefault(),q.lost=!0},!1),b.domElement.addEventListener(`webglcontextrestored`,()=>{q.lost=!1,ft(q)},!1),q.ro.observe(p),ft(q),p.classList.add(`px-scope`),q}function ft(p){let M=C(p.host),S=M.r*2;Object.assign(p.wrap.style,{left:M.cx-M.r+`px`,top:M.cy-M.r+`px`,width:S+`px`,height:S+`px`}),p.renderer.setSize(Math.max(1,S),Math.max(1,S),!0)}function Rt(p){p.ro.disconnect(),p.renderer.dispose(),p.renderer.forceContextLoss?.(),p.geo.dispose(),p.mat.dispose(),p.ring.geometry.dispose(),p.ring.material.dispose(),u(p.wrap),p.host.classList.remove(`px-scope`),j.delete(p.host)}let kt=-1;dt.push(()=>{let p=new Set(F());for(let M of[...j.values()])(!p.has(M.host)||!M.host.isConnected)&&Rt(M);for(let M of p)if(!j.has(M)){let S=ht(M);S&&j.set(M,S)}}),T.push({frame(p){for(let M of j.values()){if(M.lost)continue;M.ang+=p*Math.PI*2/je.a_sweep;let S=M.mat.uniforms;S.uAng.value=M.ang,S.uHolo.value.setRGB(e.holo[0]/255,e.holo[1]/255,e.holo[2]/255,ye);let b=kt>=0?(performance.now()-kt)/700:1,D=b<1?e.volt:e[`text-strong`];S.uHot.value.setRGB(D[0]/255,D[1]/255,D[2]/255,ye),S.uGlow.value=je.a_glow*(b<1?1+(1-b):1),M.ring.material.color.setRGB(e.holo[0]/255,e.holo[1]/255,e.holo[2]/255,ye);let L=(performance.now()-M.t0)/1e3*.06;M.cam.position.set(Math.sin(L)*1.75,2.35,Math.cos(L)*1.75),M.cam.lookAt(0,-.25,0),M.renderer.render(M.scene,M.cam)}},stop(){for(let p of[...j.values()])Rt(p)}});function lt(p,M,S){let b=_(`px-over`),D=o(),L=a(),U=m(b,D,L),v=0,h=Math.hypot(Math.max(p,D-p),Math.max(M,L-M))+80,w=x().map(z=>({el:z,d:th(p,M,c(z)),done:!1}));return{frame(z){v+=je.b_speed*z,U.clearRect(0,0,D,L);let O=(1-v/h)*je.b_alpha*2,q=U.createRadialGradient(p,M,Math.max(0,v-je.b_width),p,M,v);q.addColorStop(0,_e(S,0)),q.addColorStop(1,_e(S,.28*O)),U.fillStyle=q,U.beginPath(),U.arc(p,M,v,0,Math.PI*2),U.fill(),U.lineWidth=2,U.strokeStyle=_e(e.neon,.7*O),U.beginPath(),U.arc(p-3,M,v,0,Math.PI*2),U.stroke(),U.strokeStyle=_e(S,O),U.beginPath(),U.arc(p+2,M,v,0,Math.PI*2),U.stroke();for(let J of w)!J.done&&v>=J.d&&(J.done=!0,R(J.el,J.el.matches(`.ready`)?`px-hit-v`:`px-hit`));return v<h},stop(){u(b)}}}function vt(p){let M=o(),S=a(),b=_(`px-over`),D=m(b,M,S),L=document.createElement(`canvas`),U=Math.min(64,M/7);L.width=Math.ceil(U*6.5),L.height=Math.ceil(U*1.4);let v=L.getContext(`2d`);v.font=`700 ${U}px "Chakra Petch", sans-serif`,v.textAlign=`center`,v.textBaseline=`middle`,v.fillStyle=_e(e[`text-strong`],1),v.fillText(`ALL CLEAR`,L.width/2,L.height/2);let h=v.getImageData(0,0,L.width,L.height).data,w=p?c(p):{left:M/2,right:M/2,bottom:S*.5},z=(w.left+w.right)/2,O=w.bottom-34-U*.25,q=Math.max(2,Math.round(U/16)),J=[];for(let W=0;W<L.height;W+=q)for(let ct=0;ct<L.width;ct+=q)h[(W*L.width+ct)*4+3]>128&&J.push({tx:z-L.width/2+ct,ty:O-L.height/2+W,x:Math.random()*M,y:-Math.random()*S*.6,vy:0,ch:`01#`[Math.floor(Math.random()*3)]});t.classList.add(`px-c2`);let V=0;return{frame(W){V+=W,D.clearRect(0,0,M,S);let ct=V/je.c_dur;D.font=`600 ${Math.max(8,q*2.2)}px "JetBrains Mono", monospace`;for(let P of J){if(ct<.25)P.vy+=900*W,P.y+=P.vy*W;else if(ct<.75){let _t=1-Math.pow(5e-4,W);P.x+=(P.tx-P.x)*_t*1.1,P.y+=(P.ty-P.y)*_t*1.1,P.vy=0}else P.vy-=260*W,P.y+=P.vy*W,P.x+=Math.sin(P.ty+V*6)*.6;let ot=Math.hypot(P.tx-P.x,P.ty-P.y)<3,rt=ct>.75?1-(ct-.75)/.25:1;D.fillStyle=_e(ot?e.volt:e.holo,rt),ot?D.fillRect(P.x-q/2,P.y-q/2,q,q):D.fillText(P.ch,P.x,P.y)}return V<je.c_dur},stop(){u(b),t.classList.remove(`px-c2`)}}}let Tt=new Map;dt.push(()=>{let p=new Set(Array.from(document.querySelectorAll(`.qe.ready`)));for(let[M,S]of[...Tt])(!p.has(M)||S.parentElement!==M)&&(u(S),Tt.delete(M));for(let M of p)if(!Tt.has(M)){let S=document.createElement(`i`);S.className=`px-band`,S.setAttribute(`aria-hidden`,`true`),S.style.animationDelay=(Math.random()*-3).toFixed(2)+`s`,M.appendChild(S),d.add(S),Tt.set(M,S)}});let Pt=_(`px-bg`);t.classList.add(`px-bgon`);{let p=`attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`,M=`precision mediump float; uniform vec2 res; uniform float t; uniform vec3 holo; uniform vec3 neon; uniform float amp;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float hex(vec2 p){ p.x *= 1.1547; p.y += mod(floor(p.x), 2.0) * 0.5; p = abs(fract(p) - 0.5); return abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0); }
      void main(){ vec2 uv = gl_FragCoord.xy / res; vec2 q = uv - 0.5;
        float vig = smoothstep(0.85, 0.2, length(q * vec2(res.x / res.y, 1.0)));
        float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159 * 0.5);
        float band = smoothstep(0.0, 0.05, 0.05 - abs(fract(uv.y * 0.6 - t * 0.07) - 0.5));
        float grid = smoothstep(0.06, 0.0, hex(gl_FragCoord.xy / 38.0));
        float n = h(gl_FragCoord.xy + floor(t * 24.0));
        vec3 c = holo * (0.035 * grid * vig + 0.05 * band) + neon * 0.02 * (1.0 - vig) + vec3(n) * 0.025;
        float a = (0.6 * scan * 0.12 + grid * 0.25 * vig + band * 0.35 + n * 0.08) * amp;
        gl_FragColor = vec4(c * 3.0, a); }`,S=Pt.getContext(`webgl`,{premultipliedAlpha:!1,alpha:!0}),b=null,D=!1,L=()=>{if(!S)return;let h=(q,J)=>{let V=S.createShader(q);return S.shaderSource(V,J),S.compileShader(V),V},w=S.createProgram();if(S.attachShader(w,h(S.VERTEX_SHADER,p)),S.attachShader(w,h(S.FRAGMENT_SHADER,M)),S.linkProgram(w),!S.getProgramParameter(w,S.LINK_STATUS))return;S.useProgram(w),S.bindBuffer(S.ARRAY_BUFFER,S.createBuffer()),S.bufferData(S.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),S.STATIC_DRAW);let z=S.getAttribLocation(w,`p`);S.enableVertexAttribArray(z),S.vertexAttribPointer(z,2,S.FLOAT,!1,0,0),S.enable(S.BLEND),S.blendFunc(S.SRC_ALPHA,S.ONE_MINUS_SRC_ALPHA);let O=new Map;b={u:q=>(O.has(q)||O.set(q,S.getUniformLocation(w,q)),O.get(q))}};Pt.addEventListener(`webglcontextlost`,h=>{h.preventDefault(),D=!0,b=null}),Pt.addEventListener(`webglcontextrestored`,()=>{D=!1,U=0,L()}),L();let U=0,v=0;T.push({frame(h,w){if(!(!S||!b||D)){if(U!==o()||v!==a()){U=o(),v=a();let z=Mo();Pt.width=Math.round(U*z),Pt.height=Math.round(v*z),Pt.style.width=U+`px`,Pt.style.height=v+`px`,S.viewport(0,0,Pt.width,Pt.height)}S.clearColor(0,0,0,0),S.clear(S.COLOR_BUFFER_BIT),S.uniform2f(b.u(`res`),Pt.width,Pt.height),S.uniform1f(b.u(`t`),w),S.uniform3f(b.u(`holo`),e.holo[0]/255,e.holo[1]/255,e.holo[2]/255),S.uniform3f(b.u(`neon`),e.neon[0]/255,e.neon[1]/255,e.neon[2]/255),S.uniform1f(b.u(`amp`),je.e_alpha*1.6),S.drawArrays(S.TRIANGLE_STRIP,0,4)}},stop(){S?.getExtension(`WEBGL_lose_context`)?.loseContext(),u(Pt),t.classList.remove(`px-bgon`)}})}{let p=_(`px-over px-hud`),M=0,S=0,b,D=!1;T.push({frame(){(M!==o()||S!==a())&&(M=o(),S=a(),b=m(p,M,S));let L=(performance.now()-I.t)/1e3,U=I.touch?ui(1-(L-.4)/.4,0,1):I.x>-1e3?1:0;if(U<=0){D&&(b.clearRect(0,0,M,S),D=!1);return}D=!0,b.clearRect(0,0,M,S);let v=I.x,h=I.y;b.strokeStyle=_e(e.holo,.22*U),b.lineWidth=1,b.setLineDash([2,4]),b.beginPath(),b.moveTo(0,h+.5),b.lineTo(M,h+.5),b.moveTo(v+.5,0),b.lineTo(v+.5,S),b.stroke(),b.setLineDash([]),b.strokeStyle=_e(e.neon,.9*U),b.lineWidth=1.5;let w=10;b.beginPath();for(let[z,O]of[[-1,-1],[1,-1],[-1,1],[1,1]])b.moveTo(v+z*w,h+O*5),b.lineTo(v+z*w,h+O*w),b.lineTo(v+z*5,h+O*w);b.stroke(),b.font=`500 10px "JetBrains Mono", monospace`,b.fillStyle=_e(e.holo,.85*U),b.fillText(`X${String(Math.round(v)).padStart(4,`0`)} Y${String(Math.round(h)).padStart(4,`0`)}`,v+14,h-12)},stop(){u(p)}})}let yt=new Map,Vt=p=>{let M=p.getBoundingClientRect(),S=p.querySelector(`.cp-mouth`);if(!S)return{x:M.width/s/2,y:M.height/s/2};let b=S.getBoundingClientRect();return{x:(b.left+b.width/2-M.left)/s,y:(b.top+b.height/2-M.top)/s}};dt.push(()=>{let p=new Set(Array.from(document.querySelectorAll(`.ocr-busy, .up-empty`)).filter(M=>M.querySelector(`.capra[data-mode="scan"], .capra[data-mode="load"]`)));for(let[M,S]of[...yt])(!p.has(M)||!M.isConnected)&&(u(S.cv),M.classList.remove(`px-g`),yt.delete(M));for(let M of p)if(!yt.has(M)){M.classList.add(`px-g`);let S=_(`px-g-cv`,M);M.prepend(S),yt.set(M,{b:M,cv:S,g:null,W:0,H:0,pts:null,ang:0,cyc:0})}}),T.push({frame(p,M){for(let S of yt.values()){let b=S.b.clientWidth,D=S.b.clientHeight;if(!b||!D)continue;(b!==S.W||D!==S.H)&&(S.W=b,S.H=D,S.g=m(S.cv,b,D),S.pts=null);let L=S.g;L.clearRect(0,0,b,D);let U=Vt(S.b),v=S.b.matches(`.ocr-busy`);if(!S.pts){if(S.pts=[],v){let z=(D-36)/5,O=je.g_density;for(let q=0;q<5;q++){let J=18+q*z+4,V=z-8;for(let W=18;W<b-18;W+=5/O)S.pts.push({x:W,y:J,k:0}),S.pts.push({x:W,y:J+V,k:0});for(let W=J;W<J+V;W+=5/O)S.pts.push({x:18,y:W,k:0}),S.pts.push({x:b-18,y:W,k:0});for(let[W,ct]of[[30,.22],[30+b*.26,.1],[b-18-b*.2,.14]])for(let P=W;P<W+b*ct;P+=3/O)for(let ot=0;ot<3;ot++)S.pts.push({x:P,y:J+V/2-3+ot*3,k:0,txt:!0})}}S.ang=0,S.cyc=0}if(v){if(S.ang+=p*2.2,S.cyc+=p,S.cyc>6){S.cyc=0;for(let h of S.pts)h.k=0}for(let h of S.pts)Om(S.ang,Math.atan2(h.y-U.y,h.x-U.x))<.12?h.k=1:h.k=Math.max(h.k*Math.pow(.992,p*60),h.k>0?.28:0),!(h.k<=0)&&(L.fillStyle=_e(h.txt?e.volt:e.holo,h.k*(h.txt?.9:.6)),L.fillRect(h.x-.8,h.y-.8,1.6,1.6));if(typeof L.createConicGradient==`function`){let h=L.createConicGradient(S.ang-.7,U.x,U.y);h.addColorStop(0,_e(e.holo,0)),h.addColorStop(.11,_e(e.holo,.14)),h.addColorStop(.112,_e(e.holo,0)),h.addColorStop(1,_e(e.holo,0)),L.fillStyle=h,L.fillRect(0,0,b,D)}}else for(let h=0;h<3;h++){let w=(M*.8+h/3)%1;L.strokeStyle=_e(e.holo,.5*(1-w)),L.lineWidth=1.2,L.beginPath(),L.arc(U.x,U.y,6+w*Math.max(b,D)*.45,0,Math.PI*2),L.stroke()}}},stop(){for(let[p,M]of[...yt])u(M.cv),p.classList.remove(`px-g`),yt.delete(p)}});function ue(){let p=o(),M=a(),S=Array.from(document.querySelectorAll(`.plaque, .ov-ghead, .qe, .ov-sort, .d-sortbar, .m-sortbar`)).filter(l).map(v=>({el:v,r:c(v),shown:!1})).filter(v=>v.r.bottom>0&&v.r.top<M);t.classList.add(`px-h1`);for(let v of S)v.el.classList.add(`px-hid`);let b=_(`px-over`),D=m(b,p,M),L=0,U=je.h_dur;return{enter:!0,frame(v){L+=v;let h=L/U;D.clearRect(0,0,p,M);let w=ui(h/.35,0,1),z=ui((h-.3)/.6,0,1)*(M+40)-20;for(let O of S){let{r:q}=O;!O.shown&&h>.3&&z>=q.top&&(O.shown=!0,O.el.classList.remove(`px-hid`),O.el.classList.add(`px-in`),g(()=>O.el.classList.remove(`px-in`),450));let J=O.shown?ui(1-(z-q.top)/140,0,1):1;if(J<=0)continue;let V=2*(q.width+q.height);D.setLineDash([V*w,V]),D.strokeStyle=_e(O.el.matches(`.ready`)?e.volt:e.holo,.85*J),D.lineWidth=1,D.strokeRect(q.left+.5,q.top+.5,q.width-1,q.height-1),D.setLineDash([]),D.fillStyle=_e(e.neon,.9*J),D.fillRect(q.left-2,q.top-2,6,2),D.fillRect(q.left-2,q.top-2,2,6),D.fillRect(q.right-4,q.bottom,6,2),D.fillRect(q.right,q.bottom-4,2,6),!O.shown&&w>.6&&(D.font=`500 9px "JetBrains Mono", monospace`,D.fillStyle=_e(e.holo,.6*J),D.fillText(`${Math.round(q.width)}\xD7${Math.round(q.height)}`,q.left+4,q.top-4))}if(h>.3&&z<M+20){let O=D.createLinearGradient(0,z-50,0,z);O.addColorStop(0,_e(e.holo,0)),O.addColorStop(1,_e(e.holo,.22)),D.fillStyle=O,D.fillRect(0,z-50,p,50),D.fillStyle=_e(e[`text-strong`],.9),D.fillRect(0,z,p,1.5)}return L<U+.15},stop(){u(b),t.classList.remove(`px-h1`);for(let v of S)v.el.classList.remove(`px-hid`,`px-in`)}}}let It=new Map,nt=`http://www.w3.org/2000/svg`;function mt(p){let M=p.querySelector(`svg`),S=M?Array.from(M.querySelectorAll(`.cp-eye, .cp-visor`)):[];if(!M||!S.length)return null;let b=document.createElementNS(nt,`g`);b.setAttribute(`class`,`px-look`);let D=document.createElementNS(nt,`g`);D.setAttribute(`class`,`px-lid`),S[0].before(b),b.appendChild(D);for(let L of S)D.appendChild(L);return{c:p,svg:M,look:b,lid:D,eyes:S,state:`idle`}}function ut(p){if(p.look.isConnected){for(let M of p.eyes)p.look.before(M);p.look.remove()}p.c.classList.remove(`px-doze`,`px-alert`,`px-ping`),It.delete(p.c)}function pt(p){p.classList.remove(`px-ping`),p.offsetWidth,p.classList.add(`px-ping`),g(()=>p.classList.remove(`px-ping`),1200)}dt.push(()=>{let p=new Set(Array.from(document.querySelectorAll(`.capra[data-ready]`)).filter(M=>M.getBoundingClientRect().width>0));for(let M of[...It.values()])(!p.has(M.c)||!M.look.isConnected)&&ut(M);for(let M of p)if(!It.has(M)){let S=mt(M);S&&It.set(M,S)}});{let p=performance.now(),M=0;T.push({frame(S){let b=performance.now();I.t>p&&(p=I.t),M+=S;let D=!!document.querySelector(`.plaque.has-ready, .qe.ready`);for(let L of It.values()){let U=c(L.svg),v=U.left+U.width/2,h=U.top+U.height*.33,w=I.x-v,z=I.y-h,O=Math.hypot(w,z),q=b-p>8e3;q&&L.state!==`doze`&&(L.state=`doze`,L.c.classList.add(`px-doze`)),!q&&L.state===`doze`&&(L.state=`idle`,L.c.classList.remove(`px-doze`),pt(L.c)),!q&&O<140&&L.state!==`near`&&(L.state=`near`,pt(L.c)),O>=160&&L.state===`near`&&(L.state=`idle`);let J=je.i_track*(q||I.x<-1e3?0:1),V=ui(w/60,-1,1)*4*J,W=ui(z/80,-1,1)*2.5*J;L.look.setAttribute(`transform`,`translate(${V.toFixed(2)} ${W.toFixed(2)})`),L.c.classList.toggle(`px-alert`,D&&!q&&M%5<.6)}},stop(){for(let S of[...It.values()])ut(S)}})}let Mt=`button, .qe, .ct, a.nav-item, .d-nav-item, .m-sum`,Ut=new Set;function Ot(p){p.classList.remove(`px-press`),p.offsetWidth,p.classList.add(`px-press`),Ut.add(p),g(()=>{p.classList.remove(`px-press`),Ut.delete(p)},220)}let ae=p=>{I.x=p.clientX/s,I.y=p.clientY/s,I.t=performance.now(),I.touch=p.pointerType===`touch`,at()},Jt=()=>{I.touch||(I.x=I.y=-1e4)},Ht=p=>{ae(p);let M=p.target instanceof Element?p.target:null;if(!M)return;let S=M.closest(Mt);S&&Ot(S);for(let b of It.values())th(I.x,I.y,c(b.c))<30&&pt(b.c)},Yt=()=>{document.hidden?(H&&cancelAnimationFrame(H),H=0):(n(),y?.rebase(),at())};addEventListener(`pointermove`,ae,{passive:!0}),addEventListener(`pointerdown`,Ht,{passive:!0}),document.documentElement.addEventListener(`pointerleave`,Jt),document.addEventListener(`visibilitychange`,Yt);let Bt=setInterval(n,1e3),k=jc({C:e,tok:_e,rect:c,vw:o,vh:a,visible:l,mkCanvas:_,dropNode:u,fit:m,addEvent:$,later:g,kick:at,addMod:p=>T.push(p),addSyncer:p=>dt.push(p),ptr:I,zoom:()=>s});return y=Qc({C:e,tok:_e,rect:c,vw:o,vh:a,visible:l,mkCanvas:_,dropNode:u,fit:m,addEvent:$,later:g,kick:at,addMod:p=>T.push(p),addSyncer:p=>dt.push(p),ptr:I,zoom:()=>s,hit:R}),t.classList.add(`px-on`),at(),{emit(p){if(!st){if(p.kind===`next`){let M=N();kt=performance.now(),$(lt(M.x,M.y,e.holo)),p.target&&g(()=>p.target&&R(p.target,`px-hit-v`),450),y?.next(p.id,p.target)}else if(p.kind===`collect`)kt=performance.now(),$(lt(p.x/s,p.y/s,e.volt)),y?.collect(p.id,p.x/s,p.y/s);else if(p.kind===`clear`)$(vt(p.seal));else if(p.kind===`enter`){for(let M of[...Y])M.enter&&(M.stop(),Y.delete(M));$(ue())}}},stop(){st=!0,H&&cancelAnimationFrame(H),H=0,clearInterval(Bt),removeEventListener(`pointermove`,ae),removeEventListener(`pointerdown`,Ht),document.documentElement.removeEventListener(`pointerleave`,Jt),document.removeEventListener(`visibilitychange`,Yt),k.stop(),y?.stop();for(let p of Y)p.stop();Y.clear();for(let p of T)p.stop();for(let p of A)clearTimeout(p);A.clear();for(let p of f)p.classList.remove(`px-hit`,`px-hit-v`,`px-arrive`,`px-dec`),p.classList.add(`fx-settled`);for(let p of Ut)p.classList.remove(`px-press`);for(let p of d)p.remove();d.clear(),t.classList.remove(`px-on`,`px-bgon`,`px-h1`,`px-c2`)}}}export{Dx as cyberFx};