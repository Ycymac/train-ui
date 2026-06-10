<template>
  <a-layout-header class="app-header">
    <router-link class="brand-mark" to="/welcome">
      <span class="brand-mark__icon"><control-outlined /></span>
      <span>
        <span class="brand-mark__title">RailFlow Admin</span>
        <span class="brand-mark__caption">Operations Center</span>
      </span>
    </router-link>

    <nav class="header-nav" aria-label="快捷导航">
      <router-link class="header-nav__link" to="/business/daily-train">每日车次</router-link>
      <router-link class="header-nav__link" to="/business/confirm-order">订单监控</router-link>
      <router-link class="header-nav__link" to="/base/station">基础数据</router-link>
      <router-link class="header-nav__link" to="/batch/job">调度任务</router-link>
    </nav>

    <div class="header-actions">
      <span class="header-clock" role="timer" aria-label="当前时间">
        {{ clock.h }}<span class="header-clock__sep">:</span>{{ clock.m }}<span class="header-clock__sep">:</span>{{ clock.s }}
      </span>
      <span class="header-user"><strong>管理控制台</strong></span>
      <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'"
          @click="toggleTheme"
      >
        <svg v-if="theme === 'dark'" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
        </svg>
        <svg v-else aria-hidden="true" focusable="false" viewBox="0 0 24 24">
          <path d="M20.4 15.5A8.1 8.1 0 0 1 8.5 3.6 8.6 8.6 0 1 0 20.4 15.5Z" />
        </svg>
      </button>
    </div>
  </a-layout-header>
</template>

<script>
import {defineComponent, onMounted, onUnmounted, reactive} from 'vue';
import {theme, toggleTheme} from '@/theme';

export default defineComponent({
  name: 'header-view',
  setup() {
    // 实时时钟
    const clock = reactive({h: '--', m: '--', s: '--'});
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date();
      clock.h = pad(now.getHours());
      clock.m = pad(now.getMinutes());
      clock.s = pad(now.getSeconds());
    };
    let timer;
    onMounted(() => {
      tick();
      timer = setInterval(tick, 1000);
    });
    onUnmounted(() => clearInterval(timer));

    return {
      clock,
      theme,
      toggleTheme
    };
  }
});
</script>
