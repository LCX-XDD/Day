document.addEventListener('DOMContentLoaded', function() {
  // 深色模式切换
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  
  // 检查本地存储的主题偏好
  if (localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
    themeToggle.innerHTML = '<i class="fa fa-sun-o"></i>';
  } else {
    html.classList.remove('dark');
    themeToggle.innerHTML = '<i class="fa fa-moon-o"></i>';
  }
  
  // 切换主题
  themeToggle.addEventListener('click', function() {
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      this.innerHTML = '<i class="fa fa-moon-o"></i>';
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      this.innerHTML = '<i class="fa fa-sun-o"></i>';
    }
  });

  // 初始化应用
  function initApp() {
    // 初始化认证状态
    if (window.initAuthState) {
      window.initAuthState();
    }
  }

  // 启动应用
  initApp();
});