// LeanCloud初始化配置
document.addEventListener('DOMContentLoaded', function() {
  // 替换为您的LeanCloud App ID和App Key
  const APP_ID = 'PkkbpTxYiRWgHbA8h0noWSwh-gzGzoHsz';
  const APP_KEY = 'suQbFb5BnNKjjSIEPlxfr7BW';
  const SERVER_URL = 'https://PkkbpTxYiRWgHbA8h0noWSwh-gzGzoHsz.lc-cn-n1-shared.com'; // 国际版地址

  // 初始化LeanCloud
  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
  });

  // 暴露全局变量供其他脚本使用
  window.AV = AV;
  window.currentUser = AV.User.current();
});