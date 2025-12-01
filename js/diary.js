document.addEventListener('DOMContentLoaded', function() {
  // DOM元素
  const diaryModal = document.getElementById('diary-modal');
  const diaryForm = document.getElementById('diary-form');
  const addDiaryBtn = document.getElementById('add-diary-btn');
  const diaryList = document.getElementById('diary-list');
  const diaryModalTitle = document.getElementById('diary-modal-title');
  const diaryIdInput = document.getElementById('diary-id');
  const diaryTitleInput = document.getElementById('diary-title');
  const diaryContentInput = document.getElementById('diary-content');
  const diaryTagsInput = document.getElementById('diary-tags');
  const diaryMoodSelect = document.getElementById('diary-mood');
  const diaryWeatherSelect = document.getElementById('diary-weather');
  const searchDiaryInput = document.getElementById('search-diary');
  const filterTagsSelect = document.getElementById('filter-tags');

  // 打开新建日记模态框
  addDiaryBtn.addEventListener('click', function() {
    diaryModalTitle.textContent = '新建日记';
    diaryForm.reset();
    diaryIdInput.value = '';
    diaryModal.classList.remove('hidden');
  });

  // 表单提交处理（保存/更新日记）
diaryForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const diaryId = diaryIdInput.value;
  const title = diaryTitleInput.value.trim();
  const content = diaryContentInput.value.trim();
  const tags = diaryTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const mood = diaryMoodSelect.value;
  const weather = diaryWeatherSelect.value;

  // 表单验证
  if (!title || !content) {
    alert('标题和内容不能为空');
    return;
  }

  try {
    if (diaryId) {
      // 更新现有日记
      const diary = AV.Object.createWithoutData('Diary', diaryId);
      diary.set('title', title);
      diary.set('content', content);
      diary.set('tags', tags);
      diary.set('mood', mood);
      diary.set('weather', weather);
      await diary.save();
      alert('日记更新成功！');
    } else {
      // 创建新日记（修复 Pointer 关联问题）
      const Diary = AV.Object.extend('Diary');
      const diary = new Diary();
      
      // 关键修复：显式创建 User 类型的 Pointer（className 必须是 "User"）
      const currentUser = AV.User.current();
      const authorPointer = AV.Object.createWithoutData('User', currentUser.id);
      
      diary.set('title', title);
      diary.set('content', content);
      diary.set('tags', tags);
      diary.set('mood', mood);
      diary.set('weather', weather);
      diary.set('isPublic', false);
      diary.set('author', authorPointer); // 关联正确的 User Pointer
      
      await diary.save();
      alert('日记创建成功！');
    }
    
    // 关闭模态框并刷新列表
    diaryModal.classList.add('hidden');
    loadDiaryList();
  } catch (error) {
    console.error('保存日记失败:', error);
    alert('保存日记失败: ' + error.message);
  }
});

  // 加载日记列表
  async function loadDiaryList(filters = {}) {
    try {
      const user = AV.User.current();
      if (!user) return;

      const query = new AV.Query('Diary');
      
      // 普通用户只能看到自己的日记
      if (!user.get('isAdmin')) {
        query.equalTo('author', user);
      } else if (filters.userId) {
        // 管理员可以筛选特定用户的日记
        const userObj = AV.Object.createWithoutData('_User', filters.userId);
        query.equalTo('author', userObj);
      }
      
      // 搜索筛选
      if (filters.search) {
        const searchQuery = new AV.Query('Diary');
        searchQuery.contains('title', filters.search);
        
        const contentQuery = new AV.Query('Diary');
        contentQuery.contains('content', filters.search);
        
        query.or(searchQuery, contentQuery);
      }
      
      // 标签筛选
      if (filters.tag && filters.tag !== 'all') {
        query.containsAll('tags', [filters.tag]);
      }
      
      // 按创建时间降序排列
      query.descending('createdAt');
      
      // 关联查询作者信息
      query.include('author');
      
      const diaries = await query.find();
      renderDiaryList(diaries);
      updateTagFilters(diaries);
    } catch (error) {
      console.error('加载日记失败:', error);
      alert('加载日记失败: ' + error.message);
    }
  }

  // 渲染日记列表
  function renderDiaryList(diaries) {
    diaryList.innerHTML = '';
    
    if (diaries.length === 0) {
      diaryList.innerHTML = `
        <div class="empty-state">
          <i class="fa fa-book-open"></i>
          <p>暂无日记，点击新建按钮开始记录</p>
        </div>
      `;
      return;
    }
    
    diaries.forEach(diary => {
      const diaryObj = diary.toJSON();
      const author = diaryObj.author || {};
      const date = new Date(diaryObj.createdAt).toLocaleString();
      
      const diaryCard = document.createElement('div');
      diaryCard.className = 'diary-card';
      diaryCard.innerHTML = `
        <div class="diary-actions">
          <button class="diary-action-btn edit-diary" data-id="${diary.id}">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="diary-action-btn delete-diary" data-id="${diary.id}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
        <div class="diary-meta">
          <span>${date}</span>
          <span class="diary-mood"><i class="fa fa-smile-o"></i> ${diaryObj.mood}</span>
          <span class="diary-weather"><i class="fa fa-cloud"></i> ${diaryObj.weather}</span>
          ${AV.User.current().get('isAdmin') ? `<span>作者: ${author.username}</span>` : ''}
        </div>
        <h3>${diaryObj.title}</h3>
        <div class="diary-excerpt">${diaryObj.content}</div>
        <div class="diary-tags">
          ${diaryObj.tags?.map(tag => `<span class="diary-tag">${tag}</span>`).join('') || ''}
        </div>
      `;
      
      // 查看日记详情
      diaryCard.addEventListener('click', function(e) {
        if (!e.target.closest('.diary-action-btn')) {
          openDiaryDetail(diary);
        }
      });
      
      // 编辑日记
      diaryCard.querySelector('.edit-diary').addEventListener('click', function(e) {
        e.stopPropagation();
        openEditDiary(diary);
      });
      
      // 删除日记
      diaryCard.querySelector('.delete-diary').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('确定要删除这篇日记吗？')) {
          deleteDiary(diary.id);
        }
      });
      
      diaryList.appendChild(diaryCard);
    });
  }

  // 打开日记详情/编辑
  function openDiaryDetail(diary) {
    const diaryObj = diary.toJSON();
    diaryModalTitle.textContent = '查看日记';
    diaryIdInput.value = diary.id;
    diaryTitleInput.value = diaryObj.title;
    diaryContentInput.value = diaryObj.content;
    diaryTagsInput.value = diaryObj.tags?.join(', ') || '';
    diaryMoodSelect.value = diaryObj.mood || '开心';
    diaryWeatherSelect.value = diaryObj.weather || '晴天';
    
    // 查看模式下禁用表单
    diaryTitleInput.disabled = true;
    diaryContentInput.disabled = true;
    diaryTagsInput.disabled = true;
    diaryMoodSelect.disabled = true;
    diaryWeatherSelect.disabled = true;
    diaryForm.querySelector('button[type="submit"]').style.display = 'none';
    
    diaryModal.classList.remove('hidden');
    
    // 点击编辑按钮启用表单
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary mt-2';
    editBtn.textContent = '编辑日记';
    editBtn.addEventListener('click', function() {
      diaryModalTitle.textContent = '编辑日记';
      diaryTitleInput.disabled = false;
      diaryContentInput.disabled = false;
      diaryTagsInput.disabled = false;
      diaryMoodSelect.disabled = false;
      diaryWeatherSelect.disabled = false;
      diaryForm.querySelector('button[type="submit"]').style.display = 'inline-flex';
      editBtn.remove();
    });
    
    diaryForm.querySelector('.form-actions').appendChild(editBtn);
  }

  // 打开编辑日记
  function openEditDiary(diary) {
    const diaryObj = diary.toJSON();
    diaryModalTitle.textContent = '编辑日记';
    diaryIdInput.value = diary.id;
    diaryTitleInput.value = diaryObj.title;
    diaryContentInput.value = diaryObj.content;
    diaryTagsInput.value = diaryObj.tags?.join(', ') || '';
    diaryMoodSelect.value = diaryObj.mood || '开心';
    diaryWeatherSelect.value = diaryObj.weather || '晴天';
    
    // 启用表单
    diaryTitleInput.disabled = false;
    diaryContentInput.disabled = false;
    diaryTagsInput.disabled = false;
    diaryMoodSelect.disabled = false;
    diaryWeatherSelect.disabled = false;
    diaryForm.querySelector('button[type="submit"]').style.display = 'inline-flex';
    
    diaryModal.classList.remove('hidden');
  }

  // 删除日记
  async function deleteDiary(diaryId) {
    try {
      const diary = AV.Object.createWithoutData('Diary', diaryId);
      await diary.destroy();
      alert('日记删除成功！');
      loadDiaryList();
    } catch (error) {
      console.error('删除日记失败:', error);
      alert('删除日记失败: ' + error.message);
    }
  }

  // 更新标签筛选器
  function updateTagFilters(diaries) {
    const tags = new Set();
    
    diaries.forEach(diary => {
      diary.toJSON().tags?.forEach(tag => {
        if (tag) tags.add(tag);
      });
    });
    
    // 清空现有选项（保留"所有标签"）
    filterTagsSelect.innerHTML = '<option value="all">所有标签</option>';
    
    // 添加所有标签选项
    tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      filterTagsSelect.appendChild(option);
    });
  }

  // 搜索和筛选事件监听
  searchDiaryInput.addEventListener('input', function() {
    const searchTerm = this.value.trim();
    const tag = filterTagsSelect.value;
    
    loadDiaryList({
      search: searchTerm,
      tag: tag
    });
  });

  filterTagsSelect.addEventListener('change', function() {
    const searchTerm = searchDiaryInput.value.trim();
    const tag = this.value;
    
    loadDiaryList({
      search: searchTerm,
      tag: tag
    });
  });

  // 暴露函数供其他脚本使用
  window.loadDiaryList = loadDiaryList;

});

