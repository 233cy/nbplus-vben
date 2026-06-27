<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { useDebounceFn } from '@vueuse/core';

import { reqCheck, reqGet } from '#/api/core/captcha';

import { aesEncrypt } from './../utils/ase';
import { resetSize } from './../utils/util';

const props = withDefaults(defineProps<Props>(), {
  captchaType: '',
  initialData: undefined,
  type: '1',
  mode: 'pop',
  space: 5,
  explain: '',
  imgSize: () => ({
    width: '310px',
    height: '155px',
  }),
  blockSize: () => ({
    width: '50px',
    height: '50px',
  }),
  barSize: () => ({
    width: '310px',
    height: '40px',
  }),
});
const emit = defineEmits<{
  error: [instance: ComponentInstance];
  ready: [instance: ComponentInstance];
  success: [data: { captchaVerification: string }];
  typeChange: [type: string];
}>();
/**
 * VerifySlide 滑块验证组件
 */

// 常量定义
const BASE_WIDTH = 310; // 基准宽度
const JIGSAW_RATIO = 47; // 拼图块宽度比例
const Y_POSITION = 5; // Y轴固定位置

interface Props {
  captchaType?: string;
  initialData?: any;
  type?: string;
  mode?: 'fixed' | 'pop';
  space?: number;
  explain?: string;
  imgSize?: {
    height: string;
    width: string;
  };
  blockSize?: {
    height: string;
    width: string;
  };
  barSize?: {
    height: string;
    width: string;
  };
}

interface ComponentInstance {
  $el?: HTMLElement;
  $parent?: {
    clickShow?: boolean;
    closeBox?: () => void;
  };
}

const { proxy } = getCurrentInstance()!;

// 状态定义
const backImgBase = ref('');
const backToken = ref('');
const blockBackImgBase = ref('');
const startMoveTime = ref(0);
const endMovetime = ref(0);
const finishText = ref('');
const iconClass = ref('icon-right');
const iconColor = ref<string | undefined>(undefined);
const isEnd = ref(false);
const leftBarBorderColor = ref('#ddd');
const leftBarWidth = ref<string | undefined>(undefined);
const moveBlockBackgroundColor = ref<string | undefined>(undefined);
const moveBlockLeft = ref<string | undefined>(undefined);
const passFlag = ref(false);
const secretKey = ref('');
const setSize = reactive({
  imgHeight: '0',
  imgWidth: '0',
  barHeight: '0',
  barWidth: '0',
});
const showRefresh = ref(true);
const startLeft = ref(0);
const status = ref(false);
const text = ref('');
const tipWords = ref('');
const transitionLeft = ref('');
const transitionWidth = ref('');
const isLoad = ref(true);

const barAreaRef = ref<HTMLElement | null>(null);

const barArea = computed(() => {
  return barAreaRef.value || proxy?.$el?.querySelector('.verify-bar-area');
});

// 事件处理器引用（初始化为空函数避免未定义错误）
let moveHandler: (e: MouseEvent | TouchEvent) => void = () => {};
let endHandler: () => void = () => {};

// 鼠标按下
function start(e: MouseEvent | TouchEvent) {
  const x = 'touches' in e ? e.touches[0]?.pageX : e.clientX;

  if (!barArea.value || x === undefined) return;

  startLeft.value = Math.floor(x - barArea.value.getBoundingClientRect().left);
  startMoveTime.value = Date.now();

  if (!isEnd.value) {
    text.value = '';
    moveBlockBackgroundColor.value = '#337ab7';
    leftBarBorderColor.value = '#337AB7';
    iconColor.value = '#fff';
    e.stopPropagation();
    status.value = true;
  }
}

// 鼠标移动
function move(e: MouseEvent | TouchEvent) {
  if (status.value && !isEnd.value) {
    const x = 'touches' in e ? e.touches[0]?.pageX : e.clientX;

    if (!barArea.value || x === undefined) return;

    const barAreaLeft = barArea.value.getBoundingClientRect().left;
    let moveBlockLeftValue = x - barAreaLeft;

    const maxLeft = barArea.value.offsetWidth - Number.parseInt(props.blockSize.width) / 2 - 2;
    const minLeft = Number.parseInt(props.blockSize.width) / 2;

    if (moveBlockLeftValue >= maxLeft) {
      moveBlockLeftValue = maxLeft;
    }
    if (moveBlockLeftValue <= 0) {
      moveBlockLeftValue = minLeft;
    }

    const leftValue = moveBlockLeftValue - startLeft.value;
    moveBlockLeft.value = `${leftValue}px`;
    leftBarWidth.value = `${leftValue}px`;
  }
}

