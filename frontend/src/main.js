import './style.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const filters = {
  all: { label: 'All tasks' },
  active: { label: 'In progress' },
  completed: { label: 'Completed' },
};

const state = {
  tasks: [],
  filter: 'all',
  search: '',
  editingTask: null,
  loading: false,
};

const elements = {
  list: document.querySelector('#task-list'),
  dialog: document.querySelector('#task-dialog'),
  form: document.querySelector('#task-form'),
  title: document.querySelector('#task-title'),
  description: document.querySelector('#task-description'),
  formError: document.querySelector('#form-error'),
  saveButton: document.querySelector('#save-task-button'),
  saveLabel: document.querySelector('#save-task-label'),
  titleCounter: document.querySelector('#title-counter'),
  search: document.querySelector('#search-input'),
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`The server returned an error (${response.status}).`);
    }
    throw new Error('The server returned an unreadable response.');
  }

  if (!response.ok) {
    const detail = payload.detail;
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).join(' ')
      : detail || payload.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return payload;
}

function taskFromResponse(payload) {
  return payload?.data?.todo;
}

function taskArrayFromResponse(payload) {
  const tasks = taskFromResponse(payload);
  if (!Array.isArray(tasks)) {
    throw new Error('The server response did not include a task list.');
  }
  return tasks;
}

async function loadTasks() {
  state.loading = true;
  renderTaskList();
  try {
    const payload = await request('/todo/');
    state.tasks = taskArrayFromResponse(payload);
    state.loading = false;
    render();
  } catch (error) {
    state.loading = false;
    elements.list.innerHTML = `
      <div class="error-state">
        <span class="error-icon" aria-hidden="true">!</span>
        <strong>We couldn't load your tasks</strong>
        <p>${escapeHtml(error.message)}</p>
        <button class="button button-secondary" type="button" data-action="retry">Try again</button>
      </div>`;
  }
}

function counts() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.complete).length;
  return { total, completed, remaining: total - completed };
}

function setText(selector, value) {
  document.querySelector(selector).textContent = String(value);
}

function updateSummary() {
  const { total, completed, remaining } = counts();
  setText('#stat-total', total);
  setText('#stat-remaining', remaining);
  setText('#stat-completed', completed);
  setText('#nav-all-count', total);
  setText('#nav-active-count', remaining);
  setText('#nav-completed-count', completed);
  setText('#filter-all-count', total);
  setText('#filter-active-count', remaining);
  setText('#filter-completed-count', completed);

  const message = total === 0
    ? 'A fresh page. What would you like to make happen?'
    : remaining === 0
      ? 'Everything is done. You made today count.'
      : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} to go. You’ve got this.`;
  setText('#overview-message', message);
}

function visibleTasks() {
  const query = state.search.trim().toLocaleLowerCase();
  return state.tasks.filter((task) => {
    if (state.filter === 'active' && task.complete) return false;
    if (state.filter === 'completed' && !task.complete) return false;
    if (!query) return true;
    return `${task.title} ${task.description}`.toLocaleLowerCase().includes(query);
  });
}

function dateLabel(dateString) {
  if (!dateString) return 'Added to your list';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Added to your list';
  return `Added ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`;
}

function taskMarkup(task, index) {
  const title = escapeHtml(task.title);
  const description = escapeHtml(task.description || '');
  return `
    <article class="task-card${task.complete ? ' is-complete' : ''}" style="--card-index:${index}">
      <button
        class="task-check${task.complete ? ' checked' : ''}"
        type="button"
        data-action="toggle"
        data-id="${task.id}"
        aria-label="${task.complete ? 'Mark as in progress' : 'Mark as completed'}"
        aria-pressed="${Boolean(task.complete)}"
      >${task.complete ? '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="m4 9 3.2 3.2L14 5.5" /></svg>' : ''}</button>
      <div class="task-copy">
        <h3>${title}</h3>
        ${description ? `<p>${description}</p>` : '<p class="no-description">No extra details</p>'}
        <span class="task-date"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.3" /></svg>${escapeHtml(dateLabel(task.created_at))}</span>
      </div>
      <span class="task-status ${task.complete ? 'status-done' : 'status-progress'}">${task.complete ? 'Completed' : 'In progress'}</span>
      <div class="task-actions">
        <button class="icon-button" type="button" data-action="edit" data-id="${task.id}" aria-label="Edit ${title}" title="Edit task">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.8 4.2 2 2a1.4 1.4 0 0 1 0 2l-8.4 8.4-3.5.8.8-3.5 8.4-8.4a1.4 1.4 0 0 1 2 0Z" /><path d="m12.5 5.5 2 2" /></svg>
        </button>
        <button class="icon-button delete-button" type="button" data-action="delete" data-id="${task.id}" aria-label="Delete ${title}" title="Delete task">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11m-9.5 0 .6 10h6.8l.6-10M8 6V4h4v2m-2 3v4m-2-4v4m4-4v4" /></svg>
        </button>
      </div>
    </article>`;
}

function renderTaskList() {
  if (state.loading) {
    elements.list.innerHTML = '<div class="loading-state"><span class="spinner" aria-hidden="true"></span><span>Getting your tasks...</span></div>';
    return;
  }

  const tasks = visibleTasks();
  setText('#visible-task-count', tasks.length);
  if (tasks.length === 0) {
    const hasSearch = state.search.trim().length > 0;
    const emptyTitle = hasSearch ? 'No matches just yet' : state.filter === 'completed' ? 'Nothing completed yet' : 'Your list is clear';
    const emptyCopy = hasSearch
      ? 'Try a different search, or clear it to see all your tasks.'
      : state.filter === 'completed'
        ? 'Once you finish a task, it’ll find its way here.'
        : 'Add a task to get started. Your next small win is waiting.';
    elements.list.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration" aria-hidden="true"><span class="empty-sun">✳</span><span class="empty-check">✓</span></div>
        <h3>${emptyTitle}</h3>
        <p>${emptyCopy}</p>
        ${hasSearch ? '<button class="text-button" type="button" data-action="clear-search">Clear search</button>' : '<button class="button button-primary" type="button" data-action="add"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg> Add your first task</button>'}
      </div>`;
    return;
  }

  elements.list.innerHTML = tasks.map(taskMarkup).join('');
}

