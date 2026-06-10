<template>
  <div v-if="!param.date" class="seat-empty">
    请到余票查询里选择一趟列车，
    <router-link to="/ticket">跳转到余票查询</router-link>
  </div>
  <div v-else class="seat-sell">
    <div class="seat-sell__head">
      <p class="eyebrow">SEAT SALES MAP</p>
      <h1>座位销售图</h1>
      <p class="seat-sell__meta">
        <span>{{ param.date }}</span>
        <span>{{ param.trainCode }}</span>
        <span>{{ param.departure }} → {{ param.destination }}</span>
      </p>
    </div>

    <div class="seat-legend">
      <span class="legend-chip legend-chip--sold"></span>
      <span class="legend-text">已被购买</span>
      <span class="legend-chip legend-chip--free"></span>
      <span class="legend-text">未被购买</span>
    </div>

    <div v-for="(seatObj, carriage) in train" :key="carriage" class="carriage-card">
      <div class="carriage-card__tag">{{ carriage }}</div>
      <table class="seat-table">
        <tr>
          <td v-for="(sell, index) in Object.values(seatObj)[0]" :key="index" class="seat-table__num">
            {{ index + 1 }}
          </td>
        </tr>
        <tr v-for="(sellList, col) in seatObj" :key="col">
          <td v-for="(sell, index) in sellList" :key="index"
              class="seat-cell"
              :class="sell > 0 ? 'seat-cell--sold' : 'seat-cell--free'">{{ col }}
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>

import {defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {notification} from "ant-design-vue";
import {useRoute} from "vue-router";

export default defineComponent({
  name: "seat-view",
  setup() {
    const route = useRoute();
    const param = ref({});
    param.value = route.query;
    const list = ref();
    // 使用对象更便于组装数组，三维数组只能存储最终的01，不能存储“车箱1”，“A”这些数据
    // {
    //   "车箱1": {
    //      "A" : ["000", "001", "001", "001"],
    //      "B" : ["000", "001", "001", "001"],
    //      "C" : ["000", "001", "001", "001"],
    //      "D" : ["000", "001", "001", "001"]
    //    }, "车箱2": {
    //      "A" : ["000", "001", "001", "001"],
    //      "B" : ["000", "001", "001", "001"],
    //      "C" : ["000", "001", "001", "001"],
    //      "D" : ["000", "001", "001", "001"],
    //      "D" : ["000", "001", "001", "001"]
    //    }
    // }
    let train = ref({});

    // 查询一列火车的所有车站
    const querySeat = () => {
      axios.get("/business/seat-sell/query", {
        params: {
          date: param.value.date,
          trainCode: param.value.trainCode,
        }
      }).then((response) => {
        let data = response.data;
        if (data.success) {
          list.value = data.content;
          format();
        } else {
          notification.error({description: data.message});
        }
      });
    };

    /**
     * 截取出当前区间的销售信息，并判断是否有票
     */
    const format = () => {
      let _train = {};

      for (let i = 0; i < list.value.length; i++) {
        let item = list.value[i];

        // 计算当前区间是否还有票，约定：站序是从0开始
        let sellDB = item.sell;

        // 假设6站：start = 1, end = 3, sellDB = 11111，最终得到：sell = 01110，转int 1100，不可买
        // 假设6站：start = 1, end = 3, sellDB = 11011，最终得到：sell = 01010，转int 1000，不可买
        // 假设6站：start = 1, end = 3, sellDB = 10001，最终得到：sell = 00000，转int 0，可买
        // 验证代码：
        // let sellDB = "123456789";
        // let start = 1;
        // let end = 3;
        // let sell = sellDB.substr(start, end - start)
        // console.log(sell)
        let sell = sellDB.substr(param.value.departureIndex, param.value.arrivalIndex - param.value.departureIndex);
        // console.log("完整的销卖信息：", sellDB, "区间内的销卖信息", sell);

        // 将sell放入火车数据中
        if (!_train["车箱" + item.carriageIndex]) {
          _train["车箱" + item.carriageIndex] = {};
        }
        if (!_train["车箱" + item.carriageIndex][item.col]) {
          _train["车箱" + item.carriageIndex][item.col] = [];
        }
        _train["车箱" + item.carriageIndex][item.col].push(parseInt(sell));
      }

      train.value = _train;
    }

    onMounted(() => {
      if (param.value.date) {
        querySeat();
      }
    });

    return {
      param,
      train
    };
  },
});
</script>

<style scoped>
.seat-empty {
  padding: 18px;
  color: var(--text-soft);
}

.seat-sell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.seat-sell__head {
  padding-bottom: 14px;
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

.seat-sell__head h1 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.seat-sell__meta {
  display: flex;
  flex-wrap: wrap;
  margin: 12px 0 0;
  gap: 8px;
}

.seat-sell__meta span {
  padding: 4px 11px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--text-soft);
  background: var(--surface-strong);
  font-family: var(--mono-font);
  font-size: 12px;
}

.seat-legend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-chip {
  display: inline-block;
  width: 22px;
  height: 16px;
  border-radius: var(--radius-sm);
}

.legend-chip--free {
  background: var(--primary);
}

.legend-chip--sold {
  border: 1px solid var(--line-strong);
  background: repeating-linear-gradient(135deg, rgba(18, 18, 20, 0.16) 0 5px, rgba(255, 255, 255, 0.2) 5px 10px);
}

:root[data-theme='dark'] .legend-chip--sold {
  background: repeating-linear-gradient(135deg, rgba(243, 243, 241, 0.2) 0 5px, transparent 5px 10px);
}

.legend-text {
  margin-right: 10px;
  color: var(--text-soft);
  font-size: 13px;
}

.carriage-card {
  position: relative;
  padding: 18px 14px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow-soft);
}

.carriage-card__tag {
  display: inline-block;
  margin-bottom: 10px;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  color: var(--on-primary);
  background: var(--primary);
  font-family: var(--display-font);
  font-size: 13px;
  font-weight: 700;
}

.seat-table {
  border-collapse: separate;
  border-spacing: 6px;
}

.seat-table__num {
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 12px;
  text-align: center;
}

.seat-cell {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  color: var(--on-primary);
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.seat-cell--free {
  background: var(--primary);
}

.seat-cell--sold {
  position: relative;
  color: var(--text-faint);
  border: 1px solid var(--line-strong);
  background: repeating-linear-gradient(135deg, rgba(18, 18, 20, 0.16) 0 5px, transparent 5px 10px);
}

:root[data-theme='dark'] .seat-cell--sold {
  background: repeating-linear-gradient(135deg, rgba(243, 243, 241, 0.18) 0 5px, transparent 5px 10px);
}
</style>
