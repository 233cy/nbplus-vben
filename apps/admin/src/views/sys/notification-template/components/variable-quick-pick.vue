<script setup lang="ts">
import { Button } from 'ant-design-vue';

interface Props {
  variables?: Record<string, string>;
  hint?: string;
}

withDefaults(defineProps<Props>(), {
  variables: () => ({}),
  hint: '',
});

const emit = defineEmits<{
  insert: [variable: string];
}>();

function displayLabel(key: string, desc: string): string {
  const description = desc.trim();
  return description ? `{${key}}（${description}）` : `{${key}}`;
}
</script>

<template>
  <div v-if="Object.keys(variables).length" class="space-y-2">
    <p v-if="hint" class="m-0 text-xs text-muted-foreground">
      {{ hint }}
    </p>
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="(desc, key) in variables"
        :key="key"
        @click="emit('insert', key)"
      >
        {{ displayLabel(key, desc) }}
      </Button>
    </div>
  </div>
</template>
