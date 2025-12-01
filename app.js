document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化 LeanCloud（你的配置已正确填写）
  const APP_ID = 'N22Ib3WihnpW82odMgkJdzWI-gzGzoHsz';
  const APP_KEY = 'rhqaqcH0YVrAwZvAfgJVGHcW';
  const SERVER_URL = 'https://n22ib3wi.lc-cn-n1-shared.com'; // 国内节点

  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
  });

  // 2. 全局变量
  let currentUser = null;
  let selectedFriend = null;
  let messageQuery = null;

  // 3. DOM 元素
  const authPanel = document.getElementById('auth-panel');
  const chatPanel = document.getElementById('chat-panel');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const friendsUl = document.getElementById('friends-ul');
  const chatHeader = document.getElementById('chat-header');
  const messageContainer = document.getElementById('message-container');
  const messageContent = document.getElementById('message-content');
  const sendBtn = document.getElementById('send-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userNickname = document.getElementById('user-nickname');

  // 4. 切换标签
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });

  // 5. 注册
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const nickname = document.getElementById('reg-nickname').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const submitBtn = registerForm.querySelector('.submit-btn');

    if (password.length < 6) {
      alert('密码长度不能少于6位');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '注册中...';

    try {
      const user = new AV.User();
      user.setUsername(username);
      user.setPassword(password);
      user.set('nickname', nickname);
      // 替换为稳定的占位符（解决证书问题）
      user.set('avatar', 'https://picsum.photos/40');
      await user.signUp();
      alert('注册成功！请登录');
      loginTab.click();
    } catch (error) {
      alert('注册失败：' + error.message);
      console.log('注册错误：', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '注册';
    }
  });

  // 6. 登录（重点修复）
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const submitBtn = loginForm.querySelector('.submit-btn');

    if (!username || !password) {
      alert('请输入用户名和密码');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '登录中...';

    try {
      // 登录并验证用户
      currentUser = await AV.User.logIn(username, password);
      await currentUser.fetch(); // 确保用户信息最新
      console.log('登录成功：', currentUser);
      showChatPanel();
      loadUserInfo();
      loadFriends();
      initMessageListener();
    } catch (error) {
      alert('登录失败：' + error.message);
      console.log('登录错误：', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '登录';
    }
  });

  // 7. 退出登录
  logoutBtn.addEventListener('click', async () => {
    try {
      await AV.User.logOut();
      currentUser = null;
      selectedFriend = null;
      authPanel.classList.add('active');
      chatPanel.classList.remove('active');
      messageContainer.innerHTML = '';
      chatHeader.textContent = '选择好友开始聊天';
    } catch (error) {
      alert('退出失败：' + error.message);
    }
  });

  // 8. 显示聊天面板
  function showChatPanel() {
    authPanel.classList.remove('active');
    chatPanel.classList.add('active');
  }

  // 9. 加载用户信息
  function loadUserInfo() {
    // 替换为稳定的占位符（解决证书问题）
    userAvatar.src = currentUser.get('avatar') || 'https://picsum.photos/40';
    userNickname.textContent = currentUser.get('nickname') || currentUser.getUsername();
  }

  // 10. 加载好友列表
  async function loadFriends() {
    friendsUl.innerHTML = '';
    try {
      const query1 = new AV.Query('Friend');
      query1.equalTo('user', currentUser);
      query1.equalTo('status', 1);

      const query2 = new AV.Query('Friend');
      query2.equalTo('friend', currentUser);
      query2.equalTo('status', 1);

      const combinedQuery = AV.Query.or(query1, query2);
      const friends = await combinedQuery.find();

      for (const friend of friends) {
        let friendUser = friend.get('user').id === currentUser.id ? friend.get('friend') : friend.get('user');
        await friendUser.fetch();
        addFriendToDOM(friendUser);
      }

      // 检查好友请求
      const requestQuery = new AV.Query('Friend');
      requestQuery.equalTo('friend', currentUser);
      requestQuery.equalTo('status', 0);
      const requests = await requestQuery.find();
      if (requests.length > 0) {
        alert(`你有 ${requests.length} 个好友请求待处理`);
      }
    } catch (error) {
      alert('加载好友失败：' + error.message);
    }
  }

  // 11. 添加好友到DOM
  function addFriendToDOM(friendUser) {
    const li = document.createElement('li');
    li.className = 'friend-item';
    li.dataset.userId = friendUser.id;
    li.innerHTML = `
      <!-- 替换为稳定的占位符（解决证书问题） -->
      <img src="${friendUser.get('avatar') || 'https://picsum.photos/40'}" alt="好友头像">
      <span>${friendUser.get('nickname') || friendUser.getUsername()}</span>
    `;
    li.addEventListener('click', () => {
      document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      selectedFriend = friendUser;
      chatHeader.textContent = friendUser.get('nickname') || friendUser.getUsername();
      loadHistoryMessages();
    });
    friendsUl.appendChild(li);
  }

  // 12. 加载历史消息
  async function loadHistoryMessages() {
    messageContainer.innerHTML = '';
    if (!selectedFriend) return;

    try {
      const query1 = new AV.Query('Message');
      query1.equalTo('from', currentUser);
      query1.equalTo('to', selectedFriend);

      const query2 = new AV.Query('Message');
      query2.equalTo('from', selectedFriend);
      query2.equalTo('to', currentUser);

      const combinedQuery = AV.Query.or(query1, query2);
      combinedQuery.ascending('createdAt');
      const messages = await combinedQuery.find();

      messages.forEach(message => renderMessage(message));
      messageContainer.scrollTop = messageContainer.scrollHeight;
    } catch (error) {
      alert('加载消息失败：' + error.message);
    }
  }

  // 13. 发送消息
  async function sendMessage() {
    const content = messageContent.value.trim();
    if (!content || !selectedFriend) return;

    try {
      const Message = AV.Object.extend('Message');
      const message = new Message();
      message.set('from', currentUser);
      message.set('to', selectedFriend);
      message.set('content', content);
      await message.save();

      messageContent.value = '';
      renderMessage(message);
      messageContainer.scrollTop = messageContainer.scrollHeight;
    } catch (error) {
      alert('发送消息失败：' + error.message);
    }
  }

  // 14. 渲染消息
  function renderMessage(message) {
    const isSelf = message.get('from').id === currentUser.id;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSelf ? 'right' : 'left'}`;
    messageDiv.textContent = message.get('content');
    messageContainer.appendChild(messageDiv);
  }

  // 15. 初始化实时消息监听
  function initMessageListener() {
    if (messageQuery) messageQuery.unsubscribe();

    messageQuery = new AV.Query('Message');
    messageQuery.equalTo('to', currentUser);
    messageQuery.subscribe().then(subscription => {
      subscription.on('create', (message) => {
        if (selectedFriend && message.get('from').id === selectedFriend.id) {
          renderMessage(message);
          messageContainer.scrollTop = messageContainer.scrollHeight;
        } else {
          const friendUser = message.get('from');
          alert(`收到 ${friendUser.get('nickname') || friendUser.getUsername()} 的消息`);
        }
      });
    });
  }

  // 16. 绑定发送消息事件
  sendBtn.addEventListener('click', sendMessage);
  messageContent.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

  // 17. 页面加载时检查登录状态
  (async () => {
    try {
      currentUser = AV.User.current();
      if (currentUser) await currentUser.fetch();
      if (currentUser) {
        showChatPanel();
        loadUserInfo();
        loadFriends();
        initMessageListener();
      }
    } catch (error) {
      currentUser = null;
      console.log('登录状态验证失败：', error.message);
    }
  })();
});