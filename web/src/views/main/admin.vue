<template>
  <section class="admin-intro">
    <div class="admin-intro__head">
      <p class="eyebrow">ADMIN CONSOLE</p>
      <h1>管理控制台说明</h1>
      <p class="admin-intro__lead">
        管理台用于维护车次基础数据、每日业务数据、会员车票与跑批任务。为避免演示数据被随意改动影响体验，控制台默认只读说明，登录后按权限开放。
      </p>
      <a class="admin-intro__link" :href="adminUrl" target="_blank" rel="noopener">
        <span>打开管理控制台</span>
        <code>{{ adminUrl }}</code>
        <arrow-right-outlined />
      </a>
    </div>

    <div class="admin-grid">
      <article v-for="(item, i) in modules" :key="item.title" class="admin-card">
        <span class="admin-card__index">{{ String(i + 1).padStart(2, '0') }}</span>
        <h2>{{ item.title }}</h2>
        <p>{{ item.desc }}</p>
        <div class="admin-card__paths">
          <a v-for="entry in item.entries" :key="entry.path"
             class="admin-card__path" :href="adminUrl + '#' + entry.path" target="_blank" rel="noopener">
            {{ entry.name }}
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import {computed, defineComponent} from 'vue';

export default defineComponent({
  name: "admin-view",
  setup() {
    // 管理台与客运端同源部署，仅多一层 /admin/ 前缀（GitHub Pages 用 hash 路由）。
    // 本地开发（hash 路由未启用）回退到约定端口，保证链接始终可点。
    const adminUrl = computed(() => {
      const {origin, pathname} = window.location;
      const isPages = pathname.includes('/train-ui/');
      if (isPages) {
        return `${origin}/train-ui/admin/`;
      }
      // 本地：客运端默认 8080，管理台默认 8081（如有差异以实际启动端口为准）
      return origin.replace(/:\d+$/, ':8081') + '/';
    });

    const modules = [
      {
        title: '基础数据',
        desc: '维护所有火车基础数据：车次、车站、车厢、座位等。',
        entries: [
          {name: '车站管理', path: '/base/station'},
          {name: '火车管理', path: '/base/train'},
          {name: '列车座位', path: '/base/train-seat'}
        ]
      },
      {
        title: '业务数据',
        desc: '维护每日车次与余票信息，设置购票令牌，监控购票订单。',
        entries: [
          {name: '每日车次', path: '/business/daily-train'},
          {name: '每日座位图', path: '/business/daily-train-seat'},
          {name: '余票信息', path: '/business/daily-train-ticket'},
          {name: '令牌余量', path: '/business/sk-token'},
          {name: '订单监控', path: '/business/confirm-order'}
        ]
      },
      {
        title: '会员管理',
        desc: '管理会员、乘客及已出车票等信息。',
        entries: [
          {name: '会员车票', path: '/member/ticket'}
        ]
      },
      {
        title: '跑批管理',
        desc: '管理系统跑批任务：新增、删除、暂停、重启、重跑等。',
        entries: [
          {name: '任务管理', path: '/batch/job'}
        ]
      }
    ];

    return {
      adminUrl,
      modules
    };
  },
});
</script>

<style scoped>
.admin-intro {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.admin-intro__head {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.admin-intro__head h1 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.admin-intro__lead {
  max-width: 720px;
  margin: 14px 0 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.85;
}

.admin-intro__link {
  display: inline-flex;
  margin-top: 18px;
  padding: 10px 16px;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-md);
  color: var(--on-primary);
  background: var(--primary);
  font-weight: 700;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease;
}

.admin-intro__link:hover {
  background: var(--primary-strong);
  transform: translateY(-1px);
}

.admin-intro__link code {
  color: var(--on-primary);
  font-family: var(--mono-font);
  font-size: 12px;
  opacity: 0.85;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.admin-card {
  position: relative;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow-soft);
}

.admin-card__index {
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.admin-card h2 {
  margin: 6px 0 8px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 20px;
  font-weight: 700;
}

.admin-card p {
  margin: 0 0 14px;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.admin-card__paths {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-card__path {
  padding: 5px 11px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  background: var(--surface-strong);
  font-size: 12px;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
}

.admin-card__path:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-soft);
}
</style>