// 鼠标松开
function end() {
  endMovetime.value = Date.now();

  if (status.value && !isEnd.value) {
    isLoad.value = true;
    let moveLeftDistance = Number.parseInt((moveBlockLeft.value || '').replace('px', ''));
    // 将实际移动距离转换为基准宽度下的距离
    moveLeftDistance = (moveLeftDistance * BASE_WIDTH) / Number.parseInt(setSize.imgWidth);

    const pointData = { x: moveLeftDistance, y: Y_POSITION };
    const data = {
      captchaType: props.captchaType || '',
      pointJson: secretKey.value ? aesEncrypt(JSON.stringify(pointData), secretKey.value) : JSON.stringify(pointData),
      token: backToken.value,
    };

    reqCheck(data)
      .then(() => {
        handleSuccess(moveLeftDistance);
      })
      .catch(() => {
        handleError();
      });
    status.value = false;
  }
}

// 处理验证成功
function handleSuccess(moveLeftDistance: number) {
  moveBlockBackgroundColor.value = '#5cb85c';
  leftBarBorderColor.value = '#5cb85c';
  iconColor.value = '#fff';
  iconClass.value = 'icon-check';
  showRefresh.value = false;
  isEnd.value = true;
  passFlag.value = true;

  const duration = ((endMovetime.value - startMoveTime.value) / 1000).toFixed(2);
  tipWords.value = `${duration}s${$t('captcha.verifySuccess')}`;

  const pointData = { x: moveLeftDistance, y: Y_POSITION };
  const captchaVerification = secretKey.value
    ? aesEncrypt(`${backToken.value}---${JSON.stringify(pointData)}`, secretKey.value)
    : `${backToken.value}---${JSON.stringify(pointData)}`;

  setTimeout(() => {
    tipWords.value = '';
    const parent = proxy?.$parent as ComponentInstance['$parent'];
    parent?.closeBox?.();
    emit('success', { captchaVerification });
  }, 1000);
}

// 处理验证失败
function handleError() {
  moveBlockBackgroundColor.value = '#d9534f';
  leftBarBorderColor.value = '#d9534f';
  iconColor.value = '#fff';
  iconClass.value = 'icon-close';
  passFlag.value = false;
  tipWords.value = $t('captcha.verifyFailed');

  setTimeout(() => {
    tipWords.value = '';
    refresh();
  }, 1000);

  emit('error', proxy as ComponentInstance);
}

// 刷新验证码
const refresh = () => {
  // 重置所有状态
  showRefresh.value = true;
  finishText.value = '';
  status.value = false;
  passFlag.value = false;
  startMoveTime.value = 0;
  endMovetime.value = 0;
  startLeft.value = 0;

  // 设置过渡动画
  transitionLeft.value = 'left .3s';
  moveBlockLeft.value = '0';
  leftBarWidth.value = undefined;
  transitionWidth.value = 'width .3s';

  // 重置样式
  leftBarBorderColor.value = '#ddd';
  moveBlockBackgroundColor.value = '#fff';
  iconColor.value = '#000';
  iconClass.value = 'icon-right';
  isEnd.value = false;
  isLoad.value = true; // 立即显示 loading，避免旧图片的空窗期

  getPicture(undefined);

  setTimeout(() => {
    transitionWidth.value = '';
    transitionLeft.value = '';
    text.value = props.explain || $t('captcha.slide');
  }, 300);
};

// 获取图片验证码（内部实现，不节流）
async function doGetPicture(initial?: any) {
  isLoad.value = true;
  try {
    // 有初始数据时直接用，不发请求（首次挂载由父组件传入）
    const res = initial ?? (await reqGet());
    // 服务端返回的 type 与当前不一致时，通知父组件切换组件
    if (res.type && res.type !== props.captchaType) {
      emit('typeChange', res.type);
      return;
    }
    if (res.code) {
      tipWords.value = res.msg;
    } else {
      backImgBase.value = res.originalImageBase64;
      blockBackImgBase.value = res.jigsawImageBase64;
      backToken.value = res.token;
      secretKey.value = res.secretKey;
    }
  } catch {
    tipWords.value = $t('captcha.networkError');
  }
  isLoad.value = false;
}

// 节流版本，仅用于用户手动点击刷新按钮
const getPicture = useDebounceFn((initial?: any) => doGetPicture(initial), 800);