function render() {
  updateSummary();
  renderTaskList();
  setText('#breadcrumb-current', filters[state.filter].label);
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const selected = button.dataset.filter === state.filter;
    button.classList.toggle(button.classList.contains('nav-item') ? 'active' : 'selected', selected);
    if (button.classList.contains('nav-item')) button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
}

function openDialog(task = null) {
  state.editingTask = task;
  elements.form.reset();
  elements.formError.textContent = '';
  document.querySelector('#dialog-title').textContent = task ? 'Edit task' : 'Add a task';
  elements.saveLabel.textContent = task ? 'Save changes' : 'Add task';
  if (task) {
    elements.title.value = task.title;
    elements.description.value = task.description || '';
  }
  updateTitleCounter();
  elements.dialog.showModal();
  elements.title.focus();
}

function closeDialog() {
  elements.dialog.close();
  state.editingTask = null;
}

function updateTitleCounter() {
  setText('#title-counter', `${elements.title.value.length} / 50`);
}

async function saveTask(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  const description = elements.description.value.trim();
  if (!title) {
    elements.formError.textContent = 'Please enter a task name.';
    elements.title.focus();
    return;
  }

  elements.saveButton.disabled = true;
  elements.saveLabel.textContent = state.editingTask ? 'Saving...' : 'Adding...';
  elements.formError.textContent = '';
  try {
    const task = state.editingTask;
    const payload = await request(task ? `/todo/${task.id}` : '/todo/', {
      method: task ? 'PUT' : 'POST',
      body: JSON.stringify({ title, description, complete: task?.complete ?? false }),
    });
    const savedTask = taskFromResponse(payload);
    if (!savedTask) throw new Error('The server did not return the saved task.');
    if (task) {
      state.tasks = state.tasks.map((item) => item.id === task.id ? savedTask : item);
    } else {
      state.tasks = [savedTask, ...state.tasks];
    }
    closeDialog();
    render();
  } catch (error) {
    elements.formError.textContent = error.message;
  } finally {
    elements.saveButton.disabled = false;
    elements.saveLabel.textContent = state.editingTask ? 'Save changes' : 'Add task';
  }
}

async function toggleTask(task) {
  try {
    const payload = await request(`/todo/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: task.title, description: task.description || '', complete: !task.complete }),
    });
    const updatedTask = taskFromResponse(payload);
    if (!updatedTask) throw new Error('The server did not return the updated task.');
    state.tasks = state.tasks.map((item) => item.id === task.id ? updatedTask : item);
    render();
  } catch (error) {
    showActionError(error);
  }
}

async function deleteTask(task) {
  if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
  try {
    await request(`/todo/${task.id}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    render();
  } catch (error) {
    showActionError(error);
  }
}

function showActionError(error) {
  elements.list.insertAdjacentHTML('afterbegin', `
    <div class="inline-error" role="alert">
      <span>${escapeHtml(error.message)}</span>
      <button type="button" data-action="dismiss-error" aria-label="Dismiss error">×</button>
    </div>`);
}

function setFilter(filter) {
  if (!filters[filter] || state.filter === filter) return;
  state.filter = filter;
  render();
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

document.querySelector('#add-task-button').addEventListener('click', () => openDialog());
document.querySelector('#close-dialog').addEventListener('click', closeDialog);
document.querySelector('#cancel-dialog').addEventListener('click', closeDialog);
elements.form.addEventListener('submit', saveTask);
elements.title.addEventListener('input', updateTitleCounter);
elements.search.addEventListener('input', () => {
  state.search = elements.search.value;
  renderTaskList();
});
document.querySelector('#refresh-button').addEventListener('click', loadTasks);
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeDialog();
});

elements.list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'retry') return loadTasks();
  if (action === 'add') return openDialog();
  if (action === 'clear-search') {
    elements.search.value = '';
    state.search = '';
    return renderTaskList();
  }
  if (action === 'dismiss-error') return button.closest('.inline-error').remove();
  const task = state.tasks.find((item) => String(item.id) === id);
  if (!task) return;
  if (action === 'edit') openDialog(task);
  if (action === 'toggle') await toggleTask(task);
  if (action === 'delete') await deleteTask(task);
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === 'Escape' && elements.dialog.open) closeDialog();
});

const now = new Date();
setText('#today-label', new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now));
setText('#greeting', `Make today ${now.getHours() < 12 ? 'bright.' : now.getHours() < 17 ? 'count.' : 'yours.'}`);
loadTasks();
