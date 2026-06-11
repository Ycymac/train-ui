<template>
  <p>
    <a-space>
      <a-button type="primary" @click="handleQuery()">刷新</a-button>
    </a-space>
  </p>
  <a-spin :spinning="loading">
    <div v-if="tickets.length" class="ticket-grid">
      <article v-for="record in tickets" :key="record.id" class="member-ticket-card">
        <div class="member-ticket-card__head">
          <div class="member-ticket-card__who">
            <strong>{{ record.passengerName || '—' }}</strong>
            <span class="who-meta">
              <span class="who-meta__row"><em>会员</em><b>#{{ record.memberId }}</b></span>
              <span class="who-meta__row"><em>乘客</em><b>#{{ record.passengerId }}</b></span>
            </span>
          </div>
          <span class="ticket-tag ticket-tag--seat" :class="'seat-type--' + record.seatType">
            {{ seatTypeName(record.seatType) }}
          </span>
        </div>

        <div class="member-ticket-card__route">
          <div class="route-end">
            <span class="route-end__station">{{ record.start }}</span>
            <span class="route-end__time">{{ formatTime(record.startTime) }}</span>
          </div>
          <div class="route-line"><i></i><span class="route-line__code">{{ record.trainCode }}</span><i></i></div>
          <div class="route-end route-end--right">
            <span class="route-end__station">{{ record.end }}</span>
            <span class="route-end__time">{{ formatTime(record.endTime) }}</span>
          </div>
        </div>

        <div class="member-ticket-card__foot">
          <span class="seat-chip">
            <span class="seat-chip__seg">{{ pad2(record.carriageIndex) }}车</span>
            <span class="seat-chip__seg">{{ record.row || '--' }}排</span>
            <span class="seat-chip__seg seat-chip__seg--col">{{ colName(record) }}</span>
          </span>
          <span class="member-ticket-card__date">{{ formatDate(record.date) }}</span>
        </div>
      </article>
    </div>
    <a-empty v-else description="暂无会员车票" />
  </a-spin>
  <div v-if="tickets.length" class="ticket-pager">
    <a-pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @change="onPageChange" />
  </div>
</template>

<script>
    import { defineComponent, ref, onMounted } from 'vue';
    import {notification} from "ant-design-vue";
    import axios from "axios";
    import dayjs from "dayjs";

    export default defineComponent({
        name: "ticket-view",
        setup() {
            const SEAT_COL_ARRAY = window.SEAT_COL_ARRAY;
            const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;
            const tickets = ref([]);
            const pagination = ref({
                total: 0,
                current: 1,
                pageSize: 10,
            });
            let loading = ref(false);

            const seatTypeName = (code) => (SEAT_TYPE_ARRAY || []).find(i => i.code === code)?.desc || code || '—';
            // 列号需结合座位类型匹配（同一 code 在不同座型下含义不同）
            const colName = (record) => {
                const hit = (SEAT_COL_ARRAY || []).find(i => i.code === record.col && i.type === record.seatType);
                return (hit?.desc || record.col || '--') + '座';
            };
            const pad2 = (v) => String(v ?? 0).padStart(2, '0');
            const formatDate = (v) => v ? dayjs(v).format("YYYY-MM-DD") : '--';
            const formatTime = (v) => {
                if (!v) return '--';
                const d = dayjs(v);
                return d.isValid() ? d.format("HH:mm") : String(v).slice(0, 5);
            };

            const handleQuery = (param) => {
                if (!param) {
                    param = {
                        page: 1,
                        pageSize: pagination.value.pageSize
                    };
                }
                loading.value = true;
                axios.get("/admin/ticket/query-list", {
                    params: {
                        page: param.page,
                        pageSize: param.pageSize
                    }
                }).then((response) => {
                    loading.value = false;
                    let data = response.data;
                    if (data.success) {
                        tickets.value = data.content.rows;
                        pagination.value.current = param.page;
                        pagination.value.total = data.content.total;
                    } else {
                        notification.error({description: data.message});
                    }
                });
            };

            const onPageChange = (page, pageSize) => {
                pagination.value.pageSize = pageSize;
                handleQuery({
                    page: page,
                    pageSize: pageSize
                });
            };

            onMounted(() => {
                handleQuery({
                    page: 1,
                    pageSize: pagination.value.pageSize
                });
            });

            return {
                tickets,
                pagination,
                loading,
                seatTypeName,
                colName,
                pad2,
                formatDate,
                formatTime,
                handleQuery,
                onPageChange,
            };
        },
    });
</script>

<style scoped>
.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.member-ticket-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow-soft);
}

.member-ticket-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.member-ticket-card__who strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 16px;
  font-weight: 700;
}

.who-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.who-meta__row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono-font);
  font-size: 11px;
}

.who-meta__row em {
  display: inline-flex;
  min-width: 30px;
  padding: 1px 6px;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  background: var(--primary-soft);
  font-style: normal;
  font-family: var(--body-font);
  font-weight: 600;
}

.who-meta__row b {
  color: var(--text-faint);
  font-weight: 700;
}

.ticket-tag {
  display: inline-flex;
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.ticket-tag--seat { border: 1px solid var(--line-strong); }
.seat-type--1 { color: #b03636; background: rgba(216, 65, 47, 0.12); }
.seat-type--2 { color: #2f5fd0; background: rgba(47, 95, 208, 0.1); }
.seat-type--3 { color: #7a4dbd; background: rgba(122, 77, 189, 0.13); }
.seat-type--4 { color: #2f8f57; background: rgba(47, 143, 87, 0.13); }

.member-ticket-card__route {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.route-end {
  display: flex;
  flex-direction: column;
}

.route-end--right {
  align-items: flex-end;
  text-align: right;
}

.route-end__station {
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
}

.route-end__time {
  color: var(--text-soft);
  font-family: var(--mono-font);
  font-size: 12px;
}

.route-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.route-line i {
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, var(--text-faint), var(--text));
}

.route-line__code {
  color: var(--text-soft);
  font-family: var(--mono-font);
  font-size: 11px;
  white-space: nowrap;
}

.member-ticket-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.seat-chip {
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
}

.seat-chip__seg {
  padding: 4px 10px;
  color: var(--text);
  background: var(--surface-strong);
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 700;
}

.seat-chip__seg + .seat-chip__seg {
  border-left: 1px solid var(--line);
}

.seat-chip__seg--col {
  color: var(--on-primary);
  background: var(--primary);
}

.member-ticket-card__date {
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 12px;
}

.ticket-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

:root[data-theme='dark'] .seat-type--1 { color: #e08a82; }
:root[data-theme='dark'] .seat-type--2 { color: #8ea9e8; }
:root[data-theme='dark'] .seat-type--3 { color: #b699e0; }
:root[data-theme='dark'] .seat-type--4 { color: #7ec79a; }
</style>
