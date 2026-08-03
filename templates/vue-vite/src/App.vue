<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

const input = ref<HTMLInputElement | null>(null);
const value = ref('');
const submitted = ref(false);
const error = computed(() => submitted.value && value.value.trim().length === 0 ? '请输入内容。' : '');

async function submit() {
  submitted.value = true;
  await nextTick();
  if (error.value) {
    input.value?.focus();
  }
}
</script>

<template>
  <main class="page">
    <h1>前端应用模板</h1>
    <p>从这里开始实现业务页面、接口适配和运行时配置。</p>
    <label>
      示例输入
      <input
        ref="input"
        v-model="value"
        :aria-describedby="error ? 'input-error' : undefined"
        :aria-invalid="error ? 'true' : undefined"
      >
    </label>
    <p
      v-if="error"
      id="input-error"
      role="alert"
    >
      {{ error }}
    </p>
    <button
      type="button"
      @click="submit"
    >
      提交
    </button>
    <p v-if="submitted && !error">
      提交成功。
    </p>
  </main>
</template>
