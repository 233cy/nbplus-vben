<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface CssVarSnapshot {
  background: string;
  border: string;
  destructive: string;
  fontSizeBase: string;
  foreground: string;
  muted: string;
  primary: string;
  radius: string;
  success: string;
  warning: string;
}

const vars = ref<CssVarSnapshot>({
  background: '',
  border: '',
  destructive: '',
  fontSizeBase: '',
  foreground: '',
  muted: '',
  primary: '',
  radius: '',
  success: '',
  warning: '',
});

const isDark = ref(false);

function refreshVars() {
  const root = getComputedStyle(document.documentElement);
  vars.value = {
    background: root.getPropertyValue('--background').trim(),
    border: root.getPropertyValue('--border').trim(),
    destructive: root.getPropertyValue('--destructive').trim(),
    fontSizeBase: root.getPropertyValue('--font-size-base').trim(),
    foreground: root.getPropertyValue('--foreground').trim(),
    muted: root.getPropertyValue('--muted').trim(),
    primary: root.getPropertyValue('--primary').trim(),
    radius: root.getPropertyValue('--radius').trim(),
    success: root.getPropertyValue('--success').trim(),
    warning: root.getPropertyValue('--warning').trim(),
  };
  isDark.value = document.documentElement.classList.contains('dark');
}

onMounted(() => {
  refreshVars();
  // 监听偏好设置变化（Vben 通过修改 html 类和 style 实现）
  const observer = new MutationObserver(refreshVars);
  observer.observe(document.documentElement, {
    attributeFilter: ['class', 'style'],
  });
});
</script>

<template>
  <a-card title="偏好设置与主题适配展示" class="mb-5">
    <p class="mb-4 text-sm text-gray-500">
      本卡片用于演示组件如何跟随 Vben Admin「偏好设置」中的字号、主题、圆角、主题色变化。打开右上角「偏好设置」面板调整相关项，观察下方示例实时变化。
    </p>

    <!-- 1. 当前 CSS 变量快照 -->
    <div class="mb-6">
      <h3 class="mb-3 text-base font-semibold">当前生效的 CSS 变量</h3>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">--font-size-base</div>
          <div class="text-lg font-medium">{{ vars.fontSizeBase || '16px' }}</div>
        </div>
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">--radius</div>
          <div class="text-lg font-medium">{{ vars.radius || '0.5rem' }}</div>
        </div>
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">当前模式</div>
          <div class="text-lg font-medium">{{ isDark ? '暗色' : '亮色' }}</div>
        </div>
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">--primary</div>
          <div class="h-4 w-full rounded" :style="{ background: `hsl(${vars.primary})` }"></div>
        </div>
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">--foreground</div>
          <div class="h-4 w-full rounded" :style="{ background: `hsl(${vars.foreground})` }"></div>
        </div>
        <div class="rounded border p-3">
          <div class="text-xs text-gray-500">--background</div>
          <div class="h-4 w-full rounded border" :style="{ background: `hsl(${vars.background})` }"></div>
        </div>
      </div>
    </div>

    <!-- 2. 字号层级 -->
    <div class="mb-6">
      <h3 class="mb-3 text-base font-semibold">字号层级（跟随 --font-size-base）</h3>
      <div class="space-y-2 rounded border p-4">
        <div class="text-2xl font-bold">text-2xl / 1.75em：大标题</div>
        <div class="text-xl font-semibold">text-xl / 1.5em：二级标题</div>
        <div class="text-lg">text-lg / 1.25em：三级标题</div>
        <div class="text-base">text-base / 1em：正文（等于 --font-size-base）</div>
        <div class="text-sm">text-sm / 0.875em：辅助提示</div>
      </div>
    </div>

    <!-- 3. 主题色 -->
    <div class="mb-6">
      <h3 class="mb-3 text-base font-semibold">主题色（跟随偏好设置的主题色）</h3>
      <div class="flex flex-wrap gap-3">
        <div class="h-10 w-24 rounded" :style="{ background: `hsl(${vars.primary})` }"></div>
        <div class="h-10 w-24 rounded" :style="{ background: `hsl(${vars.success})` }"></div>
        <div class="h-10 w-24 rounded" :style="{ background: `hsl(${vars.warning})` }"></div>
        <div class="h-10 w-24 rounded" :style="{ background: `hsl(${vars.destructive})` }"></div>
      </div>
      <div class="mt-2 flex gap-6 text-sm">
        <span>主色 primary</span>
        <span>成功 success</span>
        <span>警告 warning</span>
        <span>危险 destructive</span>
      </div>
    </div>

    <!-- 4. 圆角 -->
    <div class="mb-6">
      <h3 class="mb-3 text-base font-semibold">圆角（跟随 --radius）</h3>
      <div class="flex items-center gap-4">
        <div class="flex h-16 w-16 items-center justify-center border" :style="{ borderRadius: `calc(${vars.radius} * 0.5)` }">0.5x</div>
        <div class="flex h-16 w-16 items-center justify-center border" :style="{ borderRadius: `var(--radius)` }">1x</div>
        <div class="flex h-16 w-16 items-center justify-center border" :style="{ borderRadius: `calc(${vars.radius} * 2)` }">2x</div>
      </div>
    </div>

    <!-- 5. 语义化颜色 -->
    <div class="mb-6">
      <h3 class="mb-3 text-base font-semibold">语义化颜色（自动适配暗色模式）</h3>
      <div class="space-y-3">
        <div class="rounded p-4" style="color: hsl(var(--card-foreground)); background-color: hsl(var(--card)); border: 1px solid hsl(var(--border))">
          card 背景 + card-foreground 文字 + border 边框
        </div>
        <div class="rounded p-4" style="color: hsl(var(--muted-foreground)); background-color: hsl(var(--muted))">muted 背景 + muted-foreground 文字</div>
        <div class="rounded p-4" style="color: hsl(var(--primary-foreground)); background-color: hsl(var(--primary))">primary 背景 + primary-foreground 文字</div>
      </div>
    </div>

    <!-- 6. 推荐写法 -->
    <div>
      <h3 class="mb-3 text-base font-semibold">推荐写法速查</h3>
      <pre class="overflow-x-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-900"><code>/* 字号 */
font-size: var(--font-size-base);
<h1 class="text-2xl"></h1>
<span class="text-sm"></span>

/* 颜色 */
color: hsl(var(--foreground));
background-color: hsl(var(--background));
border-color: hsl(var(--border));

/* 圆角 */
border-radius: var(--radius);

/* 暗色模式覆盖 */
.my-box {
  background-color: hsl(var(--card));
}
:global(.dark .my-box) {
  background-color: hsl(var(--card));
}
</code></pre>
    </div>
  </a-card>
</template>
