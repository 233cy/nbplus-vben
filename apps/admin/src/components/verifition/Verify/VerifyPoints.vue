<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue';

import { $t } from '@vben/locales';

import { useThrottleFn } from '@vueuse/core';

import { reqCheck, reqGet } from '#/api/core/captcha';

import { aesEncrypt } from './../utils/ase';
import { resetSize } from './../utils/util';

/**
 * 接口定义
 */
interface Props {
  mode?: 'fixed' | 'pop';
  captchaType?: string;
  space?: number;
  imgSize?: { height: string; width: string };
  barSize?: { height: string; width: string };
}

interface Point {
  x: number;
  y: number;
}

interface SetSize {
  imgHeight: string;
  imgWidth: string;
  barHeight: string;
  barWidth: string;
}

/**
 * Props 定义
 */
const props = withDefaults(defineProps<Props>(), {
  captchaType: '',
  mode: 'fixed',
  space: 5,
  imgSize: () => ({ width: '310px', height: '155px' }),
  barSize: () => ({ width: '310px', height: '40px' }),
});

/**
 * Emits 定义
 */
const emit = defineEmits<{
  (e: 'ready', instance: any): void;
  (e: 'success', data: { captchaVerification: string }): void;
  (e: 'error', instance: any): void;
  (e: 'close'): void; // 新增 close 事件，用于通知父组件关闭弹窗
}>();

// 获取当前实例 (仅用于兼容 resetSize 工具函数)
const { proxy } = getCurrentInstance()!;

// 常量
const CHECK_NUM = 3; // 默认需要点击的字数

// 状态
const backToken = ref('');
const barAreaBorderColor = ref<string | undefined>(undefined);
const barAreaColor = ref<string | undefined>(undefined);
const bindingClick = ref(true);
const tempPoints = ref<Point[]>([]); // 用户界面上显示的点
const checkPosArr = ref<Point[]>([]); // 用于提交的坐标数组
const pointBackImgBase = ref('');
const poinTextList = ref<string[]>([]);
const secretKey = ref('');
const text = ref('');
const isLoad = ref(true);
const showRefresh = ref(true);
const canvasRef = ref<HTMLElement | null>(null);

const setSize = reactive<SetSize>({
  imgHeight: '0',
  imgWidth: '0',
  barHeight: '0',
  barWidth: '0',
});

/**
 * 初始化
 */
const init = () => {
  tempPoints.value = [];
  checkPosArr.value = [];
  getPicture();

  nextTick(() => {
    if (!proxy) return;
    // 使用 as any 规避类型检查，兼容旧工具函数
    const sizes = resetSize(proxy as any);
    setSize.imgHeight = sizes.imgHeight;
    setSize.imgWidth = sizes.imgWidth;
    setSize.barHeight = sizes.barHeight;
    setSize.barWidth = sizes.barWidth;

    emit('ready', proxy);
  });
};

/**
 * 获取图片验证码
 */
const getPicture = useThrottleFn(async () => {
  isLoad.value = true;
  try {
    const res = await reqGet({ captchaType: props.captchaType });
    pointBackImgBase.value = res.originalImageBase64;
    backToken.value = res.token;
    secretKey.value = res.secretKey;
    poinTextList.value = res.wordList;
    text.value = $t('page.captcha.pointClickOrder', { text: poinTextList.value.join(',') });
  } catch {
    text.value = $t('page.captcha.loadFailed');
  } finally {
    isLoad.value = false;
  }
}, 1000);

/**
 * 点击 Canvas 处理
 */
const canvasClick = (e: MouseEvent) => {
  if (!canvasRef.value) return;

  const point = getMousePos(e);
  checkPosArr.value.push(point);

  // 在界面上绘制点
  if (tempPoints.value.length < CHECK_NUM) {
    tempPoints.value.push({ ...point });
  }

  // 达到点击次数，触发验证
  if (tempPoints.value.length === CHECK_NUM) {
    verify();
  }
};

/**
 * 获取鼠标/触摸坐标
 */
const getMousePos = (e: MouseEvent): Point => {
  return { x: e.offsetX, y: e.offsetY };
};

/**
 * 验证逻辑
 */
const verify = () => {
  isLoad.value = true;
  // 转换坐标比例
  const points = pointTransform(checkPosArr.value, setSize);
  checkPosArr.value = points; // 更新为转换后的坐标

  setTimeout(() => {
    const pointJson = JSON.stringify(checkPosArr.value);
    const encryptedPoints = secretKey.value ? aesEncrypt(pointJson, secretKey.value) : pointJson;

    const captchaVerification = secretKey.value ? aesEncrypt(`${backToken.value}---${pointJson}`, secretKey.value) : `${backToken.value}---${pointJson}`;

    const data = {
      captchaType: props.captchaType,
      pointJson: encryptedPoints,
      token: backToken.value,
    };

    reqCheck(data)
      .then(() => {
        handleSuccess(captchaVerification);
      })
      .catch(() => {
        handleError();
      });
  }, 400);
};

