document.addEventListener('DOMContentLoaded', function() {
  // DOM元素
  const authModal = document.getElementById('auth-modal');
  const modalTitle = document.getElementById('modal-title');
  const authForm = document.getElementById('auth-form');
  const registerFields = document.getElementById('register-fields');
  const switchAuthBtn = document.getElementById('switch-auth');
  const switchText = document.getElementById('switch-text');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutLink = document.getElementById('logout-link');
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const usernameDisplay = document.getElementById('username-display');
  const guestLoginBtn = document.getElementById('guest-login-btn');
  const guestRegisterBtn = document.getElementById('guest-register-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal, .close-diary-modal');
  const adminLink = document.getElementById('admin-link');

  // 状态变量
  let isRegisterMode = false;

  // 初始化认证状态
  initAuthState();

  // 切换登录/注册模式
  switchAuthBtn.addEventListener('click', function() {
    isRegisterMode = !isRegisterMode;
    
    if (isRegisterMode) {
      modalTitle.textContent = '注册';
      registerFields.classList.remove('hidden');
      switchText.textContent = '已有账号？';
      switchAuthBtn.textContent = '立即登录';
      authForm.querySelector('button[type="submit"]').textContent = '注册';
    } else {
      modalTitle.textContent = '登录';
      registerFields.classList.add('hidden');
      switchText.textContent = '还没有账号？';
      switchAuthBtn.textContent = '立即注册';
      authForm.querySelector('button[type="submit"]').textContent = '登录';
    }
  });

  // 打开登录模态框
  function openLoginModal() {
    isRegisterMode = false;
    modalTitle.textContent = '登录';
    registerFields.classList.add('hidden');
    switchText.textContent = '还没有账号？';
    switchAuthBtn.textContent = '立即注册';
    authForm.querySelector('button[type="submit"]').textContent = '登录';
    authModal.classList.remove('hidden');
  }

  // 打开注册模态框
  function openRegisterModal() {
    isRegisterMode = true;
    modalTitle.textContent = '注册';
    registerFields.classList.remove('hidden');
    switchText.textContent = '已有账号？';
    switchAuthBtn.textContent = '立即登录';
    authForm.querySelector('button[type="submit"]').textContent = '注册';
    authModal.classList.remove('hidden');
  }

  // 关闭模态框
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      authModal.classList.add('hidden');
      document.getElementById('diary-modal').classList.add('hidden');
      authForm.reset();
    });
  });

  // 点击模态框背景关闭
  authModal.querySelector('.modal-overlay').addEventListener('click', function() {
    authModal.classList.add('hidden');
    authForm.reset();
  });

  // 登录/注册按钮事件
  loginBtn.addEventListener('click', openLoginModal);
  registerBtn.addEventListener('click', openRegisterModal);
  guestLoginBtn.addEventListener('click', openLoginModal);
  guestRegisterBtn.addEventListener('click', openRegisterModal);

  // 表单提交处理
  authForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email')?.value.trim() || '';
    const confirmPassword = document.getElementById('confirm-password')?.value.trim() || '';

    // 表单验证
    if (isRegisterMode && password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    try {
      if (isRegisterMode) {
        // 注册新用户
        const user = new AV.User();
        user.setUsername(username);
        user.setPassword(password);
        if (email) user.setEmail(email);
        user.set('isAdmin', false); // 默认不是管理员
        
        await user.signUp();
        alert('注册成功！请登录');
        openLoginModal();
      } else {
        // 登录现有用户
        const user = await AV.User.logIn(username, password);
        window.currentUser = user;
        initAuthState();
        authModal.classList.add('hidden');
        alert('登录成功！');
        
        // 加载日记列表
        loadDiaryList();
        
        // 检查是否为管理员
        if (user.get('isAdmin')) {
          adminLink.classList.remove('hidden');
          loadAdminPanel();
        } else {
          adminLink.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('认证失败:', error);
      alert('操作失败: ' + error.message);
    }
  });

  // 退出登录
  logoutLink.addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
      await AV.User.logOut();
      window.currentUser = null;
      initAuthState();
      alert('退出登录成功');
    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败: ' + error.message);
    }
  });

  // 初始化认证状态
  function initAuthState() {
    const user = window.currentUser;
    
    if (user) {
      // 已登录状态
      authButtons.classList.add('hidden');
      userMenu.classList.remove('hidden');
      usernameDisplay.textContent = user.getUsername();
      document.getElementById('guest-view').classList.add('hidden');
      document.getElementById('diary-view').classList.remove('hidden');
      
      // 检查管理员权限
      if (user.get('isAdmin')) {
        adminLink.classList.remove('hidden');
        document.getElementById('admin-view').classList.remove('hidden');
        loadAdminPanel();
      } else {
        adminLink.classList.add('hidden');
        document.getElementById('admin-view').classList.add('hidden');
      }
      
      // 加载日记列表
      loadDiaryList();
    } else {
      // 未登录状态
      authButtons.classList.remove('hidden');
      userMenu.classList.add('hidden');
      document.getElementById('guest-view').classList.remove('hidden');
      document.getElementById('diary-view').classList.add('hidden');
      adminLink.classList.add('hidden');
      document.getElementById('admin-view').classList.add('hidden');
    }
  }

  // 暴露函数供其他脚本使用
  window.initAuthState = initAuthState;
  window.openLoginModal = openLoginModal;
});