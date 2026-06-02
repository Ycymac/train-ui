import {ref} from 'vue';

const STORAGE_KEY = 'train-ui-theme';
const theme = ref('light');

const getInitialTheme = () => {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (value) => {
  theme.value = value;
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value;
  window.localStorage.setItem(STORAGE_KEY, value);
};

const initTheme = () => applyTheme(getInitialTheme());
const toggleTheme = () => applyTheme(theme.value === 'dark' ? 'light' : 'dark');

export {
  initTheme,
  theme,
  toggleTheme
};