// 初始化
function init() {
  text.value = props.explain || $t('captcha.slide');
  doGetPicture(props.initialData ?? undefined);

  nextTick(() => {
    if (!proxy) return;

    try {
      const sizes = resetSize(proxy as any);
      setSize.imgHeight = sizes.imgHeight;
      setSize.imgWidth = sizes.imgWidth;
      setSize.barHeight = sizes.barHeight;
      setSize.barWidth = sizes.barWidth;

      emit('ready', proxy as ComponentInstance);
    } catch (error) {
      console.error('初始化尺寸失败:', error);
    }
  });

  // 移除旧的事件监听器
  window.removeEventListener('touchmove', moveHandler);
  window.removeEventListener('mousemove', moveHandler);
  window.removeEventListener('touchend', endHandler);
  window.removeEventListener('mouseup', endHandler);

  // 添加新的事件监听器（使用 passive 优化性能）
  moveHandler = move;
  endHandler = end;

  window.addEventListener('touchmove', moveHandler, { passive: true });
  window.addEventListener('mousemove', moveHandler);
  window.addEventListener('touchend', endHandler);
  window.addEventListener('mouseup', endHandler);
}

watch(() => props.type, init);

onMounted(() => {
  init();

  // 禁止文本选择
  proxy?.$el?.addEventListener('selectstart', (e: Event) => {
    e.preventDefault();
    return false;
  });
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('touchmove', moveHandler);
  window.removeEventListener('mousemove', moveHandler);
  window.removeEventListener('touchend', endHandler);
  window.removeEventListener('mouseup', endHandler);
});

defineExpose({
  refresh,
});
</script>

<template>
  <div style="position: relative">
    <a-spin :spinning="isLoad">
      <div v-if="type === '2'" class="verify-img-out" :style="{ height: `${Number.parseInt(setSize.imgHeight) + space}px` }">
        <div class="verify-img-panel" :style="{ width: setSize.imgWidth, height: setSize.imgHeight }">
          <a-skeleton-image v-if="!backImgBase" size="large" style="width: 100%; height: 100%" />
          <img v-else :src="`data:image/png;base64,${backImgBase}`" alt="验证码背景" style="display: block; width: 100%; height: 100%" />
          <div v-show="showRefresh" class="verify-refresh bg-white" @click="refresh">
            <i class="iconfont icon-refresh"></i>
          </div>
          <transition name="tips">
            <span v-if="tipWords" class="verify-tips" :class="passFlag ? 'suc-bg' : 'err-bg'">
              {{ tipWords }}
            </span>
          </transition>
        </div>
      </div>

      <!-- 公共部分 -->
      <div ref="barAreaRef" class="verify-bar-area" :style="{ width: setSize.imgWidth, height: barSize.height, 'line-height': barSize.height }">
        <span class="verify-msg">{{ text }}</span>
        <div
          class="verify-left-bar"
          :style="{
            width: leftBarWidth !== undefined ? leftBarWidth : barSize.height,
            height: barSize.height,
            'border-color': leftBarBorderColor,
            transition: transitionWidth,
          }"
        >
          <span class="verify-msg">{{ finishText }}</span>
          <div
            v-show="blockBackImgBase"
            class="verify-move-block"
            :style="{
              width: barSize.height,
              height: barSize.height,
              'background-color': moveBlockBackgroundColor,
              left: moveBlockLeft,
              transition: transitionLeft,
            }"
            @touchstart="start"
            @mousedown="start"
          >
            <i class="verify-icon iconfont" :class="[iconClass]" :style="{ color: iconColor }"></i>
            <div
              v-if="type === '2'"
              class="verify-sub-block"
              :style="{
                width: `${Math.floor((Number.parseInt(setSize.imgWidth) * JIGSAW_RATIO) / BASE_WIDTH)}px`,
                height: setSize.imgHeight,
                top: `-${Number.parseInt(setSize.imgHeight) + space}px`,
                'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
              }"
            >
              <img :src="`data:image/png;base64,${blockBackImgBase}`" alt="滑块图片" style="display: block; width: 100%; height: 100%; -webkit-user-drag: none" />
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>
<style scoped>
:deep(.ant-skeleton-image) {
  display: flex;

  /* 保证内部图标居中 */
  align-items: center;
  justify-content: center;
  width: 100% !important;

  /* 强制宽度 100% */
  min-width: unset !important;

  /* 清除 ant 可能设置的最小宽度 */
  height: 100% !important;

  /* 强制高度 100% */
}
</style>
