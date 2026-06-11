<template>
  <p>
    <a-space>
      <a-button type="primary" @click="handleQuery()">刷新</a-button>

    </a-space>
  </p>
  <a-table :dataSource="confirmOrders"
           :columns="columns"
           :pagination="pagination"
           @change="handleTableChange"
           :loading="loading">
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'action'">
      </template>
      <template v-else-if="column.dataIndex === 'tickets'">
        <div class="ticket-cards">
          <div v-for="(t, idx) in parseTickets(record.tickets)" :key="idx" class="ticket-card">
            <div class="ticket-card__head">
              <span class="ticket-card__name">{{ t.passengerName || '—' }}</span>
              <span class="ticket-tag" :class="'passenger-type--' + t.passengerType">
                {{ passengerTypeName(t.passengerType) }}
              </span>
            </div>
            <div class="ticket-card__body">
              <span class="ticket-tag ticket-tag--seat" :class="'seat-type--' + t.seatTypeCode">
                {{ seatTypeName(t.seatTypeCode) }}
              </span>
              <span v-if="t.seat" class="ticket-seat">{{ t.seat }}</span>
              <span v-else class="ticket-seat ticket-seat--none">未选座</span>
            </div>
            <div class="ticket-card__id" v-if="t.passengerIdCard">{{ t.passengerIdCard }}</div>
          </div>
          <span v-if="!parseTickets(record.tickets).length" class="ticket-empty">无车票</span>
        </div>
      </template>
      <template v-else-if="column.dataIndex === 'status'">
        <span class="status-pill" :class="'status--' + record.status">
          {{ statusName(record.status) }}
        </span>
      </template>
    </template>
  </a-table>
</template>

<script>
import {defineComponent, ref, onMounted} from 'vue';
import {notification} from "ant-design-vue";
import axios from "axios";

export default defineComponent({
  name: "confirm-order-view",
  setup() {
    const CONFIRM_ORDER_STATUS_ARRAY = window.CONFIRM_ORDER_STATUS_ARRAY;
    const PASSENGER_TYPE_ARRAY = window.PASSENGER_TYPE_ARRAY;
    const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;

    // tickets 字段后端存为 JSON 字符串（也可能已是数组/对象），统一解析为数组
    const parseTickets = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [];
      }
    };

    const passengerTypeName = (code) => (PASSENGER_TYPE_ARRAY || []).find(i => i.code === code)?.desc || code || '—';
    const seatTypeName = (code) => (SEAT_TYPE_ARRAY || []).find(i => i.code === code)?.desc || code || '—';
    const statusName = (code) => (CONFIRM_ORDER_STATUS_ARRAY || []).find(i => i.code === code)?.desc || code || '—';

    const visible = ref(false);
    let confirmOrder = ref({
      id: undefined,
      memberId: undefined,
      date: undefined,
      trainCode: undefined,
      start: undefined,
      end: undefined,
      dailyTrainTicketId: undefined,
      tickets: undefined,
      status: undefined,
      createTime: undefined,
      updateTime: undefined,
    });
    const confirmOrders = ref([]);
    // 分页的三个属性名是固定的
    const pagination = ref({
      total: 0,
      current: 1,
      pageSize: 10,
    });
    let loading = ref(false);
    const columns = [
      {
        title: '会员id',
        dataIndex: 'memberId',
        key: 'memberId',
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: '车次编号',
        dataIndex: 'trainCode',
        key: 'trainCode',
      },
      {
        title: '出发站',
        dataIndex: 'start',
        key: 'start',
      },
      {
        title: '到达站',
        dataIndex: 'end',
        key: 'end',
      },
      {
        title: '余票ID',
        dataIndex: 'dailyTrainTicketId',
        key: 'dailyTrainTicketId',
      },
      {
        title: '车票',
        dataIndex: 'tickets',
        key: 'tickets',
        width: 320,
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        key: 'status',
      },
    ];


    const handleQuery = (param) => {
      if (!param) {
        param = {
          page: 1,
          pageSize: pagination.value.pageSize
        };
      }
      loading.value = true;
      axios.get("/admin/confirm-order/query-list", {
        params: {
          page: param.page,
          pageSize: param.pageSize
        }
      }).then((response) => {
        loading.value = false;
        let data = response.data;
        if (data.success) {
          confirmOrders.value = data.content.rows;
          // 设置分页控件的值
          pagination.value.current = param.page;
          pagination.value.total = data.content.total;
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleTableChange = (page) => {
      // console.log("看看自带的分页参数都有啥：" + JSON.stringify(page));
      pagination.value.pageSize = page.pageSize;
      handleQuery({
        page: page.current,
        pageSize: page.pageSize
      });
    };

    onMounted(() => {
      handleQuery({
        page: 1,
        pageSize: pagination.value.pageSize
      });
    });

    return {
      CONFIRM_ORDER_STATUS_ARRAY,
      confirmOrder,
      visible,
      confirmOrders,
      pagination,
      columns,
      handleTableChange,
      handleQuery,
      loading,
      parseTickets,
      passengerTypeName,
      seatTypeName,
      statusName,
    };
  },
});
</script>

<style scoped>
/* ---- 车票卡片 ---- */
.ticket-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.ticket-card {
  display: flex;
  flex-direction: column;
  min-width: 138px;
  padding: 10px 12px;
  gap: 7px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--text-faint);
  border-radius: var(--radius-md);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow-soft);
}

