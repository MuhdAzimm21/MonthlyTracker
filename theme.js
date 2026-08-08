(function () {
  const STORAGE_KEY = 'monthlyTrackerTheme';
  const THEMES = {
    default: '',
    aurora: 'theme-aurora.css',
    bento: 'theme-bento.css',
    clay: 'theme-clay.css'
  };

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY) || 'default';
    return Object.prototype.hasOwnProperty.call(THEMES, saved) ? saved : 'default';
  }

  function applyTheme(theme) {
    const selected = Object.prototype.hasOwnProperty.call(THEMES, theme) ? theme : 'default';
    const stylesheet = document.getElementById('theme-stylesheet');
    if (stylesheet) stylesheet.setAttribute('href', THEMES[selected]);
    document.documentElement.dataset.theme = selected;
    return selected;
  }

  applyTheme(getTheme());

  window.ThemeManager = {
    getTheme,
    setTheme(theme) {
      const selected = applyTheme(theme);
      localStorage.setItem(STORAGE_KEY, selected);
      return selected;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('settings-page')) {
      const container = document.querySelector('.container');
      if (container) {
        const button = document.createElement('a');
        button.className = 'top-settings';
        button.href = 'settings.html';
        button.setAttribute('aria-label', 'Open settings');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.427 1.756 2.925 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.427 1.756-2.925 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.427-1.756-2.925 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
        container.insertBefore(button, container.firstChild);
      }
    }
    const current = getTheme();
    document.querySelectorAll('[data-theme-choice]').forEach((choice) => {
      choice.classList.toggle('selected', choice.dataset.themeChoice === current);
      choice.addEventListener('click', () => {
        const selected = window.ThemeManager.setTheme(choice.dataset.themeChoice);
        document.querySelectorAll('[data-theme-choice]').forEach((item) => {
          item.classList.toggle('selected', item.dataset.themeChoice === selected);
        });
      });
    });
  });
}());
