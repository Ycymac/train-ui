<template>
  <!--  <p style="font-size: 20px; font-weight: bold">欢迎使用甲蛙12306售票系统</p>-->
  <div style="border: 4px solid orange;
              border-radius: 4px;
              padding: 10px; text-align: left">
    <h3>
      <b></b>
    </h3>
    <br>
  </div>
  <a-divider style="border-color: #7cb305" dashed/>
  <div style="border: 4px solid #99CCFF; border-radius: 4px; padding: 10px; text-align: left">
    <h3>
      <b></b>
    </h3>
    <div>
      
      <router-link to="/passenger">
      
      </router-link>
    </div>
    <div>
      
      <router-link to="/ticket">
      
      </router-link>
      
      <router-link to="/my-ticket">
      
      </router-link>
    
      <router-link to="/seat">
    
      </router-link>
    
    </div>
    <div style="font-size: 14px; color: red">
   
    </div>
    <div style="font-size: 14px; color: #888888">
   
    </div>
  </div>
</template>

<script>

import {defineComponent} from 'vue';

export default defineComponent({
  name: "welcome-view",
  setup() {
    return {};
  },
});
</script>