.ticket-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ticket-card__name {
  color: var(--text);
  font-family: var(--display-font);
  font-size: 14px;
  font-weight: 700;
}

.ticket-card__body {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-card__id {
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.ticket-empty {
  color: var(--text-faint);
  font-size: 13px;
}

/* ---- 标签：颜色区分元素含义 ---- */
.ticket-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* 乘客类型：成人/儿童/学生 */
.passenger-type--1 { color: #2f5fd0; background: rgba(47, 95, 208, 0.12); }
.passenger-type--2 { color: #c2701c; background: rgba(232, 160, 34, 0.16); }
.passenger-type--3 { color: #2f8f57; background: rgba(47, 143, 87, 0.14); }

/* 座位类型：一等座/二等座/软卧/硬卧 */
.ticket-tag--seat { border: 1px solid var(--line-strong); }
.seat-type--1 { color: #b03636; background: rgba(216, 65, 47, 0.12); }
.seat-type--2 { color: #2f5fd0; background: rgba(47, 95, 208, 0.1); }
.seat-type--3 { color: #7a4dbd; background: rgba(122, 77, 189, 0.13); }
.seat-type--4 { color: #2f8f57; background: rgba(47, 143, 87, 0.13); }

.ticket-seat {
  color: var(--text);
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 700;
}

.ticket-seat--none {
  color: var(--text-faint);
  font-family: var(--body-font);
  font-weight: 600;
}

/* ---- 订单状态药丸：颜色区分状态 ---- */
.status-pill {
  display: inline-flex;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status--I { color: var(--text-soft); background: var(--primary-soft); }
.status--P { color: #c2701c; background: rgba(232, 160, 34, 0.16); }
.status--S { color: #2f8f57; background: rgba(47, 143, 87, 0.15); }
.status--F { color: #b03636; background: rgba(216, 65, 47, 0.14); }
.status--E { color: #7a4dbd; background: rgba(122, 77, 189, 0.13); }
.status--C { color: var(--text-faint); background: var(--surface-muted); }

:root[data-theme='dark'] .passenger-type--1 { color: #8ea9e8; }
:root[data-theme='dark'] .passenger-type--2 { color: #e0b061; }
:root[data-theme='dark'] .passenger-type--3 { color: #7ec79a; }
:root[data-theme='dark'] .seat-type--1 { color: #e08a82; }
:root[data-theme='dark'] .seat-type--2 { color: #8ea9e8; }
:root[data-theme='dark'] .seat-type--3 { color: #b699e0; }
:root[data-theme='dark'] .seat-type--4 { color: #7ec79a; }
:root[data-theme='dark'] .status--P { color: #e0b061; }
:root[data-theme='dark'] .status--S { color: #7ec79a; }
:root[data-theme='dark'] .status--F { color: #e08a82; }
:root[data-theme='dark'] .status--E { color: #b699e0; }
</style>
