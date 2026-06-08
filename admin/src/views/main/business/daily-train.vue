<template>
  <section class="rail-admin-page daily-command">
    <div class="daily-command__hero">
      <div>
        <p class="eyebrow">DAILY TRAIN PLAN</p>
        <h1>每日车次</h1>
        <p class="hero-copy">以运行日期为边界维护每日车次快照，展开一趟车即可同步处理当天经停站与车厢编组。</p>
      </div>
      <div class="hero-actions">
        <a-date-picker v-model:value="params.date" valueFormat="YYYY-MM-DD" placeholder="选择日期"/>
        <train-select-view v-model:value="params.code" width="220px"></train-select-view>
        <a-button @click="handleQuery()">查询</a-button>
        <a-button type="primary" @click="onAddDailyTrain">新增每日车次</a-button>
        <a-button danger @click="onClickGenerateDailyTrain">手动生成</a-button>
      </div>
    </div>

    <div class="daily-command__toolbar">
      <div class="toolbar-stat">
        <strong>{{ pagination.total }}</strong>
        <span>运行车次</span>
      </div>
      <div class="toolbar-note">点击左侧箭头后再加载并显示经停站、车厢数量；每日座位在“每日座位图”中按车次查看。</div>
    </div>

    <a-table
        class="train-table"
        :dataSource="dailyTrains"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        :row-key="makeDailyKey"
        :expanded-row-keys="expandedDailyKeys"
        @expand="handleExpand"
        @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'code'">
          <div class="train-code">
            <span class="train-code__badge">{{ record.type || 'TR' }}</span>
            <div>
              <strong>{{ record.code }}</strong>
              <span>{{ getTrainTypeName(record.type) }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'date'">
          <span class="date-chip">{{ formatDate(record.date) || '--' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'route'">
          <div class="route-line">
            <span>{{ record.start }}</span>
            <i></i>
            <span>{{ record.end }}</span>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'time'">
          <span class="mono-time">{{ record.startTime || '--' }} - {{ record.endTime || '--' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'detail'">
          <div v-if="getDailyDetail(record).loaded" class="detail-chips">
            <span>{{ getDailyDetail(record).stations.length }} 站</span>
            <span>{{ getDailyDetail(record).carriages.length }} 节车厢</span>
          </div>
          <span v-else class="detail-placeholder">
            {{ getDailyDetail(record).loading ? '加载中' : '待展开' }}
          </span>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a @click.stop="syncDailyStructure(record)">同步结构</a>
            <a @click.stop="onEditDailyTrain(record)">编辑</a>
            <a-popconfirm
                title="删除后不可恢复，确认删除？"
                @confirm="onDeleteDailyTrain(record)"
                ok-text="确认"
                cancel-text="取消">
              <a class="danger-link" @click.stop>删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>

      <template #expandedRowRender="{ record }">
        <div class="train-expanded">
          <a-spin :spinning="getDailyDetail(record).loading">
            <div class="composition-grid">
              <section class="rail-panel rail-panel--stations">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">ROUTE STOPS</p>
                    <h2>{{ record.code }} 经停站</h2>
                    <small>{{ formatDate(record.date) }}</small>
                  </div>
                  <a-button size="small" @click="onAddStation(record)">新增车站</a-button>
                </div>
                <div v-if="getDailyDetail(record).stations.length" class="station-timeline">
                  <article
                      v-for="station in getDailyDetail(record).stations"
                      :key="station.id || station.index"
                      class="station-node">
                    <div class="station-node__index">{{ padIndex(station.index) }}</div>
                    <div class="station-node__body">
                      <strong>{{ station.name }}</strong>
                      <span>{{ station.inTime || '--' }} / {{ station.outTime || '--' }}</span>
                    </div>
                    <div class="station-node__meta">{{ station.km || 0 }} km</div>
                    <div class="station-node__actions">
                      <a @click="onEditStation(station)">编辑</a>
                      <a-popconfirm
                          title="删除后不可恢复，确认删除？"
                          @confirm="onDeleteStation(station)"
                          ok-text="确认"
                          cancel-text="取消">
                        <a class="danger-link">删除</a>
                      </a-popconfirm>
                    </div>
                  </article>
                </div>
                <a-empty v-else description="暂无经停站，先为当天车次添加站点" />
              </section>

              <section class="rail-panel rail-panel--carriages">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">CARRIAGE SET</p>
                    <h2>{{ record.code }} 车厢编组</h2>
                    <small>{{ formatDate(record.date) }}</small>
                  </div>
                  <a-button size="small" @click="onAddCarriage(record)">新增车厢</a-button>
                </div>
                <div v-if="getDailyDetail(record).carriages.length" class="carriage-line">
                  <article
                      v-for="carriage in getDailyDetail(record).carriages"
                      :key="carriage.id || carriage.index"
                      class="carriage-unit">
                    <div class="carriage-unit__nose"></div>
                    <div class="carriage-unit__content">
                      <strong>{{ padIndex(carriage.index) }} 车</strong>
                      <span>{{ getSeatTypeName(carriage.seatType) }}</span>
                      <small>{{ carriage.rowCount || 0 }} 排 / {{ carriage.seatCount || 0 }} 座</small>
                    </div>
                    <div class="carriage-unit__actions">
                      <a @click="onEditCarriage(carriage)">编辑</a>
                      <a-popconfirm
                          title="删除后不可恢复，确认删除？"
                          @confirm="onDeleteCarriage(carriage)"
                          ok-text="确认"
                          cancel-text="取消">
                        <a class="danger-link">删除</a>
                      </a-popconfirm>
                    </div>
                  </article>
                </div>
                <a-empty v-else description="暂无车厢，添加车厢后可生成当日座位" />
              </section>
            </div>
          </a-spin>
        </div>
      </template>
    </a-table>

    <a-modal v-model:open="dailyTrainVisible" title="每日车次" :width="720" @ok="handleDailyTrainOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="dailyTrain" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="日期">
          <a-date-picker v-model:value="dailyTrain.date" valueFormat="YYYY-MM-DD" placeholder="请选择日期"/>
        </a-form-item>
        <a-form-item label="车次编号">
          <train-select-view v-model:value="dailyTrain.code" @change="onChangeCode"></train-select-view>
        </a-form-item>
        <a-form-item label="车次类型">
          <a-select v-model:value="dailyTrain.type">
            <a-select-option v-for="item in TRAIN_TYPE_ARRAY" :key="item.code" :value="item.code">
              {{ item.desc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="始发站">
          <a-input v-model:value="dailyTrain.start"/>
        </a-form-item>
        <a-form-item label="始发站拼音">
          <a-input v-model:value="dailyTrain.startPinyin"/>
        </a-form-item>
        <a-form-item label="出发时间">
          <a-time-picker v-model:value="dailyTrain.startTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="终点站">
          <a-input v-model:value="dailyTrain.end"/>
        </a-form-item>
        <a-form-item label="终点站拼音">
          <a-input v-model:value="dailyTrain.endPinyin"/>
        </a-form-item>
        <a-form-item label="到站时间">
          <a-time-picker v-model:value="dailyTrain.endTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="stationVisible" title="每日经停站" :width="720" @ok="handleStationOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="dailyTrainStation" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="日期">
          <a-date-picker v-model:value="dailyTrainStation.date" valueFormat="YYYY-MM-DD" placeholder="请选择日期"/>
        </a-form-item>
        <a-form-item label="车次编号">
          <train-select-view v-model:value="dailyTrainStation.trainCode"></train-select-view>
        </a-form-item>
        <a-form-item label="站序">
          <a-input-number v-model:value="dailyTrainStation.index" :min="1" style="width: 100%"/>
        </a-form-item>
        <a-form-item label="站名">
          <a-input v-model:value="dailyTrainStation.name"/>
        </a-form-item>
        <a-form-item label="站名拼音">
          <a-input v-model:value="dailyTrainStation.namePinyin" disabled/>
        </a-form-item>
        <a-form-item label="进站时间">
          <a-time-picker v-model:value="dailyTrainStation.inTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="出站时间">
          <a-time-picker v-model:value="dailyTrainStation.outTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="停站时长">
          <a-time-picker v-model:value="dailyTrainStation.stopTime" valueFormat="HH:mm:ss" disabled/>
        </a-form-item>
        <a-form-item label="里程">
          <a-input-number v-model:value="dailyTrainStation.km" :min="0" style="width: 100%" addon-after="km"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="carriageVisible" title="每日车厢编组" :width="680" @ok="handleCarriageOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="dailyTrainCarriage" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="日期">
          <a-date-picker v-model:value="dailyTrainCarriage.date" valueFormat="YYYY-MM-DD" placeholder="请选择日期"/>
        </a-form-item>
        <a-form-item label="车次编号">
          <train-select-view v-model:value="dailyTrainCarriage.trainCode"></train-select-view>
        </a-form-item>
        <a-form-item label="车厢号">
          <a-input-number v-model:value="dailyTrainCarriage.index" :min="1" style="width: 100%"/>
        </a-form-item>
        <a-form-item label="座位类型">
          <a-select v-model:value="dailyTrainCarriage.seatType">
            <a-select-option v-for="item in SEAT_TYPE_ARRAY" :key="item.code" :value="item.code">
              {{ item.desc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排数">
          <a-input-number v-model:value="dailyTrainCarriage.rowCount" :min="1" style="width: 100%"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="generateDailyVisible" title="生成每日车次" @ok="handleGenerateDailyOK"
             :confirm-loading="generateDailyLoading" ok-text="确认" cancel-text="取消">
      <a-form :model="generateDaily" :label-col="{span: 4}" :wrapper-col="{ span: 20 }">
        <a-form-item label="日期">
          <a-date-picker v-model:value="generateDaily.date" placeholder="请选择日期"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script>
import {defineComponent, ref, onMounted, watch} from 'vue';
import {notification} from "ant-design-vue";
import axios from "axios";
import TrainSelectView from "@/components/train-select.vue";
import {pinyin} from "pinyin-pro";
import dayjs from 'dayjs';

const emptyDailyTrain = () => ({
  id: undefined,
  date: undefined,
  code: undefined,
  type: undefined,
  start: undefined,
  startPinyin: undefined,
  startTime: undefined,
  end: undefined,
  endPinyin: undefined,
  endTime: undefined,
});

const emptyDailyStation = (date, trainCode, index = 1) => ({
  id: undefined,
  date,
  trainCode,
  index,
  name: undefined,
  namePinyin: undefined,
  inTime: undefined,
  outTime: undefined,
  stopTime: undefined,
  km: undefined,
});

const emptyDailyCarriage = (date, trainCode, index = 1) => ({
  id: undefined,
  date,
  trainCode,
  index,
  seatType: undefined,
  seatCount: undefined,
  rowCount: undefined,
  colCount: undefined,
});

const emptyDetail = () => ({
  stations: [],
  carriages: [],
  loading: false,
  loaded: false,
});

export default defineComponent({
  name: "daily-train-view",
  components: {TrainSelectView},
  setup() {
    const TRAIN_TYPE_ARRAY = window.TRAIN_TYPE_ARRAY;
    const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;

    const dailyTrainVisible = ref(false);
    const stationVisible = ref(false);
    const carriageVisible = ref(false);
    const dailyTrain = ref(emptyDailyTrain());
    const dailyTrainStation = ref(emptyDailyStation());
    const dailyTrainCarriage = ref(emptyDailyCarriage());
    const dailyTrains = ref([]);
    const dailyDetails = ref({});
    const expandedDailyKeys = ref([]);
    const pagination = ref({
      total: 0,
      current: 1,
      pageSize: 10,
    });
    const loading = ref(false);
    const params = ref({
      date: null,
      code: null
    });
    const generateDaily = ref({
      date: null,
    });
    const generateDailyVisible = ref(false);
    const generateDailyLoading = ref(false);

    const columns = [
      { title: '日期', dataIndex: 'date', key: 'date', width: 140 },
      { title: '车次', dataIndex: 'code', key: 'code', width: 180 },
      { title: '线路', dataIndex: 'route', key: 'route' },
      { title: '运行时间', dataIndex: 'time', key: 'time', width: 190 },
      { title: '结构', dataIndex: 'detail', key: 'detail', width: 180 },
      { title: '操作', dataIndex: 'action', key: 'action', width: 210 }
    ];

    const formatDate = (value) => {
      if (!value) {
        return undefined;
      }
      if (typeof value === 'number') {
        return dayjs(value).format("YYYY-MM-DD");
      }
      if (/^\d+$/.test(String(value))) {
        return dayjs(Number(value)).format("YYYY-MM-DD");
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        return String(value).slice(0, 10);
      }
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
    };

    const makeDailyKey = (record) => `${formatDate(record.date) || 'no-date'}-${record.code || record.trainCode || 'no-code'}`;
    const byIndex = (a, b) => Number(a.index || a.carriageIndex || 0) - Number(b.index || b.carriageIndex || 0);
    const getTrainTypeName = (type) => (TRAIN_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '--';
    const getSeatTypeName = (type) => (SEAT_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '--';
    const padIndex = (value) => String(value || 0).padStart(2, '0');

    const getDailyDetail = (record) => {
      const key = typeof record === 'string' ? record : makeDailyKey(record);
      if (!dailyDetails.value[key]) {
        dailyDetails.value = {
          ...dailyDetails.value,
          [key]: emptyDetail()
        };
      }
      return dailyDetails.value[key];
    };

    const setDailyDetail = (record, patch) => {
      const key = typeof record === 'string' ? record : makeDailyKey(record);
      dailyDetails.value = {
        ...dailyDetails.value,
        [key]: {
          ...getDailyDetail(key),
          ...patch
        }
      };
    };

    const resetDailyDetails = () => {
      dailyDetails.value = {};
    };

    const queryAllRows = async (url, queryParams = {}) => {
      const pageSize = 100;
      let page = 1;
      let total = 0;
      let rows = [];

      do {
        const response = await axios.get(url, {
          params: {
            ...queryParams,
            page,
            pageSize
          }
        });
        const data = response.data;
        if (!data.success) {
          notification.error({description: data.message});
          return rows;
        }

        const content = data.content || {};
        const pageRows = content.rows || [];
        total = Number(content.total || pageRows.length);
        rows = [...rows, ...pageRows];
        page += 1;
        if (!pageRows.length) {
          break;
        }
      } while (rows.length < total);

      return rows;
    };

    const loadDailyDetail = async (record, force = false) => {
      const detail = getDailyDetail(record);
      if (detail.loaded && !force) {
        return;
      }
      const date = formatDate(record.date);
      const trainCode = record.code || record.trainCode;
      if (!date || !trainCode) {
        notification.error({description: "缺少日期或车次，无法查询结构"});
        return;
      }

      setDailyDetail(record, { loading: true });
      try {
        const [stations, carriages] = await Promise.all([
          queryAllRows("/admin/daily-train-station/query-list", { date, trainCode }),
          queryAllRows("/admin/daily-train-carriage/query-list", { date, trainCode })
        ]);
        setDailyDetail(record, {
          stations: stations.sort(byIndex),
          carriages: carriages.sort(byIndex),
          loaded: true
        });
      } finally {
        setDailyDetail(record, { loading: false });
      }
    };

    const handleExpand = (expanded, record) => {
      const key = makeDailyKey(record);
      if (expanded) {
        expandedDailyKeys.value = [...new Set([...expandedDailyKeys.value, key])];
        loadDailyDetail(record);
      } else {
        expandedDailyKeys.value = expandedDailyKeys.value.filter(item => item !== key);
      }
    };

    const reloadExpandedDetails = async () => {
      const records = dailyTrains.value.filter(record => expandedDailyKeys.value.includes(makeDailyKey(record)));
      await Promise.all(records.map(record => loadDailyDetail(record, true)));
    };

    const syncDailyStructure = async (record) => {
      const date = formatDate(record.date);
      if (!date) {
        notification.error({description: "缺少日期，无法同步结构"});
        return;
      }
      const key = makeDailyKey(record);
      setDailyDetail(record, { loading: true, loaded: false });
      try {
        const response = await axios.get("/admin/daily-train/gen-daily/" + date);
        const data = response.data;
        if (data.success) {
          notification.success({description: "同步成功"});
          resetDailyDetails();
          await handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize
          });
          const latest = dailyTrains.value.find(item => makeDailyKey(item) === key);
          if (latest) {
            await loadDailyDetail(latest, true);
          }
        } else {
          notification.error({description: data.message});
        }
      } finally {
        setDailyDetail(record, { loading: false });
      }
    };

    watch(() => dailyTrainStation.value.name, () => {
      dailyTrainStation.value.namePinyin = window.Tool?.isNotEmpty(dailyTrainStation.value.name)
          ? pinyin(dailyTrainStation.value.name, {toneType: 'none'}).replaceAll(" ", "")
          : "";
    }, {immediate: true});

    const refreshStopTime = () => {
      if (!dailyTrainStation.value.inTime || !dailyTrainStation.value.outTime) {
        dailyTrainStation.value.stopTime = undefined;
        return;
      }
      const diff = dayjs(dailyTrainStation.value.outTime, "HH:mm:ss")
          .diff(dayjs(dailyTrainStation.value.inTime, "HH:mm:ss"), "second");
      dailyTrainStation.value.stopTime = dayjs("00:00:00", "HH:mm:ss")
          .second(Math.max(diff, 0))
          .format("HH:mm:ss");
    };

    watch(() => dailyTrainStation.value.inTime, refreshStopTime, {immediate: true});
    watch(() => dailyTrainStation.value.outTime, refreshStopTime, {immediate: true});

    const onAddDailyTrain = () => {
      dailyTrain.value = emptyDailyTrain();
      dailyTrainVisible.value = true;
    };

    const onEditDailyTrain = (record) => {
      dailyTrain.value = {
        ...window.Tool.copy(record),
        date: formatDate(record.date)
      };
      dailyTrainVisible.value = true;
    };

    const onAddStation = (record) => {
      const nextIndex = getDailyDetail(record).stations.length + 1;
      dailyTrainStation.value = emptyDailyStation(formatDate(record.date), record.code, nextIndex);
      stationVisible.value = true;
    };

    const onEditStation = (record) => {
      dailyTrainStation.value = {
        ...window.Tool.copy(record),
        date: formatDate(record.date)
      };
      stationVisible.value = true;
    };

    const onAddCarriage = (record) => {
      const nextIndex = getDailyDetail(record).carriages.length + 1;
      dailyTrainCarriage.value = emptyDailyCarriage(formatDate(record.date), record.code, nextIndex);
      carriageVisible.value = true;
    };

    const onEditCarriage = (record) => {
      dailyTrainCarriage.value = {
        ...window.Tool.copy(record),
        date: formatDate(record.date)
      };
      carriageVisible.value = true;
    };

    const handleDailyTrainOk = () => {
      axios.post("/admin/daily-train/save", dailyTrain.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "保存成功"});
          dailyTrainVisible.value = false;
          handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize
          });
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleStationOk = () => {
      axios.post("/admin/daily-train-station/save", dailyTrainStation.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "经停站保存成功"});
          stationVisible.value = false;
          loadDailyDetail({
            date: dailyTrainStation.value.date,
            code: dailyTrainStation.value.trainCode
          }, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleCarriageOk = () => {
      axios.post("/admin/daily-train-carriage/save", dailyTrainCarriage.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "车厢保存成功"});
          carriageVisible.value = false;
          loadDailyDetail({
            date: dailyTrainCarriage.value.date,
            code: dailyTrainCarriage.value.trainCode
          }, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteDailyTrain = (record) => {
      axios.delete("/admin/daily-train/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "删除成功"});
          expandedDailyKeys.value = expandedDailyKeys.value.filter(key => key !== makeDailyKey(record));
          handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize,
          });
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteStation = (record) => {
      axios.delete("/admin/daily-train-station/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "经停站已删除"});
          loadDailyDetail({
            date: record.date,
            code: record.trainCode
          }, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteCarriage = (record) => {
      axios.delete("/admin/daily-train-carriage/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "车厢已删除"});
          loadDailyDetail({
            date: record.date,
            code: record.trainCode
          }, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleQuery = (param) => {
      if (!param) {
        param = {
          page: 1,
          pageSize: pagination.value.pageSize
        };
      }
      loading.value = true;
      return axios.get("/admin/daily-train/query-list", {
        params: {
          page: param.page,
          pageSize: param.pageSize,
          code: params.value.code,
          date: params.value.date
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          dailyTrains.value = data.content.rows;
          pagination.value.current = param.page;
          pagination.value.total = data.content.total;
          dailyTrains.value.forEach(item => getDailyDetail(item));
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleTableChange = (page) => {
      pagination.value.pageSize = page.pageSize;
      handleQuery({
        page: page.current,
        pageSize: page.pageSize
      });
    };

    const onChangeCode = (train) => {
      const date = dailyTrain.value.date;
      const temp = window.Tool.copy(train);
      delete temp.id;
      dailyTrain.value = {
        ...dailyTrain.value,
        ...temp,
        date
      };
    };

    const onClickGenerateDailyTrain = () => {
      generateDaily.value = {
        date: params.value.date ? dayjs(params.value.date) : null
      };
      generateDailyVisible.value = true;
    };

    const handleGenerateDailyOK = () => {
      if (!generateDaily.value.date) {
        notification.error({description: "请选择生成日期"});
        return;
      }
      const date = dayjs(generateDaily.value.date).format("YYYY-MM-DD");
      generateDailyLoading.value = true;
      axios.get("/admin/daily-train/gen-daily/" + date).then((response) => {
        generateDailyLoading.value = false;
        const data = response.data;
        if (data.success) {
          notification.success({description: "生成成功"});
          generateDailyVisible.value = false;
          resetDailyDetails();
          handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize
          }).then(() => {
            reloadExpandedDetails();
          });
        } else {
          notification.error({description: data.message});
        }
      });
    };

    onMounted(() => {
      handleQuery({
        page: 1,
        pageSize: pagination.value.pageSize
      });
    });

    return {
      TRAIN_TYPE_ARRAY,
      SEAT_TYPE_ARRAY,
      dailyTrain,
      dailyTrainStation,
      dailyTrainCarriage,
      dailyTrainVisible,
      stationVisible,
      carriageVisible,
      dailyTrains,
      dailyDetails,
      expandedDailyKeys,
      pagination,
      columns,
      loading,
      params,
      generateDaily,
      generateDailyVisible,
      generateDailyLoading,
      formatDate,
      makeDailyKey,
      getDailyDetail,
      getTrainTypeName,
      getSeatTypeName,
      padIndex,
      handleExpand,
      handleTableChange,
      handleQuery,
      loadDailyDetail,
      syncDailyStructure,
      onAddDailyTrain,
      onEditDailyTrain,
      onDeleteDailyTrain,
      handleDailyTrainOk,
      onAddStation,
      onEditStation,
      onDeleteStation,
      handleStationOk,
      onAddCarriage,
      onEditCarriage,
      onDeleteCarriage,
      handleCarriageOk,
      onChangeCode,
      onClickGenerateDailyTrain,
      handleGenerateDailyOK
    };
  },
});
</script>

<style scoped>
.rail-admin-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.daily-command {
  color: var(--text);
}

.daily-command__hero {
  position: relative;
  display: flex;
  overflow: hidden;
  min-height: 176px;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
      linear-gradient(135deg, rgba(255, 255, 252, 0.92), rgba(240, 248, 248, 0.78)),
      radial-gradient(circle at 92% 16%, rgba(80, 176, 189, 0.18), transparent 28%);
  box-shadow: var(--shadow-soft);
}

:root[data-theme='dark'] .daily-command__hero {
  background:
      linear-gradient(135deg, rgba(43, 45, 45, 0.92), rgba(34, 39, 40, 0.78)),
      radial-gradient(circle at 92% 16%, rgba(80, 176, 189, 0.16), transparent 28%);
}

.daily-command__hero::before {
  position: absolute;
  right: 28px;
  bottom: 26px;
  width: 46%;
  height: 3px;
  content: "";
  background: repeating-linear-gradient(90deg, rgba(38, 42, 45, 0.75) 0 34px, transparent 34px 44px);
  transform: skewX(-18deg);
}

.daily-command__hero::after {
  position: absolute;
  right: 62px;
  bottom: 43px;
  width: 210px;
  height: 42px;
  content: "";
  border: 1px solid rgba(39, 47, 52, 0.2);
  border-radius: 22px 8px 8px 22px;
  background: linear-gradient(90deg, rgba(65, 151, 169, 0.24), rgba(96, 145, 118, 0.18));
  clip-path: polygon(0 50%, 12% 0, 100% 0, 100% 100%, 12% 100%);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
}

.daily-command__hero h1 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(30px, 5vw, 54px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.hero-copy {
  max-width: 560px;
  margin: 12px 0 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.9;
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.daily-command__toolbar {
  display: flex;
  padding: 12px 4px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.toolbar-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.toolbar-stat strong {
  color: var(--text);
  font-family: var(--display-font);
  font-size: 34px;
  line-height: 1;
}

.toolbar-stat span,
.toolbar-note {
  color: var(--text-soft);
  font-size: 13px;
}

.train-table :deep(.ant-table) {
  border-radius: 18px;
}

.date-chip {
  display: inline-flex;
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--surface-strong);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
}

.train-code {
  display: flex;
  align-items: center;
  gap: 12px;
}

.train-code__badge {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 14px 7px 14px 7px;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #202326, #397f91);
  place-items: center;
}

.train-code strong,
.train-code span {
  display: block;
}

.train-code strong {
  color: var(--text);
  font-size: 16px;
  line-height: 1.2;
}

.train-code span {
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 12px;
}

.route-line {
  display: grid;
  grid-template-columns: max-content minmax(72px, 1fr) max-content;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 700;
}

.route-line i {
  height: 2px;
  background: linear-gradient(90deg, var(--success), var(--primary));
}

.mono-time {
  color: var(--text-soft);
  font-family: "SFMono-Regular", Consolas, monospace;
}

.detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-chips span {
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--surface-strong);
  font-size: 12px;
}

.detail-placeholder {
  color: var(--text-faint);
  font-size: 13px;
}

.danger-link {
  color: #b94a48 !important;
}

.train-expanded {
  padding: 6px 0 14px;
}

.composition-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.05fr) minmax(320px, 0.95fr);
  gap: 18px;
}

.rail-panel {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: 0 12px 28px rgba(31, 41, 46, 0.05);
}

.rail-panel::before {
  position: absolute;
  inset: auto -18px -28px auto;
  width: 150px;
  height: 150px;
  content: "";
  border: 1px solid rgba(65, 151, 169, 0.18);
  transform: rotate(18deg);
}

.panel-head {
  position: relative;
  z-index: 1;
  display: flex;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.panel-head h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 24px;
  font-weight: 700;
}

.panel-head small {
  display: block;
  margin-top: 4px;
  color: var(--text-faint);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
}

.station-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.station-node {
  display: grid;
  grid-template-columns: 44px 1fr max-content max-content;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.36);
}

:root[data-theme='dark'] .station-node {
  background: rgba(255, 255, 255, 0.04);
}

.station-node__index {
  display: grid;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(66, 151, 169, 0.26);
  border-radius: 50%;
  color: var(--primary);
  font-weight: 900;
  background: rgba(66, 151, 169, 0.08);
  place-items: center;
}

.station-node__body strong,
.station-node__body span {
  display: block;
}

.station-node__body strong {
  color: var(--text);
  font-size: 15px;
}

.station-node__body span,
.station-node__meta {
  color: var(--text-soft);
  font-size: 12px;
}

.station-node__actions,
.carriage-unit__actions {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.carriage-line {
  display: grid;
  gap: 12px;
}

.carriage-unit {
  display: grid;
  grid-template-columns: 30px 1fr max-content;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.36);
}

:root[data-theme='dark'] .carriage-unit {
  background: rgba(255, 255, 255, 0.04);
}

.carriage-unit__nose {
  background:
      linear-gradient(135deg, transparent 0 46%, rgba(33, 37, 40, 0.94) 47% 53%, transparent 54%),
      linear-gradient(180deg, #3b8997, #77a987);
}

.carriage-unit__content {
  padding: 12px 14px;
}

.carriage-unit__content strong,
.carriage-unit__content span,
.carriage-unit__content small {
  display: block;
}

.carriage-unit__content strong {
  color: var(--text);
  font-size: 15px;
}

.carriage-unit__content span {
  margin-top: 4px;
  color: var(--primary);
  font-weight: 700;
}

.carriage-unit__content small {
  margin-top: 4px;
  color: var(--text-faint);
}

.carriage-unit__actions {
  padding: 12px 14px;
  align-items: center;
}

@media (max-width: 1180px) {
  .composition-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .daily-command__hero,
  .daily-command__toolbar,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .station-node,
  .carriage-unit {
    grid-template-columns: 1fr;
  }

  .station-node__actions,
  .carriage-unit__actions {
    padding-left: 0;
  }
}
</style>
