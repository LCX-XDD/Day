document.addEventListener('DOMContentLoaded', function() {
  // DOM元素
  const userFilter = document.getElementById('user-filter');
  const adminLink = document.getElementById('admin-link');
  const adminView = document.getElementById('admin-view');

  // 加载管理员面板
  async function loadAdminPanel() {
    try {
      const user = AV.User.current();
      if (!user || !user.get('isAdmin')) return;
      
      // 加载所有用户用于筛选
      await loadAllUsers();
      
      // 管理员链接点击事件
      adminLink.addEventListener('click', function(e) {
        e.preventDefault();
        adminView.classList.toggle('hidden');
        loadDiaryList(); // 加载所有日记
      });
      
      // 用户筛选事件
      userFilter.addEventListener('change', function() {
        const userId = this.value;
        loadDiaryList({
          userId: userId === 'all' ? null : userId
        });
      });
    } catch (error) {
      console.error('加载管理员面板失败:', error);
    }
  }

  // 加载所有用户
  async function loadAllUsers() {
    try {
      const query = new AV.Query('_User');
      query.ascending('username');
      const users = await query.find();
      
      // 清空现有选项（保留"所有用户"）
      userFilter.innerHTML = '<option value="all">所有用户</option>';
      
      // 添加用户选项
      users.forEach(user => {
        const userObj = user.toJSON();
        const option = document.createElement('option');
        option.value = userObj.objectId;
        option.textContent = userObj.username;
        userFilter.appendChild(option);
      });
    } catch (error) {
      console.error('加载用户列表失败:', error);
      alert('加载用户列表失败: ' + error.message);
    }
  }

  // 暴露函数供其他脚本使用
  window.loadAdminPanel = loadAdminPanel;
});