/**
 * 处理成功
 */
const handleSuccess = (captchaVerification: string) => {
  barAreaColor.value = '#4cae4c';
  barAreaBorderColor.value = '#5cb85c';
  text.value = $t('page.captcha.verifySuccess');
  bindingClick.value = false;
  showRefresh.value = false;

  if (props.mode === 'pop') {
    setTimeout(() => {
      emit('close'); // 通知父组件关闭
      refresh();
    }, 1500);
  }
  emit('success', { captchaVerification });
};

/**
 * 处理失败
 */
const handleError = () => {
  emit('error', proxy);
  barAreaColor.value = '#d9534f';
  barAreaBorderColor.value = '#d9534f';
  text.value = $t('page.captcha.verifyFailed');

  setTimeout(() => {
    refresh();
  }, 700);
};

/**
 * 刷新重置
 */
const refresh = () => {
  tempPoints.value = [];
  checkPosArr.value = [];
  barAreaColor.value = '#000';
  barAreaBorderColor.value = '#ddd';
  bindingClick.value = true;
  showRefresh.value = true;
  text.value = $t('page.captcha.pleaseRetry');
  getPicture();
};

/**
 * 坐标转换 (根据图片实际渲染尺寸转换回基准尺寸)
 */
const pointTransform = (pointArr: Point[], size: SetSize): Point[] => {
  return pointArr.map((p) => {
    // 1. 先去掉 'px' 单位
    // 2. 转为数字
    const width = Number.parseFloat(size.imgWidth.toString().replace('px', ''));
    const height = Number.parseFloat(size.imgHeight.toString().replace('px', ''));

    const x = Math.round((310 * p.x) / width);
    const y = Math.round((155 * p.y) / height);

    return { x, y };
  });
};

onMounted(() => {
  init();
  // 禁止图片选中
  proxy?.$el?.addEventListener('selectstart', (e: Event) => {
    e.preventDefault();
    return false;
  });
});

defineExpose({
  refresh,
});
</script>

<template>
  <div style="position: relative">
    <a-spin :spinning="isLoad">
      <div class="verify-img-out">
        <div
          class="verify-img-panel"
          :style="{
            width: setSize.imgWidth,
            height: setSize.imgHeight,
            'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
            'margin-bottom': `${space}px`,
          }"
        >
          <div class="verify-refresh" style="z-index: 3" @click="refresh" v-show="showRefresh">
            <i class="iconfont icon-refresh"></i>
          </div>

          <a-skeleton-image v-if="!pointBackImgBase" size="large" style="width: 100%; height: 100%" />
          <img
            v-else
            ref="canvasRef"
            :src="`data:image/png;base64,${pointBackImgBase}`"
            alt="验证码"
            style="display: block; width: 100%; height: 100%"
            @click="bindingClick ? canvasClick($event) : undefined"
          />

          <div
            v-for="(tempPoint, index) in tempPoints"
            :key="index"
            class="point-area"
            :style="{
              'background-color': '#1abd6c',
              color: '#fff',
              'z-index': 9999,
              width: '20px',
              height: '20px',
              'text-align': 'center',
              'line-height': '20px',
              'border-radius': '50%',
              position: 'absolute',
              top: `${Number(tempPoint.y) - 10}px`,
              left: `${Number(tempPoint.x) - 10}px`,
            }"
          >
            {{ index + 1 }}
          </div>
        </div>
      </div>

      <div
        class="verify-bar-area"
        :style="{
          width: setSize.imgWidth,
          color: barAreaColor,
          'border-color': barAreaBorderColor,
          'line-height': barSize.height,
        }"
      >
        <span v-if="text" class="verify-msg">{{ text }}</span>
        <span v-else class="verify-msg">{{ $t('page.captcha.loading') }}</span>
      </div>
    </a-spin>
  </div>
</template>
<style scoped>
:deep(.ant-skeleton-image) {
  display: flex; /* 保证内部图标居中 */
  align-items: center;
  justify-content: center;
  width: 100% !important; /* 强制宽度 100% */
  min-width: unset !important; /* 清除 ant 可能设置的最小宽度 */
  height: 100% !important; /* 强制高度 100% */
}
</style>
