<script type="text/babel">
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue';

import { reqCheck, reqGet } from '#/api/core/verify';

/**
 * VerifySlide
 * @description 滑块
 */
import { aesEncrypt } from './../utils/ase';
import { resetSize } from './../utils/util';
//  "captchaType":"blockPuzzle",
export default {
  name: 'VerifySlide',
  props: {
    captchaType: {
      type: String,
    },
    type: {
      type: String,
      default: '1',
    },
    // 弹出式pop，固定fixed
    mode: {
      type: String,
      default: 'fixed',
    },
    vSpace: {
      type: Number,
      default: 5,
    },
    explain: {
      type: String,
      default: '向右滑动完成验证',
    },
    imgSize: {
      type: Object,
      default() {
        return {
          width: '310px',
          height: '155px',
        };
      },
    },
    blockSize: {
      type: Object,
      default() {
        return {
          width: '50px',
          height: '50px',
        };
      },
    },
    barSize: {
      type: Object,
      default() {
        return {
          width: '310px',
          height: '40px',
        };
      },
    },
  },
  setup(props, context) {
    const { mode, captchaType, vSpace, imgSize, barSize, type, blockSize, explain } = toRefs(props);
    const { proxy } = getCurrentInstance();
    const backImgBase = ref(''); // 验证码背景图片
    const backToken = ref(''); // 后端返回的唯一token值
    const blockBackImgBase = ref(''); // 验证滑块的背景图片
    const endMovetime = ref(''); // 移动结束的时间
    const finishText = ref('');
    const iconClass = ref('icon-right');
    const iconColor = ref(undefined);
    const isEnd = ref(false); // 是够验证完成
    const left = ref(0);
    const leftBarBorderColor = ref('#ddd');
    const leftBarWidth = ref(undefined);
    // 移动中样式
    const moveBlockBackgroundColor = ref(undefined);
    const moveBlockLeft = ref(undefined);
    const passFlag = ref(''); // 是否通过的标识
    const secretKey = ref(''); // 后端返回的ase加密秘钥
    const setSize = reactive({
      imgHeight: 0,
      imgWidth: 0,
      barHeight: 0,
      barWidth: 0,
    });
    const showRefresh = ref(true);
    const startLeft = ref(0);
    const startMoveTime = ref(''); // 移动开始的时间
    const status = ref(false); // 鼠标状态
    const text = ref('');
    const tipsBackColor = ref(''); // 提示词的背景颜色
    const tipWords = ref('');
    const top = ref(0);
    const transitionLeft = ref('');
    const transitionWidth = ref('');
    const isLoad = ref(true);

    const barArea = computed(() => {
      return proxy.$el.querySelector('.verify-bar-area');
    });
    function init() {
      text.value = explain.value;
      getPictrue();
      nextTick(() => {
        const { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy);
        setSize.imgHeight = imgHeight;
        setSize.imgWidth = imgWidth;
        setSize.barHeight = barHeight;
        setSize.barWidth = barWidth;
        proxy.$parent.$emit('ready', proxy);
      });

      window.removeEventListener('touchmove', (e) => {
        move(e);
      });
      window.removeEventListener('mousemove', (e) => {
        move(e);
      });

      // 鼠标松开
      window.removeEventListener('touchend', () => {
        end();
      });
      window.removeEventListener('mouseup', () => {
        end();
      });

      window.addEventListener('touchmove', (e) => {
        move(e);
      });
      window.addEventListener('mousemove', (e) => {
        move(e);
      });

      // 鼠标松开
      window.addEventListener('touchend', () => {
        end();
      });
      window.addEventListener('mouseup', () => {
        end();
      });
    }
    watch(type, () => {
      init();
    });
    onMounted(() => {
      // 禁止拖拽
      init();
      proxy.$el.addEventListener('selectstart', () => {
        return false;
      });
    });
    // 鼠标按下
    function start(e) {
      e = e || window.event;
      if (e.touches) {
        // 兼容移动端
        var x = e.touches[0].pageX;
      } else {
        // 兼容PC端
        var x = e.clientX;
      }
      console.log(barArea);
      startLeft.value = Math.floor(x - barArea.value.getBoundingClientRect().left);
      startMoveTime.value = Date.now(); // 开始滑动的时间
      if (isEnd.value == false) {
        text.value = '';
        moveBlockBackgroundColor.value = '#337ab7';
        leftBarBorderColor.value = '#337AB7';
        iconColor.value = '#fff';
        e.stopPropagation();
        status.value = true;
      }
    }
    // 鼠标移动
    function move(e) {
      e = e || window.event;
      if (status.value && isEnd.value == false) {
        if (e.touches) {
          // 兼容移动端
          var x = e.touches[0].pageX;
        } else {
          // 兼容PC端
          var x = e.clientX;
        }
        const bar_area_left = barArea.value.getBoundingClientRect().left;
        let move_block_left = x - bar_area_left; // 小方块相对于父元素的left值
        if (move_block_left >= barArea.value.offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2) {
          move_block_left = barArea.value.offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2;
        }
        if (move_block_left <= 0) {
          move_block_left = Number.parseInt(Number.parseInt(blockSize.value.width) / 2);
        }
        // 拖动后小方块的left值
        moveBlockLeft.value = `${move_block_left - startLeft.value}px`;
        leftBarWidth.value = `${move_block_left - startLeft.value}px`;
      }
    }

    // 鼠标松开
    function end() {
      endMovetime.value = Date.now();
      // 判断是否重合
      if (status.value && isEnd.value == false) {
        let moveLeftDistance = Number.parseInt((moveBlockLeft.value || '').replace('px', ''));
        moveLeftDistance = (moveLeftDistance * 310) / Number.parseInt(setSize.imgWidth);
        const data = {
          captchaType: captchaType.value,
          pointJson: secretKey.value ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5 }), secretKey.value) : JSON.stringify({ x: moveLeftDistance, y: 5 }),
          token: backToken.value,
        };
        reqCheck(data).then((res) => {
          if (res.repCode == '0000') {
            moveBlockBackgroundColor.value = '#5cb85c';
            leftBarBorderColor.value = '#5cb85c';
            iconColor.value = '#fff';
            iconClass.value = 'icon-check';
            showRefresh.value = false;
            isEnd.value = true;
            if (mode.value == 'pop') {
              setTimeout(() => {
                proxy.$parent.clickShow = false;
                refresh();
              }, 1500);
            }
            passFlag.value = true;
            tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s验证成功`;
            const captchaVerification = secretKey.value
              ? aesEncrypt(`${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5 })}`, secretKey.value)
              : `${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5 })}`;
            setTimeout(() => {
              tipWords.value = '';
              proxy.$parent.closeBox();
              proxy.$parent.$emit('success', { captchaVerification });
            }, 1000);
          } else {
            moveBlockBackgroundColor.value = '#d9534f';
            leftBarBorderColor.value = '#d9534f';
            iconColor.value = '#fff';
            iconClass.value = 'icon-close';
            passFlag.value = false;
            setTimeout(() => {
              refresh();
            }, 1000);
            proxy.$parent.$emit('error', proxy);
            tipWords.value = '验证失败';
            setTimeout(() => {
              tipWords.value = '';
            }, 1000);
          }
        });
        status.value = false;
      }
    }

    const refresh = () => {
      showRefresh.value = true;
      finishText.value = '';

      transitionLeft.value = 'left .3s';
      moveBlockLeft.value = 0;

      leftBarWidth.value = undefined;
      transitionWidth.value = 'width .3s';

      leftBarBorderColor.value = '#ddd';
      moveBlockBackgroundColor.value = '#fff';
      iconColor.value = '#000';
      iconClass.value = 'icon-right';
      isEnd.value = false;

      getPictrue();
      setTimeout(() => {
        transitionWidth.value = '';
        transitionLeft.value = '';
        text.value = explain.value;
      }, 300);
    };

    // 请求背景图片和验证图片
    function getPictrue() {
      isLoad.value = true;
      const data = {
        captchaType: captchaType.value,
      };
      reqGet(data)
        .then((res) => {
          if (res.repCode == '0000') {
            backImgBase.value = res.repData.originalImageBase64;
            blockBackImgBase.value = res.repData.jigsawImageBase64;
            backToken.value = res.repData.token;
            secretKey.value = res.repData.secretKey;
          } else {
            tipWords.value = res.repMsg;
          }
          isLoad.value = false;
        })
        .catch(() => {
          isLoad.value = false;
        });
    }
    return {
      secretKey, // 后端返回的ase加密秘钥
      passFlag, // 是否通过的标识
      backImgBase, // 验证码背景图片
      blockBackImgBase, // 验证滑块的背景图片
      backToken, // 后端返回的唯一token值
      startMoveTime, // 移动开始的时间
      endMovetime, // 移动结束的时间
      tipsBackColor, // 提示词的背景颜色
      tipWords,
      text,
      finishText,
      setSize,
      top,
      left,
      moveBlockLeft,
      leftBarWidth,
      // 移动中样式
      moveBlockBackgroundColor,
      leftBarBorderColor,
      iconColor,
      iconClass,
      status, // 鼠标状态
      isEnd, // 是够验证完成
      showRefresh,
      transitionLeft,
      transitionWidth,
      barArea,
      refresh,
      start,
      isLoad,
    };
  },
};
</script>
<template>
  <div style="position: relative">
    <a-spin :spinning="isLoad">
      <div v-if="type === '2'" class="verify-img-out" :style="{ height: `${parseInt(setSize.imgHeight) + vSpace}px` }">
        <div class="verify-img-panel" :style="{ width: setSize.imgWidth, height: setSize.imgHeight }">
          <img :src="`data:image/png;base64,${backImgBase}`" alt="" style="display: block; width: 100%; height: 100%" />
          <div class="verify-refresh bg-white" @click="refresh" v-show="showRefresh"><i class="iconfont icon-refresh"></i></div>
          <transition name="tips">
            <span class="verify-tips" v-if="tipWords" :class="passFlag ? 'suc-bg' : 'err-bg'">{{ tipWords }}</span>
          </transition>
        </div>
      </div>
      <!-- 公共部分 -->
      <div class="verify-bar-area" :style="{ width: setSize.imgWidth, height: barSize.height, 'line-height': barSize.height }">
        <span class="verify-msg" v-text="text"></span>
        <div
          class="verify-left-bar"
          :style="{ width: leftBarWidth !== undefined ? leftBarWidth : barSize.height, height: barSize.height, 'border-color': leftBarBorderColor, transaction: transitionWidth }"
        >
          <span class="verify-msg" v-text="finishText"></span>
          <div
            class="verify-move-block"
            @touchstart="start"
            @mousedown="start"
            :style="{ width: barSize.height, height: barSize.height, 'background-color': moveBlockBackgroundColor, left: moveBlockLeft, transition: transitionLeft }"
          >
            <i class="verify-icon iconfont" :class="[iconClass]" :style="{ color: iconColor }"></i>
            <div
              v-if="type === '2'"
              class="verify-sub-block"
              :style="{
                width: `${Math.floor((parseInt(setSize.imgWidth) * 47) / 310)}px`,
                height: setSize.imgHeight,
                top: `-${parseInt(setSize.imgHeight) + vSpace}px`,
                'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
              }"
            >
              <img :src="`data:image/png;base64,${blockBackImgBase}`" alt="" style="display: block; width: 100%; height: 100%; -webkit-user-drag: none" />
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>
