<template>
  <a-row class="login">
    <a-col :span="6" :offset="9" class="login-main">
      <p class="login-eyebrow">RAILFLOW · 12306</p>
      <h1>12306 售票系统</h1>
      <a-form
          :model="loginForm"
          name="basic"
          autocomplete="off"
      >
        <a-form-item
            label=""
            name="mobile"
            :rules="[{ required: true, message: '请输入手机号!' }]"
        >
          <a-input v-model:value="loginForm.mobile" placeholder="手机号"/>
        </a-form-item>

        <a-form-item
            label=""
            name="code"
            :rules="[{ required: true, message: '请输入验证码!' }]"
        >
          <a-input v-model:value="loginForm.code">
            <template #addonAfter>
              <a @click="sendCode">获取验证码</a>
            </template>
          </a-input>
          <!--<a-input v-model:value="loginForm.code" placeholder="验证码"/>-->
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block @click="login">登录</a-button>
        </a-form-item>

      </a-form>
    </a-col>
  </a-row>
</template>

<script>
import { defineComponent, reactive } from 'vue';
import axios from 'axios';
import { notification } from 'ant-design-vue';
import { useRouter } from 'vue-router'
import store from "@/store";

export default defineComponent({
  name: "login-view",
  setup() {
    const router = useRouter();

    const loginForm = reactive({
      mobile: '13000000000',
      code: '',
    });

    const sendCode = () => {
      axios.post("/member/send-code", {
        mobile: loginForm.mobile
      }).then(response => {
        let data = response.data;
        if (data.success) {
          notification.success({ description: '发送验证码成功！' });
          loginForm.code = "123456";
        } else {
          notification.error({ description: data.message });
        }
      });
    };

    const login = () => {
      axios.post("/member/login", loginForm).then((response) => {
        let data = response.data;
        if (data.success) {
          notification.success({ description: '登录成功！' });
          const token = data.content.token;
          if (token) {
            localStorage.setItem("token", token);
            // 如果你想存 sessionStorage，就用 sessionStorage.setItem('token', token);
          }
          // 登录成功，跳到控台主页
          router.push("/welcome");
          store.commit("setMember", data.content);
        } else {
          notification.error({ description: data.message });
        }
      })
    };

    return {
      loginForm,
      sendCode,
      login
    };
  },
});
</script>

<style>
.login {
  min-height: 100vh;
  align-items: center;
}

.login-eyebrow {
  margin: 0 0 6px;
  color: var(--text-faint);
  font-family: var(--mono-font);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-align: center;
}

.login-main h1 {
  margin: 0 0 22px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-align: center;
}

.login-main {
  padding: 32px 30px 22px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow);
  backdrop-filter: var(--blur);
}
</style>
